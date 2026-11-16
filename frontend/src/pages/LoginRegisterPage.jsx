import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function LoginRegisterPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    first_name: '', surname: '', id_type: 'SA_ID', id_number: '', date_of_birth: '',
    email: '', mobile_number: '', password: '', popia_consent: false,
    street_address: '', suburb: '', city: '', province: 'Gauteng', postal_code: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        const { data } = await api.post('/auth/register', form);
        localStorage.setItem('tt_unik_token', data.token);
        window.location.href = '/dashboard';
      } else {
        const loggedUser = await login(form.email, form.password);
        if (loggedUser.organization === 'TIRELO_CAPITAL') navigate('/tirelo-portal');
        else if (loggedUser.organization === 'TT_UNIK') navigate('/admin');
        else navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (email) => {
    setIsRegister(false);
    setForm((f) => ({ ...f, email, password: 'Password@123' }));
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => setIsRegister(false)}
            className={`pb-3 px-4 text-sm font-bold border-b-2 transition ${!isRegister ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500'}`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setIsRegister(true)}
            className={`pb-3 px-4 text-sm font-bold border-b-2 transition ${isRegister ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500'}`}
          >
            Create Customer Account
          </button>
        </div>

        {/* Quick Demo Role Logins */}
        {!isRegister && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Quick Demo Role Logins (Password: Password@123)
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button type="button" onClick={() => quickFill('customer@example.co.za')} className="text-left p-2 rounded bg-white border hover:border-emerald-500">
                <strong className="block text-slate-900">Customer</strong>
                <span className="text-slate-500">customer@example.co.za</span>
              </button>
              <button type="button" onClick={() => quickFill('credit.officer@tirelocapital.co.za')} className="text-left p-2 rounded bg-white border hover:border-sky-500">
                <strong className="block text-sky-700">Tirelo Credit Officer</strong>
                <span className="text-slate-500">credit.officer@tirelocapital.co.za</span>
              </button>
              <button type="button" onClick={() => quickFill('finance.admin@tirelocapital.co.za')} className="text-left p-2 rounded bg-white border hover:border-sky-500">
                <strong className="block text-sky-700">Tirelo Finance Admin</strong>
                <span className="text-slate-500">finance.admin@tirelocapital.co.za</span>
              </button>
              <button type="button" onClick={() => quickFill('superadmin@ttunik.co.za')} className="text-left p-2 rounded bg-white border hover:border-amber-500">
                <strong className="block text-amber-700">TT UNIK Super Admin</strong>
                <span className="text-slate-500">superadmin@ttunik.co.za</span>
              </button>
            </div>
          </div>
        )}

        {error && <div className="bg-rose-50 text-rose-700 border border-rose-200 p-3 rounded-lg text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="First Name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
                <input required placeholder="Surname" value={form.surname} onChange={(e) => setForm({ ...form, surname: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="SA ID / Passport Number" value={form.id_number} onChange={(e) => setForm({ ...form, id_number: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
                <input required placeholder="Mobile (+27...)" value={form.mobile_number} onChange={(e) => setForm({ ...form, mobile_number: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
              </div>
              <input required placeholder="Street Address" value={form.street_address} onChange={(e) => setForm({ ...form, street_address: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <div className="grid grid-cols-3 gap-2">
                <input required placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
                <input required placeholder="Province" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
                <input required placeholder="Postal Code" value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
              </div>
            </>
          )}

          <input required type="email" placeholder="Email Address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3.5 py-2.5 border rounded-lg text-sm" />
          <input required type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-3.5 py-2.5 border rounded-lg text-sm" />

          {isRegister && (
            <label className="flex items-start gap-2 text-xs text-slate-600">
              <input type="checkbox" required checked={form.popia_consent} onChange={(e) => setForm({ ...form, popia_consent: e.target.checked })} className="mt-0.5" />
              <span>
                I consent to TT UNIK IT SOLUTIONS and Tirelo Capital processing my personal information in compliance with South Africa's POPIA and National Credit Act (NCA) for order fulfilment and credit assessment.
              </span>
            </label>
          )}

          <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl text-sm transition">
            {loading ? 'Processing...' : isRegister ? 'Register Account' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}