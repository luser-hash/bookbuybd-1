'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { ApiError, booksService, type BestSellingBook } from '@/lib/api';

const BESTSELLER_LIMIT = 10;
const MAIN_COLUMN_COUNT = 6;
const SIDE_COLUMN_COUNT = 4;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || '';
const BACKEND_ORIGIN = (() => {
  try {
    return API_BASE_URL ? new URL(API_BASE_URL).origin : 'http://127.0.0.1:8000';
  } catch {
    return 'http://127.0.0.1:8000';
  }
})();

function formatPrice(price: string): string {
  const value = Number(price);
  if (Number.isFinite(value)) {
    return `TK ${value.toFixed(2)}`;
  }
  return `TK ${price}`;
}

function resolveImageSrc(image: string): string | null {
  if (!image) return null;
  if (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('data:') || image.startsWith('blob:')) {
    return image;
  }

  return image.startsWith('/')
    ? `${BACKEND_ORIGIN}${image}`
    : `${BACKEND_ORIGIN}/${image}`;
}

interface ComingSoonBookItem {
  id: number | string;
  slug: string;
  title: string;
  author: string;
  image: string;
  price: string;
  expectedDate?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toText(value: unknown): string {
  return typeof value === 'string' ? value : typeof value === 'number' ? String(value) : '';
}

function normalizeComingSoonBook(value: unknown): ComingSoonBookItem | null {
  if (!isRecord(value)) return null;

  const id = value.id;
  if (typeof id !== 'number' && typeof id !== 'string') return null;

  const title = toText(value.title);
  if (!title) return null;

  const slug = toText(value.slug) || String(id);
  const author = toText(value.author) || 'Unknown Author';
  const image = toText(value.image ?? value.cover_image ?? value.coverImage);
  const rawPrice = value.price;
  const price = typeof rawPrice === 'number' ? rawPrice.toFixed(2) : toText(rawPrice) || '0.00';
  const expectedDate =
    toText(
      value.expected_release_date ??
      value.expectedDate ??
      value.release_date ??
      value.publish_date
    ) || undefined;

  return {
    id,
    slug,
    title,
    author,
    image,
    price,
    expectedDate,
  };
}

function extractComingSoonBooks(payload: unknown): ComingSoonBookItem[] {
  let items: unknown[] = [];

  if (Array.isArray(payload)) {
    items = payload;
  } else if (isRecord(payload)) {
    if (Array.isArray(payload.results)) {
      items = payload.results;
    } else if (Array.isArray(payload.items)) {
      items = payload.items;
    } else if (Array.isArray(payload.data)) {
      items = payload.data;
    }
  }

  return items
    .map(normalizeComingSoonBook)
    .filter((book): book is ComingSoonBookItem => book !== null);
}

function BookImage({ image, title }: { image: string; title: string }) {
  const [hasError, setHasError] = useState(false);
  const src = resolveImageSrc(image);

  if (hasError || !src) {
    return (
      <div className="w-full h-full bg-gray-200 flex items-center justify-center p-2">
        <span className="text-[10px] font-semibold text-gray-600 text-center leading-tight line-clamp-3">
          {title}
        </span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={title}
      fill
      sizes="(max-width: 640px) 80px, 96px"
      className="w-full h-full object-cover"
      onError={() => setHasError(true)}
      unoptimized
    />
  );
}

function BookCard({ book, isTopSeller }: { book: BestSellingBook; isTopSeller: boolean }) {
  return (
    <Link href={`/book?slug=${book.slug}`} className="flex gap-3 group cursor-pointer block">
      <div className="w-20 sm:w-24 aspect-[2/3] flex-shrink-0 rounded-md shadow-md overflow-hidden bg-gray-100 relative">
        <BookImage image={book.image} title={book.title} />
        {isTopSeller && (
          <span className="absolute top-0 left-0 text-[8px] bg-brand-500 text-white px-1 font-bold leading-tight">
            TOP SELLER
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-gray-400 uppercase">{book.author}</p>
        <p className="text-xs font-semibold text-gray-800 leading-tight group-hover:text-brand-600 transition line-clamp-2">{book.title}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">{book.category_name}</p>
        <div className="mt-2">
          <span className="text-sm font-bold text-gray-900">{formatPrice(book.price)}</span>
          <p className="text-[10px] text-gray-400 mt-0.5">{book.total_sold} sold</p>
        </div>
      </div>
    </Link>
  );
}

function SideBookCard({ book }: { book: ComingSoonBookItem }) {
  return (
    <Link href={`/book?slug=${book.slug}`} className="flex gap-3 group cursor-pointer block">
      <div className="w-20 sm:w-24 aspect-[2/3] flex-shrink-0 rounded-md shadow-md overflow-hidden bg-gray-100 relative">
        <BookImage image={book.image} title={book.title} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-gray-400 uppercase">{book.author}</p>
        <p className="text-xs font-semibold text-gray-800 leading-tight group-hover:text-brand-600 transition line-clamp-2">
          {book.title}
        </p>
        <div className="mt-1">
          <span className="text-sm font-bold text-brand-600">{formatPrice(book.price)}</span>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {book.expectedDate ? `Expected: ${book.expectedDate}` : 'Coming soon'}
          </p>
        </div>
      </div>
    </Link>
  );
}

function LoadingCard({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex gap-3 animate-pulse">
      <div className="w-20 sm:w-24 aspect-[2/3] rounded-md bg-gray-200 flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-2 w-20 bg-gray-200 rounded" />
        <div className="h-3 w-4/5 bg-gray-200 rounded" />
        {!compact && <div className="h-3 w-3/5 bg-gray-200 rounded" />}
      </div>
    </div>
  );
}

export default function BooksGrid() {
  const [books, setBooks] = useState<BestSellingBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comingSoonBooks, setComingSoonBooks] = useState<ComingSoonBookItem[]>([]);
  const [comingSoonLoading, setComingSoonLoading] = useState(true);
  const [comingSoonError, setComingSoonError] = useState<string | null>(null);

  const loadBestsellers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await booksService.getBestSelling({ limit: BESTSELLER_LIMIT });
      setBooks(response);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load bestsellers.';
      setError(message);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadComingSoon = useCallback(async () => {
    setComingSoonLoading(true);
    setComingSoonError(null);

    try {
      const response = await booksService.getComingSoon({ limit: SIDE_COLUMN_COUNT });
      setComingSoonBooks(extractComingSoonBooks(response));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load coming soon books.';
      setComingSoonError(message);
      setComingSoonBooks([]);
    } finally {
      setComingSoonLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBestsellers();
    void loadComingSoon();
  }, [loadBestsellers, loadComingSoon]);

  const mainBooks = books.slice(0, MAIN_COLUMN_COUNT);
  const sideBooks = comingSoonBooks.slice(0, SIDE_COLUMN_COUNT);

  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 leading-tight">Bestsellers</h2>
              <p className="text-sm text-gray-500 mt-1">Our most popular books right now</p>
            </div>
            <Link href="/shop" className="hidden sm:inline-flex text-sm font-bold text-brand-600 hover:text-brand-700 items-center gap-1">
              View All
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: MAIN_COLUMN_COUNT }).map((_, index) => (
                <LoadingCard key={`main-loading-${index}`} />
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="rounded-lg border border-red-100 bg-red-50 p-4">
              <p className="text-sm text-red-700">{error}</p>
              <button
                type="button"
                onClick={() => {
                  void loadBestsellers();
                }}
                className="mt-2 text-xs font-semibold text-red-700 hover:underline"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && mainBooks.length === 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-sm text-gray-600">No bestselling books are available right now.</p>
            </div>
          )}

          {!loading && !error && mainBooks.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {mainBooks.map((book, index) => (
                <BookCard key={book.id} book={book} isTopSeller={index === 0} />
              ))}
            </div>
          )}

          <Link href="/shop" className="mt-4 inline-block text-xs text-brand-600 font-semibold hover:underline">
            VIEW MORE
          </Link>
        </div>

        <div className="hidden lg:block w-px bg-gray-100" />

        <div className="w-full lg:w-72 lg:flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Coming Soon</h2>
            <div className="flex gap-1">
              <button
                type="button"
                className="w-6 h-6 border border-gray-200 rounded-full flex items-center justify-center text-gray-400"
                aria-label="Previous"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                className="w-6 h-6 border border-gray-200 rounded-full flex items-center justify-center text-gray-400"
                aria-label="Next"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {comingSoonLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              {Array.from({ length: SIDE_COLUMN_COUNT }).map((_, index) => (
                <LoadingCard key={`side-loading-${index}`} compact />
              ))}
            </div>
          )}

          {!comingSoonLoading && !comingSoonError && sideBooks.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              {sideBooks.map((book, index) => (
                <SideBookCard key={`${book.id}-side-${index}`} book={book} />
              ))}
            </div>
          )}

          {!comingSoonLoading && comingSoonError && (
            <div className="rounded-lg border border-red-100 bg-red-50 p-4">
              <p className="text-sm text-red-700">{comingSoonError}</p>
              <button
                type="button"
                onClick={() => {
                  void loadComingSoon();
                }}
                className="mt-2 text-xs font-semibold text-red-700 hover:underline"
              >
                Retry
              </button>
            </div>
          )}

          {!comingSoonLoading && !comingSoonError && sideBooks.length === 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-sm text-gray-600">No books to show in this panel.</p>
            </div>
          )}

          <Link href="/shop" className="mt-4 inline-block text-xs text-brand-600 font-semibold hover:underline">
            VIEW MORE
          </Link>
        </div>
      </div>
    </section>
  );
}
