import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, CreditCard, Banknote, UploadCloud } from 'lucide-react';
import api, { formatZAR } from '../api/client';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import DepositCalculator from '../components/DepositCalculator';

export default function CartCheckoutPage() {
  const { items, purchaseMode, setPurchaseMode, updateQuantity, removeFromCart, clearCart, subtotal, allCreditEligible } = useCart();
  const { user, addresses } = useAuth();
  const navigate = useNavigate();

  const [selectedAddressId, setSelectedAddressId] = useState(addresses[0]?.id || '');
  const [promoCode, setPromoCode] = useState('');
  const [creditQuote, setCreditQuote] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Credit Application Form State (URS Section 4.4)
  const [creditForm, setCreditForm] = useState({
    employment_status: 'PERMANENT',
    employer_name: '',
    employer_contact: '',
    monthly_gross_income: '',
    monthly_net_income: '',
    monthly_expenses: ''
  });
  const [idDoc, setIdDoc] = useState(null);
  const [payslipDoc, setPayslipDoc] = useState(null);

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Your Shopping Cart is Empty</h2>
        <Link to="/" className="inline-block bg-emerald-600 text-white font-bold px-6 py-3 rounded-xl text-sm">
          Browse Electronics
        </Link>
      </div>
    );
  }

  const deliveryFee = subtotal >= 2500 ? 0 : 150;
  const totalAmount = subtotal + deliveryFee;

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    const addrId = selectedAddressId || addresses[0]?.id;
    if (!addrId) {
      setError('Please ensure you have a delivery address on your profile.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      // 1. Create Order
      const { data: orderData } = await api.post('/orders/checkout', {
        items: items.map((i) => ({
          product_id: i.product_id,
          product_variant_id: i.product_variant_id,
          quantity: i.quantity
        })),
        delivery_address_id: Number(addrId),
        purchase_type: purchaseMode,
        deposit_percentage: creditQuote?.selected_deposit_percentage || 20,
        repayment_months: creditQuote?.repayment_months || 12,
        promotion_code: promoCode || undefined
      });

      if (purchaseMode === 'CASH') {
        // 2A. Verify Cash Payment via Sandbox Gateway
        await api.post(`/orders/${orderData.order.id}/pay`, { gateway_provider: 'PayFast Instant EFT' });
        clearCart();
        navigate('/dashboard');
      } else {
        // 2B. Submit Credit Application to Tirelo Capital
        const { data: appData } = await api.post('/credit/applications', {
          order_id: orderData.order.id,
          deposit_percentage: creditQuote?.selected_deposit_percentage || 20,
          repayment_months: creditQuote?.repayment_months || 12,
          ...creditForm
        });

        // 3. Upload Supporting KYC Documents if selected
        if (idDoc) {
          const fd = new FormData();
          fd.append('document', idDoc);
          fd.append('document_type', 'SA_ID_OR_PASSPORT');
          await api.post(`/credit/applications/${appData.application_id}/documents`, fd);
        }
        if (payslipDoc) {
          const fd = new FormData();
          fd.append('document', payslipDoc);
          fd.append('document_type', 'PAYSLIP');
          await api.post(`/credit/applications/${appData.application_id}/documents`, fd);
        }

        clearCart();
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Checkout failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Cart Items */}
      <div className="lg:col-span-7 space-y-4">
        <h1 className="text-2xl font-extrabold text-slate-900">Shopping Cart & Checkout</h1>

        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {items.map((item) => (
            <div key={item.key} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover bg-slate-100" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{item.name}</h3>
                  {item.variant_name && <span className="text-xs text-slate-500 block">{item.variant_name}</span>}
                  <span className="text-sm font-bold text-emerald-700">{formatZAR(item.unit_price)}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center border rounded-lg">
                  <button type="button" onClick={() => updateQuantity(item.key, -1)} className="px-2.5 py-1 text-sm font-bold">-</button>
                  <span className="px-2.5 text-sm font-semibold">{item.quantity}</span>
                  <button type="button" onClick={() => updateQuantity(item.key, 1)} className="px-2.5 py-1 text-sm font-bold">+</button>
                </div>
                <button type="button" onClick={() => removeFromCart(item.key)} className="text-rose-500 hover:text-rose-700 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Payment Method Toggle */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
          <h2 className="font-bold text-slate-900 text-sm uppercase tracking-wider">1. Choose Purchasing Method</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPurchaseMode('CASH')}
              className={`p-4 rounded-xl border-2 text-left transition ${purchaseMode === 'CASH' ? 'border-emerald-600 bg-emerald-50/50' : 'border-slate-200'}`}
            >
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Banknote className="w-5 h-5 text-emerald-600" /> Cash Purchase
              </div>
              <p className="text-xs text-slate-500 mt-1">Pay full retail price via Instant EFT / Card for immediate dispatch.</p>
            </button>

            <button
              type="button"
              disabled={!allCreditEligible}
              onClick={() => setPurchaseMode('CREDIT')}
              className={`p-4 rounded-xl border-2 text-left transition ${
                !allCreditEligible
                  ? 'opacity-50 cursor-not-allowed border-slate-200'
                  : purchaseMode === 'CREDIT'
                  ? 'border-sky-600 bg-sky-50/50'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <CreditCard className="w-5 h-5 text-sky-600" /> Buy on Credit
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {allCreditEligible ? 'Pay deposit + finance balance via Tirelo Capital.' : 'Cart contains cash-only accessories.'}
              </p>
            </button>
          </div>

          {purchaseMode === 'CREDIT' && allCreditEligible && (
            <DepositCalculator retailPrice={totalAmount} minDepositPct={20} onSelectTerms={setCreditQuote} />
          )}
        </div>
      </div>

      {/* Checkout & Credit Application Column */}
      <div className="lg:col-span-5">
        <form onSubmit={handleCheckout} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
          <h2 className="font-bold text-slate-900 text-lg">Order Summary & Details</h2>

          <div className="space-y-2 text-sm border-b border-slate-100 pb-4">
            <div className="flex justify-between"><span className="text-slate-600">Subtotal</span><span className="font-semibold">{formatZAR(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Courier Delivery</span><span className="font-semibold">{deliveryFee === 0 ? 'FREE' : formatZAR(deliveryFee)}</span></div>
            <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2">
              <span>Total Order Value</span>
              <span>{formatZAR(totalAmount)}</span>
            </div>
          </div>

          {user && addresses.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Delivery Address</label>
              <select
                value={selectedAddressId || addresses[0]?.id}
                onChange={(e) => setSelectedAddressId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
              >
                {addresses.map((a) => (
                  <option key={a.id} value={a.id}>{a.street_address}, {a.city}, {a.province}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Promo Code (Try: UNIK10 or TECH500)</label>
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder="Optional promo code"
              className="w-full px-3 py-2 border rounded-lg text-sm uppercase"
            />
          </div>

          {/* Tirelo Capital Credit Application Form */}
          {purchaseMode === 'CREDIT' && (
            <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-sky-900">
                Tirelo Capital Credit Application Form
              </h3>
              <select
                value={creditForm.employment_status}
                onChange={(e) => setCreditForm({ ...creditForm, employment_status: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
              >
                <option value="PERMANENT">Permanently Employed</option>
                <option value="CONTRACT">Fixed-Term Contract</option>
                <option value="SELF_EMPLOYED">Self-Employed</option>
                <option value="PENSIONER">Pensioner</option>
              </select>
              <input required placeholder="Employer / Company Name" value={creditForm.employer_name} onChange={(e) => setCreditForm({ ...creditForm, employer_name: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm bg-white" />
              <div className="grid grid-cols-3 gap-2">
                <input required type="number" placeholder="Gross Income (R)" value={creditForm.monthly_gross_income} onChange={(e) => setCreditForm({ ...creditForm, monthly_gross_income: e.target.value })} className="px-2.5 py-2 border rounded-lg text-xs bg-white" />
                <input required type="number" placeholder="Net Income (R)" value={creditForm.monthly_net_income} onChange={(e) => setCreditForm({ ...creditForm, monthly_net_income: e.target.value })} className="px-2.5 py-2 border rounded-lg text-xs bg-white" />
                <input required type="number" placeholder="Expenses (R)" value={creditForm.monthly_expenses} onChange={(e) => setCreditForm({ ...creditForm, monthly_expenses: e.target.value })} className="px-2.5 py-2 border rounded-lg text-xs bg-white" />
              </div>

              <div className="space-y-2 pt-1 text-xs">
                <label className="block font-semibold text-slate-700 flex items-center gap-1">
                  <UploadCloud className="w-4 h-4 text-sky-600" /> Upload Certified ID Copy (PDF/JPG)
                </label>
                <input type="file" onChange={(e) => setIdDoc(e.target.files[0])} className="w-full text-xs" />

                <label className="block font-semibold text-slate-700 flex items-center gap-1">
                  <UploadCloud className="w-4 h-4 text-sky-600" /> Upload Latest Payslip / Bank Statement
                </label>
                <input type="file" onChange={(e) => setPayslipDoc(e.target.files[0])} className="w-full text-xs" />
              </div>
            </div>
          )}

          {error && <div className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">{error}</div>}

          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-3.5 rounded-xl font-bold text-white text-sm transition ${
              purchaseMode === 'CREDIT' ? 'bg-sky-600 hover:bg-sky-500' : 'bg-emerald-600 hover:bg-emerald-500'
            }`}
          >
            {!user
              ? 'Sign In to Complete Checkout'
              : submitting
              ? 'Processing...'
              : purchaseMode === 'CREDIT'
              ? 'Submit Credit Application to Tirelo Capital'
              : `Pay ${formatZAR(totalAmount)} Now`}
          </button>
        </form>
      </div>
    </div>
  );
}