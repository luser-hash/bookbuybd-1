'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApiError, booksService, type BookAuthor, type BookDetailResponse } from '@/lib/api';
import { addItemToStoredCart } from './cartStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || '';
const BACKEND_ORIGIN = (() => {
  try {
    return API_BASE_URL ? new URL(API_BASE_URL).origin : 'http://127.0.0.1:8000';
  } catch {
    return 'http://127.0.0.1:8000';
  }
})();

function resolveMediaSrc(path?: string | null): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:') || path.startsWith('blob:')) {
    return path;
  }

  return path.startsWith('/') ? `${BACKEND_ORIGIN}${path}` : `${BACKEND_ORIGIN}/${path}`;
}

function formatPrice(price: string): string {
  const numeric = Number(price);
  if (Number.isFinite(numeric)) return `TK ${numeric.toFixed(2)}`;
  return `TK ${price}`;
}

function Img({
  src,
  alt = '',
  className = '',
  fallback = '#e2e8f0',
  style = {},
}: {
  src: string;
  alt?: string;
  className?: string;
  fallback?: string;
  style?: CSSProperties;
}) {
  const [errored, setErrored] = useState(false);
  if (!src || errored) return <div className={className} style={{ ...style, background: fallback }} />;
  return <img src={src} alt={alt} className={className} style={style} onError={() => setErrored(true)} />;
}

