import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shield, Truck, ShoppingCart, CreditCard, ArrowLeft } from 'lucide-react';
import api, { formatZAR } from '../api/client';
import { useCart } from '../context/CartContext';
import DepositCalculator from '../components/DepositCalculator';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/products/${slug}`)
      .then(({ data }) => {
        setProduct(data.product);
        if (data.product.variants?.length > 0) {
          setSelectedVariant(data.product.variants[0]);
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="max-w-7xl mx-auto p-10 text-center text-slate-500">Loading product details...</div>;
  if (!product) return <div className="max-w-7xl mx-auto p-10 text-center text-rose-600">Product not found.</div>;

  const effectivePrice = Number(product.retail_price) + Number(selectedVariant?.price_adjustment || 0);

  const handleAction = (mode) => {
    addToCart(product, selectedVariant, 1, mode);
    navigate('/cart');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" /> Back to Catalogue
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Image Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
            <img
              src={product.images?.[0]?.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{product.warranty_info}</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Nationwide SA Courier Delivery</span>
            </div>
          </div>
        </div>

        {/* Details & Customization Column */}
        <div className="lg:col-span-7 space-y-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600">
              <span>{product.brand_name}</span>
              <span>•</span>
              <span>{product.category_name}</span>
              <span>•</span>
              <span className="text-slate-500">Model: {product.model_number}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{product.name}</h1>
            <p className="text-slate-600 text-sm mt-2 leading-relaxed">{product.description}</p>
          </div>

          <div className="flex items-baseline gap-4">
            <span className="text-3xl font-extrabold text-slate-900">{formatZAR(effectivePrice)}</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
              {product.stock_available} units available
            </span>
          </div>

          {/* Product Variants / Customization (URS Section 3.6) */}
          {product.variants?.length > 0 && (
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Select Configuration / Variant
              </label>
              <div className="flex flex-wrap gap-2.5">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariant(v)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
                      selectedVariant?.id === v.id
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                        : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                    }`}
                  >
                    {v.variant_name}
                    {v.price_adjustment > 0 && ` (+${formatZAR(v.price_adjustment)})`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Credit Calculator */}
          {Boolean(product.is_credit_eligible) && (
            <DepositCalculator
              retailPrice={effectivePrice}
              minDepositPct={product.min_deposit_percentage || 20}
            />
          )}

          {/* Purchase Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => handleAction('CASH')}
              className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-6 rounded-xl transition"
            >
              <ShoppingCart className="w-5 h-5" /> Buy Cash ({formatZAR(effectivePrice)})
            </button>

            {Boolean(product.is_credit_eligible) && (
              <button
                onClick={() => handleAction('CREDIT')}
                className="flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-bold py-3.5 px-6 rounded-xl transition"
              >
                <CreditCard className="w-5 h-5" /> Buy on Credit (Apply Now)
              </button>
            )}
          </div>

          {/* Technical Specifications */}
          {product.attributes?.length > 0 && (
            <div className="border-t border-slate-200 pt-5">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Technical Specifications</h3>
              <dl className="divide-y divide-slate-100 text-sm">
                {product.attributes.map((attr) => (
                  <div key={attr.id} className="py-2 flex justify-between">
                    <dt className="text-slate-500 font-medium">{attr.attribute_name}</dt>
                    <dd className="text-slate-900 font-semibold">{attr.attribute_value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}