'use client';
import { useState } from 'react';
import { PrintingCheckoutForm } from './printingStore';

// Optional static dataset - you could sync this with the main store in reality
const DISTRICTS = [
    'Dhaka', 'Chattogram', 'Rajshahi', 'Khulna', 'Barishal', 'Sylhet', 'Rangpur', 'Mymensingh',
    'Cumilla', 'Gazipur', 'Narayanganj', 'Tangail', 'Faridpur', 'Bogura', 'Pabna', 'Noakhali'
];

interface EmergencyCheckoutProps {
    form: PrintingCheckoutForm;
    onBack: () => void;
    onNext: (form: PrintingCheckoutForm) => void;
}

type Errors = Partial<Record<keyof PrintingCheckoutForm, string>>;
const REQUIRED: (keyof PrintingCheckoutForm)[] = ['fullName', 'phone', 'address', 'city', 'division'];

function validate(f: PrintingCheckoutForm): Errors {
    const e: Errors = {};
    if (!f.fullName.trim()) e.fullName = 'Full name is required';
    if (!f.phone.trim()) e.phone = 'Phone number is required';
    else if (!/^(\+8801|01)[0-9]{9}$/.test(f.phone.replace(/\s/g, ''))) e.phone = 'Enter a valid BD phone number';
    if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = 'Enter a valid email';
    if (!f.address.trim()) e.address = 'Delivery address is required';
    if (!f.city.trim()) e.city = 'City / Thana is required';
    if (!f.division) e.division = 'Please select a district/division';
    return e;
}

