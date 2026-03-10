'use client';
import { useState } from 'react';
import { CartItem, CheckoutForm, EMPTY_FORM, DISTRICTS, DELIVERY_CHARGE, FREE_DELIVERY_THRESHOLD } from './cartStore';

function Img({ src, alt = '', className = '', fallback = '#e2e8f0' }: { src: string; alt?: string; className?: string; fallback?: string }) {
  const [err, setErr] = useState(false);
  if (err) return <div className={className} style={{ background: fallback }} />;
  return <img src={src} alt={alt} className={className} onError={() => setErr(true)} />;
}

interface CheckoutProps {
  items: CartItem[];
  onBack: () => void;
  onConfirm: (form: CheckoutForm) => Promise<void> | void;
  onEdit: (form: CheckoutForm) => void;
  isSubmitting?: boolean;
  submitError?: string | null;
}

type Step = 'form' | 'review';
type Errors = Partial<Record<keyof CheckoutForm, string>>;

function validate(f: CheckoutForm): Errors {
  const e: Errors = {};
  if (!f.fullName.trim()) e.fullName = 'Full name is required';
  if (!f.phone.trim()) e.phone = 'Phone number is required';
  else if (!/^(\+8801|01)[0-9]{9}$/.test(f.phone.replace(/\s/g, ''))) e.phone = 'Enter a valid BD phone number';
  if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = 'Enter a valid email';
  if (!f.address.trim()) e.address = 'Delivery address is required';
  if (!f.city.trim()) e.city = 'City / Thana is required';
  if (!f.district) e.district = 'Please select a district';
  return e;
}

