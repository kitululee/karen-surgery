import { useEffect, useState, type FormEvent } from "react";
import { ArrowDown, ArrowUp, ExternalLink, Plus, Trash2, Upload } from "lucide-react";
import { apiRequest, PUBLIC_SITE_URL } from "../lib/api";

interface PageRow {
  id: number;
  slug: string;
  title: string;
  meta_title: string;
  meta_description: string;
  status: "draft" | "published" | "archived";
  sections: {
    id: number;
    section_key: string;
    section_type: string;
    heading: string;
    subheading: string;
    cta_label: string;
    cta_href: string;
  }[];
}

interface PractitionerRow {
  id: number;
  slug: string;
  name: string;
  qualifications: string;
  role_title: string;
  department: string;
  bio_json: string;
  specialties_json: string;
  email: string | null;
  media_asset_id: number | null;
  is_active: number;
  is_approved: number;
  is_archived: number;
  serviceIds: number[];
}

interface ServiceRow {
  id: number;
  slug: string;
  title: string;
  short_title: string;
  description: string;
  href: string;
  contact_email: string | null;
  is_published: number;
  sort_order: number;
  practitionerIds: number[];
}

interface MediaRow {
  id: number;
  filename: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  alt_text: string;
  public_url: string;
  is_system_asset: number;
  practitioner_refs: number;
  service_refs: number;
  section_refs: number;
}