function Stars({ count, total = 5 }: { count: number; total?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: total }).map((_, i) => (
        <svg key={i} className={`w-3.5 h-3.5 ${i < count ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function DetailState({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="max-w-4xl mx-auto px-5 py-16">
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <Link href="/shop" className="mt-5 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          Browse Books
        </Link>
      </div>
    </div>
  );
}

export default function BookDetails() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = useMemo(() => searchParams.get('slug')?.trim() ?? '', [searchParams]);

  const [book, setBook] = useState<BookDetailResponse | null>(null);
  const [author, setAuthor] = useState<BookAuthor | null>(null);
  const [authorLoading, setAuthorLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!slug) {
      setBook(null);
      setErrorMessage(null);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    const loadBook = async () => {
      setLoading(true);
      setErrorMessage(null);
      setBook(null);
      setAuthor(null);
      setAuthorLoading(false);

      try {
        const payload = await booksService.getBySlug(slug);
        if (!cancelled) {
          setBook(payload);
        }
      } catch (error) {
        if (cancelled) return;

        if (error instanceof ApiError) {
          setErrorMessage(error.message || 'Failed to load book details.');
        } else {
          setErrorMessage('Failed to load book details.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadBook();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const authorSlug = book?.author?.slug?.trim() ?? '';

  useEffect(() => {
    let cancelled = false;

    if (!book) {
      setAuthor(null);
      setAuthorLoading(false);
      return () => {
        cancelled = true;
      };
    }

    if (!authorSlug) {
      setAuthor(book.author ?? null);
      setAuthorLoading(false);
      return () => {
        cancelled = true;
      };
    }

    const loadAuthor = async () => {
      setAuthorLoading(true);
      try {
        const payload = await booksService.getAuthorBySlug(authorSlug);
        if (!cancelled) {
          setAuthor(payload);
        }
      } catch {
        if (!cancelled) {
          setAuthor(book.author ?? null);
        }
      } finally {
        if (!cancelled) {
          setAuthorLoading(false);
        }
      }
    };

    void loadAuthor();

    return () => {
      cancelled = true;
    };
  }, [authorSlug, book]);

  if (!slug) {
    return (
      <div className="bd-root min-h-screen bg-slate-50">
        <DetailState title="Book slug is missing" message="Open a book from the listing so this page can fetch GET /api/books/<slug>/." />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bd-root min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-5 py-12 animate-pulse">
          <div className="h-4 w-20 rounded bg-slate-200" />
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex gap-6">
              <div className="h-56 w-40 rounded-xl bg-slate-200" />
              <div className="flex-1 space-y-3">
                <div className="h-6 w-4/5 rounded bg-slate-200" />
                <div className="h-4 w-2/5 rounded bg-slate-200" />
                <div className="h-4 w-1/3 rounded bg-slate-200" />
                <div className="h-20 w-full rounded bg-slate-100" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    const isNotFound = errorMessage.toLowerCase().includes('no book matches') || errorMessage.toLowerCase().includes('not found');
    return (
      <div className="bd-root min-h-screen bg-slate-50">
        <DetailState
          title={isNotFound ? 'Book not found' : 'Failed to load book'}
          message={errorMessage}
        />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="bd-root min-h-screen bg-slate-50">
        <DetailState title="Book data unavailable" message="No data returned from GET /api/books/<slug>/." />
      </div>
    );
  }

  const resolvedAuthor = author ?? book.author;
  const authorName = resolvedAuthor?.name || 'Unknown Author';
  const coverSrc = resolveMediaSrc(book.image);
  const authorPhoto = resolveMediaSrc(resolvedAuthor?.photo || '');
  const categoryName = book.category?.name || 'Uncategorized';
  const shortDescription = book.description?.slice(0, 320);
  const hasLongDescription = (book.description?.length || 0) > 320;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@400;500;600;700&display=swap');

        .bd-root { font-family:'DM Sans',sans-serif; }
        .bd-root h1,.bd-root h2,.bd-root h3 { font-family:'Lora',serif; }

        @keyframes bdUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .bd-a1 { animation: bdUp .45s cubic-bezier(.22,1,.36,1) both; }
        .bd-a2 { animation: bdUp .45s .10s cubic-bezier(.22,1,.36,1) both; }

        .tag-chip {
          font-size:11px; font-weight:700;
          padding:4px 11px; border-radius:20px;
          background:#eff6ff; color:#1d4ed8;
          border:1px solid #bfdbfe;
        }

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

        .shop-btn {
          background: linear-gradient(135deg,#3b82f6 0%,#2563eb 100%);
          color:#fff; font-size:13px; font-weight:700;
          padding:9px 22px; border-radius:10px; border:none;
          cursor:pointer; box-shadow:0 4px 14px rgba(37,99,235,0.35);
          transition:opacity .2s, transform .15s;
        }
        .shop-btn:hover  { opacity:.92; transform:translateY(-1px); }
        .shop-btn:active { transform:scale(.97); }

        .info-card {
          background:#fff; border:1px solid #e2e8f0;
          border-radius:16px; padding:16px;
          box-shadow:0 1px 4px rgba(0,0,0,0.05);
        }

        .read-more { font-size:12px; font-weight:700; color:#2563eb; cursor:pointer; background:none; border:none; padding:0; }
        .read-more:hover { text-decoration:underline; }
      `}</style>

      <div className="bd-root min-h-screen bg-slate-50">
        <main className="mx-auto max-w-4xl px-5 py-7">
          <button
            className="mb-6 flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-blue-600"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={() => {
              window.history.back();
            }}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <div className="info-card bd-a1 mb-6 flex gap-7">
            <div className="flex-shrink-0 overflow-hidden rounded-xl shadow-lg" style={{ width: 155, height: 220 }}>
              <Img src={coverSrc} alt={book.title} className="h-full w-full object-cover" fallback="#1d4ed8" />
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-[22px] font-bold leading-tight text-slate-900">{book.title}</h1>
              <p className="mt-1 text-[13px] text-slate-500">
                By <span className="font-semibold text-blue-600">{authorName}</span>
              </p>

              <div className="mt-2 flex items-center gap-2">
                <Stars count={book.is_in_stock ? 5 : 3} />
                <span className="text-xs text-slate-400">Stock: {book.stock_quantity}</span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="tag-chip">{categoryName}</span>
                <span className="tag-chip">{book.is_in_stock ? 'In Stock' : 'Out of Stock'}</span>
                {book.is_coming_soon && <span className="tag-chip">Coming Soon</span>}
                {!book.is_active && <span className="tag-chip">Inactive</span>}
              </div>

              <p className="mt-4 text-[14px] font-bold text-slate-900">{formatPrice(book.price)}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    const parsedPrice = Number(book.price);
                    const safePrice = Number.isFinite(parsedPrice) && parsedPrice >= 0 ? parsedPrice : 0;

                    addItemToStoredCart({
                      id: book.id,
                      title: book.title,
                      author: authorName,
                      cover: coverSrc,
                      coverFallback: '#1d4ed8',
                      price: safePrice,
                      qty: 1,
                      edition: categoryName,
                    });

                    setAdded(true);
                    setTimeout(() => setAdded(false), 2000);
                    router.push('/shop');
                  }}
                  className="shop-btn"
                  style={added ? { background: '#10b981', boxShadow: '0 4px 14px rgba(16,185,129,0.35)' } : {}}
                >
                  {added ? 'Added to Cart' : 'Add to Cart'}
                </button>
                <span className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
                  Stock: {book.stock_quantity}
                </span>

                <Link href="/shop" className="flex h-[40px] items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 text-sm font-bold text-gray-700 shadow-sm transition hover:border-brand-500 hover:text-brand-600">
                  Shop Now
                </Link>
              </div>
            </div>
          </div>

          <div className="bd-a2 flex gap-5">
            <div className="w-52 flex-shrink-0">
              <div className="info-card">
                <p className="mb-3 text-sm font-bold text-slate-900">About the Author</p>
                <div className="mb-3 flex items-center gap-2.5">
                  <div className="h-10 w-10 overflow-hidden rounded-full shadow-sm">
                    <Img src={authorPhoto} alt={authorName} className="h-full w-full object-cover" fallback="#3b82f6" />
                  </div>
                  <span className="text-[13px] font-semibold text-slate-800">{authorName}</span>
                </div>
                <p className="text-[12px] leading-relaxed text-slate-600">
                  {resolvedAuthor?.bio?.trim() || 'No author bio available.'}
                </p>
                {authorLoading && <p className="mt-2 text-[11px] text-slate-400">Refreshing author details...</p>}
              </div>
            </div>

            <div className="info-card min-w-0 flex-1">
              <p className="text-[13px] leading-7 text-slate-600">
                {descExpanded ? (book.description || 'No description available.') : (shortDescription || 'No description available.')}
                {hasLongDescription && !descExpanded ? '…' : ''}
              </p>
              {hasLongDescription && (
                <button className="read-more mt-2" onClick={() => setDescExpanded((prev) => !prev)}>
                  {descExpanded ? 'Read Less' : 'Read More'}
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
