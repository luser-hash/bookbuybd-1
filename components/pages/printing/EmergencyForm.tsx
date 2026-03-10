'use client';
import { useState, useRef, useEffect } from 'react';
import { PrintingDetails } from './printingStore';

/* ══════════════════════════════════════════
   DATA — all printing categories & items
══════════════════════════════════════════ */
const CATEGORIES = [
    {
        id: 'books',
        label: 'Books & Academic',
        icon: '📚',
        items: [
            { name: 'Custom Printed Books', desc: 'Full-color or B&W book printing, any size', icon: '📖' },
            { name: 'Thesis & Dissertations', desc: 'Hard/soft cover thesis binding & printing', icon: '🎓' },
            { name: 'Notebooks & Journals', desc: 'Custom branded notebooks with logo', icon: '📓' },
            { name: 'Calendars', desc: 'Wall and desk calendars, custom design', icon: '📅' },
        ],
    },
    {
        id: 'office',
        label: 'Office & Corporate',
        icon: '🏢',
        items: [
            { name: 'ID Cards', desc: 'PVC, laminated ID cards with lanyards', icon: '🪪' },
            { name: 'Visiting Cards', desc: 'Matte, gloss, spot UV business cards', icon: '💳' },
            { name: 'Brochures & Leaflets', desc: 'Bi-fold, tri-fold, DL brochures', icon: '📋' },
            { name: 'Invoices & Forms', desc: 'Carbonless NCR pads, custom forms', icon: '🧾' },
            { name: 'Certificates', desc: 'A4/A3 certificates, gold foil borders', icon: '📜' },
            { name: 'Letterheads', desc: 'Branded company letterhead pads', icon: '✉️' },
        ],
    },
    {
        id: 'display',
        label: 'Banners & Display',
        icon: '🏳️',
        items: [
            { name: 'Banners', desc: 'Vinyl, fabric, retractable roll-up banners', icon: '🏷️' },
            { name: 'Posters', desc: 'A0–A3 glossy/matte large-format posters', icon: '🖼️' },
            { name: 'Stickers & Labels', desc: 'Die-cut, roll, sheet stickers', icon: '🔖' },
            { name: 'Prize Cards', desc: 'Custom award & prize cards, foil finish', icon: '🏅' },
        ],
    },
    {
        id: 'ceremony',
        label: 'Ceremony & Events',
        icon: '🎉',
        items: [
            { name: 'Custom Printed Bags', desc: 'Gift bags, tote bags, carry bags with branding', icon: '🛍️' },
            { name: 'Event Backdrops', desc: 'Photo booth, step-and-repeat backdrops', icon: '🎭' },
            { name: 'Table Cards & Menus', desc: 'Wedding/event table cards and menus', icon: '🍽️' },
            { name: 'Invitation Cards', desc: 'Premium invitation & greeting cards', icon: '💌' },
        ],
    },
];

