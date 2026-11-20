import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import argon2 from "argon2";
import { createDb, setDbForTesting, nowIso } from "../db/database.js";
import { buildApp } from "../app.js";

async function runTests() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ks-api-test-"));
  const dbPath = path.join(tmpDir, "test.db");
  const db = createDb(dbPath);
  setDbForTesting(db);

  const app = await buildApp({ db, logger: false });
  let passed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    await fn();
    passed++;
    console.log(`[PASS] ${name}`);
  }

  function extractCookie(setCookie: string | string[] | undefined): string {
    const arr = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
    const match = arr.find((c) => c.startsWith("ks_admin_session="));
    assert.ok(match, "Expected ks_admin_session Set-Cookie header");
    assert.ok(match.includes("HttpOnly"), "Session cookie must be HttpOnly");
    assert.ok(match.includes("SameSite=Lax"), "Session cookie must set SameSite=Lax");
    return match.split(";")[0];
  }

  // Provision initial SUPER_ADMIN in test DB using Argon2id (never hardcoded in prod code)
  const roleRow = await db.get<{ id: number }>("SELECT id FROM roles WHERE code = 'SUPER_ADMIN'");
  assert.ok(roleRow, "SUPER_ADMIN role must be seeded");
  const superPass = "TestSuperAdmin!2026#Safe";
  const superHash = await argon2.hash(superPass, { type: argon2.argon2id });
  await db.run(
    "INSERT INTO admin_users (email, full_name, password_hash, role_id, is_active, created_at, updated_at) VALUES ($1,$2,$3,$4,1,$5,$5)",
    ["superadmin@karensurgery.test", "Test Super Admin", superHash, roleRow.id, nowIso()]
  );

  try {
    await test("1. Health check & unauthenticated admin routes blocked (401)", async () => {
      const h = await app.inject({ method: "GET", url: "/api/public/health" });
      assert.equal(h.statusCode, 200);

      for (const ep of ["/api/admin/dashboard", "/api/admin/appointments", "/api/admin/enquiries", "/api/admin/users", "/api/admin/audit-logs"]) {
        const res = await app.inject({ method: "GET", url: ep });
        assert.equal(res.statusCode, 401, `Expected 401 on ${ep}`);
      }
    });

    let tonyaId = 0;
    let kituluId = 0;

    await test("2. Dynamic booking options return verified active/approved services & practitioners", async () => {
      const res = await app.inject({ method: "GET", url: "/api/public/booking-options" });
      assert.equal(res.statusCode, 200);
      const body = res.json();
      assert.ok(body.services.length >= 6);
      assert.equal(body.practitioners.length, 17, "Expected 17 active clinical practitioners (excluding support staff)");
      const tonya = body.practitioners.find((p: { slug: string }) => p.slug === "dr-tonya-shaw");
      const kitulu = body.practitioners.find((p: { slug: string }) => p.slug === "dr-jacqueline-kitulu");
      assert.ok(tonya && kitulu);
      tonyaId = tonya.id;
      kituluId = kitulu.id;
    });

    let aptRefTonya = "";
    let aptRefGp = "";

    await test("3. Appointment submission validates, blocks honeypot spam, routes practitioner vs reception fallback", async () => {
      // Honeypot spam blocked
      const spam = await app.inject({
        method: "POST",
        url: "/api/public/appointments",
        payload: {
          fullName: "Bot User",
          phone: "+254700000001",
          email: "bot@example.com",
          serviceSlug: "family-medicine",
          preferredDate: "2026-12-01",
          privacyAccepted: true,
          websiteUrl: "https://spam.example",
        },
      });
      assert.equal(spam.statusCode, 400);

      // Valid request for Dr. Tonya Shaw -> routes to Dr_TonyaShaw@KarenSurgery.com
      const resTonya = await app.inject({
        method: "POST",
        url: "/api/public/appointments",
        payload: {
          fullName: "Jane Patient",
          phone: "+254711223344",
          email: "jane@example.com",
          patientType: "new",
          serviceSlug: "mental-health",
          practitionerId: tonyaId,
          preferredDate: "2026-12-05",
          preferredTime: "Morning (9:00 am – 12:00 pm)",
          preferredContact: "phone",
          message: "Initial consultation inquiry",
          privacyAccepted: true,
        },
      });
      assert.equal(resTonya.statusCode, 201);
      const b1 = resTonya.json();
      assert.match(b1.referenceCode, /^KS-APT-/);
      assert.equal(b1.status, "new");
      aptRefTonya = b1.referenceCode;

      const row1 = await db.get<{ routed_email: string }>(
        "SELECT routed_email FROM appointment_requests WHERE reference_code = $1",
        [aptRefTonya]
      );
      assert.equal(row1?.routed_email, "Dr_TonyaShaw@KarenSurgery.com");

      // Valid request for Dr. Jacqueline Kitulu (no personal email on site) -> reception fallback
      const resGp = await app.inject({
        method: "POST",
        url: "/api/public/appointments",
        payload: {
          fullName: "John Family",
          phone: "+254722334455",
          email: "john@example.com",
          patientType: "existing",
          serviceSlug: "family-medicine",
          practitionerId: kituluId,
          preferredDate: "2026-12-06",
          preferredTime: "8:00 am – 10:00 am",
          preferredContact: "whatsapp",
          privacyAccepted: true,
        },
      });
      assert.equal(resGp.statusCode, 201);
      aptRefGp = resGp.json().referenceCode;
      const row2 = await db.get<{ routed_email: string }>(
        "SELECT routed_email FROM appointment_requests WHERE reference_code = $1",
        [aptRefGp]
      );
      assert.equal(row2?.routed_email, "Receptionist@KarenSurgery.com");
    });

    await test("4. General enquiry & chatbot-generated enquiry submission", async () => {
      const r1 = await app.inject({
        method: "POST",
        url: "/api/public/enquiries",
        payload: {
          fullName: "Mary Visitor",
          email: "mary@example.com",
          phone: "+254733000111",
          category: "General enquiries",
          subject: "Parking availability",
          message: "Is there patient parking available inside the Karen Surgery compound?",
          preferredContact: "email",
          privacyAccepted: true,
          source: "contact_form",
        },
      });
      assert.equal(r1.statusCode, 201);
      assert.match(r1.json().referenceCode, /^KS-ENQ-/);

      const r2 = await app.inject({
        method: "POST",
        url: "/api/public/enquiries",
        payload: {
          fullName: "David Chat",
          email: "david@example.com",
          category: "Laboratory Services",
          subject: "Website enquiry: Laboratory Services",
          message: "Do you process specialized allergy panels via Pathcare?",
          preferredContact: "email",
          privacyAccepted: true,
          source: "chatbot",
          originalQuestion: "Do you process specialized allergy panels?",
          conversationSummary: "Visitor asked about specialized allergy panels via Website Assistant.",
        },
      });
      assert.equal(r2.statusCode, 201);
      assert.equal(r2.json().source, "chatbot");
    });

    await test("5. Chatbot retrieval, emergency guardrail, clinical refusal, and controlled fallback", async () => {
      // Grounded FAQ answer
      const hoursRes = await app.inject({
        method: "POST",
        url: "/api/public/chatbot/ask",
        payload: { question: "What are your opening hours on Saturday?", sessionId: "s1" },
      });
      assert.equal(hoursRes.statusCode, 200);
      assert.equal(hoursRes.json().type, "answer");
      assert.ok(hoursRes.json().answer.includes("9:00 am"));

      // Grounded practitioner lookup
      const pracRes = await app.inject({
        method: "POST",
        url: "/api/public/chatbot/ask",
        payload: { question: "Tell me about Sarah Peacock", sessionId: "s1" },
      });
      assert.equal(pracRes.json().type, "answer");
      assert.ok(pracRes.json().answer.includes("Sarah Peacock"));

      // Emergency guardrail
      const emerRes = await app.inject({
        method: "POST",
        url: "/api/public/chatbot/ask",
        payload: { question: "I have severe chest pain and difficulty breathing", sessionId: "s2" },
      });
      assert.equal(emerRes.json().type, "emergency");
      assert.ok(emerRes.json().answer.includes("724"));
      assert.equal(emerRes.json().offerEnquiryDraft, false);

      // Clinical advice refusal
      const medRes = await app.inject({
        method: "POST",
        url: "/api/public/chatbot/ask",
        payload: { question: "Can you prescribe antibiotics for my rash and interpret my symptoms?", sessionId: "s3" },
      });
      assert.equal(medRes.json().type, "medical_refusal");

      // Out-of-scope fallback with long multi-turn history (e.g. following an emergency reply) -> logs unanswered + offers editable draft
      const fbRes = await app.inject({
        method: "POST",
        url: "/api/public/chatbot/ask",
        payload: {
          question: "Do you perform robotic MRI scans on Mars?",
          sessionId: "s4",
          history: [
            { role: "user", text: "I have severe chest pain and difficulty breathing" },
            { role: "assistant", text: emerRes.json().answer },
          ],
        },
      });
      assert.equal(fbRes.statusCode, 200);
      assert.equal(fbRes.json().type, "fallback");
      assert.equal(fbRes.json().offerEnquiryDraft, true);
      assert.ok(fbRes.json().draftEnquiry.originalQuestion.includes("MRI"));
    });

    // Helper to log in any admin user
    async function loginAs(email: string, password: string) {
      const res = await app.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: { email, password },
      });
      assert.equal(res.statusCode, 200, `Login failed for ${email}`);
      const cookie = extractCookie(res.headers["set-cookie"]);
      const { csrfToken, user } = res.json();
      return { cookie, csrfToken, user };
    }

    const superAuth = await loginAs("superadmin@karensurgery.test", superPass);

    await test("6. CSRF protection enforced on mutating admin endpoints", async () => {
      const noCsrf = await app.inject({
        method: "POST",
        url: "/api/admin/pages",
        headers: { cookie: superAuth.cookie },
        payload: { slug: "test-csrf", title: "Test CSRF" },
      });
      assert.equal(noCsrf.statusCode, 403);
    });

    await test("7. SUPER_ADMIN creates CONTENT_ADMIN, RECEPTION_OPERATIONS, and READ_ONLY users & RBAC boundaries hold", async () => {
      const rolesToCreate = [
        { email: "content@karensurgery.test", fullName: "Content Editor", roleCode: "CONTENT_ADMIN" },
        { email: "reception@karensurgery.test", fullName: "Reception Desk", roleCode: "RECEPTION_OPERATIONS" },
        { email: "auditor@karensurgery.test", fullName: "Read Only Viewer", roleCode: "READ_ONLY" },
      ];
      for (const u of rolesToCreate) {
        const res = await app.inject({
          method: "POST",
          url: "/api/admin/users",
          headers: { cookie: superAuth.cookie, "x-csrf-token": superAuth.csrfToken },
          payload: { ...u, password: "StrongRolePass!2026" },
        });
        assert.equal(res.statusCode, 201);
      }

      const contentAuth = await loginAs("content@karensurgery.test", "StrongRolePass!2026");
      const receptionAuth = await loginAs("reception@karensurgery.test", "StrongRolePass!2026");
      const readOnlyAuth = await loginAs("auditor@karensurgery.test", "StrongRolePass!2026");

      // READ_ONLY can read appointments & pages, blocked from mutating anything or viewing users/audit
      assert.equal((await app.inject({ method: "GET", url: "/api/admin/appointments", headers: { cookie: readOnlyAuth.cookie } })).statusCode, 200);
      assert.equal((await app.inject({ method: "PATCH", url: "/api/admin/appointments/1", headers: { cookie: readOnlyAuth.cookie, "x-csrf-token": readOnlyAuth.csrfToken }, payload: { status: "confirmed" } })).statusCode, 403);
      assert.equal((await app.inject({ method: "GET", url: "/api/admin/users", headers: { cookie: readOnlyAuth.cookie } })).statusCode, 403);

      // RECEPTION_OPERATIONS can confirm appointment & save private internal notes, blocked from CMS & Users
      const aptList = (await app.inject({ method: "GET", url: "/api/admin/appointments", headers: { cookie: receptionAuth.cookie } })).json();
      assert.ok(aptList.length >= 2);
      const upd = await app.inject({
        method: "PATCH",
        url: `/api/admin/appointments/${aptList[0].id}`,
        headers: { cookie: receptionAuth.cookie, "x-csrf-token": receptionAuth.csrfToken },
        payload: { status: "confirmed", internalNotes: "CONFIDENTIAL_INTERNAL_NOTE_123" },
      });
      assert.equal(upd.statusCode, 200);
      assert.equal(upd.json().status, "confirmed");
      assert.equal(upd.json().internal_notes, "CONFIDENTIAL_INTERNAL_NOTE_123");

      // Blocked from CMS page creation
      const blockedCms = await app.inject({
        method: "POST",
        url: "/api/admin/pages",
        headers: { cookie: receptionAuth.cookie, "x-csrf-token": receptionAuth.csrfToken },
        payload: { slug: "blocked-page", title: "Blocked" },
      });
      assert.equal(blockedCms.statusCode, 403);

      // CONTENT_ADMIN can manage CMS pages & FAQ, blocked from appointments, users, and emergency contact updates
      const cmsPage = await app.inject({
        method: "POST",
        url: "/api/admin/pages",
        headers: { cookie: contentAuth.cookie, "x-csrf-token": contentAuth.csrfToken },
        payload: { slug: "travel-clinic-draft", title: "Travel Clinic Draft", status: "draft" },
      });
      assert.equal(cmsPage.statusCode, 201);
      // Draft page MUST NOT be returned on public API
      assert.equal((await app.inject({ method: "GET", url: "/api/public/pages/travel-clinic-draft" })).statusCode, 404);

      assert.equal((await app.inject({ method: "GET", url: "/api/admin/appointments", headers: { cookie: contentAuth.cookie } })).statusCode, 403);
      assert.equal((await app.inject({ method: "PATCH", url: "/api/admin/settings/emergency", headers: { cookie: contentAuth.cookie, "x-csrf-token": contentAuth.csrfToken }, payload: { confirmPhrase: "CONFIRM EMERGENCY CHANGE", emergency: { phoneDisplay: "x", phoneTel: "x", bannerText: "Emergency test text", ambulances: [{ provider: "A", numbers: ["12345"] }] } } })).statusCode, 403);
    });

    await test("8. Media in-use protection, emergency double-confirmation & audit logs verified", async () => {
      // Attempt to delete an in-use system practitioner image -> MUST return 409 Conflict
      const mediaList = (await app.inject({ method: "GET", url: "/api/admin/media", headers: { cookie: superAuth.cookie } })).json();
      const inUse = mediaList.find((m: { practitioner_refs: number }) => Number(m.practitioner_refs) > 0);
      assert.ok(inUse, "Expected at least one in-use media asset");
      const delRes = await app.inject({
        method: "DELETE",
        url: `/api/admin/media/${inUse.id}`,
        headers: { cookie: superAuth.cookie, "x-csrf-token": superAuth.csrfToken },
      });
      assert.equal(delRes.statusCode, 409);

      // Emergency update without confirmation phrase -> 400
      const badEmer = await app.inject({
        method: "PATCH",
        url: "/api/admin/settings/emergency",
        headers: { cookie: superAuth.cookie, "x-csrf-token": superAuth.csrfToken },
        payload: {
          confirmPhrase: "WRONG",
          emergency: {
            phoneDisplay: "+254 (0) 724 840246",
            phoneTel: "+254724840246",
            bannerText: "Do not waste time. Call the emergency phone, go to the nearest hospital or call an ambulance.",
            ambulances: [{ provider: "Karen Hospital", numbers: ["+254 (0) 702 222222"] }],
          },
        },
      });
      assert.equal(badEmer.statusCode, 400);

      // Emergency update WITH exact confirmation phrase -> 200
      const goodEmer = await app.inject({
        method: "PATCH",
        url: "/api/admin/settings/emergency",
        headers: { cookie: superAuth.cookie, "x-csrf-token": superAuth.csrfToken },
        payload: {
          confirmPhrase: "CONFIRM EMERGENCY CHANGE",
          emergency: {
            phoneDisplay: "+254 (0) 724 840246",
            phoneTel: "+254724840246",
            bannerText: "Do not waste time. Call the emergency phone, go to the nearest hospital or call an ambulance.",
            ambulances: [{ provider: "Karen Hospital", numbers: ["+254 (0) 702 222222"] }],
          },
        },
      });
      assert.equal(goodEmer.statusCode, 200);

      // Dashboard derives real DB counts & Audit logs capture actions
      const dash = (await app.inject({ method: "GET", url: "/api/admin/dashboard", headers: { cookie: superAuth.cookie } })).json();
      assert.equal(dash.appointments.total, 2);
      assert.equal(dash.appointments.confirmed, 1);
      assert.equal(dash.enquiries.total, 2);
      assert.equal(dash.enquiries.fromChatbot, 1);

      const logs = (await app.inject({ method: "GET", url: "/api/admin/audit-logs", headers: { cookie: superAuth.cookie } })).json();
      assert.ok(logs.length >= 6);
      assert.ok(logs.some((l: { action: string }) => l.action === "settings.emergency_update"));
    });

    await test("9. Logout invalidates session cookie", async () => {
      const lo = await app.inject({
        method: "POST",
        url: "/api/auth/logout",
        headers: { cookie: superAuth.cookie, "x-csrf-token": superAuth.csrfToken },
      });
      assert.equal(lo.statusCode, 200);
      const after = await app.inject({
        method: "GET",
        url: "/api/auth/me",
        headers: { cookie: superAuth.cookie },
      });
      assert.equal(after.statusCode, 401);
    });

    console.log(`\nALL ${passed} BACKEND INTEGRATION, RBAC & SECURITY TESTS PASSED.`);
  } finally {
    await app.close();
    await db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

runTests().catch((err) => {
  console.error("TEST SUITE FAILED:", err);
  process.exit(1);
});
