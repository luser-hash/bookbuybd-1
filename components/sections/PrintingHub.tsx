'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ApiError,
  printingService,
  type CreatePrintingRequestResponse,
  type PrintingCategory,
  type PrintingEstimateResponse,
  type PrintingItemOption,
} from '@/lib/api';

type UiItem = PrintingItemOption & { icon: string; desc: string };
type UiCategory = Omit<PrintingCategory, 'icon' | 'items'> & {
  icon: string;
  color: string;
  light: string;
  items: UiItem[];
};

type OrderItem = { id: string; name: string; icon: string; categoryLabel: string };

const THEMES = [
  { color: 'from-blue-500 to-blue-700', light: 'bg-blue-50 border-blue-200 text-blue-700' },
  { color: 'from-indigo-500 to-indigo-700', light: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
  { color: 'from-orange-500 to-orange-700', light: 'bg-orange-50 border-orange-200 text-orange-700' },
  { color: 'from-pink-500 to-rose-600', light: 'bg-pink-50 border-pink-200 text-pink-700' },
  { color: 'from-green-500 to-emerald-700', light: 'bg-green-50 border-green-200 text-green-700' },
] as const;

const CATEGORY_ICON: Record<string, string> = { books: '📚', office: '🏢', display: '🏳️', ceremony: '🎉', stationery: '✏️' };

const ITEM_ICON: Record<string, string> = {
  'custom-printed-books': '📖',
  'thesis-dissertations': '🎓',
  'notebooks-journals': '📓',
  calendars: '📅',
  'id-cards': '🪪',
  'visiting-cards': '💳',
  'brochures-leaflets': '📋',
  'invoices-forms': '🧾',
  certificates: '📜',
  letterheads: '✉️',
  banners: '🏷️',
  posters: '🖼️',
  'stickers-labels': '🔖',
  'prize-cards': '🏅',
  'custom-printed-bags': '🛍️',
  'event-backdrops': '🎭',
  'table-cards-menus': '🍽️',
  'invitation-cards': '💌',
  keyrings: '🔑',
  'mugs-cups': '☕',
  'trophies-awards': '🏆',
  'pens-stationery-sets': '🖊️',
  'custom-gifts': '🎁',
  'tshirts-apparel': '👕',
};

const ICON_SHOWCASE = [
  { icon: '📚', label: 'Books & Thesis' },
  { icon: '🪪', label: 'ID & Visiting Cards' },
  { icon: '📜', label: 'Certificates' },
  { icon: '🏳️', label: 'Banners & Posters' },
  { icon: '🛍️', label: 'Event Bags' },
  { icon: '🏆', label: 'Trophies & Awards' },
  { icon: '☕', label: 'Mugs & Gifts' },
  { icon: '🔑', label: 'Keyrings' },
  { icon: '💌', label: 'Invitations' },
  { icon: '🧾', label: 'Invoices & Forms' },
];

const toInt = (v: string): number | undefined => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined;
};
const toNum = (v: string): number | undefined => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

const mapItem = (item: PrintingItemOption): UiItem => ({ ...item, icon: item.icon || ITEM_ICON[item.id] || '🖨️', desc: item.description || '' });
const mapCategory = (cat: PrintingCategory, i: number): UiCategory => ({
  id: cat.id,
  label: cat.label,
  icon: cat.icon || CATEGORY_ICON[cat.id] || '🖨️',
  color: THEMES[i % THEMES.length].color,
  light: THEMES[i % THEMES.length].light,
  items: (cat.items || []).map(mapItem),
});

