'use client';
import { useState } from 'react';
import Link from 'next/link';

/* ═══════════════════════════════════════
   IMAGE PATHS  →  public/images/
   book-detail/cover.jpg        main book cover
   book-detail/author.jpg       author avatar
   book-detail/edition1.jpg     hardback cover
   book-detail/edition2.jpg     paperback cover
   book-detail/edition3.jpg     ebook cover
   similar/sim1.jpg … sim4.jpg  similar book covers
   books/book1.jpg … book4.jpg  "Other Books" row
═══════════════════════════════════════ */

/* ─── fallback image ─── */
function Img({
    src, alt = '', className = '', fallback = '#e2e8f0', style = {},
}: {
    src: string; alt?: string; className?: string; fallback?: string; style?: React.CSSProperties;
}) {
    const [err, setErr] = useState(false);
    if (err) return <div className={className} style={{ ...style, background: fallback }} />;
    return <img src={src} alt={alt} className={className} style={style} onError={() => setErr(true)} />;
}

/* ─── stars ─── */
function Stars({ count, total = 5 }: { count: number; total?: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {Array.from({ length: total }).map((_, i) => (
                <svg key={i} className={`w-3.5 h-3.5 ${i < count ? 'text-amber-400' : 'text-gray-200'}`}
                    fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
        </div>
    );
}

/* ─── DATA ─── */
const BOOK = {
    title: 'Bald Bearded Boss',
    author: 'Elliott Holt',
    date: 'Feb 2020',
    rating: 4,
    reviews: 271,
    score: 80,
    tags: ['Time travel', 'Fast Food', 'Début writer'],
    cover: '/images/book-detail/cover.jpg',
    synopsis: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus.',
    synopsisQuote: '- Joey Bare',
    description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad minim veniam, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim\n\nUt enim ad minim veniam, quis nostrud exercitation. Nam hendrerit nisi sed sollicitudin pellentesque. Nunc posuere purus rhoncus pulvinar aliquam. Ut aliquet tristique nisi vitae volutpat. Nulla aliquet porttitor venenatis. Donec a dui et dui fringilla consectetur id nec massa. Aliquam erat volutpat. Sed ut dui at lacus dictum fermentum vel tincidunt neque. Sed sed lacinia luctus. Duis ante sodales felis."`,
    writingSample: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam hendrerit nisi sed sollicitudin pellentesque. Nunc posuere purus rhoncus pulvinar aliquam. Ut aliquet tristique nisi vitae volutpat.',
};

const AUTHOR = {
    name: 'Elliott Holt',
    avatar: '/images/book-detail/author.jpg',
    bio: 'Elliott Holt is an American fiction writer and former ad copywriter. Holt won a 2011 Pushcart Prize for her story "Tom-Can" and was the runner-up of the 2011 PEN Emerging Writers Award for her story "The Norwegians." She was also part of Twitter\'s 2012 #twitterfiction festival.',
};

const OTHER_BOOKS = [
    { title: 'The Days Before', img: '/images/books/book1.jpg', color: '#7c3aed' },
    { title: 'World of Abstract Art', img: '/images/books/book2.jpg', color: '#0d9488' },
    { title: 'The Days Painting', img: '/images/books/book3.jpg', color: '#b45309' },
    { title: 'Night Stories', img: '/images/books/book4.jpg', color: '#e11d48' },
];

const EDITIONS = [
    { type: 'Hardback', price: '$15.99', img: '/images/book-detail/edition1.jpg', color: '#c2410c', desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod.' },
    { type: 'Paperback', price: '$15.99', img: '/images/book-detail/edition2.jpg', color: '#7c3aed', desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod.' },
    { type: 'Ebook', price: '$15.99', img: '/images/book-detail/edition3.jpg', color: '#0d9488', desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod.', stores: true },
];

const SIMILAR = [
    { title: 'The Tiny Dragon', author: 'By Mesha Maon', date: '1 Feb 2020', rating: 4, reviews: 27, img: '/images/similar/sim1.jpg', color: '#be185d' },
    { title: 'World of Abstract Art', author: 'By Mesha Maon', date: '1 Feb 2020', rating: 4, reviews: 27, img: '/images/similar/sim2.jpg', color: '#1d4ed8' },
    { title: 'Sunset Kiss', author: 'By Mesha Maon', date: '1 Feb 2020', rating: 4, reviews: 27, img: '/images/similar/sim3.jpg', color: '#b45309' },
    { title: 'Dark Waters', author: 'By Mesha Maon', date: '1 Feb 2020', rating: 4, reviews: 27, img: '/images/similar/sim4.jpg', color: '#0d9488' },
];

const NAV_ITEMS = [
    { label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', active: false },
    { label: 'Discover', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', active: false },
    { label: 'Recommendations', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z', active: true },
    { label: 'Wishlist', icon: 'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z', active: false },
    { label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', active: false },
];

/* ══════════════════════════════════════
   PAGE
══════════════════════════════════════ */
export default function BookDetails() {
    const [saved, setSaved] = useState(false);
    const [hidden, setHidden] = useState(false);
    const [markRead, setMarkRead] = useState(false);
    const [descExpanded, setDescExpanded] = useState(false);
    const [sampleExpanded, setSampleExpanded] = useState(false);

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@400;500;600;700&display=swap');

        .bd-root { font-family:'DM Sans',sans-serif; background:#f8fafc; min-height:100vh; }
        .bd-root h1,.bd-root h2,.bd-root h3 { font-family:'Lora',serif; }

        @keyframes bdUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .bd-a1 { animation: bdUp .45s cubic-bezier(.22,1,.36,1) both; }
        .bd-a2 { animation: bdUp .45s .10s cubic-bezier(.22,1,.36,1) both; }
        .bd-a3 { animation: bdUp .45s .20s cubic-bezier(.22,1,.36,1) both; }

        /* Score ring */
        .score-ring {
          width:54px; height:54px; border-radius:50%;
          background: conic-gradient(#f59e0b calc(var(--pct)*1%), #e2e8f0 0);
          display:flex; align-items:center; justify-content:center;
          box-shadow: 0 0 0 3px #fff, 0 2px 8px rgba(0,0,0,0.1);
        }
        .score-inner {
          width:40px; height:40px; border-radius:50%;
          background:#fff;
          font-size:11px; font-weight:800; color:#f59e0b;
          display:flex; align-items:center; justify-content:center;
        }

        /* Tags */
        .tag-chip {
          font-size:11px; font-weight:600;
          padding:3px 11px; border-radius:20px;
          background:#eff6ff; color:#3b82f6;
          border:1px solid #bfdbfe;
        }

        /* Action buttons */
        .act-btn {
          display:flex; align-items:center; gap:6px;
          font-size:12px; font-weight:600;
          padding:8px 16px; border-radius:10px;
          background:#fff; color:#475569;
          border:1px solid #e2e8f0;
          cursor:pointer; white-space:nowrap;
          transition:all .18s;
          box-shadow:0 1px 3px rgba(0,0,0,0.06);
        }
        .act-btn:hover { background:#f1f5f9; border-color:#cbd5e1; color:#1e40af; }
        .act-btn.on    { background:#eff6ff; border-color:#93c5fd; color:#2563eb; }

        /* Shop Now */
        .shop-btn {
          background: linear-gradient(135deg,#3b82f6 0%,#2563eb 100%);
          color:#fff; font-size:13px; font-weight:700;
          padding:9px 22px; border-radius:10px; border:none;
          cursor:pointer; box-shadow:0 4px 14px rgba(37,99,235,0.35);
          transition:opacity .2s, transform .15s;
        }
        .shop-btn:hover  { opacity:.92; transform:translateY(-1px); }
        .shop-btn:active { transform:scale(.97); }

        /* Sidebar nav */
        .nav-item {
          display:flex; align-items:center; gap:10px;
          padding:9px 14px; border-radius:10px;
          font-size:13px; font-weight:500; color:#64748b;
          cursor:pointer; transition:background .15s, color .15s;
        }
        .nav-item:hover { background:#f1f5f9; color:#2563eb; }
        .nav-item.on    { background:#eff6ff; color:#2563eb; font-weight:600; }

        /* Cards */
        .info-card {
          background:#fff; border:1px solid #e2e8f0;
          border-radius:16px; padding:16px;
          box-shadow:0 1px 4px rgba(0,0,0,0.05);
        }
        .edition-card {
          background:#fff; border:1px solid #e2e8f0;
          border-radius:16px; padding:18px;
          display:flex; flex-direction:column; align-items:center; gap:12px;
          box-shadow:0 1px 4px rgba(0,0,0,0.05);
          transition:box-shadow .2s, border-color .2s;
        }
        .edition-card:hover { box-shadow:0 6px 20px rgba(37,99,235,0.12); border-color:#93c5fd; }
        .sim-card {
          background:#fff; border:1px solid #e2e8f0;
          border-radius:16px; overflow:hidden;
          box-shadow:0 1px 4px rgba(0,0,0,0.05);
          transition:box-shadow .2s, transform .2s; cursor:pointer;
        }
        .sim-card:hover { box-shadow:0 6px 20px rgba(37,99,235,0.12); transform:translateY(-2px); }

        /* Divider */
        .divider { height:1px; background:#f1f5f9; margin:18px 0; }

        /* Section titles */
        .sec-title { font-size:13px; font-weight:700; color:#1e293b; margin-bottom:12px; font-family:'DM Sans',sans-serif; }

        /* Read more */
        .read-more { font-size:12px; font-weight:700; color:#2563eb; cursor:pointer; background:none; border:none; padding:0; }
        .read-more:hover { text-decoration:underline; }

        /* App store chips */
        .store-chip {
          border-radius:8px; display:flex; align-items:center; justify-content:center;
          padding:5px 8px; background:#f8fafc; border:1px solid #e2e8f0;
          transition:background .15s;
        }
        .store-chip:hover { background:#eff6ff; border-color:#93c5fd; }
      `}</style>

            <div className="bd-root flex">



                {/* ══ MAIN ══ */}
                <main className="flex-1 overflow-y-auto" style={{ background: '#f8fafc' }}>
                    <div className="max-w-4xl mx-auto px-5 py-7">

                        {/* Back */}
                        <button className="flex items-center gap-1.5 text-sm font-semibold mb-6 transition-colors hover:text-blue-600"
                            style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back
                        </button>

                        {/* ── TOP: cover + info ── */}
                        <div className="info-card flex gap-7 mb-6 bd-a1">
                            {/* Cover */}
                            <div className="flex-shrink-0 rounded-xl overflow-hidden shadow-lg" style={{ width: 155, height: 220 }}>
                                <Img src={BOOK.cover} alt={BOOK.title} className="w-full h-full object-cover" fallback="#c2410c" />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', lineHeight: 1.25 }}>{BOOK.title}</h1>
                                        <p className="mt-1" style={{ fontSize: 13, color: '#64748b' }}>
                                            By <span style={{ color: '#2563eb', fontWeight: 600 }}>{BOOK.author}</span>
                                            &nbsp;·&nbsp; {BOOK.date}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <Stars count={BOOK.rating} />
                                            <span style={{ fontSize: 12, color: '#94a3b8' }}>({BOOK.reviews})</span>
                                        </div>
                                    </div>
                                    {/* Score ring */}
                                    <div className="score-ring flex-shrink-0" style={{ '--pct': BOOK.score } as React.CSSProperties}>
                                        <div className="score-inner">{BOOK.score}%</div>
                                    </div>
                                </div>

                                {/* Tags */}
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {BOOK.tags.map(t => <span key={t} className="tag-chip">{t}</span>)}
                                </div>

                                {/* Synopsis */}
                                <p className="mt-3 leading-relaxed" style={{ fontSize: 13, color: '#64748b' }}>{BOOK.synopsis}</p>
                                <p className="mt-1" style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>{BOOK.synopsisQuote}</p>

                                {/* Action buttons */}
                                <div className="flex flex-wrap gap-2 mt-4">
                                    <button className={`act-btn ${saved ? 'on' : ''}`} onClick={() => setSaved(s => !s)}>
                                        <svg className="w-3.5 h-3.5" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                        </svg>
                                        Save
                                    </button>
                                    <button className={`act-btn ${hidden ? 'on' : ''}`} onClick={() => setHidden(h => !h)}>
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                        Hide
                                    </button>
                                    <button className={`act-btn ${markRead ? 'on' : ''}`} onClick={() => setMarkRead(m => !m)}>
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Mark Read
                                    </button>
                                    <Link href="/shop" className="shop-btn">
                                        Shop Now
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* ── MIDDLE: sidebar cards + description ── */}
                        <div className="flex gap-5 bd-a2">

                            {/* Left cards */}
                            <div className="flex-shrink-0 flex flex-col gap-4" style={{ width: 196 }}>

                                {/* About Author */}
                                <div className="info-card">
                                    <p className="sec-title">About the Author</p>
                                    <div className="flex items-center gap-2.5 mb-3">
                                        <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 shadow-sm">
                                            <Img src={AUTHOR.avatar} alt={AUTHOR.name} className="w-full h-full object-cover" fallback="#3b82f6" />
                                        </div>
                                        <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{AUTHOR.name}</span>
                                    </div>
                                    <p style={{ fontSize: 11.5, color: '#64748b', lineHeight: 1.65 }}>{AUTHOR.bio}</p>
                                </div>

                                {/* Other Books */}
                                <div className="info-card">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="sec-title" style={{ marginBottom: 0 }}>Other Books</p>
                                        <button className="read-more" style={{ fontSize: 11 }}>View All</button>
                                    </div>
                                    <div className="flex gap-2 flex-wrap">
                                        {OTHER_BOOKS.map((b, i) => (
                                            <div key={i} className="rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform shadow-sm border border-gray-100"
                                                style={{ width: 38, height: 54 }}>
                                                <Img src={b.img} alt={b.title} className="w-full h-full object-cover" fallback={b.color} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Description + writing sample */}
                            <div className="flex-1 min-w-0 info-card">
                                <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.78 }}>
                                    {descExpanded ? BOOK.description : BOOK.description.slice(0, 420) + '…'}
                                </p>
                                <button className="read-more mt-2" onClick={() => setDescExpanded(e => !e)}>
                                    {descExpanded ? 'Read Less' : 'Read More'}
                                </button>

                                <div className="divider" />

                                <p className="sec-title">Writing Sample</p>
                                <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.78 }}>
                                    {sampleExpanded ? BOOK.writingSample + ' ' + BOOK.writingSample : BOOK.writingSample}
                                </p>
                                <button className="read-more mt-2" onClick={() => setSampleExpanded(e => !e)}>
                                    {sampleExpanded ? 'Read Less' : 'Read More'}
                                </button>
                            </div>
                        </div>

                        {/* ── EDITIONS ── */}
                        <div className="mt-6 bd-a3">
                            <div className="grid grid-cols-3 gap-4">
                                {EDITIONS.map((ed, i) => (
                                    <div key={i} className="edition-card">
                                        <div className="rounded-xl overflow-hidden shadow-md" style={{ width: 118, height: 166 }}>
                                            <Img src={ed.img} alt={ed.type} className="w-full h-full object-cover" fallback={ed.color} />
                                        </div>

                                        <div className="w-full flex items-center justify-between">
                                            <div>
                                                <p style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{ed.type}</p>
                                                <p style={{ fontSize: 13, color: '#64748b' }}>{ed.price}</p>
                                            </div>
                                            {ed.stores ? (
                                                <div className="flex gap-1.5">
                                                    <button className="store-chip">
                                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#60A5FA' }}>
                                                            <path d="M3.18 23.76a2 2 0 001.94-.21l11.12-6.42-2.82-2.82-10.24 9.45zm-1.07-20.5a2 2 0 00-.11.74v16a2 2 0 00.11.74l.06.05 8.96-8.96v-.21L2.17 3.21l-.06.05zm14.79 11.47l-2.99-2.99v-.21l2.99-2.99.07.04 3.54 2.01c1.01.57 1.01 1.51 0 2.09l-3.54 2.01-.07.04zm-2.99 1.85l-3.07-3.07L1.18 22.28a2.27 2.27 0 002.59.23l13.14-7.57-.07-.07z" />
                                                        </svg>
                                                    </button>
                                                    <button className="store-chip">
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" style={{ color: '#1e293b' }}>
                                                            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.15-2.19 1.28-2.17 3.83.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.75zM13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ) : (
                                                <Link href="/shop" className="shop-btn" style={{ padding: '7px 16px', fontSize: 12 }}>
                                                    Shop Now
                                                </Link>
                                            )}
                                        </div>

                                        <p style={{ fontSize: 11.5, color: '#94a3b8', lineHeight: 1.6, textAlign: 'center' }}>{ed.desc}</p>
                                        <button className="read-more" style={{ fontSize: 11 }}>View Details</button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ── SIMILAR BOOKS ── */}
                        <div className="mt-8">
                            <p className="sec-title" style={{ fontSize: 15, marginBottom: 16 }}>Similar Books</p>
                            <div className="grid grid-cols-4 gap-4">
                                {SIMILAR.map((b, i) => (
                                    <div key={i} className="sim-card">
                                        <div style={{ height: 155 }}>
                                            <Img src={b.img} alt={b.title} className="w-full h-full object-cover" fallback={b.color} />
                                        </div>
                                        <div className="p-3">
                                            <p style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', lineHeight: 1.3 }}>{b.title}</p>
                                            <p style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{b.author}</p>
                                            <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>{b.date}</p>
                                            <div className="flex items-center gap-1.5 mt-1.5">
                                                <Stars count={b.rating} />
                                                <span style={{ fontSize: 10, color: '#94a3b8' }}>({b.reviews})</span>
                                            </div>
                                            <Link href="/shop" className="shop-btn mt-3 w-full text-center" style={{ padding: '8px 0', fontSize: 11 }}>
                                                Shop Now
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ height: 48 }} />
                    </div>
                </main>
            </div>
        </>
    );
}