export default function Checkout({ items, onBack, onConfirm, onEdit, isSubmitting = false, submitError = null }: CheckoutProps) {
  const [step, setStep] = useState<Step>('form');
  const [form, setForm] = useState<CheckoutForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
  const delivery = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;
  const total = subtotal + delivery;
  const totalItems = items.reduce((s, it) => s + it.qty, 0);

  const set = (k: keyof CheckoutForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const val = e.target.value;
    setForm(f => ({ ...f, [k]: val }));
    setTouched(t => new Set([...t, k]));
    if (touched.has(k)) {
      setErrors(prev => ({ ...prev, [k]: validate({ ...form, [k]: val })[k] }));
    }
  };

  const handleNext = () => {
    const errs = validate(form);
    setErrors(errs);
    setTouched(new Set(Object.keys(form)));
    if (Object.keys(errs).length === 0) setStep('review');
  };

  const F_BASE = 'w-full px-5 py-4 text-sm font-medium rounded-2xl border outline-none transition-all shadow-sm';
  const F_OK = `${F_BASE} border-gray-100 bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50 focus:shadow-xl`;
  const F_ERR = `${F_BASE} border-rose-200 bg-rose-50/30 focus:border-rose-400 focus:ring-4 focus:ring-rose-100/50`;
  const fieldCls = (k: keyof CheckoutForm) => touched.has(k) && errors[k] ? F_ERR : F_OK;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        .ck-root { font-family:'Plus Jakarta Sans',sans-serif; background:#f4f6f9; min-height:100vh; }
        select { appearance:none; -webkit-appearance:none; cursor:pointer; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp .4s cubic-bezier(.22,1,.36,1) both; }
        .fade-up-2 { animation: fadeUp .4s .1s cubic-bezier(.22,1,.36,1) both; }
      `}</style>

      <div className="ck-root">
        <div className="max-w-6xl mx-auto px-4 py-10">

          {/* ── Header with Step Indicator ── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-10 fade-up">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-gray-100 shadow-sm transition-all hover:border-blue-300 hover:text-blue-600 hover:-translate-x-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Checkout</h1>
                <p className="text-sm text-gray-400 font-semibold mt-0.5">{totalItems} item{totalItems !== 1 ? 's' : ''} · ৳{total.toLocaleString()}</p>
              </div>
            </div>

            {/* Visual 2-Step Indicator */}
            <div className="flex items-center gap-4">
              {(['form', 'review'] as Step[]).map((s, i) => {
                const isActive = step === s;
                const isPast = step === 'review' && s === 'form';
                const labels = { form: 'Delivery Info', review: 'Review Order' };
                const icons = {
                  form: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
                  review: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
                };
                return (
                  <div key={s} className="flex items-center gap-3">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className={`w-11 h-11 rounded-[14px] flex items-center justify-center transition-all duration-500 border-4 ${isActive ? 'bg-blue-600 border-white text-white scale-110 shadow-xl shadow-blue-200' : isPast ? 'bg-blue-100 border-white text-blue-600 shadow-sm' : 'bg-white border-gray-50 text-gray-300'}`}>
                        {isPast ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        ) : icons[s]}
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-colors duration-500 ${isActive ? 'text-gray-900' : isPast ? 'text-blue-600' : 'text-gray-300'}`}>{labels[s]}</span>
                    </div>
                    {i === 0 && (
                      <div className="w-16 h-0.5 mb-5 rounded-full transition-all duration-700" style={{ background: step === 'review' ? '#3b82f6' : '#e5e7eb' }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 items-start">

            {/* ── LEFT: Form or Review ── */}
            <div className="flex-1 min-w-0">

              {step === 'form' ? (
                <div className="flex flex-col gap-6 fade-up">

                  {/* Delivery Info Card */}
                  <div className="bg-white rounded-[2rem] p-8 border border-gray-50 shadow-xl shadow-gray-100/20">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      </div>
                      <h2 className="text-xl font-black text-gray-900 tracking-tight">Delivery Information</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="sm:col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Full Name *</label>
                        <input type="text" placeholder="e.g. Arifbillah Rahman" value={form.fullName} onChange={set('fullName')} className={fieldCls('fullName')} />
                        {touched.has('fullName') && errors.fullName && <p className="text-rose-500 text-[10px] font-bold px-2">{errors.fullName}</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Phone Number *</label>
                        <input type="tel" placeholder="01XXXXXXXXX" value={form.phone} onChange={set('phone')} className={fieldCls('phone')} />
                        {touched.has('phone') && errors.phone && <p className="text-rose-500 text-[10px] font-bold px-2">{errors.phone}</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Email (optional)</label>
                        <input type="email" placeholder="yourname@email.com" value={form.email} onChange={set('email')} className={fieldCls('email')} />
                        {touched.has('email') && errors.email && <p className="text-rose-500 text-[10px] font-bold px-2">{errors.email}</p>}
                      </div>
                      <div className="sm:col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Full Delivery Address *</label>
                        <input type="text" placeholder="House / Road / Building / Area..." value={form.address} onChange={set('address')} className={fieldCls('address')} />
                        {touched.has('address') && errors.address && <p className="text-rose-500 text-[10px] font-bold px-2">{errors.address}</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">City / Thana *</label>
                        <input type="text" placeholder="e.g. Gulshan" value={form.city} onChange={set('city')} className={fieldCls('city')} />
                        {touched.has('city') && errors.city && <p className="text-rose-500 text-[10px] font-bold px-2">{errors.city}</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">District *</label>
                        <div className="relative">
                          <select value={form.district} onChange={set('district')} className={`${fieldCls('district')} pr-12`}>
                            <option value="">Select district…</option>
                            {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                          <svg className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                        {touched.has('district') && errors.district && <p className="text-rose-500 text-[10px] font-bold px-2">{errors.district}</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Postal Code (optional)</label>
                        <input type="text" placeholder="e.g. 1212" value={form.postalCode} onChange={set('postalCode')} className={F_OK} />
                      </div>
                    </div>
                  </div>

                  {/* Payment Card */}
                  <div className="bg-white rounded-[2rem] p-8 border border-gray-50 shadow-xl shadow-gray-100/20">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                      </div>
                      <h2 className="text-xl font-black text-gray-900 tracking-tight">Payment Method</h2>
                    </div>
                    <div className="p-6 rounded-2xl border-2 border-blue-400 bg-blue-50/50 flex items-center gap-5">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-blue-900 text-base">Cash on Delivery</p>
                        <p className="text-xs text-blue-600/70 font-semibold mt-0.5">Pay ৳{total.toLocaleString()} when your books arrive</p>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-blue-500 border-4 border-white shadow-md flex-shrink-0" />
                    </div>
                  </div>

                  {/* Customer Note Card */}
                  <div className="bg-white rounded-[2rem] p-8 border border-gray-50 shadow-xl shadow-gray-100/20">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">Special Instructions</h2>
                        <p className="text-[11px] text-gray-400 font-semibold mt-0.5">Optional delivery notes or gift message</p>
                      </div>
                    </div>
                    <textarea
                      className="w-full px-5 py-4 text-sm font-medium rounded-2xl border border-gray-100 bg-gray-50/50 outline-none transition-all resize-none focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100/50"
                      rows={3}
                      placeholder="e.g. Please call before delivery · This is a gift · Deliver after 6 PM…"
                      value={form.note}
                      onChange={set('note')}
                      maxLength={400}
                    />
                    <p className="text-[10px] text-gray-300 font-bold text-right mt-2">{form.note.length}/400</p>
                  </div>

                  <button
                    onClick={handleNext}
                    className="group w-full flex items-center justify-center gap-3 py-5 rounded-3xl font-black text-sm transition-all hover:-translate-y-1 active:scale-95 relative overflow-hidden"
                    style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', boxShadow: '0 6px 24px rgba(59,130,246,0.35)', color: '#fff' }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    Review My Order
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

              ) : (
                /* ── REVIEW STEP ── */
                <div className="flex flex-col gap-6 fade-up">

                  {/* Delivery Details Review */}
                  <div className="bg-white rounded-[2rem] p-8 border border-gray-50 shadow-xl shadow-gray-100/20">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">Delivery Details</h2>
                      </div>
                      <button
                        onClick={() => { onEdit(form); setStep('form'); }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-all"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        Edit
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { label: 'Full Name', val: form.fullName, icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /> },
                        { label: 'Phone', val: form.phone, icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /> },
                        { label: 'Email', val: form.email || '—', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /> },
                        { label: 'District', val: form.district, icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /> },
                        { label: 'City', val: form.city, icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /> },
                        { label: 'Postal Code', val: form.postalCode || '—', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /> },
                      ].map(r => (
                        <div key={r.label} className="flex items-start gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                          <svg className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">{r.icon}</svg>
                          <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{r.label}</p>
                            <p className="text-sm font-black text-gray-900 mt-0.5">{r.val}</p>
                          </div>
                        </div>
                      ))}
                      {form.address && (
                        <div className="sm:col-span-2 flex items-start gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                          <svg className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                          <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Full Address</p>
                            <p className="text-sm font-black text-gray-900 mt-0.5">{form.address}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Review */}
                  <div className="bg-white rounded-[2rem] p-8 border border-gray-50 shadow-xl shadow-gray-100/20">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                      </div>
                      <h2 className="text-xl font-black text-gray-900 tracking-tight">Payment</h2>
                    </div>
                    <div className="flex items-center gap-4 p-5 rounded-2xl bg-blue-50 border border-blue-100">
                      <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                      </div>
                      <div>
                        <p className="font-black text-blue-900">Cash on Delivery</p>
                        <p className="text-xs text-blue-600/70 font-semibold mt-0.5">No advance payment · Pay upon delivery</p>
                      </div>
                      <svg className="w-5 h-5 text-blue-500 ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    </div>
                  </div>

                  {/* Customer Note review */}
                  {form.note.trim() && (
                    <div className="bg-amber-50 rounded-[2rem] p-8 border border-amber-100 shadow-xl shadow-amber-100/20">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                        </div>
                        <h2 className="text-xl font-black text-amber-900 tracking-tight">Your Note</h2>
                      </div>
                      <p className="text-sm text-amber-800 font-medium leading-relaxed italic bg-amber-100/50 rounded-2xl p-5 border border-amber-200/50">&quot;{form.note}&quot;</p>
                    </div>
                  )}

                  {submitError && (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                      {submitError}
                    </div>
                  )}

                  <button
                    onClick={() => { void onConfirm(form); }}
                    disabled={isSubmitting}
                    className="group w-full flex items-center justify-center gap-3 py-5 rounded-3xl font-black text-sm transition-all hover:-translate-y-1 active:scale-95 relative overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg,#10b981,#059669)',
                      boxShadow: '0 6px 24px rgba(16,185,129,0.35)',
                      color: '#fff',
                      opacity: isSubmitting ? 0.75 : 1,
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    {isSubmitting ? 'Placing Order...' : 'Confirm & Place Order'}
                  </button>
                </div>
              )}
            </div>

            {/* ── RIGHT: Sticky Order Summary ── */}
            <div className="w-full lg:w-[320px] flex-shrink-0 fade-up-2">
              <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-gray-900/30 sticky top-6 relative overflow-hidden">
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-blue-600 rounded-full blur-[60px] opacity-25" />
                <div className="relative z-10">
                  <h2 className="text-lg font-black tracking-tight mb-6">
                    Your Order <span className="text-gray-500 font-semibold text-sm">({totalItems})</span>
                  </h2>

                  {/* Items list */}
                  <div className="space-y-4 mb-6">
                    {items.map(item => (
                      <div key={item.id} className="flex gap-3">
                        <div className="flex-shrink-0 rounded-xl overflow-hidden shadow-sm" style={{ width: 46, height: 64 }}>
                          <Img src={item.cover} className="w-full h-full object-cover" fallback={item.coverFallback} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-white leading-snug line-clamp-2">{item.title}</p>
                          <p className="text-[10px] text-gray-500 font-semibold mt-1">×{item.qty} · {item.edition}</p>
                          <p className="text-sm font-black text-blue-400 mt-1">৳{(item.price * item.qty).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="h-px bg-white/10 mb-5" />

                  <div className="space-y-3 text-sm mb-5">
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-semibold">Subtotal</span>
                      <span className="font-black">৳{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 font-semibold">Delivery</span>
                      {delivery === 0
                        ? <span className="px-3 py-0.5 text-[10px] font-black uppercase tracking-wide rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">FREE</span>
                        : <span className="font-black">৳{delivery}</span>
                      }
                    </div>
                  </div>

                  <div className="h-px bg-white/10 mb-5" />

                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Total</p>
                      <p className="text-3xl font-black tracking-tighter">৳{total.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
