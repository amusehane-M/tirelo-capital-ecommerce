import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('tt_unik_cart')) || [];
    } catch {
      return [];
    }
  });
  const [purchaseMode, setPurchaseMode] = useState('CASH');

  useEffect(() => {
    localStorage.setItem('tt_unik_cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product, variant = null, quantity = 1, mode = 'CASH') => {
    setPurchaseMode(mode);
    setItems((prev) => {
      const key = `${product.id}-${variant?.id || 'base'}`;
      const existing = prev.find((i) => i.key === key);
      const unitPrice = Number(product.retail_price) + Number(variant?.price_adjustment || 0);
      if (existing) {
        return prev.map((i) => (i.key === key ? { ...i, quantity: i.quantity + quantity } : i));
      }
      return [
        ...prev,
        {
          key,
          product_id: product.id,
          product_variant_id: variant?.id || null,
          name: product.name,
          model_number: product.model_number,
          variant_name: variant?.variant_name || null,
          image: product.primary_image || product.images?.[0]?.image_url,
          unit_price: unitPrice,
          is_credit_eligible: Boolean(product.is_credit_eligible),
          min_deposit_percentage: product.min_deposit_percentage || 20,
          quantity
        }
      ];
    });
  };

  const updateQuantity = (key, delta) => {
    setItems((prev) =>
      prev
        .map((item) => (item.key === key ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (key) => {
    setItems((prev) => prev.filter((item) => item.key !== key));
  };

  const clearCart = () => setItems([]);

  const subtotal = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const allCreditEligible = items.length > 0 && items.every((i) => i.is_credit_eligible);

  return (
    <CartContext.Provider
      value={{
        items, purchaseMode, setPurchaseMode,
        addToCart, updateQuantity, removeFromCart, clearCart,
        subtotal, totalCount, allCreditEligible
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);