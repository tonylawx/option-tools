"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { authCopy, normalizeLocale, type Locale } from "@tonylaw/shared/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type AuthMode = "signin" | "register";

function readCallbackUrl() {
  if (typeof window === "undefined") {
    return "";
  }

  const params = new URLSearchParams(window.location.search);
  return params.get("callbackUrl") ?? "https://optix.tonylaw.cc";
}

function authApiBaseUrl() {
  return process.env.NEXT_PUBLIC_AUTH_API_URL ?? (process.env.NODE_ENV === "production" ? "https://api.tonylaw.cc/auth" : "http://localhost:3001/auth");
}

export default function SignInPage() {
  const callbackUrl = useMemo(readCallbackUrl, []);
  const [locale, setLocale] = useState<Locale>("zh");
  const [mode, setMode] = useState<AuthMode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    setLocale(normalizeLocale(params.get("locale")));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    params.set("locale", locale);
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  }, [locale]);

  const text = authCopy[locale];

  async function handleResendVerification() {
    if (!email) {
      setError(text.emailNotVerified);
      return;
    }

    const response = await fetch(`${authApiBaseUrl()}/api/public/auth/resend-verification`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, locale })
    });
    const payload = (await response.json().catch(() => ({}))) as { previewUrl?: string };
    setPreviewUrl(payload.previewUrl ?? "");
    setSuccess(text.resendVerificationSuccess);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setSuccess("");
    setPreviewUrl("");

    if (mode === "register") {
      if (password !== confirmPassword) {
        setPending(false);
        setError(text.passwordMismatch);
        return;
      }

      const response = await fetch(`${authApiBaseUrl()}/api/public/auth/register`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ name, email, password, locale })
      });

      const payload = (await response.json().catch(() => ({ error: text.registerFailed }))) as {
        error?: string;
        previewUrl?: string;
      };

      if (!response.ok) {
        setPending(false);
        setError(payload.error ?? text.registerFailed);
        return;
      }

      setPending(false);
      setPreviewUrl(payload.previewUrl ?? "");
      setSuccess(text.registerVerifySuccess);
      setMode("signin");
      return;
    }

    const statusResponse = await fetch(`${authApiBaseUrl()}/api/public/auth/login-status`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    if (!statusResponse.ok) {
      const payload = (await statusResponse.json().catch(() => ({}))) as { code?: string };
      setPending(false);

      if (payload.code === "EMAIL_NOT_FOUND") {
        setError(text.emailNotFound);
      } else if (payload.code === "EMAIL_NOT_VERIFIED") {
        setError(text.emailNotVerified);
      } else {
        setError(text.invalidCredentials);
      }
      return;
    }

    const signInResponse = await fetch(`${authApiBaseUrl()}/api/public/auth/sign-in`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({ email, password })
    });

    setPending(false);

    if (!signInResponse.ok) {
      setError(text.invalidCredentials);
      return;
    }

    window.location.href = callbackUrl;
  }

  return (
    <main className="px-4 pb-10 pt-6">
      <section className="theme-shell max-w-[460px]">
        <div className="theme-paper overflow-hidden">
          <div className="theme-header-panel">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="theme-eyebrow m-0">tonylaw.cc</p>
                <h1 className="mt-3 text-[34px] leading-[1.05] font-semibold">
                  {mode === "signin" ? text.titleSignin : text.titleRegister}
                </h1>
              </div>

              <div className="theme-segmented-soft">
                <Button type="button" size="sm" onClick={() => setLocale("zh")} className={`h-8 rounded-full px-2.5 text-xs ${locale === "zh" ? "bg-white text-navy hover:bg-white" : "bg-transparent text-white/72 shadow-none hover:bg-white/10"}`}>
                  {text.localeZh}
                </Button>
                <Button type="button" size="sm" onClick={() => setLocale("en")} className={`h-8 rounded-full px-2.5 text-xs ${locale === "en" ? "bg-white text-navy hover:bg-white" : "bg-transparent text-white/72 shadow-none hover:bg-white/10"}`}>
                  {text.localeEn}
                </Button>
              </div>
            </div>
          </div>

          <section className="p-4 md:p-5">
            <div className="theme-card p-5 md:p-6">
              <Tabs
                value={mode}
                onValueChange={(value) => {
                  setMode(value as AuthMode);
                  setError("");
                  setSuccess("");
                  setPreviewUrl("");
                }}
                className="w-full"
              >
                <TabsList className="grid h-auto w-full grid-cols-2 rounded-full bg-[rgba(29,32,56,0.05)] p-1">
                  <TabsTrigger value="signin" className="rounded-full py-2 text-[13px] font-medium data-[state=active]:bg-navy data-[state=active]:text-white">
                    {text.signinTab}
                  </TabsTrigger>
                  <TabsTrigger value="register" className="rounded-full py-2 text-[13px] font-medium data-[state=active]:bg-navy data-[state=active]:text-white">
                    {text.registerTab}
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
                {mode === "register" ? (
                  <label className="theme-label">
                    {text.nameLabel}
                    <Input type="text" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" placeholder={text.namePlaceholder} className="theme-input h-12 rounded-2xl bg-white/95 px-3.5 text-[15px]" />
                  </label>
                ) : null}

                <label className="theme-label">
                  {text.emailLabel}
                  <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required className="theme-input h-12 rounded-2xl bg-white/95 px-3.5 text-[15px]" />
                </label>

                <label className="theme-label">
                  {text.passwordLabel}
                  <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "register" ? "new-password" : "current-password"} placeholder={mode === "register" ? text.passwordPlaceholder : undefined} required className="theme-input h-12 rounded-2xl bg-white/95 px-3.5 text-[15px]" />
                </label>

                {mode === "register" ? (
                  <label className="theme-label">
                    {text.confirmPasswordLabel}
                    <Input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" placeholder={text.passwordPlaceholder} required className="theme-input h-12 rounded-2xl bg-white/95 px-3.5 text-[15px]" />
                  </label>
                ) : null}

                <input type="hidden" name="callbackUrl" value={callbackUrl} />

                {success ? <p className="theme-status-success m-0">{success}</p> : null}
                {error ? <p className="theme-status-error m-0">{error}</p> : null}
                {previewUrl ? <a href={previewUrl} className="text-sm text-navy underline" target="_blank" rel="noreferrer">{text.previewLink}</a> : null}

                <Button type="submit" disabled={pending} className="theme-button-primary h-[50px] rounded-2xl text-[15px] font-bold">
                  {pending
                    ? mode === "signin"
                      ? text.pendingSignin
                      : text.pendingRegister
                    : mode === "signin"
                      ? text.submitSignin
                      : text.submitRegister}
                </Button>
              </form>

              <div className="mt-4 flex items-center justify-between text-sm">
                <Link href={`/forgot-password?locale=${locale}`} className="text-navy underline">
                  {text.forgotPassword}
                </Link>
                {error === text.emailNotVerified ? (
                  <button type="button" onClick={() => void handleResendVerification()} className="text-navy underline">
                    {text.resendVerification}
                  </button>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
