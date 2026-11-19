import { useState, useEffect } from 'react';
import { Package, FileText, Landmark, CheckCircle, CreditCard } from 'lucide-react';
import api, { formatZAR } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { getDisplayFirstName } from '../components/Navbar';

export default function CustomerDashboardPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [creditData, setCreditData] = useState({ applications: [], accounts: [] });
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordRes, credRes] = await Promise.all([
        api.get('/orders/my').catch(() => ({ data: { orders: [] } })),
        api.get('/credit/my').catch(() => ({ data: { applications: [], accounts: [] } }))
      ]);
      setOrders(Array.isArray(ordRes.data?.orders) ? ordRes.data.orders : []);
      setCreditData({
        applications: Array.isArray(credRes.data?.applications) ? credRes.data.applications : [],
        accounts: Array.isArray(credRes.data?.accounts) ? credRes.data.accounts : []
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePayDeposit = async (orderId) => {
    await api.post(`/orders/${orderId}/pay`, { gateway_provider: 'PayFast Deposit Gateway' });
    alert('Deposit payment verified! Now review and accept your Tirelo Capital financing agreement.');
    loadData();
  };

  const handleAcceptAgreement = async (applicationId) => {
    await api.post(`/credit/applications/${applicationId}/accept-agreement`);
    alert('Financing agreement accepted! Your Tirelo Capital account is active and your order is processing.');
    loadData();
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto p-10 text-center text-slate-500">Loading your dashboard...</div>;
  }

  const displayName = getDisplayFirstName(user);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Welcome back, {displayName}</h1>
        <p className="text-sm text-slate-500">
          Track your TT UNIK orders, Tirelo Capital credit applications, and active repayment schedules.
        </p>
      </div>

      {/* Active Tirelo Capital Financing Accounts */}
      {creditData.accounts.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Landmark className="w-5 h-5 text-[#0B4DA2]" /> My Tirelo Capital Financing Accounts
          </h2>
          {creditData.accounts.map((acc) => (
            <div key={acc.id} className="bg-white rounded-xl border border-sky-200 shadow-sm p-6 space-y-4">
              <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs font-bold text-[#0B4DA2] uppercase">{acc.account_number}</span>
                  <h3 className="font-bold text-slate-900">
                    Order {acc.order_number} • {acc.term_months} Months Facility
                  </h3>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  {acc.status}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-xs text-slate-500 block">Financed Principal</span>
                  <strong>{formatZAR(acc.principal_financed)}</strong>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Outstanding Balance</span>
                  <strong className="text-[#0B4DA2]">{formatZAR(acc.outstanding_balance)}</strong>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Monthly Instalment</span>
                  <strong>{formatZAR(acc.monthly_instalment)}</strong>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Next Payment Date</span>
                  <strong>{acc.next_payment_date}</strong>
                </div>
              </div>

              {Array.isArray(acc.schedules) && acc.schedules.length > 0 && (
                <details className="text-xs">
                  <summary className="cursor-pointer font-bold text-[#0B4DA2]">
                    View Repayment Schedule ({acc.schedules.length} instalments)
                  </summary>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b">
                          <th className="p-2">#</th>
                          <th className="p-2">Due Date</th>
                          <th className="p-2">Instalment</th>
                          <th className="p-2">Paid</th>
                          <th className="p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {acc.schedules.map((s) => (
                          <tr key={s.id} className="border-b">
                            <td className="p-2">{s.instalment_number}</td>
                            <td className="p-2">{s.due_date}</td>
                            <td className="p-2">{formatZAR(s.total_instalment_due)}</td>
                            <td className="p-2">{formatZAR(s.amount_paid)}</td>
                            <td className="p-2 font-semibold">{s.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Credit Applications */}
      {creditData.applications.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#0B4DA2]" /> Credit Applications
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {creditData.applications.map((app) => (
              <div key={app.id} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-slate-500">{app.application_number}</span>
                    <h3 className="font-bold text-slate-900">Order {app.order_number}</h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
                    {app.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50 p-3 rounded-lg">
                  <div>
                    <span className="text-slate-500 block">Deposit</span>
                    <strong>{formatZAR(app.selected_deposit_amount)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Financed</span>
                    <strong>{formatZAR(app.proposed_financed_amount)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Monthly</span>
                    <strong>{formatZAR(app.estimated_monthly_instalment)}</strong>
                  </div>
                </div>

                {app.decision_reason && (
                  <p className="text-xs text-slate-600 bg-amber-50 border border-amber-200 p-2.5 rounded-lg">
                    <strong>Tirelo Note:</strong> {app.decision_reason}
                  </p>
                )}

                {app.status === 'DEPOSIT_PENDING' && (
                  <button
                    type="button"
                    onClick={() => handlePayDeposit(app.order_id)}
                    className="w-full flex items-center justify-center gap-2 bg-[#0B4DA2] hover:bg-[#083a7c] text-white font-bold py-2.5 rounded-lg text-xs"
                  >
                    <CreditCard className="w-4 h-4" /> Pay Required Deposit ({formatZAR(app.selected_deposit_amount)})
                  </button>
                )}

                {app.status === 'AGREEMENT_PENDING' && (
                  <button
                    type="button"
                    onClick={() => handleAcceptAgreement(app.id)}
                    className="w-full flex items-center justify-center gap-2 bg-[#1D63B8] hover:bg-[#0B4DA2] text-white font-bold py-2.5 rounded-lg text-xs"
                  >
                    <CheckCircle className="w-4 h-4" /> Review & Accept Tirelo Financing Agreement
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Orders List */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Package className="w-5 h-5 text-[#0B4DA2]" /> My Orders
        </h2>
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {orders.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">You have not placed any orders yet.</p>
          ) : (
            orders.map((ord) => (
              <div key={ord.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{ord.order_number}</span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {ord.purchase_type}
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {ord.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {(ord.items || []).map((i) => `${i.product_name_snapshot} (x${i.quantity})`).join(', ')}
                  </p>
                  {ord.tracking_number && (
                    <p className="text-xs text-[#0B4DA2] font-semibold">
                      Courier: {ord.courier_name} • Tracking: {ord.tracking_number}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-base font-extrabold text-slate-900 block">
                    {formatZAR(ord.total_amount)}
                  </span>
                  <span className="text-[11px] text-slate-400">{ord.created_at}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}