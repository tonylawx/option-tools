import type { Locale } from "@tonylaw/shared/i18n";
import { uiCopy } from "@tonylaw/shared/i18n";
import { useMemo, useState } from "react";

type Props = {
  locale?: Locale;
};

type OptionMode = "put" | "call";

function fmt(value: number, digits = 2) {
  return value.toFixed(digits);
}

function parseNumber(value: string, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function OptionYieldCalculator({ locale = "zh" }: Props) {
  const text = uiCopy[locale];
  const [mode, setMode] = useState<OptionMode>("put");
  const [premium, setPremium] = useState("2.35");
  const [strike, setStrike] = useState("500");
  const [daysToExpiry, setDaysToExpiry] = useState("35");
  const [contracts, setContracts] = useState("1");

  const result = useMemo(() => {
    const premiumValue = Math.max(parseNumber(premium), 0);
    const strikeValue = Math.max(parseNumber(strike), 0);
    const daysValue = Math.max(parseNumber(daysToExpiry), 1);
    const contractsValue = Math.max(parseNumber(contracts), 1);

    const shares = contractsValue * 100;
    const premiumIncome = premiumValue * shares;
    const collateral = strikeValue * shares;
    const simpleReturn = collateral > 0 ? (premiumIncome / collateral) * 100 : 0;
    const annualizedReturn = simpleReturn * (365 / daysValue);
    const breakeven = mode === "put" ? Math.max(strikeValue - premiumValue, 0) : strikeValue + premiumValue;

    return {
      premiumIncome,
      collateral,
      simpleReturn,
      annualizedReturn,
      breakeven
    };
  }, [contracts, daysToExpiry, mode, premium, strike]);

  return (
    <section className="overflow-hidden rounded-3xl border border-[rgba(29,32,56,0.08)] bg-[#fffaf2] shadow-[var(--shadow-paper)]">
      <div className="bg-linear-to-b from-[#1d2038] to-[#252848] px-6 py-[18px] text-white">
        <p className="m-0 text-[11px] text-white/70">{text.calculatorKicker}</p>
        <h2 className="my-1 text-2xl font-semibold">{text.calculatorTitle}</h2>
        <p className="m-0 text-[13px] text-[#d9d6cf]">{text.calculatorSubtitle}</p>
        <div className="mt-3 inline-flex gap-1 rounded-full border border-white/15 bg-white/8 p-1">
          <button
            type="button"
            onClick={() => setMode("put")}
            className={`rounded-full px-3 py-[7px] text-xs ${mode === "put" ? "bg-white text-[#1d2038]" : "text-white/80"}`}
          >
            {text.shortPutMode}
          </button>
          <button
            type="button"
            onClick={() => setMode("call")}
            className={`rounded-full px-3 py-[7px] text-xs ${mode === "call" ? "bg-white text-[#1d2038]" : "text-white/80"}`}
          >
            {text.shortCallMode}
          </button>
        </div>
      </div>

      <div className="grid gap-3 p-3 md:grid-cols-2">
        <article className="rounded-[18px] border border-[rgba(29,32,56,0.07)] bg-white p-3.5">
          <h3 className="m-0 text-base font-semibold">{text.calculatorInputs}</h3>
          <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5">
              <span className="text-xs text-muted">{text.premiumLabel}</span>
              <input inputMode="decimal" value={premium} onChange={(event) => setPremium(event.target.value)} className="w-full rounded-2xl border border-line bg-[#fcfbf8] px-3 py-2.5 text-base outline-none" />
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs text-muted">{text.strikeLabel}</span>
              <input inputMode="decimal" value={strike} onChange={(event) => setStrike(event.target.value)} className="w-full rounded-2xl border border-line bg-[#fcfbf8] px-3 py-2.5 text-base outline-none" />
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs text-muted">{text.daysLabel}</span>
              <input inputMode="numeric" value={daysToExpiry} onChange={(event) => setDaysToExpiry(event.target.value)} className="w-full rounded-2xl border border-line bg-[#fcfbf8] px-3 py-2.5 text-base outline-none" />
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs text-muted">{text.contractsLabel}</span>
              <input inputMode="numeric" value={contracts} onChange={(event) => setContracts(event.target.value)} className="w-full rounded-2xl border border-line bg-[#fcfbf8] px-3 py-2.5 text-base outline-none" />
            </label>
          </div>
          <div className="mt-3.5 rounded-2xl bg-[rgba(40,73,129,0.08)] p-3">
            <strong className="mb-1 block text-xs">{text.calculatorAssumptionTitle}</strong>
            <p className="m-0 text-xs leading-5 text-muted">
              {mode === "put" ? text.calculatorAssumptionBody : text.calculatorAssumptionBodyCall}
            </p>
          </div>
        </article>

        <article className="rounded-[18px] border border-[rgba(29,32,56,0.07)] bg-white p-3.5">
          <h3 className="m-0 text-base font-semibold">{text.calculatorResults}</h3>
          <div className="mt-3.5 grid gap-0">
            <div className="flex justify-between gap-4 border-t border-line py-2.5 text-sm"><span>{text.premiumIncomeLabel}</span><strong>${fmt(result.premiumIncome)}</strong></div>
            <div className="flex justify-between gap-4 border-t border-line py-2.5 text-sm"><span>{text.collateralLabel}</span><strong>${fmt(result.collateral)}</strong></div>
            <div className="flex justify-between gap-4 border-t border-line py-2.5 text-sm"><span>{text.simpleReturnLabel}</span><strong className="text-[#1f9d63]">{fmt(result.simpleReturn, 2)}%</strong></div>
            <div className="flex justify-between gap-4 border-t border-line py-2.5 text-sm"><span>{text.annualizedReturnLabel}</span><strong className="text-amber">{fmt(result.annualizedReturn, 2)}%</strong></div>
            <div className="flex justify-between gap-4 border-t border-line py-2.5 text-sm"><span>{text.breakevenLabel}</span><strong>${fmt(result.breakeven)}</strong></div>
          </div>
        </article>
      </div>
    </section>
  );
}
