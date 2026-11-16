import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, ChevronDown, CreditCard,
  ShoppingBag, CheckCircle2, Tag, Layers, Award
} from 'lucide-react';
import api, { formatZAR } from '../api/client';
import { useCart } from '../context/CartContext';

const VISUAL_CATEGORIES = [
  {
    label: 'LAPTOPS',
    slug: 'laptops-notebooks',
    img: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=400&q=80'
  },
  {
    label: 'DESKTOPS',
    slug: 'desktop-computers',
    img: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=400&q=80'
  },
  {
    label: 'PRINTERS',
    slug: 'printers-scanners',
    img: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=400&q=80'
  },
  {
    label: 'MONITORS',
    slug: 'desktop-computers',
    img: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=400&q=80'
  },
  {
    label: 'KEY BOARDS',
    slug: 'computer-accessories',
    img: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=400&q=80'
  },
  {
    label: 'MOUSE',
    slug: 'computer-accessories',
    img: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=400&q=80'
  },
  {
    label: 'ROUTERS',
    slug: 'networking-equipment',
    img: 'https://images.unsplash.com/photo-1648413653819-7c0fd93e8e6a?auto=format&fit=crop&w=400&q=80'
  },
  {
    label: 'NETWORKING',
    slug: 'networking-equipment',
    img: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=400&q=80'
  },
  {
    label: 'CCTV',
    slug: 'electronic-accessories',
    img: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=400&q=80'
  },
  {
    label: 'SMARTPHONES',
    slug: 'smartphones-cellphones',
    img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80'
  }
];

const HERO_SLIDES = [
  {
    badge: 'BEST PRICES, QUICK DELIVERY',
    title: 'HP OmniBook & Business Laptops',
    subtitle: 'Pay Cash or Buy on Credit with Tirelo Capital — flexible deposits from 20% and up to 36 months.',
    brandTag: 'hp',
    image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=700&q=80',
    ctaCategory: 'laptops-notebooks'
  },
  {
    badge: 'TIRELO CAPITAL INSTANT CREDIT',
    title: 'Flagship 5G Smartphones & Tablets',
    subtitle: 'Samsung Galaxy & Apple iPhone devices with online deposit calculator and instant application.',
    brandTag: 'SAMSUNG',
    image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=700&q=80',
    ctaCategory: 'smartphones-cellphones'
  }
];

