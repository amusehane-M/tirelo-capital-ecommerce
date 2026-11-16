import { useState, useEffect } from 'react';
import { Calculator, Info } from 'lucide-react';
import api, { formatZAR } from '../api/client';

export default function DepositCalculator({ retailPrice, minDepositPct = 20, onSelectTerms }) {
  const [depositPct, setDepositPct] = useState(Math.max(25, minDepositPct));
  const [months, setMonths] = useState(12);
  const [quote, setQuote] = useState(null);

  useEffect(() => {
    setDepositPct((prev) => Math.max(prev, minDepositPct));
  }, [minDepositPct]);

  useEffect(() => {
    if (!retailPrice) return;
    api
      .post('/products/calculate-credit', {
        retail_price: retailPrice,
        deposit_percentage: depositPct,
        months,
        min_deposit_percentage: minDepositPct
      })
      .then(({ data }) => {
        setQuote(data);
        if (onSelectTerms) onSelectTerms(data);
      })
      .catch(() => {});
  }, [retailPrice, depositPct, months, minDepositPct]);

  if (!quote) return null;

  return (
    <div className="bg-sky-50/80 border border-sky-200 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sky-950 font-bold">
          <Calculator className="w-5 h-5 text-sky-600" />
          <span>Tirelo Capital Credit Deposit Calculator</span>
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-wider bg-sky-100 text-sky-800 px-2.5 py-0.5 rounded-full">
          Indicative Estimate
        </span>
      </div>

      <div>
        <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
          <span>Select Deposit Percentage (Min {quote.min_deposit_percentage}%)</span>
          <span className="text-sky-700">{quote.selected_deposit_percentage}%</span>
        </div>
        <div className="grid grid-cols-6 gap-1.5">
          {[15, 20, 25, 30, 40, 50].map((pct) => {
            const disabled = pct < quote.min_deposit_percentage;
            return (
              <button
                key={pct}
                type="button"
                disabled={disabled}
                onClick={() => setDepositPct(pct)}
                className={`py-1.5 text-xs font-bold rounded-lg border transition ${
                  disabled
                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                    : depositPct === pct
                    ? 'bg-sky-600 text-white border-sky-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:border-sky-500'
                }`}
              >
                {pct}%
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <span className="block text-xs font-semibold text-slate-700 mb-1.5">Repayment Term (Months)</span>
        <div className="grid grid-cols-5 gap-1.5">
          {[6, 12, 18, 24, 36].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMonths(m)}
              className={`py-1.5 text-xs font-bold rounded-lg border transition ${
                months === m
                  ? 'bg-sky-600 text-white border-sky-600'
                  : 'bg-white text-slate-700 border-slate-300 hover:border-sky-500'
              }`}
            >
              {m}m
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 bg-white p-3.5 rounded-lg border border-sky-100">
        <div>
          <span className="text-[11px] text-slate-500 block">Upfront Deposit</span>
          <span className="text-base font-extrabold text-slate-900">{formatZAR(quote.deposit_amount)}</span>
        </div>
        <div>
          <span className="text-[11px] text-slate-500 block">Financed Balance</span>
          <span className="text-base font-extrabold text-sky-700">{formatZAR(quote.financed_principal)}</span>
        </div>
        <div>
          <span className="text-[11px] text-slate-500 block">Est. Monthly ({months}m)</span>
          <span className="text-base font-extrabold text-emerald-600">{formatZAR(quote.estimated_monthly_instalment)}</span>
        </div>
      </div>

      <p className="text-[11px] text-slate-500 flex items-start gap-1.5 leading-relaxed">
        <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
        <span>
          Includes R{quote.initiation_fee.toFixed(2)} initiation fee, R{quote.monthly_service_fee.toFixed(2)}/pm service fee at {quote.annual_interest_rate_pct}% p.a. {quote.disclaimer}
        </span>
      </p>
    </div>
  );
}