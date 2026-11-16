import { useState, useEffect } from 'react';
import { Landmark, CheckCircle2, XCircle, FileWarning, DollarSign } from 'lucide-react';
import api, { formatZAR } from '../api/client';

export default function TireloPortalPage() {
  const [applications, setApplications] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [tab, setTab] = useState('applications');
  const [notes, setNotes] = useState({});
  const [repayAmount, setRepayAmount] = useState({});

  const loadPortal = async () => {
    const [appRes, accRes] = await Promise.all([
      api.get('/credit/portal/applications'),
      api.get('/credit/portal/accounts')
    ]);
    setApplications(appRes.data.applications);
    setAccounts(accRes.data.accounts);
  };

  useEffect(() => {
    loadPortal();
  }, []);

  const handleDecision = async (appId, decision) => {
    await api.post(`/credit/portal/applications/${appId}/decide`, {
      decision,
      decision_reason: notes[appId] || `Assessed by Tirelo Capital Officer: ${decision}`
    });
    loadPortal();
  };

  const handleRecordRepayment = async (accountId, defaultAmount) => {
    const amount = repayAmount[accountId] || defaultAmount;
    await api.post(`/credit/portal/accounts/${accountId}/repayments`, {
      amount: Number(amount),
      payment_channel: 'DEBIT_ORDER',
      external_receipt_ref: `DO-${Date.now()}`
    });
    alert('Repayment allocated to financing account.');
    loadPortal();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="bg-sky-950 text-white rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-sky-500/20 p-3 rounded-xl border border-sky-400/30">
            <Landmark className="w-7 h-7 text-sky-300" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold">Tirelo Capital Credit & Collections Portal</h1>
            <p className="text-xs text-sky-200">Authoritative Credit Assessment, Agreement Administration & Repayment Collections</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setTab('applications')}
            className={`px-4 py-2 rounded-lg text-xs font-bold ${tab === 'applications' ? 'bg-sky-500 text-slate-950' : 'bg-sky-900 text-sky-200'}`}
          >
            Credit Applications ({applications.length})
          </button>
          <button
            onClick={() => setTab('accounts')}
            className={`px-4 py-2 rounded-lg text-xs font-bold ${tab === 'accounts' ? 'bg-sky-500 text-slate-950' : 'bg-sky-900 text-sky-200'}`}
          >
            Active Financing Accounts ({accounts.length})
          </button>
        </div>
      </div>

      {tab === 'applications' ? (
        <div className="space-y-4">
          {applications.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border text-center text-slate-500 text-sm">No credit applications submitted yet.</div>
          ) : (
            applications.map((app) => {
              const disposable = Number(app.monthly_net_income) - Number(app.monthly_expenses);
              return (
                <div key={app.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                  <div className="flex flex-wrap justify-between items-start gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <span className="text-xs font-bold text-sky-700">{app.application_number} • Order {app.order_number}</span>
                      <h3 className="text-lg font-bold text-slate-900">{app.first_name} {app.surname} (ID: {app.id_number})</h3>
                      <p className="text-xs text-slate-500">{app.email} • {app.mobile_number} • {app.employment_status} at {app.employer_name}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-sky-100 text-sky-900">{app.status}</span>
                  </div>

                  {/* Affordability & Deal Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 bg-slate-50 p-3.5 rounded-xl text-xs">
                    <div><span className="text-slate-500 block">Retail Price</span><strong>{formatZAR(app.product_retail_price)}</strong></div>
                    <div><span className="text-slate-500 block">Deposit</span><strong>{formatZAR(app.selected_deposit_amount)}</strong></div>
                    <div><span className="text-slate-500 block">Financed</span><strong className="text-sky-700">{formatZAR(app.proposed_financed_amount)}</strong></div>
                    <div><span className="text-slate-500 block">Instalment ({app.repayment_months}m)</span><strong>{formatZAR(app.estimated_monthly_instalment)}</strong></div>
                    <div><span className="text-slate-500 block">Net Income</span><strong>{formatZAR(app.monthly_net_income)}</strong></div>
                    <div><span className="text-slate-500 block">Disposable Income</span><strong className={disposable >= app.estimated_monthly_instalment ? 'text-emerald-600' : 'text-rose-600'}>{formatZAR(disposable)}</strong></div>
                  </div>

                  {/* Uploaded KYC Documents */}
                  <div className="text-xs">
                    <span className="font-bold text-slate-700">Supporting KYC Documents: </span>
                    {app.documents.length === 0 ? (
                      <span className="text-slate-400">None attached</span>
                    ) : (
                      app.documents.map((d) => (
                        <a
                          key={d.id}
                          href={`http://localhost:5000/uploads/kyc/${d.encrypted_storage_path}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block mr-2 px-2.5 py-1 bg-slate-100 hover:bg-sky-100 text-sky-800 rounded font-semibold"
                        >
                          {d.document_type}: {d.original_filename}
                        </a>
                      ))
                    )}
                  </div>

                  {['SUBMITTED', 'UNDER_REVIEW', 'DOCUMENTS_REQUIRED'].includes(app.status) && (
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <input
                        type="text"
                        placeholder="Assessment notes / condition / reason..."
                        value={notes[app.id] || ''}
                        onChange={(e) => setNotes({ ...notes, [app.id]: e.target.value })}
                        className="flex-1 px-3 py-2 border rounded-lg text-xs"
                      />
                      <button onClick={() => handleDecision(app.id, 'APPROVED')} className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-lg text-xs">
                        <CheckCircle2 className="w-4 h-4" /> Approve Credit
                      </button>
                      <button onClick={() => handleDecision(app.id, 'DOCUMENTS_REQUIRED')} className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs">
                        <FileWarning className="w-4 h-4" /> Request Docs
                      </button>
                      <button onClick={() => handleDecision(app.id, 'DECLINED')} className="inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2 rounded-lg text-xs">
                        <XCircle className="w-4 h-4" /> Decline
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {accounts.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border text-center text-slate-500 text-sm">No active financing accounts yet.</div>
          ) : (
            accounts.map((acc) => (
              <div key={acc.id} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-4">
                  <div>
                    <span className="text-xs font-bold text-sky-700">{acc.account_number} • {acc.first_name} {acc.surname} (ID: {acc.id_number})</span>
                    <h3 className="font-bold text-slate-900">Outstanding Balance: {formatZAR(acc.outstanding_balance)} / {formatZAR(acc.total_payable)}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder={acc.monthly_instalment}
                      value={repayAmount[acc.id] || ''}
                      onChange={(e) => setRepayAmount({ ...repayAmount, [acc.id]: e.target.value })}
                      className="w-32 px-3 py-2 border rounded-lg text-xs"
                    />
                    <button
                      onClick={() => handleRecordRepayment(acc.id, acc.monthly_instalment)}
                      className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-lg text-xs"
                    >
                      <DollarSign className="w-4 h-4" /> Record Repayment
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}