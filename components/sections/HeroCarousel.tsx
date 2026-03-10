'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { HeroSlide } from '@/lib/api/contracts/home';

interface HeroSlideViewModel {
  id: string;
  tag: string;
  title: string;
  ctaLabel: string;
  ctaHref: string;
  imageUrl: string;
  backgroundFrom: string;
  backgroundTo: string;
}

const COLOR_TOKEN_MAP: Record<string, string> = {
  'amber-50': '#fffbeb',
  'orange-100': '#ffedd5',
  'blue-50': '#eff6ff',
  'indigo-100': '#e0e7ff',
  'green-50': '#f0fdf4',
  'emerald-100': '#d1fae5',
  'purple-50': '#faf5ff',
  'fuchsia-100': '#fae8ff',
  'rose-50': '#fff1f2',
  'pink-100': '#fce7f3',
};

const FALLBACK_GRADIENT_FROM = '#eff6ff';
const FALLBACK_GRADIENT_TO = '#e0e7ff';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || '';
const BACKEND_ORIGIN = (() => {
  try {
    return API_BASE_URL ? new URL(API_BASE_URL).origin : 'http://127.0.0.1:8000';
  } catch {
    return 'http://127.0.0.1:8000';
  }
})();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getListPayload(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (isRecord(payload) && Array.isArray(payload.data)) return payload.data;
  return [];
}

function toNonEmptyString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function resolveGradientColor(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  const normalized = value.trim().replace(/^(from-|to-)/, '');

  if (!normalized) return fallback;
  if (normalized.startsWith('#')) return normalized;
  if (normalized.startsWith('rgb(') || normalized.startsWith('rgba(')) return normalized;
  if (normalized.startsWith('hsl(') || normalized.startsWith('hsla(')) return normalized;
  if (normalized.startsWith('var(')) return normalized;

  return COLOR_TOKEN_MAP[normalized] || fallback;
}

function resolveImageSrc(image: string): string {
  const trimmed = image.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }
  return trimmed.startsWith('/') ? `${BACKEND_ORIGIN}${trimmed}` : `${BACKEND_ORIGIN}/${trimmed}`;
}

function mapHeroSlides(payload: unknown): HeroSlideViewModel[] {
  const rawSlides = getListPayload(payload);

  return rawSlides
    .map((item) => {
      if (!isRecord(item)) return null;

      const raw = item as unknown as HeroSlide;
      const id = toNonEmptyString(raw.id);
      const title = toNonEmptyString(raw.title);
      const imageUrl = resolveImageSrc(toNonEmptyString(raw.imageUrl));

      if (!id || !title || !imageUrl) return null;

      return {
        id,
        title,
        imageUrl,
        tag: toNonEmptyString(raw.tag),
        ctaLabel: toNonEmptyString(raw.ctaLabel),
        ctaHref: toNonEmptyString(raw.ctaHref),
        backgroundFrom: resolveGradientColor(raw.backgroundFrom, FALLBACK_GRADIENT_FROM),
        backgroundTo: resolveGradientColor(raw.backgroundTo, FALLBACK_GRADIENT_TO),
      };
    })
    .filter((slide): slide is HeroSlideViewModel => slide !== null);
}

function mapTrendingSearches(payload: unknown): string[] {
  const rawItems = getListPayload(payload);

  return rawItems
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);
}

async function readJsonOrEmpty(response: Response, fallback: unknown): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return fallback;
  }
}