export function ContentCmsView({ canWrite }: { canWrite: boolean }) {
  const [subTab, setSubTab] = useState<"pages" | "practitioners" | "services" | "media">("pages");
  const [pages, setPages] = useState<PageRow[]>([]);
  const [practitioners, setPractitioners] = useState<PractitionerRow[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [media, setMedia] = useState<MediaRow[]>([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  // New page form
  const [newPageSlug, setNewPageSlug] = useState("");
  const [newPageTitle, setNewPageTitle] = useState("");
  const [editingPage, setEditingPage] = useState<PageRow | null>(null);
  const [secHeading, setSecHeading] = useState("");
  const [secSubheading, setSecSubheading] = useState("");

  // Edit practitioner modal/panel
  const [editingPrac, setEditingPrac] = useState<PractitionerRow | null>(null);
  const [pracName, setPracName] = useState("");
  const [pracRole, setPracRole] = useState("");
  const [pracQuals, setPracQuals] = useState("");
  const [pracEmail, setPracEmail] = useState("");
  const [pracBio, setPracBio] = useState("");
  const [pracMediaId, setPracMediaId] = useState<string>("");
  const [pracActive, setPracActive] = useState(true);
  const [pracApproved, setPracApproved] = useState(true);

  // Media upload
  const [uploadAlt, setUploadAlt] = useState("");

  async function loadAll() {
    const [p, pr, s, m] = await Promise.all([
      apiRequest<PageRow[]>("/api/admin/pages"),
      apiRequest<PractitionerRow[]>("/api/admin/practitioners"),
      apiRequest<ServiceRow[]>("/api/admin/services"),
      apiRequest<MediaRow[]>("/api/admin/media"),
    ]);
    setPages(p);
    setPractitioners(pr);
    setServices(s);
    setMedia(m);
  }

  useEffect(() => {
    loadAll().catch((e) => setError(e.message));
  }, []);

  async function createPage(e: FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    try {
      await apiRequest("/api/admin/pages", {
        method: "POST",
        body: JSON.stringify({ slug: newPageSlug, title: newPageTitle, status: "draft" }),
      });
      setNewPageSlug("");
      setNewPageTitle("");
      setNotice("Created draft page.");
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create page.");
    }
  }

  async function updatePageStatus(p: PageRow, status: "draft" | "published" | "archived") {
    setError("");
    setNotice("");
    try {
      await apiRequest(`/api/admin/pages/${p.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      setNotice(`Page /${p.slug}/ set to ${status}.`);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    }
  }

  async function saveHeroSection(e: FormEvent) {
    e.preventDefault();
    if (!editingPage) return;
    setError("");
    try {
      await apiRequest(`/api/admin/pages/${editingPage.id}/sections`, {
        method: "PUT",
        body: JSON.stringify({
          sectionKey: "hero",
          sectionType: "hero",
          heading: secHeading,
          subheading: secSubheading,
          isPublished: true,
          sortOrder: 1,
        }),
      });
      setNotice(`Saved hero section for /${editingPage.slug}/.`);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Section save failed.");
    }
  }

  function startEditPractitioner(p: PractitionerRow) {
    setEditingPrac(p);
    setPracName(p.name);
    setPracRole(p.role_title);
    setPracQuals(p.qualifications || "");
    setPracEmail(p.email || "");
    const bioArr = JSON.parse(p.bio_json || "[]") as string[];
    setPracBio(bioArr.join("\n\n"));
    setPracMediaId(p.media_asset_id ? String(p.media_asset_id) : "");
    setPracActive(Boolean(p.is_active));
    setPracApproved(Boolean(p.is_approved));
  }

  async function savePractitioner(e: FormEvent) {
    e.preventDefault();
    if (!editingPrac) return;
    setError("");
    try {
      await apiRequest(`/api/admin/practitioners/${editingPrac.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: pracName,
          roleTitle: pracRole,
          qualifications: pracQuals,
          email: pracEmail || null,
          bio: pracBio.split(/\n\n+/).map((x) => x.trim()).filter(Boolean),
          mediaAssetId: pracMediaId ? Number(pracMediaId) : null,
          isActive: pracActive,
          isApproved: pracApproved,
        }),
      });
      setNotice(`Updated practitioner profile: ${pracName}`);
      setEditingPrac(null);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save practitioner.");
    }
  }

  async function toggleServicePublish(svc: ServiceRow) {
    try {
      await apiRequest(`/api/admin/services/${svc.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isPublished: !svc.is_published }),
      });
      setNotice(`Updated service ${svc.title}.`);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update service.");
    }
  }

  async function moveService(index: number, delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= services.length) return;
    const copy = [...services];
    const [item] = copy.splice(index, 1);
    copy.splice(target, 0, item);
    await apiRequest("/api/admin/services/reorder", {
      method: "PUT",
      body: JSON.stringify({ orderedIds: copy.map((s) => s.id) }),
    });
    setNotice("Updated service display order.");
    await loadAll();
  }

  async function handleFileUpload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setNotice("");
    const fileInput = e.currentTarget.elements.namedItem("file") as HTMLInputElement;
    const file = fileInput?.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("altText", uploadAlt);
    try {
      await apiRequest("/api/admin/media/upload", { method: "POST", body: fd });
      setUploadAlt("");
      fileInput.value = "";
      setNotice(`Uploaded ${file.name} cleanly.`);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    }
  }

  async function deleteMedia(m: MediaRow) {
    setError("");
    setNotice("");
    try {
      await apiRequest(`/api/admin/media/${m.id}`, { method: "DELETE" });
      setNotice(`Deleted ${m.filename}.`);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Content Management (CMS)</h2>
        <p className="text-sm text-slate-500">Manage pages, sections, practitioners, services, and media library assets.</p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {(["pages", "practitioners", "services", "media"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setSubTab(t)}
            className={`rounded-lg px-3.5 py-2 text-xs font-semibold capitalize cursor-pointer ${
              subTab === t ? "bg-[#121713] text-white" : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}
      {notice ? <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{notice}</div> : null}

      {/* PAGES TAB */}
      {subTab === "pages" ? (
        <div className="space-y-5">
          {canWrite ? (
            <form onSubmit={createPage} className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <div>
                <label htmlFor="page-slug" className="block text-xs font-semibold text-slate-700 mb-1">New Page Slug</label>
                <input id="page-slug" required pattern="[a-z0-9-]+" placeholder="e.g. travel-clinic" value={newPageSlug} onChange={(e) => setNewPageSlug(e.target.value)} className="min-h-[38px] rounded-lg border border-slate-300 px-3 text-sm" />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label htmlFor="page-title" className="block text-xs font-semibold text-slate-700 mb-1">Page Title</label>
                <input id="page-title" required placeholder="Page heading" value={newPageTitle} onChange={(e) => setNewPageTitle(e.target.value)} className="w-full min-h-[38px] rounded-lg border border-slate-300 px-3 text-sm" />
              </div>
              <button type="submit" className="min-h-[38px] inline-flex items-center gap-1.5 rounded-lg bg-[#121713] px-4 text-xs font-semibold text-white cursor-pointer">
                <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Create Draft Page
              </button>
            </form>
          ) : null}

          <div className="rounded-2xl border border-slate-200 bg-white overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                  <th className="px-4 py-3">Page</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pages.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{p.title}</p>
                      <p className="font-mono text-xs text-slate-500">/{p.slug === "home" ? "" : `${p.slug}/`}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                        p.status === "published" ? "bg-emerald-100 text-emerald-900" : p.status === "archived" ? "bg-slate-200 text-slate-700" : "bg-amber-100 text-amber-900"
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 flex flex-wrap items-center gap-2">
                      <a
                        href={`${PUBLIC_SITE_URL}/${p.slug === "home" ? "" : `${p.slug}/`}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Preview <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </a>
                      {canWrite ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPage(p);
                              const hero = p.sections?.[0];
                              setSecHeading(hero?.heading || p.title);
                              setSecSubheading(hero?.subheading || p.meta_description);
                            }}
                            className="rounded border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-50 cursor-pointer"
                          >
                            Edit Section
                          </button>
                          {p.status !== "published" ? (
                            <button type="button" onClick={() => updatePageStatus(p, "published")} className="rounded bg-[#2F4A2C] px-2.5 py-1 text-xs font-semibold text-white cursor-pointer">
                              Publish
                            </button>
                          ) : (
                            <button type="button" onClick={() => updatePageStatus(p, "draft")} className="rounded border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900 cursor-pointer">
                              Unpublish
                            </button>
                          )}
                          {p.status !== "archived" ? (
                            <button type="button" onClick={() => updatePageStatus(p, "archived")} className="rounded border border-slate-300 px-2.5 py-1 text-xs text-slate-600 cursor-pointer">
                              Archive
                            </button>
                          ) : (
                            <button type="button" onClick={() => updatePageStatus(p, "draft")} className="rounded border border-emerald-300 px-2.5 py-1 text-xs text-emerald-800 cursor-pointer">
                              Restore
                            </button>
                          )}
                        </>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {editingPage && canWrite ? (
            <form onSubmit={saveHeroSection} className="rounded-2xl border border-emerald-200 bg-white p-5 space-y-3">
              <h3 className="font-bold text-slate-900">Edit Hero / Intro Section — /{editingPage.slug}/</h3>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Heading</label>
                <input value={secHeading} onChange={(e) => setSecHeading(e.target.value)} className="w-full min-h-[38px] rounded-lg border border-slate-300 px-3 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Introductory Copy / Subheading</label>
                <textarea rows={3} value={secSubheading} onChange={(e) => setSecSubheading(e.target.value)} className="w-full rounded-lg border border-slate-300 p-2.5 text-sm" />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="rounded-lg bg-[#121713] px-4 py-2 text-xs font-semibold text-white cursor-pointer">Save Section</button>
                <button type="button" onClick={() => setEditingPage(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 cursor-pointer">Cancel</button>
              </div>
            </form>
          ) : null}
        </div>
      ) : null}

      {/* PRACTITIONERS TAB */}
      {subTab === "practitioners" ? (
        <div className="grid gap-5 lg:grid-cols-12">
          <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                  <th className="px-4 py-3">Practitioner</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Booking Status</th>
                  <th className="px-4 py-3">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {practitioners.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.role_title}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{p.department}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        p.is_active && p.is_approved && !p.is_archived ? "bg-emerald-100 text-emerald-900" : "bg-slate-200 text-slate-700"
                      }`}>
                        {p.is_archived ? "Archived" : p.is_active && p.is_approved ? "Active & Approved" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {canWrite ? (
                        <button type="button" onClick={() => startEditPractitioner(p)} className="rounded border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-800 cursor-pointer">
                          Edit
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">Read-only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 self-start">
            {!editingPrac ? (
              <p className="text-sm text-slate-500 py-8 text-center">Select a practitioner to edit biography, photo, qualifications, email, or active status.</p>
            ) : (
              <form onSubmit={savePractitioner} className="space-y-3">
                <h3 className="font-bold text-slate-900">Edit {editingPrac.name}</h3>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                  <input required value={pracName} onChange={(e) => setPracName(e.target.value)} className="w-full min-h-[38px] rounded-lg border border-slate-300 px-3 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                  <input required value={pracRole} onChange={(e) => setPracRole(e.target.value)} className="w-full min-h-[38px] rounded-lg border border-slate-300 px-3 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Qualifications</label>
                  <input value={pracQuals} onChange={(e) => setPracQuals(e.target.value)} className="w-full min-h-[38px] rounded-lg border border-slate-300 px-3 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Approved Routing Email (leave empty for Reception fallback)</label>
                  <input type="email" value={pracEmail} onChange={(e) => setPracEmail(e.target.value)} className="w-full min-h-[38px] rounded-lg border border-slate-300 px-3 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Portrait (Media Library)</label>
                  <select value={pracMediaId} onChange={(e) => setPracMediaId(e.target.value)} className="w-full min-h-[38px] rounded-lg border border-slate-300 bg-white px-3 text-sm">
                    <option value="">None</option>
                    {media.map((m) => (
                      <option key={m.id} value={m.id}>#{m.id} — {m.original_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Biography</label>
                  <textarea rows={4} value={pracBio} onChange={(e) => setPracBio(e.target.value)} className="w-full rounded-lg border border-slate-300 p-2.5 text-sm" />
                </div>
                <div className="flex items-center gap-5 text-xs font-medium text-slate-800">
                  <label className="inline-flex items-center gap-1.5">
                    <input type="checkbox" checked={pracActive} onChange={(e) => setPracActive(e.target.checked)} /> Active
                  </label>
                  <label className="inline-flex items-center gap-1.5">
                    <input type="checkbox" checked={pracApproved} onChange={(e) => setPracApproved(e.target.checked)} /> Approved for public booking list
                  </label>
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="submit" className="rounded-lg bg-[#121713] px-4 py-2 text-xs font-semibold text-white cursor-pointer">Save Profile</button>
                  <button type="button" onClick={() => setEditingPrac(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 cursor-pointer">Cancel</button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}

      {/* SERVICES TAB */}
      {subTab === "services" ? (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Routing Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {services.map((s, idx) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 flex items-center gap-1">
                    {canWrite ? (
                      <>
                        <button type="button" aria-label="Move up" onClick={() => moveService(idx, -1)} className="p-1 rounded border border-slate-200 hover:bg-slate-50 cursor-pointer"><ArrowUp className="h-3.5 w-3.5" /></button>
                        <button type="button" aria-label="Move down" onClick={() => moveService(idx, 1)} className="p-1 rounded border border-slate-200 hover:bg-slate-50 cursor-pointer"><ArrowDown className="h-3.5 w-3.5" /></button>
                      </>
                    ) : (
                      <span>{s.sort_order}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{s.title}</p>
                    <p className="text-xs text-slate-500 line-clamp-1">{s.description}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{s.contact_email || "Reception fallback"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.is_published ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"}`}>
                      {s.is_published ? "Published" : "Unpublished"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {canWrite ? (
                      <button type="button" onClick={() => toggleServicePublish(s)} className="rounded border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-800 cursor-pointer">
                        {s.is_published ? "Unpublish" : "Publish"}
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* MEDIA LIBRARY TAB */}
      {subTab === "media" ? (
        <div className="space-y-5">
          {canWrite ? (
            <form onSubmit={handleFileUpload} className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <div>
                <label htmlFor="media-file" className="block text-xs font-semibold text-slate-700 mb-1">Upload Image (JPEG, PNG, WebP, AVIF, max 5MB)</label>
                <input id="media-file" name="file" type="file" accept="image/jpeg,image/png,image/webp,image/avif" required className="text-xs" />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label htmlFor="media-alt" className="block text-xs font-semibold text-slate-700 mb-1">Descriptive Alt Text</label>
                <input id="media-alt" value={uploadAlt} onChange={(e) => setUploadAlt(e.target.value)} placeholder="Describe the photograph for screen readers" className="w-full min-h-[38px] rounded-lg border border-slate-300 px-3 text-sm" />
              </div>
              <button type="submit" className="min-h-[38px] inline-flex items-center gap-1.5 rounded-lg bg-[#121713] px-4 text-xs font-semibold text-white cursor-pointer">
                <Upload className="h-3.5 w-3.5" aria-hidden="true" /> Upload Image
              </button>
            </form>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {media.map((m) => {
              const totalRefs = Number(m.practitioner_refs) + Number(m.service_refs) + Number(m.section_refs);
              return (
                <div key={m.id} className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{m.original_name}</p>
                      <p className="font-mono text-[11px] text-slate-500">{m.mime_type} · #{m.id}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${totalRefs > 0 ? "bg-emerald-100 text-emerald-900" : "bg-slate-100 text-slate-600"}`}>
                      {totalRefs > 0 ? `In use (${totalRefs})` : "Unused"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">{m.alt_text || "(No alt text set)"}</p>
                  {canWrite ? (
                    <button
                      type="button"
                      onClick={() => deleteMedia(m)}
                      className="inline-flex items-center gap-1 rounded border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-800 hover:bg-red-100 cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" aria-hidden="true" /> Delete
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
