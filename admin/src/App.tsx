import { useEffect, useState } from "react";
import {
  Bot,
  CalendarClock,
  FileText,
  LayoutDashboard,
  LogOut,
  MailQuestion,
  Settings,
  Shield,
  ShieldCheck,
  Users,
} from "lucide-react";
import { apiRequest, setCsrfToken, type AdminUser } from "./lib/api";
import { LoginView } from "./components/LoginView";
import { DashboardView } from "./components/DashboardView";
import { AppointmentsView } from "./components/AppointmentsView";
import { EnquiriesView } from "./components/EnquiriesView";
import { ContentCmsView } from "./components/ContentCmsView";
import { ChatbotAdminView } from "./components/ChatbotAdminView";
import { SettingsView, UsersAndAuditView } from "./components/SettingsAndUsersView";

export function App() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState<string>(() => {
    const q = new URLSearchParams(window.location.search).get("tab");
    return q || "dashboard";
  });

  useEffect(() => {
    apiRequest<{ user: AdminUser; csrfToken: string }>("/api/auth/me")
      .then((res) => {
        setCsrfToken(res.csrfToken);
        setUser(res.user);
      })
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  async function handleLogout() {
    await apiRequest("/api/auth/logout", { method: "POST" }).catch(() => {});
    setCsrfToken("");
    setUser(null);
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm text-slate-600">
        Verifying session...
      </div>
    );
  }

  if (!user) {
    return <LoginView onSuccess={(u) => setUser(u)} />;
  }

  const has = (perm: string) => user.permissions.includes(perm);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, visible: has("dashboard.read") },
    { id: "appointments", label: "Appointments", icon: CalendarClock, visible: has("appointments.read") },
    { id: "enquiries", label: "Enquiries", icon: MailQuestion, visible: has("enquiries.read") },
    { id: "cms", label: "Content & Media", icon: FileText, visible: has("cms.read") },
    { id: "chatbot", label: "Chatbot Knowledge", icon: Bot, visible: has("chatbot.read") },
    { id: "settings", label: "Settings & Emergency", icon: Settings, visible: has("cms.read") },
    { id: "users", label: "Users & Roles", icon: Users, visible: has("users.read") },
    { id: "audit", label: "Audit Logs", icon: Shield, visible: has("audit.read") },
  ].filter((n) => n.visible);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50">
      {/* Independent Operational Sidebar */}
      <aside className="w-full lg:w-64 shrink-0 bg-[#121713] text-white flex flex-col">
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2F4A2C]">
            <ShieldCheck className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-wide uppercase">Karen Surgery</p>
            <p className="text-[11px] text-white/65">Administration Portal</p>
          </div>
        </div>

        <nav aria-label="Administration" className="flex-1 p-3 flex lg:flex-col gap-1 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => setTab(item.id)}
                className={`inline-flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-sm font-medium whitespace-nowrap cursor-pointer transition-colors ${
                  active ? "bg-[#2F4A2C] text-white" : "text-white/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4 space-y-3">
          <div className="text-xs">
            <p className="font-semibold text-white truncate">{user.fullName}</p>
            <p className="text-white/65 truncate">{user.email}</p>
            <span className="mt-1 inline-block rounded bg-white/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-emerald-200">
              {user.roleCode}
            </span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-5 sm:p-8 max-w-7xl">
        {tab === "dashboard" ? <DashboardView onNavigate={setTab} /> : null}
        {tab === "appointments" && has("appointments.read") ? (
          <AppointmentsView canWrite={has("appointments.write")} />
        ) : null}
        {tab === "enquiries" && has("enquiries.read") ? (
          <EnquiriesView canWrite={has("enquiries.write")} />
        ) : null}
        {tab === "cms" && has("cms.read") ? (
          <ContentCmsView canWrite={has("cms.write")} />
        ) : null}
        {tab === "chatbot" && has("chatbot.read") ? (
          <ChatbotAdminView canWrite={has("chatbot.write")} />
        ) : null}
        {tab === "settings" && has("cms.read") ? <SettingsView user={user} /> : null}
        {tab === "users" && has("users.read") ? <UsersAndAuditView mode="users" /> : null}
        {tab === "audit" && has("audit.read") ? <UsersAndAuditView mode="audit" /> : null}
      </main>
    </div>
  );
}
