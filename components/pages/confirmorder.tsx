'use client';
import { useState, useEffect, useMemo, useId } from 'react';
import { CartItem, CheckoutForm, DELIVERY_CHARGE, FREE_DELIVERY_THRESHOLD } from './cartStore';

function Img({ src, alt = '', className = '', fallback = '#e2e8f0' }: { src: string; alt?: string; className?: string; fallback?: string }) {
  const [err, setErr] = useState(false);
  if (err) return <div className={className} style={{ background: fallback }} />;
  return <img src={src} alt={alt} className={className} onError={() => setErr(true)} />;
}

/* ── confetti particle ── */
interface Particle { id: number; x: number; size: number; color: string; delay: number; duration: number; }
const CONFETTI_COLORS = ['#3A9AFF','#60A5FA','#f59e0b','#3b82f6','#ec4899','#8b5cf6','#f97316'];

function hashSeed(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0 || 1;
}

function createRng(seed: number): () => number {
  let state = seed >>> 0 || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function makeParticles(n = 60, seed = 1): Particle[] {
  const rand = createRng(seed);
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    x: rand() * 100,
    size: 6 + rand() * 8,
    color: CONFETTI_COLORS[Math.floor(rand() * CONFETTI_COLORS.length)],
    delay: rand() * 1.2,
    duration: 2 + rand() * 1.5,
  }));
}

interface ConfirmOrderProps {
  items: CartItem[];
  form: CheckoutForm;
  onContinueShopping: () => void;
}

type Phase = 'animating' | 'done';