export default function HomePage() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ categories: [], brands: [] });
  const [loading, setLoading] = useState(true);

  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [brand, setBrand] = useState(searchParams.get('brand') || '');
  const [creditOnly, setCreditOnly] = useState(searchParams.get('credit') === '1');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState('newest');
  const [slideIdx, setSlideIdx] = useState(0);

  const categoryScrollRef = useRef(null);
  const { addToCart } = useCart();

  useEffect(() => {
    setCreditOnly(searchParams.get('credit') === '1');
  }, [searchParams]);

  useEffect(() => {
    api.get('/products/meta').then(({ data }) => setMeta(data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    const q = searchParams.get('search');
    if (q) params.search = q;
    if (category) params.category = category;
    if (brand) params.brand = brand;
    if (creditOnly) params.credit_only = '1';
    if (sort) params.sort = sort;

    api
      .get('/products', { params })
      .then(({ data }) => {
        const list = inStockOnly
          ? data.products.filter((p) => p.stock_available > 0)
          : data.products;
        setProducts(list);
      })
      .finally(() => setLoading(false));
  }, [searchParams, category, brand, creditOnly, inStockOnly, sort]);

  const scrollCategories = (dir) => {
    if (!categoryScrollRef.current) return;
    categoryScrollRef.current.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };

  const currentSlide = HERO_SLIDES[slideIdx];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* TOP SPLIT: Left Filter Sidebar + Right Hero Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Sidebar Filters (Matches PDF: CATEGORY, BRAND, ON PROMOTION, IN STOCK) */}
        <aside className="lg:col-span-3 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="divide-y divide-slate-200">
            {/* CATEGORY */}
            <div className="p-3.5">
              <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-[#0B4DA2] mb-2">
                <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> CATEGORY</span>
                <ChevronDown className="w-4 h-4" />
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-slate-50 font-medium text-slate-700 focus:outline-none focus:border-[#0B4DA2]"
              >
                <option value="">All Categories (10)</option>
                {meta.categories.map((c) => (
                  <option key={c.id} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* BRAND */}
            <div className="p-3.5">
              <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-[#0B4DA2] mb-2">
                <span className="flex items-center gap-1.5"><Award className="w-3.5 h-3.5" /> BRAND</span>
                <ChevronDown className="w-4 h-4" />
              </div>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-slate-50 font-medium text-slate-700 focus:outline-none focus:border-[#0B4DA2]"
              >
                <option value="">All Brands</option>
                {meta.brands.map((b) => (
                  <option key={b.id} value={b.slug}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* ON PROMOTION / CREDIT ELIGIBLE */}
            <div className="p-3.5">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#0B4DA2]">
                  <Tag className="w-3.5 h-3.5" /> ON PROMOTION / CREDIT
                </span>
                <input
                  type="checkbox"
                  checked={creditOnly}
                  onChange={(e) => setCreditOnly(e.target.checked)}
                  className="rounded text-[#0B4DA2] focus:ring-[#0B4DA2]"
                />
              </label>
            </div>

            {/* IN STOCK */}
            <div className="p-3.5">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#0B4DA2]">
                  <CheckCircle2 className="w-3.5 h-3.5" /> IN STOCK
                </span>
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="rounded text-[#0B4DA2] focus:ring-[#0B4DA2]"
                />
              </label>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                setCategory('');
                setBrand('');
                setCreditOnly(false);
                setInStockOnly(false);
              }}
              className="w-full py-2 text-xs font-bold text-slate-600 hover:text-[#0B4DA2] border border-slate-300 rounded-lg bg-white transition"
            >
              Reset All Filters
            </button>
          </div>
        </aside>

        {/* Right Hero Banner (Matches PDF: BEST PRICES, QUICK DELIVERY + Shop Now + Product Visual) */}
        <section className="lg:col-span-9 relative rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-gradient-to-r from-[#062958] via-[#0B4DA2] to-[#1D63B8] text-white flex items-center">
          <button
            type="button"
            onClick={() => setSlideIdx((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1))}
            className="absolute left-3 z-10 p-2 rounded-full bg-white/20 hover:bg-white/35 text-white transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="w-full px-12 py-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-7 space-y-3">
              <span className="inline-block bg-amber-400 text-slate-950 text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded">
                {currentSlide.badge}
              </span>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                {currentSlide.title}
              </h1>
              <p className="text-sky-100 text-xs sm:text-sm leading-relaxed">
                {currentSlide.subtitle}
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCategory(currentSlide.ctaCategory)}
                  className="bg-white text-[#0B4DA2] hover:bg-sky-50 font-extrabold text-xs sm:text-sm px-6 py-2.5 rounded-lg shadow transition"
                >
                  Shop Now
                </button>
                <button
                  type="button"
                  onClick={() => setCreditOnly(true)}
                  className="bg-sky-950/50 hover:bg-sky-950/70 border border-white/30 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-lg transition"
                >
                  Buy on Credit
                </button>
              </div>
            </div>

            <div className="md:col-span-5 relative flex flex-col items-center">
              <div className="bg-white p-3 rounded-xl shadow-lg w-full max-w-[260px]">
                <img
                  src={currentSlide.image}
                  alt={currentSlide.title}
                  className="w-full h-40 object-cover rounded-lg"
                />
                <div className="mt-2 flex items-center justify-between text-slate-900 px-1">
                  <span className="text-xs font-bold">Featured Device</span>
                  <span className="text-xs font-black uppercase px-2 py-0.5 rounded bg-[#0B4DA2] text-white">
                    {currentSlide.brandTag}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSlideIdx((prev) => (prev + 1) % HERO_SLIDES.length)}
            className="absolute right-3 z-10 p-2 rounded-full bg-white/20 hover:bg-white/35 text-white transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </section>
      </div>

      {/* SHOP BY CATEGORIES VISUAL CAROUSEL (Exact match to PDF blue-bordered cards & blue footer labels) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-light tracking-wide text-[#0B4DA2] uppercase">
            SHOP BY CATEGORIES
          </h2>
          {category && (
            <button
              onClick={() => setCategory('')}
              className="text-xs font-bold text-[#0B4DA2] hover:underline"
            >
              Show All Categories
            </button>
          )}
        </div>

        <div className="relative flex items-center">
          <button
            type="button"
            onClick={() => scrollCategories(-1)}
            className="p-1.5 text-[#0B4DA2] hover:bg-sky-50 rounded-full transition shrink-0"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div
            ref={categoryScrollRef}
            className="flex gap-3.5 overflow-x-auto scroll-smooth py-2 px-1 no-scrollbar flex-1"
          >
            {VISUAL_CATEGORIES.map((cat) => {
              const isSelected = category === cat.slug;
              return (
                <button
                  key={cat.label}
                  type="button"
                  onClick={() => setCategory(isSelected ? '' : cat.slug)}
                  className={`w-36 shrink-0 rounded-lg border-2 overflow-hidden bg-white shadow-sm hover:shadow-md transition flex flex-col ${
                    isSelected ? 'border-amber-500 ring-2 ring-amber-400/40' : 'border-[#1D63B8]'
                  }`}
                >
                  <div className="h-28 w-full p-2.5 bg-white flex items-center justify-center">
                    <img
                      src={cat.img}
                      alt={cat.label}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="w-full bg-[#1D63B8] text-white text-[11px] font-bold tracking-wider py-2 text-center uppercase">
                    {cat.label}
                  </div>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => scrollCategories(1)}
            className="p-1.5 text-[#0B4DA2] hover:bg-sky-50 rounded-full transition shrink-0"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </section>

      {/* CATALOGUE HEADER & SORT BAR */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              {creditOnly ? 'Credit-Eligible Devices (Tirelo Capital)' : 'Featured Products & Hardware'}
            </h2>
            <p className="text-xs text-slate-500">
              Showing {products.length} item{products.length === 1 ? '' : 's'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Sort by:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg bg-white text-slate-700"
            >
              <option value="newest">Featured / Newest</option>
              <option value="popular">Popularity</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* PRODUCT GRID */}
        {loading ? (
          <div className="text-center py-16 text-slate-500 text-sm">Loading TT UNIK catalogue...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
            <p className="text-slate-600 font-medium text-sm">No products match your selected filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl border border-slate-200 hover:border-[#1D63B8] shadow-sm hover:shadow-md transition flex flex-col overflow-hidden"
              >
                <Link to={`/products/${product.slug}`} className="relative block aspect-[4/3] bg-white p-3 border-b border-slate-100 overflow-hidden">
                  <img
                    src={product.primary_image}
                    alt={product.name}
                    loading="lazy"
                    className="w-full h-full object-cover rounded-lg hover:scale-105 transition duration-300"
                  />
                  {product.is_credit_eligible ? (
                    <span className="absolute top-3 left-3 bg-[#0B4DA2] text-white text-[10px] font-bold px-2.5 py-1 rounded shadow">
                      Buy on Credit
                    </span>
                  ) : (
                    <span className="absolute top-3 left-3 bg-slate-700 text-white text-[10px] font-semibold px-2.5 py-1 rounded">
                      Cash Only
                    </span>
                  )}
                </Link>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                      <span className="font-bold text-[#0B4DA2] uppercase">{product.brand_name}</span>
                      <span>{product.model_number}</span>
                    </div>
                    <Link to={`/products/${product.slug}`} className="font-bold text-sm text-slate-900 hover:text-[#0B4DA2] line-clamp-2">
                      {product.name}
                    </Link>
                    <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {product.stock_available > 0 ? `${product.stock_available} In Stock` : 'Out of Stock'}
                    </p>
                  </div>

                  <div className="space-y-2.5 pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Cash Retail Price</span>
                      <span className="text-lg font-black text-slate-900">{formatZAR(product.retail_price)}</span>
                    </div>

                    {product.credit_preview && (
                      <div className="bg-sky-50 border border-sky-200 rounded-lg p-2 text-[11px] space-y-0.5">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Deposit ({product.credit_preview.selected_deposit_percentage}%):</span>
                          <span className="font-bold text-slate-900">{formatZAR(product.credit_preview.deposit_amount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Est. Monthly (12m):</span>
                          <span className="font-bold text-[#0B4DA2]">{formatZAR(product.credit_preview.estimated_monthly_instalment)}</span>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => addToCart(product, null, 1, 'CASH')}
                        disabled={product.stock_available <= 0}
                        className="flex items-center justify-center gap-1 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-bold py-2 rounded-lg transition"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" /> Buy Cash
                      </button>
                      {product.is_credit_eligible ? (
                        <Link
                          to={`/products/${product.slug}`}
                          className="flex items-center justify-center gap-1 bg-[#1D63B8] hover:bg-[#0B4DA2] text-white text-xs font-bold py-2 rounded-lg transition"
                        >
                          <CreditCard className="w-3.5 h-3.5" /> Credit
                        </Link>
                      ) : (
                        <Link
                          to={`/products/${product.slug}`}
                          className="flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2 rounded-lg transition"
                        >
                          Details
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}