"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { authCopy, normalizeLocale, type Locale } from "@tonylaw/shared/i18n";

function authApiBaseUrl() {
  return process.env.NEXT_PUBLIC_AUTH_API_URL ?? (process.env.NODE_ENV === "production" ? "https://api.tonylaw.cc/auth" : "http://localhost:3001/auth");
}

export default function ResetPasswordPage() {
  const [locale, setLocale] = useState<Locale>("zh");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setLocale(normalizeLocale(params.get("locale")));
    setToken(params.get("token") ?? "");
  }, []);

  const text = authCopy[locale];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError(text.passwordMismatch);
      return;
    }

    const response = await fetch(`${authApiBaseUrl()}/api/public/auth/reset-password`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, password })
    });

    if (!response.ok) {
      setError(text.invalidToken);
      return;
    }

    setSuccess(text.resetSuccess);
  }

  return (
    <main className="px-4 pb-10 pt-6">
      <section className="theme-shell max-w-[460px]">
        <div className="theme-paper overflow-hidden">
          <div className="theme-header-panel">
            <p className="theme-eyebrow m-0">tonylaw.cc</p>
            <h1 className="mt-3 text-[34px] leading-[1.05] font-semibold">{text.resetTitle}</h1>
            <p className="mt-3 text-sm text-white/80">{text.resetDescription}</p>
          </div>
          <section className="p-4 md:p-5">
            <div className="theme-card p-5 md:p-6">
              <form onSubmit={handleSubmit} className="grid gap-4">
                <label className="theme-label">
                  {text.passwordLabel}
                  <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="theme-input" required />
                </label>
                <label className="theme-label">
                  {text.confirmPasswordLabel}
                  <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="theme-input" required />
                </label>
                {success ? <p className="theme-status-success m-0">{success}</p> : null}
                {error ? <p className="theme-status-error m-0">{error}</p> : null}
                <button type="submit" className="theme-button-primary">{text.resetSubmit}</button>
              </form>
              <div className="mt-4 text-sm">
                <Link href={`/signin?locale=${locale}`} className="text-navy underline">{text.backToSignin}</Link>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
