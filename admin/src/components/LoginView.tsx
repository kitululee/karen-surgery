import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import { apiRequest, setCsrfToken, type AdminUser } from "../lib/api";

interface LoginViewProps {
  onSuccess: (user: AdminUser) => void;
}

export function LoginView({ onSuccess }: LoginViewProps) {
  const params = new URLSearchParams(window.location.search);
  const initialResetToken = params.get("resetToken") || "";

  const [mode, setMode] = useState<"login" | "forgot" | "reset">(initialResetToken ? "reset" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetToken, setResetToken] = useState(initialResetToken);
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiRequest<{ user: AdminUser; csrfToken: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setCsrfToken(res.csrfToken);
      onSuccess(res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot(e: FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const res = await apiRequest<{ message: string }>("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setNotice(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const res = await apiRequest<{ message: string }>("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token: resetToken, newPassword }),
      });
      setNotice(res.message);
      setMode("login");
      setNewPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2F4A2C] text-white">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900">Karen Surgery Admin</h1>
            <p className="text-xs text-slate-500">Protected Practice Operations &amp; CMS Portal</p>
          </div>
        </div>

        {error ? (
          <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        {notice ? (
          <div role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {notice}
          </div>
        ) : null}

        {mode === "login" ? (
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label htmlFor="admin-email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Administrator Email
              </label>
              <input
                id="admin-email"
                name="email"
                type="email"
                required
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2 text-base text-slate-900"
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 pl-3.5 pr-11 py-2 text-base text-slate-900"
                />
                <button
                  type="button"
                  aria-pressed={showPassword}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#121713] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#2F4A2C] disabled:opacity-60 cursor-pointer transition-colors"
            >
              <Lock className="h-4 w-4" aria-hidden="true" />
              <span>{loading ? "Signing in..." : "Sign in to Admin Portal"}</span>
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setNotice("");
                  setMode("forgot");
                }}
                className="text-xs font-medium text-[#2F4A2C] hover:underline cursor-pointer"
              >
                Forgot your password?
              </button>
            </div>
          </form>
        ) : null}

        {mode === "forgot" ? (
          <form onSubmit={handleForgot} className="mt-6 space-y-4">
            <p className="text-sm text-slate-600">
              Enter your administrator email to generate a time-limited password reset link.
            </p>
            <div>
              <label htmlFor="forgot-email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                id="forgot-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2 text-base"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[46px] rounded-xl bg-[#121713] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#2F4A2C] disabled:opacity-60 cursor-pointer"
            >
              {loading ? "Requesting..." : "Request Password Reset"}
            </button>
            <button
              type="button"
              onClick={() => setMode("login")}
              className="w-full text-xs font-medium text-slate-600 hover:underline cursor-pointer"
            >
              Back to Sign In
            </button>
          </form>
        ) : null}

        {mode === "reset" ? (
          <form onSubmit={handleReset} className="mt-6 space-y-4">
            <div>
              <label htmlFor="reset-token" className="block text-sm font-medium text-slate-700 mb-1.5">
                Reset Token
              </label>
              <input
                id="reset-token"
                type="text"
                required
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-mono"
              />
            </div>
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-slate-700 mb-1.5">
                New Password (min 12 characters)
              </label>
              <input
                id="new-password"
                type="password"
                required
                minLength={12}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2 text-base"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[46px] rounded-xl bg-[#121713] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#2F4A2C] disabled:opacity-60 cursor-pointer"
            >
              {loading ? "Updating..." : "Set New Password"}
            </button>
            <button
              type="button"
              onClick={() => setMode("login")}
              className="w-full text-xs font-medium text-slate-600 hover:underline cursor-pointer"
            >
              Back to Sign In
            </button>
          </form>
        ) : null}

        <p className="mt-6 border-t border-slate-100 pt-4 text-[11px] leading-relaxed text-slate-500">
          Authorised Karen Surgery personnel only. All sessions use HTTP-only server cookies and
          administrative changes are recorded in the audit log.
        </p>
      </div>
    </div>
  );
}
