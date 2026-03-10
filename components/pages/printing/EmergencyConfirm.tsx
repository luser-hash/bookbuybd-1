'use client';
import { PrintingDetails, PrintingCheckoutForm } from './printingStore';

interface EmergencyConfirmProps {
    details: PrintingDetails;
    form: PrintingCheckoutForm;
    onBack: () => void;
    onSubmit: () => void;
}

export default function EmergencyConfirm({ details, form, onBack, onSubmit }: EmergencyConfirmProps) {
    return (
        <div className="max-w-6xl mx-auto px-4 pb-20" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

            <div className="flex items-center gap-4 mb-10">
                <button onClick={onBack} className="w-12 h-12 flex items-center justify-center rounded-2xl transition-all bg-white border border-gray-100 shadow-sm hover:border-brand-300 hover:text-brand-600 hover:-translate-x-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Final Verification</h2>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">Step 3: Quality Check & Submit</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                {/* Left Column: Detailed breakdown */}
                <div className="lg:col-span-7 space-y-8">
                    {/* Printing Specs Card */}
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-brand-100/10 border border-gray-50 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50 rounded-full blur-3xl -mt-10 -mr-10 opacity-60" />
                        <div className="flex items-center gap-3 mb-8 relative">
                            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                            </div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">Manifest of Requirements</h3>
                        </div>

                        <div className="space-y-6 relative">
                            {/* Selected Items Grid */}
                            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-4">Service Modules</label>
                                <div className="flex flex-wrap gap-2.5">
                                    {details.items.map(i => (
                                        <div key={i} className="group px-4 py-2 bg-white border border-gray-100 rounded-xl flex items-center gap-2 shadow-sm transition-all hover:border-brand-300">
                                            <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                                            <span className="text-xs font-black text-gray-700">{i}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="p-5 rounded-2xl border border-gray-100 flex items-center gap-4 bg-white shadow-sm">
                                    <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Asset Uploaded</p>
                                        <p className="text-xs font-black text-gray-900 truncate">{details.file?.name}</p>
                                    </div>
                                </div>

                                <div className="p-5 rounded-2xl border border-gray-100 bg-white shadow-sm flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-black">
                                            {details.quantity}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Units</p>
                                            <p className="text-xs font-black text-gray-900">Total Copies</p>
                                        </div>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${details.color === 'Color' ? 'bg-brand-500 text-white' : 'bg-gray-900 text-white'}`}>
                                        {details.color === 'Color' ? 'Full CMYK' : 'Monochrome'}
                                    </div>
                                </div>
                            </div>

                            {details.notes && (
                                <div className="p-6 rounded-2xl bg-brand-50/50 border border-brand-100">
                                    <label className="text-[10px] font-black text-brand-600 uppercase tracking-widest block mb-3">Special Directives</label>
                                    <p className="text-sm font-medium text-brand-900 italic leading-relaxed">"{details.notes}"</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Delivery Summary Card */}
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-brand-100/10 border border-gray-50 flex flex-col md:flex-row gap-10 items-start">
                        <div className="flex-1 w-full">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                </div>
                                <h3 className="text-xl font-black text-gray-900 tracking-tight">Logistics Mapping</h3>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Receiver</p>
                                        <p className="text-sm font-black text-gray-900">{form.fullName}</p>
                                        <p className="text-xs font-bold text-gray-400 mt-1">{form.phone}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Region</p>
                                        <p className="text-sm font-black text-gray-900">{form.division}</p>
                                        <p className="text-xs font-bold text-gray-400 mt-1">{form.city}</p>
                                    </div>
                                </div>
                                <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Detailed street address</p>
                                    <p className="text-xs font-bold text-gray-800 leading-snug">{form.address}</p>
                                </div>
                            </div>
                        </div>

                        <div className="w-full md:w-px bg-gray-100 self-stretch" />

                        <div className="md:w-64 space-y-6 self-center">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Settlement method</p>
                            <div className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 text-center ${form.paymentMethod === 'cod' ? 'border-brand-500 bg-brand-50 shadow-lg shadow-brand-100/50' : 'border-[#e2136e] bg-[#e2136e]/5 shadow-lg shadow-[#e2136e]/10'}`}>
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${form.paymentMethod === 'cod' ? 'bg-brand-500 text-white' : 'bg-[#e2136e] text-white'}`}>
                                    {form.paymentMethod === 'cod' ? (
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                    ) : (
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs font-black text-gray-900 uppercase tracking-tight">{form.paymentMethod === 'cod' ? 'Cash Delivery' : 'bKash Mobile'}</p>
                                    <p className="text-[9px] font-bold text-gray-400 mt-0.5">Payment on receipt</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Sticky Summary */}
                <div className="lg:col-span-5 lg:sticky lg:top-8">
                    <div className="bg-gray-900 rounded-[3rem] p-10 text-white shadow-2xl shadow-gray-900/40 relative overflow-hidden group">
                        {/* Abstract background highlight */}
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-brand-500 rounded-full blur-[80px] opacity-20" />

                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-10">
                                <span className="px-5 py-2 rounded-full bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest">Job Ticket Summary</span>
                                {details.isEmergency && (
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                        <span className="text-[10px] font-black text-rose-500 uppercase">Priority</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-6 mb-10">
                                <div className="flex justify-between items-baseline border-b border-white/5 pb-4">
                                    <span className="text-xs font-bold text-gray-400">Print Volume</span>
                                    <span className="text-2xl font-black">{details.quantity} <span className="text-xs font-bold text-gray-500 italic ml-1">Prints</span></span>
                                </div>
                                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                                    <span className="text-xs font-bold text-gray-400">Processing Mode</span>
                                    <span className={`text-xs font-black px-3 py-1 rounded-lg border uppercase tracking-widest ${details.isEmergency ? 'border-rose-500/30 text-rose-500 bg-rose-500/10' : 'border-brand-500/30 text-brand-400 bg-brand-500/10'}`}>
                                        {details.isEmergency ? 'Express' : 'Standard'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-gray-400">Order Estimate</span>
                                    <div className="text-right">
                                        <span className="text-3xl font-black tracking-tighter text-brand-400">৳ ---</span>
                                        <p className="text-[9px] font-bold text-gray-500 uppercase mt-1">Calculated at production</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <button
                                    onClick={onSubmit}
                                    className="group w-full flex items-center justify-center gap-4 py-6 bg-brand-600 text-white font-black rounded-3xl shadow-xl shadow-brand-600/20 hover:bg-brand-500 hover:-translate-y-1 transition-all active:scale-95 overflow-hidden relative"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                    Submit Digital Order
                                    <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                </button>

                                <p className="text-center text-[10px] font-bold text-gray-500 uppercase tracking-widest opacity-60">No payment required now</p>
                            </div>
                        </div>

                        {details.isEmergency && (
                            <div className="mt-8 p-6 rounded-[2rem] bg-rose-500/10 border border-rose-500/20 flex gap-4 animate-in slide-in-from-bottom-4 duration-500">
                                <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center flex-shrink-0">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                </div>
                                <div>
                                    <h4 className="text-xs font-black text-rose-500 uppercase tracking-wider">Priority Pipeline Active</h4>
                                    <p className="text-[10px] text-rose-200/70 font-medium leading-relaxed mt-1">A dedicated manager will contact you within 15 mins to confirm specialized requirements.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 px-8 flex items-center gap-4 group">
                        <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-loose">Automated quality assurance <br />Verified production partners</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
