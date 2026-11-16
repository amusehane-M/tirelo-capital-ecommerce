import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import ProductDetailPage from './pages/ProductDetailPage';
import LoginRegisterPage from './pages/LoginRegisterPage';
import CartCheckoutPage from './pages/CartCheckoutPage';
import CustomerDashboardPage from './pages/CustomerDashboardPage';
import TireloPortalPage from './pages/TireloPortalPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/products/:slug" element={<ProductDetailPage />} />
                <Route path="/login" element={<LoginRegisterPage />} />
                <Route path="/cart" element={<CartCheckoutPage />} />
                <Route path="/dashboard" element={<CustomerDashboardPage />} />
                <Route path="/tirelo-portal" element={<TireloPortalPage />} />
                <Route path="/admin" element={<AdminDashboardPage />} />
              </Routes>
            </main>

            <footer id="footer-contact" className="bg-[#083a7c] text-white text-xs mt-12">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-white/15">
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wider">TT UNIK IT SOLUTIONS</h3>
                  <p className="text-sky-200 italic mt-1">Innovation. Creativity. Quality. Always</p>
                  <p className="text-sky-100 mt-2">Tirelo Business Park, Mabulela Atok (HQ)</p>
                  <p className="text-sky-100">Tel: 015 619 0072 | 061 486 5651</p>
                </div>
                <div id="services">
                  <h3 className="font-bold text-sm uppercase tracking-wider">IT Services & Solutions</h3>
                  <ul className="mt-2 space-y-1 text-sky-100">
                    <li>• Online Hardware & ICT Shop</li>
                    <li>• Computer & Laptop Repairs</li>
                    <li>• Custom Website & Software Development</li>
                    <li>• Enterprise Networking, Cabling & CCTV</li>
                    <li>• Managed Technical Support</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold text-sm uppercase tracking-wider">Tirelo Capital Financing</h3>
                  <p className="text-sky-100 mt-2 leading-relaxed">
                    Buy eligible devices on credit with an upfront deposit and monthly instalments administered by Tirelo Capital (Authorized Credit Provider). POPIA & NCA Compliant.
                  </p>
                </div>
              </div>
              <div className="bg-[#062958] py-3.5 px-4 text-center text-sky-200">
                © 2026 TT UNIK IT SOLUTIONS (Pty) Ltd & Tirelo Capital. All rights reserved.
              </div>
            </footer>
          </div>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}