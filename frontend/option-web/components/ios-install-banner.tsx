"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@tonylaw/shared/i18n";
import { uiCopy } from "@tonylaw/shared/i18n";

type Props = {
  locale?: Locale;
};

function isStandalone() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(display-mode: standalone)").matches || Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
}

export function IOSInstallBanner({ locale = "zh" }: Props) {
  const [visible, setVisible] = useState(false);
  const text = uiCopy[locale];

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const ua = window.navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    setVisible(isIOS && !isStandalone());
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div className="mb-2.5 flex items-center justify-between gap-3 rounded-[18px] border border-[rgba(201,169,106,0.35)] bg-[rgba(255,250,242,0.92)] px-3 py-2.5 shadow-[var(--shadow-paper)]">
      <div className="grid gap-0.5">
        <strong className="text-[13px]">{text.installBannerTitle}</strong>
        <span className="text-xs text-muted">{text.installBannerBody}</span>
      </div>
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="whitespace-nowrap rounded-full bg-navy px-3 py-2 text-xs text-white"
      >
        {locale === "zh" ? "知道了" : "Close"}
      </button>
    </div>
  );
}