function UploadArea({ label, file, disabled, onPick }: { label: string; file: File | null; disabled?: boolean; onPick: (f: File | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  return (
    <div
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={(e) => { if (!disabled) { e.preventDefault(); setDrag(true); } }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        if (disabled) return;
        e.preventDefault();
        setDrag(false);
        onPick(e.dataTransfer.files?.[0] || null);
      }}
      className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center py-6 px-4 transition-all ${disabled ? 'border-gray-100 bg-gray-100 cursor-not-allowed opacity-70' : drag ? 'border-blue-400 bg-blue-50 cursor-pointer' : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/30 cursor-pointer'}`}
    >
      <input ref={inputRef} type="file" className="hidden" accept=".svg,.eps,.ai,.pdf,.png,.jpg,.jpeg" onChange={(e) => onPick(e.target.files?.[0] || null)} />
      <svg className="w-8 h-8 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
      <p className="text-xs font-semibold text-gray-600 mb-0.5">{label}</p>
      {file ? <p className="text-[11px] text-blue-500 text-center break-all px-1">{file.name}</p> : <p className="text-[11px] text-gray-400 text-center leading-relaxed">Drag and drop to upload<br />or <span className="text-blue-500">choose file</span></p>}
    </div>
  );
}

function CategoryDropdown({ selected, categories, loading, onSelect }: { selected: string | null; categories: UiCategory[]; loading?: boolean; onSelect: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const current = categories.find((c) => c.id === selected);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={boxRef}>
      <button type="button" onClick={() => setOpen((v) => !v)} className={`w-full flex items-center justify-between gap-2 border rounded-lg px-4 py-2.5 text-sm transition outline-none focus:ring-2 focus:ring-blue-100 ${open ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300'}`}>
        <span className={`flex items-center gap-2 ${current ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>{current ? <>{current.icon} {current.label}</> : loading ? 'Loading categories...' : 'Select printing category...'}</span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && categories.length > 0 && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          {categories.map((cat) => (
            <button key={cat.id} type="button" onClick={() => { onSelect(cat.id); setOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition text-sm ${selected === cat.id ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700'}`}>
              <span className="text-lg">{cat.icon}</span><span>{cat.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ItemSelector({ categoryId, items, selected, loading, onToggle }: { categoryId: string | null; items: UiItem[]; selected: string[]; loading?: boolean; onToggle: (id: string) => void }) {
  if (!categoryId) return <div className="rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center py-8 text-gray-300 text-sm">← Select a category to see available items</div>;
  if (loading) return <div className="rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center py-8 text-gray-300 text-sm">Loading items...</div>;
  if (items.length === 0) return <div className="rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center py-8 text-gray-300 text-sm">No items available in this category</div>;

  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((item) => {
        const active = selected.includes(item.id);
        return (
          <button key={item.id} type="button" onClick={() => onToggle(item.id)} className={`flex items-start gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all ${active ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/30'}`}>
            <span className="text-xl flex-shrink-0 mt-0.5">{item.icon}</span>
            <div><p className={`text-xs font-bold leading-tight ${active ? 'text-blue-700' : 'text-gray-800'}`}>{item.name}</p><p className="text-[10px] text-gray-400 leading-tight mt-0.5">{item.desc}</p></div>
          </button>
        );
      })}
    </div>
  );
}

export default function PrintingHub() {
  const [categories, setCategories] = useState<UiCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  const [category, setCategory] = useState<string | null>(null);
  const [categoryItems, setCategoryItems] = useState<UiItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [budget, setBudget] = useState('');
  const [quantity, setQuantity] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);

  const [primaryFile, setPrimaryFile] = useState<File | null>(null);
  const [secondaryFile, setSecondaryFile] = useState<File | null>(null);

  const [estimate, setEstimate] = useState<PrintingEstimateResponse | null>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitResult, setSubmitResult] = useState<CreatePrintingRequestResponse | null>(null);

  useEffect(() => {
    const run = async () => {
      setCategoriesLoading(true);
      setCategoriesError(null);
      try {
        const payload = await printingService.getCategories();
        setCategories(payload.map(mapCategory));
      } catch (error) {
        setCategoriesError(error instanceof ApiError ? error.message : 'Failed to load printing categories.');
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };
    void run();
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!category) {
        setCategoryItems([]);
        return;
      }
      setItemsLoading(true);
      try {
        const payload = await printingService.getCategoryItems(category);
        setCategoryItems(payload.map(mapItem));
      } catch {
        setCategoryItems(categories.find((c) => c.id === category)?.items || []);
      } finally {
        setItemsLoading(false);
      }
    };
    void run();
  }, [category, categories]);

  const itemLookup = useMemo(() => {
    const map = new Map<string, OrderItem>();
    categories.forEach((cat) => {
      cat.items.forEach((item) => map.set(item.id, { id: item.id, name: item.name, icon: item.icon, categoryLabel: cat.label }));
    });
    const activeLabel = categories.find((c) => c.id === category)?.label || 'Selected Category';
    categoryItems.forEach((item) => map.set(item.id, { id: item.id, name: item.name, icon: item.icon, categoryLabel: activeLabel }));
    return map;
  }, [categories, categoryItems, category]);

  const selectedOrderItems = useMemo(() => selectedItemIds.map((id) => itemLookup.get(id) || { id, name: id, icon: '🖨️', categoryLabel: 'Selected Category' }), [selectedItemIds, itemLookup]);
  const activeCategory = categories.find((c) => c.id === category) || null;

  const toggleItem = (itemId: string) => setSelectedItemIds((p) => (p.includes(itemId) ? p.filter((id) => id !== itemId) : [...p, itemId]));

  useEffect(() => {
    if (!category || selectedItemIds.length === 0) {
      setEstimate(null);
      setEstimateError(null);
      return;
    }
    const timer = setTimeout(() => {
      const run = async () => {
        setEstimateLoading(true);
        setEstimateError(null);
        try {
          setEstimate(await printingService.estimate({ categoryId: category, itemIds: selectedItemIds, quantity: toInt(quantity), emergency: isEmergency }));
        } catch (error) {
          setEstimate(null);
          setEstimateError(error instanceof ApiError ? error.message : 'Failed to estimate printing cost.');
        } finally {
          setEstimateLoading(false);
        }
      };
      void run();
    }, 350);

    return () => clearTimeout(timer);
  }, [category, selectedItemIds, quantity, isEmergency]);

  const handleSubmit = async (emergency: boolean) => {
    setIsEmergency(emergency);
    setSubmitError(null);
    setSubmitResult(null);

    if (!category) return setSubmitError('Please select a printing category.');
    if (selectedItemIds.length === 0) return setSubmitError('Please select at least one item.');

    setSubmitting(true);
    try {
      const files = [primaryFile, secondaryFile].filter((f): f is File => Boolean(f));
      const assetUrls: string[] = [];
      for (const file of files) {
        const up = await printingService.createUploadUrl({ fileName: file.name, contentType: file.type || 'application/octet-stream', sizeInBytes: file.size || 1 });
        assetUrls.push(up.fileUrl);
      }

      const result = await printingService.createRequest({
        categoryId: category,
        itemIds: selectedItemIds,
        quantity: toInt(quantity),
        budget: toNum(budget),
        requiredBy: date || undefined,
        notes: notes.trim() || undefined,
        emergency,
        assetUrls,
      });

      setSubmitResult(result);
      alert(`${emergency ? 'Emergency' : 'Standard'} printing request submitted.\nRequest ID: ${result.requestId}`);
    } catch (error) {
      setSubmitError(error instanceof ApiError ? error.message : 'Failed to submit printing request.');
    } finally {
      setSubmitting(false);
    }
  };

  const estimateLabel = estimate ? `${estimate.currency} ${estimate.estimatedTotal.toFixed(2)}` : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 flex items-start justify-center py-12 px-4">
      <div className="w-full" style={{ maxWidth: 900 }}>
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-bold px-4 py-1.5 rounded-full mb-3"><span>🖨️</span> CUSTOM PRINTING SERVICES</div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">What would you like to print?</h1>
          <p className="text-gray-500 text-sm max-w-lg mx-auto">From books and ID cards to trophies and event bags - we print it all. Configure your order below.</p>
          <div className="flex items-center justify-center gap-3 mt-5">
            <button type="button" disabled={submitting} onClick={() => { void handleSubmit(false); }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-bold text-sm px-7 py-3 rounded-xl shadow-md shadow-blue-200 transition">Create Printing</button>
            <button type="button" disabled={submitting} onClick={() => { void handleSubmit(true); }} className="flex items-center gap-2 bg-red-500 hover:bg-red-600 active:scale-[0.98] disabled:bg-red-300 disabled:cursor-not-allowed text-white font-bold text-sm px-7 py-3 rounded-xl shadow-md shadow-red-200 transition">Emergency Printing</button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
          {categories.map((cat) => (
            <button key={cat.id} type="button" onClick={() => { setCategory(cat.id); setSelectedItemIds([]); }} className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border transition whitespace-nowrap ${category === cat.id ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'}`}><span>{cat.icon}</span>{cat.label}</button>
          ))}
          {categoriesLoading && <p className="text-xs text-gray-400 px-1 py-2">Loading categories...</p>}
          {!categoriesLoading && categories.length === 0 && <p className="text-xs text-gray-400 px-1 py-2">No categories available</p>}
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="flex gap-0">
            <div className="flex flex-col border-r border-gray-100" style={{ width: 230, minWidth: 230 }}>
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50"><h3 className="text-sm font-extrabold text-gray-800">Your Order</h3><p className="text-[10px] text-gray-400 mt-0.5">Selected items appear here</p></div>
              <div className="flex-1 overflow-y-auto">
                {selectedOrderItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-gray-300 px-4 text-center"><p className="text-[11px] leading-tight">No items yet.<br />Select from the right →</p></div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {selectedOrderItems.map((item) => (
                      <div key={item.id} className="flex items-start gap-2 px-4 py-3 group">
                        <span className="text-base mt-0.5">{item.icon}</span>
                        <div className="flex-1 min-w-0"><p className="text-[11px] font-bold text-gray-800 leading-tight">{item.name}</p><p className="text-[10px] text-gray-400">{item.categoryLabel}</p></div>
                        <button type="button" onClick={() => toggleItem(item.id)} className="text-gray-200 hover:text-red-400 transition text-base leading-none flex-shrink-0">×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="px-4 py-4 border-t border-gray-100 space-y-2 bg-gray-50">
                <div className="flex items-center justify-between gap-2"><span className="text-[10px] text-gray-500 font-medium">Quantity</span><input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="e.g. 100" min={1} className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-800 outline-none focus:border-blue-400 text-right" /></div>
                <div className="flex justify-between items-center pt-1 border-t border-gray-200"><span className="text-[10px] text-gray-500">Items selected</span><span className="text-xs font-bold text-blue-600">{selectedItemIds.length}</span></div>
                <div className="flex justify-between items-center"><span className="text-[10px] text-gray-500">Estimated total</span><span className="text-xs font-bold text-gray-700">{estimateLoading ? 'Calculating...' : estimateLabel || '--'}</span></div>
                {estimateError && <p className="text-[10px] text-amber-600">{estimateError}</p>}
              </div>
            </div>

            <div className="flex-1 px-6 py-5 flex flex-col gap-4">
              <h2 className="text-lg font-extrabold text-gray-900 border-b border-gray-100 pb-2 mb-1">Configure Your Print Order</h2>
              {categoriesError && <p className="text-xs text-amber-600">{categoriesError}</p>}
              {submitError && <p className="text-xs text-red-600">{submitError}</p>}
              {submitResult && <p className="text-xs text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">Request submitted: <span className="font-semibold">{submitResult.requestId}</span> ({submitResult.status})</p>}

              <div>
                <label className="block text-sm text-gray-800 font-bold mb-1.5">Printing Category</label>
                <CategoryDropdown selected={category} categories={categories} loading={categoriesLoading} onSelect={(id) => { setCategory(id); setSelectedItemIds([]); }} />
              </div>

              <div>
                <label className="block text-sm text-gray-800 font-bold mb-1.5">Select Items {selectedItemIds.length > 0 && <span className="ml-2 bg-blue-100 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{selectedItemIds.length} selected</span>}</label>
                <ItemSelector categoryId={category} items={categoryItems.length > 0 ? categoryItems : activeCategory?.items || []} selected={selectedItemIds} loading={itemsLoading} onToggle={toggleItem} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm text-gray-800 font-bold mb-1.5">Budget (BDT)</label><input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="e.g. 5000" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition" /></div>
                <div><label className="block text-sm text-gray-800 font-bold mb-1.5">Required By</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition" /></div>
              </div>

              <div><label className="block text-sm text-gray-800 font-bold mb-1.5">Special Instructions</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Paper type, finish (matte/gloss), size, colours, binding style, delivery address..." className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition resize-none placeholder-gray-300" /></div>

              <div>
                <p className="text-[10px] text-gray-400 text-center mb-3">Accepted: .svg, .eps, .ai, .pdf, .png, .jpg</p>
                <div className="grid grid-cols-2 gap-3">
                  <UploadArea label="Primary Design / Logo" file={primaryFile} onPick={setPrimaryFile} disabled={submitting} />
                  <UploadArea label="Secondary Design / Brand Guide" file={secondaryFile} onPick={setSecondaryFile} disabled={submitting} />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button type="button" disabled={submitting} onClick={() => { void handleSubmit(false); }} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-bold text-sm py-3 rounded-xl shadow shadow-blue-200 transition">{submitting ? 'Submitting...' : 'Create Printing'}</button>
                <button type="button" disabled={submitting} onClick={() => { void handleSubmit(true); }} className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 active:scale-[0.98] disabled:bg-red-300 disabled:cursor-not-allowed text-white font-bold text-sm py-3 rounded-xl shadow shadow-red-200 transition">{submitting ? 'Submitting...' : 'Emergency Printing'}</button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-5 gap-3">
          {ICON_SHOWCASE.map((p) => (
            <div key={p.label} className="bg-white rounded-xl border border-gray-100 flex flex-col items-center py-4 px-2 hover:border-blue-200 hover:shadow-sm transition cursor-pointer group">
              <span className="text-2xl mb-1.5 group-hover:scale-110 transition-transform">{p.icon}</span>
              <p className="text-[10px] text-gray-500 text-center font-medium leading-tight">{p.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
