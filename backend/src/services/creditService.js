import db from '../config/db.js';

export function getCreditPolicy() {
  const rows = db.prepare(`SELECT setting_key, setting_value, value_type FROM system_settings WHERE setting_group = 'TIRELO_CREDIT'`).all();
  const policy = {};
  for (const row of rows) {
    if (row.value_type === 'NUMBER') policy[row.setting_key] = Number(row.setting_value);
    else if (row.value_type === 'JSON') policy[row.setting_key] = JSON.parse(row.setting_value);
    else policy[row.setting_key] = row.setting_value;
  }
  return policy;
}

export function calculateCreditQuote({ retailPrice, depositPercentage, months, productMinDepositPct = null }) {
  const policy = getCreditPolicy();
  const minPct = productMinDepositPct ? Number(productMinDepositPct) : policy.default_min_deposit_pct;
  const effectiveDepositPct = Math.max(Number(depositPercentage || minPct), minPct);
  const termMonths = Number(months || 12);

  const depositAmount = Number(((retailPrice * effectiveDepositPct) / 100).toFixed(2));
  const financedPrincipal = Number((retailPrice - depositAmount).toFixed(2));

  // NCA-style flat initiation fee + monthly service fee + reducing-balance monthly interest
  const initiationFee = Number(policy.initiation_fee_zar || 0);
  const monthlyServiceFee = Number(policy.monthly_service_fee_zar || 0);
  const annualRate = Number(policy.annual_interest_rate_pct || 21.5);
  const monthlyRate = annualRate / 100 / 12;

  const principalWithInitiation = financedPrincipal + initiationFee;

  let baseMonthlyPayment = 0;
  if (monthlyRate > 0) {
    const factor = Math.pow(1 + monthlyRate, termMonths);
    baseMonthlyPayment = (principalWithInitiation * monthlyRate * factor) / (factor - 1);
  } else {
    baseMonthlyPayment = principalWithInitiation / termMonths;
  }

  const estimatedMonthlyInstalment = Number((baseMonthlyPayment + monthlyServiceFee).toFixed(2));
  const totalPayable = Number((estimatedMonthlyInstalment * termMonths).toFixed(2));
  const totalInterestAndFees = Number((totalPayable - financedPrincipal).toFixed(2));

  return {
    is_indicative_estimate: true,
    disclaimer: 'Indicative estimate only. Subject to Tirelo Capital credit assessment, affordability check, and final agreement.',
    retail_price: Number(retailPrice.toFixed(2)),
    min_deposit_percentage: minPct,
    selected_deposit_percentage: effectiveDepositPct,
    deposit_amount: depositAmount,
    financed_principal: financedPrincipal,
    repayment_months: termMonths,
    annual_interest_rate_pct: annualRate,
    initiation_fee: initiationFee,
    monthly_service_fee: monthlyServiceFee,
    estimated_monthly_instalment: estimatedMonthlyInstalment,
    total_interest_and_fees: totalInterestAndFees,
    total_payable: totalPayable,
    allowed_deposit_percentages: policy.allowed_deposit_percentages.filter((p) => p >= minPct),
    allowed_repayment_months: policy.allowed_repayment_months
  };
}

export function generateRepaymentSchedule(creditAccountId, principal, totalInterestAndFees, monthlyInstalment, termMonths) {
  const insert = db.prepare(`
    INSERT INTO repayment_schedules (
      credit_account_id, instalment_number, due_date,
      principal_component, interest_component, fee_component, total_instalment_due, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'UPCOMING')
  `);

  const principalPart = Number((principal / termMonths).toFixed(2));
  const feePart = 69.00;
  const interestPart = Number(Math.max(0, monthlyInstalment - principalPart - feePart).toFixed(2));

  const startDate = new Date();
  for (let i = 1; i <= termMonths; i++) {
    const due = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
    const dueDateStr = due.toISOString().split('T')[0];
    insert.run(creditAccountId, i, dueDateStr, principalPart, interestPart, feePart, monthlyInstalment);
  }
}