export default function HeroCarousel() {
  const [slides, setSlides] = useState<HeroSlideViewModel[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadHomeHero = async () => {
      setLoading(true);
      setLoadError(null);

      try {
        const [slidesResponse, trendingResponse] = await Promise.all([
          fetch('/api/home/hero-slides', { cache: 'no-store' }),
          fetch('/api/search/trending', { cache: 'no-store' }),
        ]);

        if (!slidesResponse.ok && slidesResponse.status !== 404) {
          throw new Error(`Failed to load hero slides (${slidesResponse.status}).`);
        }

        if (!trendingResponse.ok && trendingResponse.status !== 404) {
          throw new Error(`Failed to load trending searches (${trendingResponse.status}).`);
        }

        const [slidesPayload, trendingPayload] = await Promise.all([
          slidesResponse.status === 404 ? Promise.resolve([]) : readJsonOrEmpty(slidesResponse, []),
          trendingResponse.status === 404 ? Promise.resolve([]) : readJsonOrEmpty(trendingResponse, []),
        ]);

        if (cancelled) return;

        setSlides(mapHeroSlides(slidesPayload));
        setTrendingSearches(mapTrendingSearches(trendingPayload));
      } catch (error) {
        if (cancelled) return;
        setSlides([]);
        setTrendingSearches([]);
        setLoadError(error instanceof Error ? error.message : 'Failed to load hero content.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadHomeHero();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (slides.length === 0) return;
    if (active < slides.length) return;
    setActive(0);
  }, [active, slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;

    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides.length]);

  const currentSlide = slides[active] ?? null;
  const heroBackgroundStyle = currentSlide
    ? { backgroundImage: `linear-gradient(135deg, ${currentSlide.backgroundFrom}, ${currentSlide.backgroundTo})` }
    : { backgroundImage: `linear-gradient(135deg, ${FALLBACK_GRADIENT_FROM}, ${FALLBACK_GRADIENT_TO})` };

  return (
    <section className="w-full bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch">
          {/* Main hero */}
          <div
            className="flex-1 relative rounded-xl overflow-hidden min-h-[200px] sm:min-h-[260px] md:min-h-[320px] transition-colors duration-500"
            style={heroBackgroundStyle}
          >

            {/* Banner Images (crossfade) */}
            {slides.map((slide, i) => (
              <img
                key={slide.id}
                src={slide.imageUrl}
                alt={`Banner ${i + 1}`}
                className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700 ease-in-out ${active === i ? 'opacity-50' : 'opacity-0'}`}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><rect width="100%" height="100%" fill="transparent"/></svg>';
                }}
              />
            ))}

            <div className="relative z-10 p-6 sm:p-8 md:p-10 h-full flex flex-col justify-end">
              {currentSlide ? (
                <>
                  {currentSlide.tag && (
                    <span className="inline-block bg-brand-500 text-white text-[10px] sm:text-xs font-bold px-3 py-1 rounded mb-3 w-fit tracking-wider transition-all duration-300">
                      {currentSlide.tag}
                    </span>
                  )}
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight drop-shadow-md mb-4 whitespace-pre-line transition-all duration-300">
                    {currentSlide.title}
                  </h1>
                  {currentSlide.ctaLabel && currentSlide.ctaHref && (
                    <Link
                      href={currentSlide.ctaHref}
                      className="inline-block bg-white text-gray-800 text-sm font-bold px-5 py-2.5 rounded-full hover:bg-brand-500 hover:text-white transition-all shadow-sm w-fit active:scale-[0.98]"
                    >
                      {currentSlide.ctaLabel}
                    </Link>
                  )}
                </>
              ) : (
                <p className="text-sm text-white/90 font-semibold">
                  {loading ? 'Loading hero content...' : 'No hero slides available.'}
                </p>
              )}
            </div>
            {/* Dots */}
            {slides.length > 1 && (
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {slides.map((slide, i) => (
                  <button
                    key={slide.id}
                    onClick={() => setActive(i)}
                    className={`h-2 rounded-full transition-all duration-300 ${active === i ? 'w-5 bg-brand-500' : 'w-2 bg-white/60 hover:bg-white'}`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Side panel - hidden on mobile/tablet */}
          <div className="hidden lg:flex w-56 flex-col gap-3">
            <Link href="/shop" className="rounded-xl bg-white shadow-sm p-3 flex items-center gap-3 hover:shadow-md transition cursor-pointer border border-gray-100 block">
              <div className="w-14 aspect-[2/3] bg-red-100 rounded flex-shrink-0 overflow-hidden">
                <img
                  src="/images/books/book1.jpg"
                  className="w-full h-full object-cover"
                  alt="Most Read Book"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
              <div>
                <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded font-bold tracking-wider">RECOMMENDED</span>
                <p className="text-xs text-gray-800 mt-1 font-bold leading-tight">Most Read Books</p>
              </div>
            </Link>
            <div className="rounded-xl bg-amber-50 p-3 flex-1 flex flex-col justify-between hover:shadow-md transition cursor-pointer border border-amber-100/50">
              <p className="text-xs font-bold text-gray-800">Shop Bangladeshi Stories</p>
              <div className="grid grid-cols-2 gap-1.5 my-2">
                {[2, 3, 4, 5].map(i => (
                  <div key={i} className="aspect-[2/3] bg-white rounded-md shadow-sm overflow-hidden mix-blend-multiply">
                    <img
                      src={`/images/books/book${i}.jpg`}
                      className="w-full h-full object-cover"
                      alt={`Story ${i}`}
                      onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }}
                    />
                  </div>
                ))}
              </div>
              <Link
                href="/shop"
                className="block w-full text-xs bg-brand-500 text-white font-bold py-2 rounded-lg hover:bg-brand-600 transition shadow-sm text-center"
              >
                Shop Now
              </Link>
            </div>
          </div>
        </div>

        {/* Most searched bar */}
        <div className="mt-5">
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest text-center mb-3">Most Searched</p>
          <div className="flex gap-2 overflow-x-auto pb-2 justify-center flex-wrap scrollbar-hide">
            {trendingSearches.map((tag, i) => (
              <button key={i} className="text-xs px-4 py-1.5 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-brand-500 hover:text-brand-600 font-medium whitespace-nowrap transition-colors shadow-sm">
                {tag}
              </button>
            ))}
            {!loading && trendingSearches.length === 0 && (
              <p className="text-xs text-gray-400">No trending searches available.</p>
            )}
          </div>
        </div>

        {loadError && (
          <p className="mt-3 text-xs text-amber-600 text-center">
            {loadError}
          </p>
        )}
      </div>
    </section>
  );
}
