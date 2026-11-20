import { useEffect, useState, type FormEvent } from "react";
import { AlertTriangle, Plus, Save, Shield, UserCheck } from "lucide-react";
import { apiRequest, type AdminUser } from "../lib/api";

interface AdminUserRow {
  id: number;
  email: string;
  full_name: string;
  role_code: string;
  role_name: string;
  is_active: number;
  last_login_at: string | null;
}

interface AuditRow {
  id: number;
  actor_email: string;
  actor_role: string;
  action: string;
  entity_type: string;
  entity_id: string;
  summary: string;
  ip_address: string;
  created_at: string;
}

export function SettingsView({ user }: { user: AdminUser }) {
  const canEditGeneral = user.permissions.includes("settings.write");
  const canEditEmergency = user.permissions.includes("settings.emergency");

  const [contactEmail, setContactEmail] = useState("");
  const [whatsappDisplay, setWhatsappDisplay] = useState("");
  const [street, setStreet] = useState("");
  const [retentionDays, setRetentionDays] = useState(365);
  const [navItems, setNavItems] = useState<{ label: string; href: string; enabled: boolean; order: number }[]>([]);

  // Emergency protected section
  const [emerPhone, setEmerPhone] = useState("");
  const [emerTel, setEmerTel] = useState("");
  const [emerBanner, setEmerBanner] = useState("");
  const [emerAmbulances, setEmerAmbulances] = useState<{ provider: string; numbers: string[] }[]>([]);
  const [confirmPhrase, setConfirmPhrase] = useState("");

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    apiRequest<{
      contact: { email: string; whatsapp: { display: string } };
      location: { street: string };
      emergency: { phoneDisplay: string; phoneTel: string; bannerText: string; ambulances: { provider: string; numbers: string[] }[] };
      navigation: { label: string; href: string; enabled: boolean; order: number }[];
      dataRetentionDays: number;
    }>("/api/admin/settings")
      .then((s) => {
        setContactEmail(s.contact?.email || "");
        setWhatsappDisplay(s.contact?.whatsapp?.display || "");
        setStreet(s.location?.street || "");
        setRetentionDays(s.dataRetentionDays || 365);
        setNavItems(s.navigation || []);
        setEmerPhone(s.emergency?.phoneDisplay || "");
        setEmerTel(s.emergency?.phoneTel || "");
        setEmerBanner(s.emergency?.bannerText || "");
        setEmerAmbulances(s.emergency?.ambulances || []);
      })
      .catch((e) => setErr(e.message));
  }, []);

  async function saveGeneral(e: FormEvent) {
    e.preventDefault();
    setErr("");
    setMsg("");
    try {
      await apiRequest("/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({
          contact: {
            email: contactEmail,
            whatsapp: { display: whatsappDisplay, href: `https://wa.me/${whatsappDisplay.replace(/\D/g, "")}` },
          },
          location: { street },
          navigation: navItems,
          dataRetentionDays: Number(retentionDays),
        }),
      });
      setMsg("Saved general operational settings.");
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Failed to save.");
    }
  }

  async function saveEmergency(e: FormEvent) {
    e.preventDefault();
    setErr("");
    setMsg("");
    try {
      await apiRequest("/api/admin/settings/emergency", {
        method: "PATCH",
        body: JSON.stringify({
          confirmPhrase,
          emergency: {
            phoneDisplay: emerPhone,
            phoneTel: emerTel,
            bannerText: emerBanner,
            ambulances: emerAmbulances,
          },
        }),
      });
      setConfirmPhrase("");
      setMsg("Emergency contact settings updated and recorded in audit log.");
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Emergency update rejected.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Practice Settings, Navigation &amp; Emergency Contacts</h2>
        <p className="text-sm text-slate-500">Manage approved operational settings, navigation labels, retention policy, and protected emergency numbers.</p>
      </div>

      {err ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{err}</div> : null}
      {msg ? <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{msg}</div> : null}

      <form onSubmit={saveGeneral} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <h3 className="font-bold text-slate-900">Reception Contact, Location &amp; Retention</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reception Email</label>
            <input disabled={!canEditGeneral} value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="w-full min-h-[38px] rounded-lg border border-slate-300 px-3 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp Display Number</label>
            <input disabled={!canEditGeneral} value={whatsappDisplay} onChange={(e) => setWhatsappDisplay(e.target.value)} className="w-full min-h-[38px] rounded-lg border border-slate-300 px-3 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Street Address</label>
            <input disabled={!canEditGeneral} value={street} onChange={(e) => setStreet(e.target.value)} className="w-full min-h-[38px] rounded-lg border border-slate-300 px-3 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Data Retention Period (days)</label>
            <input type="number" min={30} max={3650} disabled={!canEditGeneral} value={retentionDays} onChange={(e) => setRetentionDays(Number(e.target.value))} className="w-full min-h-[38px] rounded-lg border border-slate-300 px-3 text-sm" />
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Existing Public Navigation Items</h4>
          <div className="space-y-2">
            {navItems.map((item, idx) => (
              <div key={item.href} className="flex flex-wrap items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  disabled={!canEditGeneral}
                  checked={item.enabled}
                  onChange={(e) =>
                    setNavItems((prev) => prev.map((x, i) => (i === idx ? { ...x, enabled: e.target.checked } : x)))
                  }
                />
                <input
                  disabled={!canEditGeneral}
                  value={item.label}
                  onChange={(e) =>
                    setNavItems((prev) => prev.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)))
                  }
                  className="rounded border border-slate-300 px-2.5 py-1 text-sm"
                />
                <span className="font-mono text-xs text-slate-500">{item.href}</span>
              </div>
            ))}
          </div>
        </div>

        {canEditGeneral ? (
          <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg bg-[#121713] px-4 py-2 text-xs font-semibold text-white cursor-pointer">
            <Save className="h-3.5 w-3.5" aria-hidden="true" /> Save General Settings
          </button>
        ) : null}
      </form>

      {/* Protected Emergency Contact Section */}
      <form onSubmit={saveEmergency} className="rounded-2xl border-2 border-red-200 bg-red-50/40 p-5 space-y-4">
        <div className="flex items-center gap-2 text-red-800">
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          <h3 className="font-bold">Protected Emergency Contact Configuration (Super Admin Only)</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Phone Display</label>
            <input disabled={!canEditEmergency} value={emerPhone} onChange={(e) => setEmerPhone(e.target.value)} className="w-full min-h-[38px] rounded-lg border border-slate-300 bg-white px-3 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Tel URI</label>
            <input disabled={!canEditEmergency} value={emerTel} onChange={(e) => setEmerTel(e.target.value)} className="w-full min-h-[38px] rounded-lg border border-slate-300 bg-white px-3 text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Warning Banner Text</label>
          <textarea rows={2} disabled={!canEditEmergency} value={emerBanner} onChange={(e) => setEmerBanner(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm" />
        </div>
        {canEditEmergency ? (
          <div className="rounded-xl border border-red-300 bg-white p-4 space-y-2.5">
            <label htmlFor="emer-confirm" className="block text-xs font-bold text-red-900">
              Additional Confirmation Required — Type <code className="bg-red-50 px-1.5 py-0.5 rounded">CONFIRM EMERGENCY CHANGE</code>
            </label>
            <input
              id="emer-confirm"
              required
              value={confirmPhrase}
              onChange={(e) => setConfirmPhrase(e.target.value)}
              placeholder="CONFIRM EMERGENCY CHANGE"
              className="w-full min-h-[38px] rounded-lg border border-red-300 px-3 text-sm font-mono"
            />
            <button type="submit" className="rounded-lg bg-red-700 px-4 py-2 text-xs font-semibold text-white hover:bg-red-800 cursor-pointer">
              Confirm &amp; Update Emergency Contacts
            </button>
          </div>
        ) : (
          <p className="text-xs text-red-800">Only SUPER_ADMIN accounts can modify emergency contact information.</p>
        )}
      </form>
    </div>
  );
}

export function UsersAndAuditView({ mode }: { mode: "users" | "audit" }) {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [roleCode, setRoleCode] = useState<"SUPER_ADMIN" | "CONTENT_ADMIN" | "RECEPTION_OPERATIONS" | "READ_ONLY">("RECEPTION_OPERATIONS");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function load() {
    if (mode === "users") {
      setUsers(await apiRequest<AdminUserRow[]>("/api/admin/users"));
    } else {
      setLogs(await apiRequest<AuditRow[]>("/api/admin/audit-logs?limit=150"));
    }
  }

  useEffect(() => {
    load().catch((e) => setErr(e.message));
  }, [mode]);

  async function createUser(e: FormEvent) {
    e.preventDefault();
    setErr("");
    setMsg("");
    try {
      await apiRequest("/api/admin/users", {
        method: "POST",
        body: JSON.stringify({ email, fullName, password, roleCode }),
      });
      setEmail("");
      setFullName("");
      setPassword("");
      setMsg("Created administrator account.");
      await load();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Failed to create user.");
    }
  }

  if (mode === "audit") {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#2F4A2C]" aria-hidden="true" /> Audit Logs
          </h2>
          <p className="text-sm text-slate-500">Immutable record of real administrative authentications, content changes, and operational updates.</p>
        </div>
        {err ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{err}</div> : null}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 uppercase text-slate-500">
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Summary</th>
                <th className="px-4 py-3">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-2.5 tabular-nums whitespace-nowrap text-slate-500">{new Date(l.created_at).toLocaleString()}</td>
                  <td className="px-4 py-2.5">
                    <span className="font-semibold text-slate-900">{l.actor_email}</span>
                    <span className="block text-[10px] text-slate-500">{l.actor_role}</span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[#2F4A2C]">{l.action}</td>
                  <td className="px-4 py-2.5 text-slate-800">{l.summary}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-500">{l.ip_address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-[#2F4A2C]" aria-hidden="true" /> Admin Users &amp; Roles
        </h2>
        <p className="text-sm text-slate-500">Create staff accounts and assign role-based access permissions (Argon2id password hashing).</p>
      </div>
      {err ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{err}</div> : null}
      {msg ? <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{msg}</div> : null}

      <form onSubmit={createUser} className="rounded-2xl border border-slate-200 bg-white p-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5 items-end">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
          <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full min-h-[38px] rounded-lg border border-slate-300 px-3 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full min-h-[38px] rounded-lg border border-slate-300 px-3 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Password (12+ chars)</label>
          <input type="password" required minLength={12} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full min-h-[38px] rounded-lg border border-slate-300 px-3 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
          <select value={roleCode} onChange={(e) => setRoleCode(e.target.value as typeof roleCode)} className="w-full min-h-[38px] rounded-lg border border-slate-300 bg-white px-3 text-sm">
            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            <option value="CONTENT_ADMIN">CONTENT_ADMIN</option>
            <option value="RECEPTION_OPERATIONS">RECEPTION_OPERATIONS</option>
            <option value="READ_ONLY">READ_ONLY</option>
          </select>
        </div>
        <button type="submit" className="min-h-[38px] inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#121713] px-4 text-xs font-semibold text-white cursor-pointer">
          <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Create User
        </button>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">{u.full_name}</p>
                  <p className="text-xs text-slate-500">{u.email}</p>
                </td>
                <td className="px-4 py-3 font-mono text-xs font-semibold text-[#2F4A2C]">{u.role_code}</td>
                <td className="px-4 py-3 text-xs">{u.is_active ? "Active" : "Inactive"}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={async () => {
                      await apiRequest(`/api/admin/users/${u.id}`, {
                        method: "PATCH",
                        body: JSON.stringify({ isActive: !u.is_active }),
                      });
                      await load();
                    }}
                    className="rounded border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-800 cursor-pointer"
                  >
                    {u.is_active ? "Deactivate" : "Reactivate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
