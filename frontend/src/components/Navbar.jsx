import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart, User, ShieldCheck, Landmark, LogOut,
  Search, Phone, MapPin, Wrench, Code, Network, Headphones, Mail, Store
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatZAR } from '../api/client';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totalCount, subtotal } = useCart();
  const [navSearch, setNavSearch] = useState('');
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    navigate(navSearch.trim() ? `/?search=${encodeURIComponent(navSearch.trim())}` : '/');
  };

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
      {/* Top Corporate & Tirelo Capital Bar */}
      <div className="bg-slate-100 border-b border-slate-200 text-slate-600 text-[11px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#0B4DA2]" />
              Tirelo Business Park, Mabulela Atok (HQ)
            </span>
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-[#0B4DA2]" />
              Tel: 015 619 0072 | 061 486 5651
            </span>
          </div>

          <div className="flex items-center gap-3 font-medium">
            <Link to="/?credit=1" className="text-[#0B4DA2] hover:underline font-semibold">
              Tirelo Capital Credit Financing Available
            </Link>
            <span className="text-slate-300">|</span>
            <Link to="/login" className="hover:text-[#0B4DA2]">
              Staff & Credit Officer Login
            </Link>
          </div>
        </div>
      </div>

      {/* Main White Brand, Search & Cart Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand Identity */}
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0B4DA2] to-[#1D63B8] text-white flex flex-col items-center justify-center font-black tracking-tighter shadow-sm">
            <span className="text-base leading-none">TT</span>
            <span className="text-[9px] tracking-widest text-sky-200">UNIK</span>
          </div>
          <div>
            <span className="font-black text-xl tracking-tight text-[#0B4DA2] block leading-none">
              TT UNIK <span className="text-slate-800">IT SOLUTIONS</span>
            </span>
            <span className="text-[11px] text-slate-500 italic font-medium block mt-0.5">
              Innovation. Creativity. Quality. Always
            </span>
          </div>
        </Link>

        {/* Center Search + Advanced Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xl flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              placeholder="Search laptops, desktops, printers, smartphones, SKU..."
              className="w-full pl-4 pr-10 py-2 text-sm border-2 border-[#1D63B8] rounded-l-lg focus:outline-none"
            />
            <button
              type="submit"
              className="absolute right-0 top-0 bottom-0 px-3.5 bg-[#1D63B8] hover:bg-[#0B4DA2] text-white rounded-r-md transition"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
          <Link
            to="/?advanced=1"
            className="hidden sm:inline-block text-xs font-semibold text-[#0B4DA2] hover:underline whitespace-nowrap"
          >
            Advanced Search
          </Link>
        </form>

        {/* Right Account & Cart Summary */}
        <div className="flex items-center gap-3">
          <Link
            to="/cart"
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg border border-slate-200 hover:border-[#1D63B8] bg-slate-50 transition"
          >
            <div className="relative">
              <ShoppingCart className="w-5 h-5 text-[#0B4DA2]" />
              <span className="absolute -top-2 -right-2 bg-[#0B4DA2] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {totalCount}
              </span>
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <span className="text-[10px] text-slate-500 block">My Cart</span>
              <span className="text-xs font-extrabold text-slate-900">{formatZAR(subtotal)}</span>
            </div>
          </Link>

          {user ? (
            <div className="flex items-center gap-2">
              <Link
                to={
                  user.organization === 'TIRELO_CAPITAL'
                    ? '/tirelo-portal'
                    : user.organization === 'TT_UNIK'
                    ? '/admin'
                    : '/dashboard'
                }
                className="flex items-center gap-2 bg-[#0B4DA2] hover:bg-[#083a7c] text-white px-3.5 py-2 rounded-lg text-xs font-bold transition"
              >
                <User className="w-4 h-4" />
                <span>{user.first_name}</span>
              </Link>
              <button
                onClick={handleLogout}
                title="Logout"
                className="p-2 rounded-lg border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="bg-[#0B4DA2] hover:bg-[#083a7c] text-white font-bold text-xs px-4 py-2.5 rounded-lg transition"
            >
              Login / Register
            </Link>
          )}
        </div>
      </div>

      {/* Royal Blue Primary Navigation Bar */}
      <nav className="bg-[#0B4DA2] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between overflow-x-auto text-xs font-semibold">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-1.5 px-4 py-3 bg-[#083a7c] hover:bg-[#062d61] whitespace-nowrap">
              <Store className="w-3.5 h-3.5" /> Online Shop
            </Link>
            <Link to="/?credit=1" className="flex items-center gap-1.5 px-4 py-3 hover:bg-[#1D63B8] whitespace-nowrap text-amber-300 font-bold">
              <Landmark className="w-3.5 h-3.5" /> Buy on Credit (Tirelo Capital)
            </Link>
            <a href="#services" className="hidden lg:flex items-center gap-1.5 px-3.5 py-3 hover:bg-[#1D63B8] whitespace-nowrap">
              <Wrench className="w-3.5 h-3.5" /> Computer Repairs
            </a>
            <a href="#services" className="hidden lg:flex items-center gap-1.5 px-3.5 py-3 hover:bg-[#1D63B8] whitespace-nowrap">
              <Code className="w-3.5 h-3.5" /> Website Development
            </a>
            <a href="#services" className="hidden xl:flex items-center gap-1.5 px-3.5 py-3 hover:bg-[#1D63B8] whitespace-nowrap">
              <Network className="w-3.5 h-3.5" /> Networking & Cabling
            </a>
            <a href="#services" className="hidden xl:flex items-center gap-1.5 px-3.5 py-3 hover:bg-[#1D63B8] whitespace-nowrap">
              <Headphones className="w-3.5 h-3.5" /> Technical Support
            </a>
            <a href="#footer-contact" className="hidden md:flex items-center gap-1.5 px-3.5 py-3 hover:bg-[#1D63B8] whitespace-nowrap">
              <Mail className="w-3.5 h-3.5" /> Contacts
            </a>
          </div>

          {/* Role-Specific Quick Portal Link */}
          <div className="flex items-center">
            {user?.organization === 'CUSTOMER' && (
              <Link to="/dashboard" className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold whitespace-nowrap">
                My Orders & Credit Account
              </Link>
            )}
            {user?.organization === 'TT_UNIK' && (
              <Link to="/admin" className="flex items-center gap-1.5 px-4 py-3 bg-amber-500 text-slate-950 font-extrabold whitespace-nowrap">
                <ShieldCheck className="w-4 h-4" /> TT UNIK Admin Panel
              </Link>
            )}
            {user?.organization === 'TIRELO_CAPITAL' && (
              <Link to="/tirelo-portal" className="flex items-center gap-1.5 px-4 py-3 bg-sky-400 text-slate-950 font-extrabold whitespace-nowrap">
                <Landmark className="w-4 h-4" /> Tirelo Capital Portal
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}