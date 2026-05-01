import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LOCALE, OPTION_MODE, OptionMode } from "@/shared/constants";
import type { Locale } from "@/shared/i18n";
import { uiCopy } from "@/shared/i18n";

type Props = {
  locale?: Locale;
};

function fmt(value: number, digits = 2) {
  return value.toFixed(digits);
}

function parseNumber(value: string, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function ClearableInput({
  inputMode,
  value,
  onChange,
  ariaLabel
}: {
  inputMode: "decimal" | "numeric";
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="relative flex items-center">
      <Input
        className="pr-10"
        inputMode={inputMode}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {focused && value ? (
        <Button
          className="absolute right-2 top-1/2 size-6 -translate-y-1/2 rounded-full bg-app-navy/8 p-0 text-base leading-none text-app-muted hover:bg-app-navy/12"
          variant="ghost"
          size="icon"
          aria-label={ariaLabel}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onChange("")}
        >
          ×
        </Button>
      ) : null}
    </div>
  );
}

export function OptionYieldCalculator({ locale = LOCALE.ZH }: Props) {
  const text = uiCopy[locale];
  const [mode, setMode] = useState<OptionMode>(OPTION_MODE.PUT);
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
    const breakeven = mode === OPTION_MODE.PUT
      ? Math.max(strikeValue - premiumValue, 0)
      : strikeValue + premiumValue;

    return {
      premiumIncome,
      collateral,
      simpleReturn,
      annualizedReturn,
      breakeven
    };
  }, [contracts, daysToExpiry, mode, premium, strike]);

  return (
    <section className="overflow-hidden rounded-3xl border border-app-navy/8 bg-[#fffaf2] shadow-app">
      <div className="bg-gradient-to-b from-app-navy to-[#252848] px-6 py-5 text-white">
        <p className="m-0 text-[11px] text-white/72">{text.calculatorKicker}</p>
        <h2 className="mt-1 text-2xl font-semibold">{text.calculatorTitle}</h2>
        <p className="mt-1 text-[13px] text-[#d9d6cf]">{text.calculatorSubtitle}</p>
        <ToggleGroup
          className="mt-3 rounded-full border border-white/16 bg-white/8 p-1"
          spacing={1}
          type="single"
          value={mode}
          onValueChange={(value) => {
            if (value) {
              setMode(value as OptionMode);
            }
          }}
        >
          <ToggleGroupItem
            className="!rounded-full border-0 px-3 text-white/78 hover:bg-white/10 hover:text-white data-[state=on]:bg-white data-[state=on]:text-app-navy"
            value={OPTION_MODE.PUT}
          >
            {text.shortPutMode}
          </ToggleGroupItem>
          <ToggleGroupItem
            className="!rounded-full border-0 px-3 text-white/78 hover:bg-white/10 hover:text-white data-[state=on]:bg-white data-[state=on]:text-app-navy"
            value={OPTION_MODE.CALL}
          >
            {text.shortCallMode}
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="grid gap-3 p-3 lg:grid-cols-2">
        <article className="rounded-[18px] border border-app-navy/7 bg-white p-4">
          <h3 className="text-base font-semibold">{text.calculatorInputs}</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5">
              <span className="text-xs text-app-muted">{text.premiumLabel}</span>
              <ClearableInput
                inputMode="decimal"
                value={premium}
                onChange={setPremium}
                ariaLabel={text.clearInput}
              />
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs text-app-muted">{text.strikeLabel}</span>
              <ClearableInput
                inputMode="decimal"
                value={strike}
                onChange={setStrike}
                ariaLabel={text.clearInput}
              />
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs text-app-muted">{text.daysLabel}</span>
              <ClearableInput
                inputMode="numeric"
                value={daysToExpiry}
                onChange={setDaysToExpiry}
                ariaLabel={text.clearInput}
              />
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs text-app-muted">{text.contractsLabel}</span>
              <ClearableInput
                inputMode="numeric"
                value={contracts}
                onChange={setContracts}
                ariaLabel={text.clearInput}
              />
            </label>
          </div>
          <div className="mt-3 rounded-2xl bg-app-soft-blue px-3 py-3">
            <strong className="mb-1 block text-xs">{text.calculatorAssumptionTitle}</strong>
            <p className="text-xs leading-6 text-app-muted">
              {mode === OPTION_MODE.PUT ? text.calculatorAssumptionBody : text.calculatorAssumptionBodyCall}
            </p>
          </div>
        </article>

        <article className="rounded-[18px] border border-app-navy/7 bg-white p-4">
          <h3 className="text-base font-semibold">{text.calculatorResults}</h3>
          <div className="mt-3 grid gap-0.5">
            <div className="flex items-center justify-between gap-4 border-t border-app-line py-2.5 text-sm first:border-t-0 first:pt-0">
              <span>{text.premiumIncomeLabel}</span>
              <strong>${fmt(result.premiumIncome)}</strong>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-app-line py-2.5 text-sm">
              <span>{text.collateralLabel}</span>
              <strong>${fmt(result.collateral)}</strong>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-app-line py-2.5 text-sm">
              <span>{text.simpleReturnLabel}</span>
              <strong className="text-[#1f9d63]">{fmt(result.simpleReturn, 2)}%</strong>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-app-line py-2.5 text-sm">
              <span>{text.annualizedReturnLabel}</span>
              <strong className="text-app-amber">{fmt(result.annualizedReturn, 2)}%</strong>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-app-line py-2.5 text-sm">
              <span>{text.breakevenLabel}</span>
              <strong>${fmt(result.breakeven)}</strong>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