export default function EmergencyCheckout({ form, onBack, onNext }: EmergencyCheckoutProps) {
    const [local, setLocal] = useState<PrintingCheckoutForm>(form);
    const [errors, setErrors] = useState<Errors>({});
    const [touched, setTouched] = useState<Set<string>>(new Set());

    const set = (k: keyof PrintingCheckoutForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const val = e.target.value;
        setLocal(f => ({ ...f, [k]: val }));
        setTouched(t => new Set([...t, k]));
        if (touched.has(k)) {
            setErrors(prev => ({ ...prev, [k]: validate({ ...local, [k]: val })[k] }));
        }
    };

    const handleNext = () => {
        const errs = validate(local);
        setErrors(errs);
        setTouched(new Set(Object.keys(local)));
        if (Object.keys(errs).length === 0) onNext(local);
    };

    const INPUT_BASE = 'w-full px-5 py-4 text-sm font-medium rounded-2xl border transition-all outline-none shadow-sm';
    const INPUT_OK = `${INPUT_BASE} border-gray-100 bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:shadow-xl focus:shadow-brand-100/30`;
    const INPUT_ERR = `${INPUT_BASE} border-rose-200 bg-rose-50/30 focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10`;

    const fieldCls = (k: keyof PrintingCheckoutForm) => touched.has(k) && errors[k] ? INPUT_ERR : INPUT_OK;

    return (
        <div className="max-w-5xl mx-auto px-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="w-12 h-12 flex items-center justify-center rounded-2xl transition-all bg-white border border-gray-100 shadow-sm hover:border-brand-300 hover:text-brand-600 hover:-translate-x-1">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Delivery Logistics</h2>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">Step 2: Shipping & Payment</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Form Area */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Contact Card */}
                    <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-brand-100/20 border border-gray-50">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            </div>
                            <h3 className="text-lg font-black text-gray-900">Communication Bridge</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Recipient Full Name</label>
                                <input type="text" className={fieldCls('fullName')} placeholder="e.g. Shariar Mahir" value={local.fullName} onChange={set('fullName')} />
                                {touched.has('fullName') && errors.fullName && <p className="text-rose-500 text-[10px] font-bold px-2 animate-in fade-in slide-in-from-left-2">{errors.fullName}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Contact Number</label>
                                <input type="tel" className={fieldCls('phone')} placeholder="017xxxxxxxx" value={local.phone} onChange={set('phone')} />
                                {touched.has('phone') && errors.phone && <p className="text-rose-500 text-[10px] font-bold px-2 animate-in fade-in slide-in-from-left-2">{errors.phone}</p>}
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Digital Receipt Email</label>
                                <input type="email" className={fieldCls('email')} placeholder="mahir@example.com" value={local.email} onChange={set('email')} />
                                {touched.has('email') && errors.email && <p className="text-rose-500 text-[10px] font-bold px-2 animate-in fade-in slide-in-from-left-2">{errors.email}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Shipping Card */}
                    <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-brand-100/20 border border-gray-50">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            </div>
                            <h3 className="text-lg font-black text-gray-900">Destination Details</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Detailed physical address</label>
                                <input type="text" className={fieldCls('address')} placeholder="Apt, Suite, Floor, House, Road..." value={local.address} onChange={set('address')} />
                                {touched.has('address') && errors.address && <p className="text-rose-500 text-[10px] font-bold px-2 animate-in fade-in slide-in-from-left-2">{errors.address}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Administrative District</label>
                                <div className="relative">
                                    <select className={fieldCls('division')} style={{ appearance: 'none' }} value={local.division} onChange={set('division')}>
                                        <option value="">Select Region</option>
                                        {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                    <svg className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                                </div>
                                {touched.has('division') && errors.division && <p className="text-rose-500 text-[10px] font-bold px-2 animate-in fade-in slide-in-from-left-2">{errors.division}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Neighborhood / City</label>
                                <input type="text" className={fieldCls('city')} placeholder="e.g. Banani / Uttara" value={local.city} onChange={set('city')} />
                                {touched.has('city') && errors.city && <p className="text-rose-500 text-[10px] font-bold px-2 animate-in fade-in slide-in-from-left-2">{errors.city}</p>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Side Actions Area */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Payment Card */}
                    <div className="bg-gray-900 rounded-[2rem] p-8 text-white shadow-2xl shadow-gray-900/40">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-white/10 text-brand-400 flex items-center justify-center">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                            </div>
                            <h3 className="text-lg font-black tracking-tight">Payment Portal</h3>
                        </div>

                        <div className="space-y-4">
                            <label
                                onClick={() => setLocal({ ...local, paymentMethod: 'cod' })}
                                className={`group relative p-5 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all duration-300 ${local.paymentMethod === 'cod' ? 'border-brand-500 bg-brand-500/10 shadow-lg shadow-brand-500/10' : 'border-white/10 hover:border-white/30'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${local.paymentMethod === 'cod' ? 'bg-brand-500 border-brand-500' : 'border-white/20'}`}>
                                        {local.paymentMethod === 'cod' && <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>}
                                    </div>
                                    <div className="font-black text-sm uppercase tracking-wider">Cash Delivery</div>
                                </div>
                                <svg className={`w-5 h-5 transition-colors ${local.paymentMethod === 'cod' ? 'text-brand-400' : 'text-white/20'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" /><path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" /></svg>
                            </label>

                            <label
                                onClick={() => setLocal({ ...local, paymentMethod: 'bkash' })}
                                className={`group relative p-5 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all duration-300 ${local.paymentMethod === 'bkash' ? 'border-[#e2136e] bg-[#e2136e]/10 shadow-lg shadow-[#e2136e]/10' : 'border-white/10 hover:border-white/30'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${local.paymentMethod === 'bkash' ? 'bg-[#e2136e] border-[#e2136e]' : 'border-white/20'}`}>
                                        {local.paymentMethod === 'bkash' && <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>}
                                    </div>
                                    <div className="font-black text-sm uppercase tracking-wider">Mobile Pay <span className="text-[9px] text-white/40 block">vIA BKASH</span></div>
                                </div>
                                <div className={`px-2 py-1 rounded bg-[#e2136e] text-[9px] font-black transition-opacity ${local.paymentMethod === 'bkash' ? 'opacity-100' : 'opacity-20'}`}>HOT</div>
                            </label>
                        </div>

                        <div className="mt-10 pt-8 border-t border-white/10 space-y-6">
                            <div className="flex items-center justify-between text-white/40 font-bold uppercase tracking-widest text-[10px]">
                                <span>Privacy Guarantee</span>
                                <span className="text-emerald-400">Encrypted</span>
                            </div>

                            <button
                                onClick={handleNext}
                                className="group w-full flex items-center justify-center gap-3 py-5 bg-brand-600 text-white font-black rounded-2xl shadow-2xl shadow-brand-500/20 hover:bg-brand-500 hover:-translate-y-1 transition-all"
                            >
                                Validate & Review
                                <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </button>
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl border border-brand-100 bg-brand-50/30 flex items-start gap-3">
                        <svg className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <p className="text-[10px] text-brand-800 font-medium leading-relaxed">Your data is secured using industry-standard SSL encryption. Your print files are automatically deleted 48h after job completion.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
