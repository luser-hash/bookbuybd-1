'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CartItem,
  INITIAL_CART,
  DELIVERY_CHARGE,
  FREE_DELIVERY_THRESHOLD,
  getStoredCartItems,
  persistCartItems,
} from './cartStore';

/* ── Fallback image ── */
function Img({ src, alt = '', className = '', fallback = '#e2e8f0' }: { src: string; alt?: string; className?: string; fallback?: string }) {
  const [err, setErr] = useState(false);
  if (err) return <div className={className} style={{ background: fallback }} />;
  return <img src={src} alt={alt} className={className} onError={() => setErr(true)} />;
}

interface CartProps {
  onCheckout: (items: CartItem[]) => void;
}

export default function Cart({ onCheckout }: CartProps) {
  const [items, setItems] = useState<CartItem[]>(() => {
    const stored = getStoredCartItems();
    return stored.length > 0 ? stored : INITIAL_CART;
  });
  const [removing, setRemoving] = useState<number | null>(null);

  useEffect(() => {
    persistCartItems(items);
  }, [items]);

  const updateQty = (id: number, delta: number) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, qty: Math.max(1, it.qty + delta) } : it));
  };

  const removeItem = (id: number) => {
    setRemoving(id);
    setTimeout(() => { setItems(prev => prev.filter(it => it.id !== id)); setRemoving(null); }, 400);
  };

  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
  const discount = 0;
  const delivery = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;
  const total = subtotal - discount + delivery;
  const savings = items.reduce((s, it) => s + ((it.originalPrice ?? it.price) - it.price) * it.qty, 0);
  const totalQty = items.reduce((s, it) => s + it.qty, 0);
  const freeProgress = Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        .cart-root { font-family:'Plus Jakarta Sans',sans-serif; background:#f4f6f9; min-height:100vh; }
        @keyframes slideRight { from{opacity:0;transform:translateX(-20px)} to{opacity:1;transform:translateX(0)} }
        @keyframes slideLeft  { from{opacity:1;transform:translateX(0)} to{opacity:0;transform:translateX(40px);max-height:0;margin:0;padding:0;overflow:hidden} }
        @keyframes numPop { 0%{transform:scale(0.7)} 60%{transform:scale(1.2)} 100%{transform:scale(1)} }
        .item-in   { animation: slideRight .4s cubic-bezier(.22,1,.36,1) both; }
        .item-out  { animation: slideLeft  .4s cubic-bezier(.22,1,.36,1) both; overflow:hidden; }
        .num-pop   { animation: numPop .25s cubic-bezier(.22,1,.36,1) both; }
      `}</style>

      <div className="cart-root">
        <div className="max-w-6xl mx-auto px-4 py-10">

          {/* ── Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">My Cart</h1>
              <p className="text-sm text-gray-400 font-semibold mt-1">{totalQty} {totalQty === 1 ? 'item' : 'items'} ready for checkout</p>
            </div>

            {/* Free delivery progress */}
            <div className="flex flex-col gap-2" style={{ minWidth: 240 }}>
              {subtotal >= FREE_DELIVERY_THRESHOLD ? (
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  <span className="text-xs font-black text-emerald-700 uppercase tracking-wide">Free Delivery Unlocked!</span>
                </div>
              ) : (
                <p className="text-xs text-gray-500 font-semibold text-right">
                  Add <span className="text-blue-600 font-black">৳{(FREE_DELIVERY_THRESHOLD - subtotal).toLocaleString()}</span> more for free delivery
                </p>
              )}
              <div className="w-full h-1.5 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${freeProgress}%`, background: 'linear-gradient(90deg,#3b82f6,#1d4ed8)' }}
                />
              </div>
            </div>
          </div>

          {/* ── Empty state ── */}
          {items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 gap-6">
              <div className="w-28 h-28 rounded-[2rem] flex items-center justify-center bg-blue-50 border border-blue-100 shadow-xl shadow-blue-100/50">
                <svg className="w-14 h-14 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-gray-900">Your cart is empty</p>
                <p className="text-sm text-gray-400 mt-2">Discover thousands of books and add them here!</p>
              </div>
              <Link
                href="/"
                className="px-8 py-4 rounded-2xl font-black text-white text-sm transition-all hover:-translate-y-1 shadow-xl shadow-blue-200/50"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)' }}
              >
                Browse Books
              </Link>
            </div>
          )}

          {items.length > 0 && (
            <div className="flex flex-col lg:flex-row gap-8 items-start">

              {/* ── LEFT: Cart Items ── */}
              <div className="flex-1 flex flex-col gap-4">
                {items.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`group bg-white rounded-[1.75rem] p-5 border border-gray-100 shadow-sm hover:shadow-lg hover:shadow-gray-100/80 transition-all duration-300 ${removing === item.id ? 'item-out' : 'item-in'}`}
                    style={{ animationDelay: `${idx * 0.06}s` }}
                  >
                    <div className="flex gap-5">
                      {/* Book cover */}
                      <div className="flex-shrink-0 rounded-2xl overflow-hidden shadow-md" style={{ width: 80, height: 112 }}>
                        <Img src={item.cover} alt={item.title} className="w-full h-full object-cover" fallback={item.coverFallback} />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-black text-gray-900 text-base leading-snug">{item.title}</p>
                            <p className="text-sm text-gray-400 font-semibold mt-1">{item.author}</p>
                            <span className="inline-block mt-2 px-3 py-0.5 text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100 rounded-full">{item.edition}</span>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl transition-all bg-gray-50 text-gray-300 hover:bg-rose-50 hover:text-rose-500 border border-gray-100 hover:border-rose-100"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                          {/* Pricing */}
                          <div className="flex items-baseline gap-2">
                            <span className="text-xl font-black text-gray-900">৳{(item.price * item.qty).toLocaleString()}</span>
                            {item.originalPrice && (
                              <span className="text-sm text-gray-300 line-through font-semibold">৳{(item.originalPrice * item.qty).toLocaleString()}</span>
                            )}
                          </div>

                          {/* Qty Controls */}
                          <div className="flex items-center gap-1 p-1 rounded-2xl bg-gray-50 border border-gray-100">
                            <button
                              onClick={() => updateQty(item.id, -1)}
                              disabled={item.qty <= 1}
                              className="w-8 h-8 flex items-center justify-center rounded-xl font-black text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white hover:shadow-sm text-gray-600"
                            >−</button>
                            <span key={item.qty} className="num-pop min-w-[2rem] text-center text-sm font-black text-gray-900">{item.qty}</span>
                            <button
                              onClick={() => updateQty(item.id, 1)}
                              className="w-8 h-8 flex items-center justify-center rounded-xl font-black text-sm transition-all hover:bg-white hover:shadow-sm text-blue-600"
                            >+</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

              </div>

              {/* ── RIGHT: Dark Order Summary ── */}
              <div className="w-full lg:w-[340px] flex-shrink-0">
                <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-gray-900/30 sticky top-6 relative overflow-hidden">
                  {/* Glow accent */}
                  <div className="absolute -bottom-8 -right-8 w-36 h-36 bg-blue-600 rounded-full blur-[72px] opacity-30" />

                  <div className="relative z-10">
                    <h2 className="text-xl font-black tracking-tight mb-8">Order Summary</h2>

                    {/* Savings callout */}
                    {savings > 0 && (
                      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-6">
                        <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <p className="text-xs font-black text-emerald-400">You&apos;re saving <span className="text-emerald-300">৳{savings.toLocaleString()}</span> on this order!</p>
                      </div>
                    )}

                    {/* Line items */}
                    <div className="space-y-4 mb-6">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400 font-semibold">Subtotal ({totalQty} items)</span>
                        <span className="font-black">৳{subtotal.toLocaleString()}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-purple-400 font-semibold">Coupon Discount</span>
                          <span className="font-black text-purple-400">−৳{discount.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400 font-semibold">Delivery</span>
                        {delivery === 0
                          ? <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">FREE</span>
                          : <span className="font-black">৳{delivery}</span>
                        }
                      </div>
                    </div>

                    <div className="h-px bg-white/10 mb-6" />

                    <div className="flex justify-between items-end mb-8">
                      <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Total Amount</p>
                        <p className="text-4xl font-black tracking-tighter">৳{total.toLocaleString()}</p>
                      </div>
                      {delivery === 0 && <span className="text-[10px] text-emerald-400 font-black uppercase">Free Shipping</span>}
                    </div>

                    <button
                      onClick={() => onCheckout(items)}
                      className="group w-full flex items-center justify-center gap-3 py-5 rounded-3xl font-black text-sm transition-all hover:-translate-y-1 active:scale-95 relative overflow-hidden"
                      style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', boxShadow: '0 6px 24px rgba(59,130,246,0.35)' }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                      Proceed to Checkout
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>

                    <div className="flex items-center justify-center gap-2 mt-5">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                      <p className="text-[11px] text-gray-500 font-semibold">Secure checkout · Cash on Delivery</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </>
  );
}
