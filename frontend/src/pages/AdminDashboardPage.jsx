import { useState, useEffect } from 'react';
import { BarChart3, PackageCheck, Boxes, ShieldAlert } from 'lucide-react';
import api, { formatZAR } from '../api/client';

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [tracking, setTracking] = useState({});

  const loadAdmin = () => {
    api.get('/admin/dashboard').then((res) => setData(res.data));
  };

  useEffect(() => {
    loadAdmin();
  }, []);

  if (!data) return <div className="max-w-7xl mx-auto p-10 text-center text-slate-500">Loading administration dashboard...</div>;

  const { stats, recentOrders, inventory, auditLogs } = data;

  const updateOrderStatus = async (orderId, status) => {
    await api.patch(`/orders/${orderId}/status`, {
      status,
      courier_name: 'The Courier Guy',
      tracking_number: tracking[orderId] || `TCG-${Math.floor(100000 + Math.random() * 900000)}`
    });
    loadAdmin();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">TT UNIK IT SOLUTIONS — Administration Dashboard</h1>
        <p className="text-sm text-slate-500">Real-time retail sales, credit sales, stock reservations, and compliance audit trail.</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500">Cash Sales</span>
          <strong className="text-lg font-extrabold text-emerald-600 block mt-1">{formatZAR(stats.cash_sales_total)}</strong>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500">Credit Sales</span>
          <strong className="text-lg font-extrabold text-sky-600 block mt-1">{formatZAR(stats.credit_sales_total)}</strong>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500">Deposits Collected</span>
          <strong className="text-lg font-extrabold text-slate-900 block mt-1">{formatZAR(stats.deposits_collected)}</strong>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500">Pending Credit Apps</span>
          <strong className="text-lg font-extrabold text-amber-600 block mt-1">{stats.pending_credit_apps}</strong>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500">Total Customers / Orders</span>
          <strong className="text-lg font-extrabold text-slate-900 block mt-1">{stats.total_customers} / {stats.total_orders}</strong>
        </div>
      </div>

      {/* Order Management */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h2 className="font-bold text-slate-900 flex items-center gap-2">
          <PackageCheck className="w-5 h-5 text-emerald-600" /> Order Management & Dispatch
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b text-slate-600">
                <th className="p-2.5">Order #</th>
                <th className="p-2.5">Customer</th>
                <th className="p-2.5">Type</th>
                <th className="p-2.5">Total</th>
                <th className="p-2.5">Status</th>
                <th className="p-2.5">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {recentOrders.map((o) => (
                <tr key={o.id}>
                  <td className="p-2.5 font-bold">{o.order_number}</td>
                  <td className="p-2.5">{o.first_name} {o.surname}</td>
                  <td className="p-2.5">{o.purchase_type}</td>
                  <td className="p-2.5 font-semibold">{formatZAR(o.total_amount)}</td>
                  <td className="p-2.5"><span className="px-2 py-0.5 rounded bg-slate-100 font-bold">{o.status}</span></td>
                  <td className="p-2.5 flex items-center gap-2">
                    {o.status === 'PROCESSING' && (
                      <>
                        <input
                          placeholder="Tracking #"
                          value={tracking[o.id] || ''}
                          onChange={(e) => setTracking({ ...tracking, [o.id]: e.target.value })}
                          className="border rounded px-2 py-1 w-28"
                        />
                        <button onClick={() => updateOrderStatus(o.id, 'DISPATCHED')} className="bg-sky-600 text-white px-2.5 py-1 rounded font-bold">
                          Dispatch
                        </button>
                      </>
                    )}
                    {o.status === 'DISPATCHED' && (
                      <button onClick={() => updateOrderStatus(o.id, 'DELIVERED')} className="bg-emerald-600 text-white px-2.5 py-1 rounded font-bold">
                        Mark Delivered
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Inventory & Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <Boxes className="w-5 h-5 text-amber-600" /> Inventory Levels & Reserved Stock
          </h2>
          <div className="divide-y text-xs">
            {inventory.map((inv) => (
              <div key={inv.id} className="py-2.5 flex justify-between items-center">
                <div>
                  <strong className="block text-slate-900">{inv.product_name} {inv.variant_name ? `(${inv.variant_name})` : ''}</strong>
                  <span className="text-slate-500">SKU: {inv.sku}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-700 block">Avail: {inv.quantity_available}</span>
                  <span className="text-amber-600">Reserved: {inv.quantity_reserved}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-slate-700" /> Security & Financial Audit Trail
          </h2>
          <div className="divide-y text-xs max-h-80 overflow-y-auto">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-2">
                <div className="flex justify-between">
                  <strong className="text-slate-900">{log.action}</strong>
                  <span className="text-slate-400">{log.created_at}</span>
                </div>
                <span className="text-slate-500">{log.user_email || 'System'} • {log.entity_type} #{log.entity_id}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}