/* ── Upload drop zone ── */
function UploadArea({ label, file, setFile }: { label: string; file: File | null; setFile: (f: File) => void }) {
    const ref = useRef<HTMLInputElement>(null);
    const [drag, setDrag] = useState(false);
    const handle = (f: File) => setFile(f);
    return (
        <div
            onClick={() => ref.current?.click()}
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files[0]) handle(e.dataTransfer.files[0]); }}
            className={`relative group border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center py-10 px-6 cursor-pointer transition-all duration-500 overflow-hidden ${drag ? 'border-brand-500 bg-brand-50/50 scale-[0.98]' : 'border-gray-200 bg-gray-50/50 hover:border-brand-400 hover:bg-white hover:shadow-2xl hover:shadow-brand-100/50'}`}
        >
            <input ref={ref} type="file" className="hidden" onChange={e => {
                if (e.target.files?.[0]) handle(e.target.files[0]);
            }} />

            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500 ${file ? 'bg-emerald-100 text-emerald-600 rotate-0' : 'bg-brand-100 text-brand-600 group-hover:scale-110 group-hover:rotate-12'}`}>
                {file ? (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                ) : (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                )}
            </div>

            <p className="text-sm font-bold text-gray-900 mb-1">{label}</p>
            {file ? (
                <div className="flex items-center gap-2 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100 animate-in fade-in zoom-in duration-300">
                    <span className="text-[11px] text-emerald-700 font-bold truncate max-w-[200px]">{file.name}</span>
                    <button onClick={(e) => { e.stopPropagation(); setFile(null as any); }} className="text-emerald-400 hover:text-emerald-600 transition-colors">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" /></svg>
                    </button>
                </div>
            ) : (
                <p className="text-[11px] text-gray-400 text-center leading-relaxed">
                    Drag and drop to upload or <span className="text-brand-600 font-bold decoration-2 underline-offset-2 hover:underline">browse files</span>
                </p>
            )}

            {/* Subtle background decoration */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-brand-50 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
        </div>
    );
}

/* ── Category dropdown button ── */
function CategorySelection({ selected, onSelect }: { selected: string | null; onSelect: (id: string) => void; }) {
    return (
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {CATEGORIES.map(cat => {
                const active = selected === cat.id;
                return (
                    <button
                        key={cat.id}
                        type="button"
                        onClick={() => onSelect(cat.id)}
                        className={`group relative p-4 rounded-2xl border-2 text-left transition-all duration-300 overflow-hidden ${active
                            ? 'border-brand-500 bg-brand-50 shadow-lg shadow-brand-100 scale-[1.02]'
                            : 'border-gray-100 bg-white hover:border-brand-200 hover:bg-gray-50/50'}`}
                    >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors ${active ? 'bg-brand-500 text-white shadow-md shadow-brand-200' : 'bg-gray-100 text-gray-400 group-hover:bg-brand-100 group-hover:text-brand-600'}`}>
                            <span className="text-xl">{cat.icon}</span>
                        </div>
                        <h3 className={`text-sm font-bold tracking-tight mb-1 ${active ? 'text-brand-700' : 'text-gray-900'}`}>{cat.label}</h3>
                        <p className={`text-[10px] leading-tight ${active ? 'text-brand-600/70' : 'text-gray-400'}`}>
                            {cat.items.length} print variants available
                        </p>

                        {active && (
                            <div className="absolute top-3 right-3 w-5 h-5 bg-brand-500 text-white rounded-full flex items-center justify-center animate-in fade-in zoom-in duration-300">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            </div>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

/* ── Item selector chips ── */
function ItemSelector({ categoryId, selected, onToggle }: { categoryId: string | null; selected: string[]; onToggle: (name: string) => void; }) {
    const cat = CATEGORIES.find(c => c.id === categoryId);
    if (!cat) return (
        <div className="h-full min-h-[160px] rounded-[2rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center p-8 text-center bg-gray-50/30">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-gray-200 mb-3 border border-gray-50">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            </div>
            <p className="text-xs font-bold text-gray-400">Step 1: Select a category</p>
            <p className="text-[10px] text-gray-300 mt-1 max-w-[140px]">Specific items will appear here after selection</p>
        </div>
    );
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {cat.items.map(item => {
                const active = selected.includes(item.name);
                return (
                    <button
                        key={item.name}
                        type="button"
                        onClick={() => onToggle(item.name)}
                        className={`group flex items-start gap-3 p-3.5 rounded-2xl border-2 text-left transition-all duration-300 ${active
                            ? 'border-brand-500 bg-brand-50/50 shadow-md shadow-brand-100'
                            : 'border-gray-50 bg-gray-50/50 hover:border-brand-200 hover:bg-white hover:shadow-xl hover:shadow-brand-100/30'
                            }`}
                    >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${active ? 'bg-brand-500 text-white shadow-sm' : 'bg-white text-gray-400 group-hover:bg-brand-100 group-hover:text-brand-600 border border-gray-100'}`}>
                            <span className="text-xl">{item.icon}</span>
                        </div>
                        <div className="min-w-0 pr-6">
                            <p className={`text-xs font-black truncate leading-tight ${active ? 'text-brand-700' : 'text-gray-900 group-hover:text-brand-600'}`}>{item.name}</p>
                            <p className="text-[10px] text-gray-400 leading-tight mt-1 line-clamp-2">{item.desc}</p>
                        </div>
                        {active && (
                            <div className="absolute top-3.5 right-3.5 w-4 h-4 rounded-full bg-brand-500 text-white flex items-center justify-center shadow-sm animate-in fade-in zoom-in duration-300">
                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                            </div>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

interface EmergencyFormProps {
    details: PrintingDetails;
    onNext: (details: PrintingDetails) => void;
}

export default function EmergencyForm({ details, onNext }: EmergencyFormProps) {
    const [local, setLocal] = useState<PrintingDetails>(details);
    const [error, setError] = useState('');

    const handleNext = () => {
        if (!local.categoryId) {
            setError('Please select a printing category.');
            return;
        }
        if (local.items.length === 0) {
            setError('Please select at least one item to print.');
            return;
        }
        if (!local.file) {
            setError('Please upload the file to be printed.');
            return;
        }
        onNext(local);
    };

    return (
        <div className="max-w-6xl mx-auto px-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <div className="bg-white rounded-[2.5rem] p-8 lg:p-12 shadow-2xl shadow-brand-100/20 border border-gray-50">
                <div className="mb-12">
                    <h2 className="text-4xl font-black text-gray-900 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        Specialized <br />
                        <span className="text-brand-600 italic">Printing Details</span>
                    </h2>
                    <p className="text-gray-400 mt-2 font-medium">Configure your professional print job with our advanced tools.</p>
                </div>

                {error && (
                    <div className="mb-8 p-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center gap-3 animate-in slide-in-from-top-4 duration-500">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Left Section: Selection */}
                    <div className="lg:col-span-7 space-y-10">
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-black text-xs">1</div>
                                <label className="text-sm font-black text-gray-900 uppercase tracking-widest">Select Category</label>
                            </div>
                            <CategorySelection
                                selected={local.categoryId}
                                onSelect={id => { setLocal({ ...local, categoryId: id, items: [] }); setError(''); }}
                            />
                        </div>

                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-black text-xs">2</div>
                                <label className="text-sm font-black text-gray-900 uppercase tracking-widest">Print Surface & Variant</label>
                            </div>
                            <ItemSelector
                                categoryId={local.categoryId}
                                selected={local.items}
                                onToggle={name => {
                                    setLocal(prev => ({
                                        ...prev,
                                        items: prev.items.includes(name) ? prev.items.filter(i => i !== name) : [...prev.items, name]
                                    }));
                                    setError('');
                                }}
                            />
                        </div>
                    </div>

                    {/* Right Section: Configuration */}
                    <div className="lg:col-span-5 space-y-10 bg-gray-50/50 p-8 rounded-[2rem] border border-gray-100">
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-black text-xs">3</div>
                                <label className="text-sm font-black text-gray-900 uppercase tracking-widest">Digital Assets</label>
                            </div>
                            <UploadArea
                                label="Drop Print File Here"
                                file={local.file}
                                setFile={f => { setLocal({ ...local, file: f }); setError(''); }}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Quantity</label>
                                <div className="flex items-center bg-white border border-gray-100 p-1.5 rounded-2xl shadow-sm">
                                    <button type="button" onClick={() => setLocal({ ...local, quantity: Math.max(1, local.quantity - 1) })} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-brand-50 hover:text-brand-600 transition-colors font-black">-</button>
                                    <input type="text" className="w-full text-center font-black text-gray-900 outline-none bg-transparent" value={local.quantity} readOnly />
                                    <button type="button" onClick={() => setLocal({ ...local, quantity: local.quantity + 1 })} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-brand-50 hover:text-brand-600 transition-colors font-black">+</button>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Color Palette</label>
                                <div className="flex bg-white border border-gray-100 p-1.5 rounded-2xl shadow-sm">
                                    <button type="button" onClick={() => setLocal({ ...local, color: 'BW' })} className={`flex-1 h-10 rounded-xl text-[11px] font-black transition-all ${local.color === 'BW' ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}>B&W</button>
                                    <button type="button" onClick={() => setLocal({ ...local, color: 'Color' })} className={`flex-1 h-10 rounded-xl text-[11px] font-black transition-all ${local.color === 'Color' ? 'bg-brand-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}>CMYK</button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Customization Notes</label>
                            <textarea
                                className="w-full bg-white border border-gray-100 rounded-[1.5rem] p-5 text-sm font-medium focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all resize-y min-h-[120px] shadow-sm placeholder:text-gray-300"
                                placeholder="Special paper gsm, binding preference, or specific details..."
                                value={local.notes}
                                onChange={e => setLocal({ ...local, notes: e.target.value })}
                            />
                        </div>

                        <label className={`group flex items-start gap-4 p-5 rounded-[1.5rem] border-2 cursor-pointer transition-all duration-300 ${local.isEmergency ? 'border-rose-500 bg-rose-50 shadow-lg shadow-rose-100' : 'border-gray-100 bg-white hover:border-rose-200'}`}>
                            <div className={`mt-1 flex-shrink-0 w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${local.isEmergency ? 'bg-rose-500 border-rose-500' : 'border-gray-200'}`}>
                                {local.isEmergency && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>}
                            </div>
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={local.isEmergency}
                                onChange={e => setLocal({ ...local, isEmergency: e.target.checked })}
                            />
                            <div>
                                <span className={`block font-black text-sm uppercase tracking-wider ${local.isEmergency ? 'text-rose-700' : 'text-gray-900'}`}>Express Priority</span>
                                <span className="block text-[10px] text-gray-400 font-medium mt-1 leading-relaxed">Prioritizes your job for 24h turnaround. Extra ৳350 applies.</span>
                            </div>
                            <div className={`ml-auto self-center p-2 rounded-xl transition-colors ${local.isEmergency ? 'bg-rose-100 text-rose-500' : 'bg-gray-50 text-gray-300'}`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </div>
                        </label>
                    </div>
                </div>

                <div className="mt-12 flex items-center justify-between">
                    <p className="hidden sm:block text-[11px] text-gray-300 font-bold uppercase tracking-widest">Secure cloud printing powered by BookBuyBD</p>
                    <button
                        onClick={handleNext}
                        className="group flex items-center gap-3 px-10 py-5 bg-brand-600 text-white font-black rounded-2xl shadow-2xl shadow-brand-200 hover:bg-brand-700 hover:-translate-y-1 transition-all w-full sm:w-auto text-sm"
                    >
                        Configure Delivery
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