export default function ConfirmOrder({ items, form, onContinueShopping }: ConfirmOrderProps) {
  const uid = useId();
  const seed = useMemo(() => hashSeed(uid), [uid]);
  const orderId = useMemo(
    () => `ANP-${seed.toString(36).toUpperCase().slice(-6).padStart(6, '0')}`,
    [seed],
  );
  const particles = useMemo(() => makeParticles(70, seed), [seed]);

  const [phase,       setPhase]       = useState<Phase>('animating');
  const [textVisible, setTextVisible] = useState(false);
  const [detailsVis,  setDetailsVis]  = useState(false);

  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
  const delivery = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;
  const total    = subtotal + delivery;

  useEffect(() => {
    // sequence: ring draws → check pops → text fades in → details slide up
    const t1 = setTimeout(() => setTextVisible(true), 1100);
    const t2 = setTimeout(() => setDetailsVis(true),  1600);
    const t3 = setTimeout(() => setPhase('done'),     2000);
    return () => { [t1, t2, t3].forEach(clearTimeout); };
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,600;0,700;1,400&family=DM+Sans:wght@400;500;600;700&display=swap');
        .co-root { font-family:'DM Sans',sans-serif; background:#f8fafc; min-height:100vh; }

        /* ── confetti ── */
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotate(0deg);   opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .confetti-piece {
          position: fixed; top: -10px; border-radius: 3px;
          animation: confettiFall var(--dur) var(--delay) ease-in forwards;
          pointer-events: none; z-index: 100;
        }

        /* ── success ring ── */
        @keyframes ringDraw {
          from { stroke-dashoffset: 283; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes checkPop {
          0%   { opacity:0; transform:scale(0) rotate(-20deg); }
          70%  { transform:scale(1.15) rotate(5deg); }
          100% { opacity:1; transform:scale(1) rotate(0deg); }
        }
        @keyframes ringPulse {
          0%,100% { transform:scale(1);   box-shadow:0 0 0 0   rgba(58,154,255,0.3); }
          50%     { transform:scale(1.04);box-shadow:0 0 0 18px rgba(58,154,255,0);   }
        }
        .ring-svg circle {
          stroke-dasharray: 283;
          stroke-dashoffset: 283;
          animation: ringDraw .65s .2s cubic-bezier(.22,1,.36,1) forwards;
        }
        .check-icon {
          opacity: 0;
          animation: checkPop .4s .85s cubic-bezier(.22,1,.36,1) forwards;
        }
        .ring-pulse {
          animation: ringPulse 2.2s 1.5s ease-in-out infinite;
        }

        /* ── text / card entries ── */
        @keyframes fadeUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        .text-in   { animation: fadeUp  .5s cubic-bezier(.22,1,.36,1) both; }
        .detail-in { animation: slideIn .5s cubic-bezier(.22,1,.36,1) both; }

        /* ── cards ── */
        .co-card { background:#fff; border-radius:20px; padding:20px; border:1px solid #e8f0e9; box-shadow:0 2px 16px rgba(0,0,0,0.06); }
        .order-row { display:flex; justify-content:space-between; padding:5px 0; font-size:13px; border-bottom:1px solid #f1f5f9; }
        .order-row:last-child { border-bottom:none; }

        /* ── step tracker ── */
        .track-step { display:flex; flex-direction:column; align-items:center; gap:6px; flex:1; }
        .track-icon { width:38px; height:38px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:16px; border:2px solid; transition:all .3s; }
        .track-line { flex:1; height:2px; margin-top:-26px; }

        /* ── CTA buttons ── */
        .btn-ghost { background:#eff6ff; color:#3A9AFF; border:1.5px solid #bfdbfe; border-radius:14px; padding:12px 24px; font-size:14px; font-weight:700; cursor:pointer; transition:all .2s; }
        .btn-ghost:hover { background:#dbeafe; }
        .btn-solid { background:linear-gradient(135deg,#3A9AFF,#1D4ED8); color:#fff; border:none; border-radius:14px; padding:12px 28px; font-size:14px; font-weight:700; cursor:pointer; box-shadow:0 4px 16px rgba(58,154,255,0.3); transition:all .2s; }
        .btn-solid:hover { opacity:.9; transform:translateY(-1px); }
      `}</style>

      {/* Confetti burst */}
      {phase === 'animating' && particles.map(p => (
        <div key={p.id} className="confetti-piece"
          style={{
            left: `${p.x}%`,
            width:  p.size,
            height: p.size * 0.5,
            background: p.color,
            '--dur':   `${p.duration}s`,
            '--delay': `${p.delay}s`,
          } as React.CSSProperties}
        />
      ))}

      <div className="co-root">
        <div className="max-w-3xl mx-auto px-4 py-10">

          {/* ── SUCCESS ANIMATION ── */}
          <div className="flex flex-col items-center mb-10">
            {/* Ring + check */}
            <div className="ring-pulse relative flex items-center justify-center"
              style={{ width: 110, height: 110, borderRadius: '50%', background: '#eff6ff', border: '3px solid #dbeafe' }}>
              {/* SVG ring */}
              <svg className="ring-svg absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#3A9AFF" strokeWidth="4" strokeLinecap="round"/>
              </svg>
              {/* Check mark */}
              <svg className="check-icon w-12 h-12" fill="none" stroke="#3A9AFF" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
              </svg>
            </div>

            {/* Text */}
            {textVisible && (
              <div className="text-center mt-6 text-in">
                <h1 style={{ fontFamily: 'Lora,serif', fontSize: 28, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                  Order Confirmed! 🎉
                </h1>
                <p style={{ fontSize: 14, color: '#64748b', marginTop: 8, maxWidth: 380 }}>
                  Thank you, <strong style={{ color: '#1E3A8A' }}>{form.fullName}</strong>! Your books are on their way.
                </p>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>Order ID</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', background: '#f1f5f9', borderRadius: 8, padding: '3px 10px', letterSpacing: '0.05em' }}>
                    {orderId}
                  </span>
                </div>
              </div>
            )}
          </div>

          {detailsVis && (
            <div className="flex flex-col gap-5">

              {/* ── ORDER TRACKER ── */}
              <div className="co-card detail-in" style={{ animationDelay: '0s' }}>
                <h2 style={{ fontFamily: 'Lora,serif', fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>
                  📦 Order Status
                </h2>
                <div className="flex items-start justify-between gap-2 px-2">
                  {[
                    { icon: '✅', label: 'Order Placed',  done: true  },
                    { icon: '📦', label: 'Packing',       done: false },
                    { icon: '🚚', label: 'Out for Delivery', done: false },
                    { icon: '🏠', label: 'Delivered',     done: false },
                  ].map((step, i, arr) => (
                    <div key={i} className="flex items-center" style={{ flex: 1 }}>
                      <div className="track-step">
                        <div className="track-icon"
                          style={{
                            background: step.done ? '#dbeafe' : '#f8fafc',
                            borderColor: step.done ? '#3A9AFF' : '#e2e8f0',
                            fontSize: 18,
                          }}>
                          {step.icon}
                        </div>
                        <span style={{ fontSize: 11, fontWeight: step.done ? 700 : 500, color: step.done ? '#1E3A8A' : '#94a3b8', textAlign: 'center', lineHeight: 1.3 }}>
                          {step.label}
                        </span>
                      </div>
                      {i < arr.length - 1 && (
                        <div className="track-line mb-5"
                          style={{ background: step.done ? '#3A9AFF' : '#e2e8f0' }}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 12, color: '#64748b', textAlign: 'center', marginTop: 14, background: '#eff6ff', borderRadius: 10, padding: '8px 16px' }}>
                  🕐 Expected delivery: <strong style={{ color: '#1E3A8A' }}>3–5 business days</strong>
                </p>
              </div>

              {/* ── 2 COLUMNS: items + delivery summary ── */}
              <div className="flex gap-5 flex-col md:flex-row">

                {/* Items */}
                <div className="co-card flex-1 detail-in" style={{ animationDelay: '.05s' }}>
                  <h2 style={{ fontFamily: 'Lora,serif', fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>
                    📚 Your Books ({items.reduce((s, it) => s + it.qty, 0)})
                  </h2>
                  <div className="flex flex-col gap-3">
                    {items.map(item => (
                      <div key={item.id} className="flex gap-3 items-center">
                        <div className="flex-shrink-0 rounded-xl overflow-hidden shadow" style={{ width: 44, height: 62 }}>
                          <Img src={item.cover} alt={item.title} className="w-full h-full object-cover" fallback={item.coverFallback} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', lineHeight: 1.3 }}>{item.title}</p>
                          <p style={{ fontSize: 11, color: '#94a3b8' }}>{item.author} · {item.edition} · ×{item.qty}</p>
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#1E3A8A', flexShrink: 0 }}>
                          ৳{(item.price * item.qty).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div style={{ height: 1, background: '#e8f0e9', margin: '14px 0' }} />

                  <div className="flex flex-col gap-1.5" style={{ fontSize: 13 }}>
                    <div className="order-row">
                      <span style={{ color: '#64748b' }}>Subtotal</span>
                      <span style={{ fontWeight: 600 }}>৳{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="order-row">
                      <span style={{ color: '#64748b' }}>Delivery</span>
                      {delivery === 0
                        ? <span style={{ fontSize: 11, background: '#dbeafe', color: '#1E3A8A', borderRadius: 20, padding: '1px 8px', fontWeight: 700 }}>FREE</span>
                        : <span style={{ fontWeight: 600 }}>৳{delivery}</span>
                      }
                    </div>
                    <div className="order-row">
                      <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>Total Payable (COD)</span>
                      <span style={{ fontWeight: 800, fontSize: 17, color: '#166634' }}>৳{total.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* COD reminder */}
                  <div className="flex items-center gap-3 mt-4 p-3 rounded-xl"
                    style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="#3A9AFF" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
                    </svg>
                    <p style={{ fontSize: 12, color: '#1E3A8A', fontWeight: 600 }}>
                      Pay ৳{total.toLocaleString()} cash when your books are delivered 🤝
                    </p>
                  </div>
                </div>

                {/* Delivery details */}
                <div className="co-card detail-in" style={{ width: 260, flexShrink: 0, animationDelay: '.1s' }}>
                  <h2 style={{ fontFamily: 'Lora,serif', fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>
                    📍 Delivering To
                  </h2>
                  <div className="flex flex-col gap-2.5" style={{ fontSize: 13 }}>
                    {[
                      { icon: '👤', label: form.fullName },
                      { icon: '📞', label: form.phone },
                      ...(form.email ? [{ icon: '📧', label: form.email }] : []),
                      { icon: '🏠', label: form.address },
                      { icon: '📌', label: `${form.city}, ${form.district}${form.postalCode ? ' ' + form.postalCode : ''}` },
                    ].map((r, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{r.icon}</span>
                        <span style={{ color: '#374151', lineHeight: 1.4 }}>{r.label}</span>
                      </div>
                    ))}
                  </div>

                  {form.note.trim() && (
                    <>
                      <div style={{ height: 1, background: '#e8f0e9', margin: '14px 0' }} />
                      <h3 style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>YOUR NOTE</h3>
                      <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.6, background: '#f8fafc', borderRadius: 10, padding: '8px 10px', border: '1px solid #e2e8f0', fontStyle: 'italic' }}>
                        &ldquo;{form.note}&rdquo;
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* ── CTA buttons ── */}
              <div className="flex gap-3 justify-center mt-2 detail-in" style={{ animationDelay: '.15s' }}>
                <button className="btn-ghost" onClick={onContinueShopping}>
                  ← Continue Shopping
                </button>
                <button className="btn-solid" onClick={() => window.print()}>
                  🖨️ Print Receipt
                </button>
              </div>

              {/* Support note */}
              <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 4 }}>
                Need help? Contact us at <strong style={{ color: '#3A9AFF' }}>support@anyaprokash.com</strong> · Order ID: {orderId}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
