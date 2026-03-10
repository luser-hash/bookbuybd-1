'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ApiError, booksService } from '@/lib/api';

interface GenreOption {
  name: string;
  slug: string;
}

const DEFAULT_GENRE_OPTIONS: GenreOption[] = [
  { name: 'All Genres', slug: '' },
];

const GENRE_META: Record<string, { description: string; color: string; accent: string }> = {
  'All Genres': { description: 'Explore our full collection across all genres.', color: '#1e40af', accent: '#dbeafe' },
  'Business': { description: 'Master strategy, finance and entrepreneurship.', color: '#065f46', accent: '#d1fae5' },
  'Science': { description: 'Discover the universe — from quantum physics to biology.', color: '#1e3a5f', accent: '#e0f2fe' },
  'Fiction': { description: 'Lose yourself in captivating stories and unforgettable characters.', color: '#7c2d12', accent: '#ffedd5' },
  'Philosophy': { description: 'Question everything with the greatest thinkers of all time.', color: '#4c1d95', accent: '#ede9fe' },
  'Biography': { description: 'Real lives, real lessons — stories of people who shaped the world.', color: '#831843', accent: '#fce7f3' },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function slugifyCategory(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function extractGenreOptions(payload: unknown): GenreOption[] {
  let list: unknown[] = [];

  if (Array.isArray(payload)) {
    list = payload;
  } else if (isRecord(payload)) {
    if (Array.isArray(payload.results)) {
      list = payload.results;
    } else if (Array.isArray(payload.items)) {
      list = payload.items;
    } else if (Array.isArray(payload.data)) {
      list = payload.data;
    }
  }

  const options = list
    .map((item) => {
      if (typeof item === 'string') {
        const name = item.trim();
        if (!name) return null;
        return { name, slug: slugifyCategory(name) };
      }
      if (isRecord(item)) {
        const nameCandidate = typeof item.name === 'string'
          ? item.name
          : typeof item.title === 'string'
            ? item.title
            : '';
        const name = nameCandidate.trim();
        if (!name) return null;
        const slugCandidate = typeof item.slug === 'string' ? item.slug : slugifyCategory(name);
        const slug = slugCandidate.trim();
        return { name, slug };
      }
      return null;
    })
    .filter((option): option is GenreOption => option !== null);

  const unique = new Map<string, GenreOption>();
  options.forEach((option) => {
    if (!unique.has(option.slug)) {
      unique.set(option.slug, option);
    }
  });

  return Array.from(unique.values());
}

/* ══════════════════════════════════════
   HELPERS
══════════════════════════════════════ */
interface Book {
  id: number;
  slug: string;
  title: string;
  author: string;
  genre: string;
  rating: number;
  reviews: number;
  likes: number;
  excerpt: string;
  img: string;
  imgFallbackColor: string;
  likedBy: string;
  likedByImg: string[];
}

interface SidebarAuthor {
  name: string;
  initials: string;
  color: string;
  src: string;
}

interface SidebarBook {
  title: string;
  author: string;
  img: string;
}

type AuthorLookup = Record<number, string>;

const AUTHOR_COLORS = ['#0d9488', '#2563eb', '#7c3aed', '#b45309', '#be185d', '#047857'];
const BOOK_FALLBACK_COLORS = ['#e11d48', '#0284c7', '#7c3aed', '#1e293b', '#374151', '#b45309', '#6b7280', '#0d9488'];
const BOOK_FALLBACK_LIKED_BY = ['/images/avatars/av1.jpg', '/images/avatars/av2.jpg'];
const SIDEBAR_BOOKS_OF_YEAR_LIMIT = 5;

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function formatAuthorLabel(value: string): string {
  const author = value.trim();
  if (!author) return 'by Unknown Author';
  return author.toLowerCase().startsWith('by ') ? author : `by ${author}`;
}

function asTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function toInteger(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (!/^\d+$/.test(trimmed)) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
  }
  return null;
}

function getExplicitAuthorName(item: Record<string, unknown>): string {
  const authorObject = isRecord(item.author) ? item.author : null;
  const authorDetail = isRecord(item.author_detail) ? item.author_detail : null;
  const authorDetails = isRecord(item.author_details) ? item.author_details : null;
  const userObject = isRecord(item.user) ? item.user : null;

  return (
    asTrimmedString(item.author_name) ||
    asTrimmedString(item.authorName) ||
    asTrimmedString(item.writer_name) ||
    asTrimmedString(item.writerName) ||
    (authorObject ? asTrimmedString(authorObject.name) || asTrimmedString(authorObject.full_name) : '') ||
    (authorDetail ? asTrimmedString(authorDetail.name) || asTrimmedString(authorDetail.full_name) : '') ||
    (authorDetails ? asTrimmedString(authorDetails.name) || asTrimmedString(authorDetails.full_name) : '') ||
    (userObject ? asTrimmedString(userObject.name) : '')
  );
}

function resolveAuthorName(item: Record<string, unknown>, authorLookup: AuthorLookup = {}): string {
  const explicitName = getExplicitAuthorName(item);
  if (explicitName) return explicitName;

  const authorIdFromAuthor = toInteger(item.author);
  if (authorIdFromAuthor !== null && authorLookup[authorIdFromAuthor]) {
    return authorLookup[authorIdFromAuthor];
  }

  const authorIdFromField = toInteger(item.author_id);
  if (authorIdFromField !== null && authorLookup[authorIdFromField]) {
    return authorLookup[authorIdFromField];
  }

  const authorRaw = asTrimmedString(item.author);
  if (authorRaw && toInteger(authorRaw) === null) {
    return authorRaw;
  }

  return '';
}

function extractAuthorLookupFromPayload(payload: unknown): AuthorLookup {
  const lookup: AuthorLookup = {};
  const list = extractBookListFromPayload(payload);

  list.forEach((entry) => {
    if (!isRecord(entry)) return;

    const authorObject = isRecord(entry.author) ? entry.author : null;
    const authorId =
      (authorObject ? toInteger(authorObject.id) : null) ??
      toInteger(entry.author_id) ??
      toInteger(entry.author);

    if (authorId === null) return;

    const explicitName = getExplicitAuthorName(entry);
    if (explicitName) {
      lookup[authorId] = explicitName;
    }
  });

  return lookup;
}

function mergeAuthorLookups(base: AuthorLookup, incoming: AuthorLookup): AuthorLookup {
  const entries = Object.entries(incoming);
  if (entries.length === 0) return base;

  let changed = false;
  const next: AuthorLookup = { ...base };

  entries.forEach(([idKey, name]) => {
    const id = Number(idKey);
    if (!Number.isFinite(id)) return;
    if (!name || next[id] === name) return;
    next[id] = name;
    changed = true;
  });

  return changed ? next : base;
}

function extractAuthorsFromPayload(payload: unknown): SidebarAuthor[] {
  let list = extractBookListFromPayload(payload);

  if (list.length === 0 && isRecord(payload)) {
    if (isRecord(payload.author)) {
      list = [payload.author];
    } else if (
      typeof payload.name === 'string' ||
      typeof payload.author_name === 'string' ||
      typeof payload.author === 'string'
    ) {
      list = [payload];
    }
  }

  return list
    .map((item, index) => {
      if (typeof item === 'string') {
        const name = item.trim();
        if (!name) return null;
        return {
          name,
          initials: getInitials(name),
          color: AUTHOR_COLORS[index % AUTHOR_COLORS.length],
          src: '',
        };
      }

      if (!isRecord(item)) return null;

      const name =
        typeof item.name === 'string'
          ? item.name
          : typeof item.author_name === 'string'
            ? item.author_name
            : typeof item.author === 'string'
              ? item.author
              : isRecord(item.user) && typeof item.user.name === 'string'
                ? item.user.name
                : '';

      if (!name.trim()) return null;

      const src =
        typeof item.image === 'string'
          ? item.image
          : typeof item.avatar === 'string'
            ? item.avatar
            : typeof item.photo === 'string'
              ? item.photo
              : typeof item.profile_image === 'string'
                ? item.profile_image
                : isRecord(item.author) && typeof item.author.image === 'string'
                  ? item.author.image
                : '';

      return {
        name,
        initials: getInitials(name),
        color: AUTHOR_COLORS[index % AUTHOR_COLORS.length],
        src,
      };
    })
    .filter((author): author is SidebarAuthor => author !== null);
}

function extractBooksOfYearFromPayload(payload: unknown, authorLookup: AuthorLookup = {}): SidebarBook[] {
  let list = extractBookListFromPayload(payload);

  if (list.length === 0 && isRecord(payload)) {
    if (Array.isArray(payload.books)) {
      list = payload.books;
    } else if (isRecord(payload.book)) {
      list = [payload.book];
    } else if (typeof payload.title === 'string') {
      list = [payload];
    }
  }

  return list
    .map((item) => {
      if (!isRecord(item)) return null;

      const title =
        typeof item.title === 'string'
          ? item.title.trim()
          : typeof item.name === 'string'
            ? item.name.trim()
            : '';
      if (!title) return null;

      const authorRaw = resolveAuthorName(item, authorLookup);

      const image =
        typeof item.image === 'string'
          ? item.image
          : typeof item.cover_image === 'string'
            ? item.cover_image
            : typeof item.coverImage === 'string'
              ? item.coverImage
              : '';

      return {
        title,
        author: formatAuthorLabel(authorRaw),
        img: image,
      };
    })
    .filter((book): book is SidebarBook => book !== null);
}

function toNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function extractBookListFromPayload(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (isRecord(payload)) {
    if (Array.isArray(payload.results)) return payload.results;
    if (Array.isArray(payload.items)) return payload.items;
    if (Array.isArray(payload.data)) return payload.data;
  }
  return [];
}

function normalizeApiBook(item: unknown, index: number): Book | null {
  if (!isRecord(item)) return null;

  const title = typeof item.title === 'string' ? item.title.trim() : '';
  if (!title) return null;

  const id = toNumber(item.id, index + 1);
  const slug =
    typeof item.slug === 'string' && item.slug.trim()
      ? item.slug.trim()
      : String(id);
  const authorRaw = resolveAuthorName(item);
  const author = formatAuthorLabel(authorRaw);

  const categoryName =
    typeof item.category_name === 'string'
      ? item.category_name
      : isRecord(item.category) && typeof item.category.name === 'string'
        ? item.category.name
        : typeof item.genre === 'string'
          ? item.genre
          : 'Uncategorized';

  const image =
    typeof item.image === 'string'
      ? item.image
      : typeof item.cover_image === 'string'
        ? item.cover_image
        : typeof item.coverImage === 'string'
          ? item.coverImage
          : '/images/books/book1.jpg';

  return {
    id,
    slug,
    title,
    author,
    genre: categoryName,
    rating: Math.max(1, Math.min(5, Math.round(toNumber(item.rating, 4)))),
    reviews: toNumber(item.review_count ?? item.reviews, 0),
    likes: toNumber(item.likes ?? item.total_sold, 0),
    excerpt:
      typeof item.excerpt === 'string'
        ? item.excerpt
        : typeof item.description === 'string'
          ? item.description
          : 'Read more about this book in the detail page.',
    img: image,
    imgFallbackColor: BOOK_FALLBACK_COLORS[index % BOOK_FALLBACK_COLORS.length],
    likedBy: 'Readers from BookBuyBD like this',
    likedByImg: BOOK_FALLBACK_LIKED_BY,
  };
}

function normalizeApiBooks(payload: unknown, authorLookup: AuthorLookup = {}): Book[] {
  const list = extractBookListFromPayload(payload);
  return list
    .map((item, index) => {
      if (!isRecord(item)) return null;
      const authorName = resolveAuthorName(item, authorLookup);
      const normalized = authorName ? { ...item, author: authorName } : item;
      return normalizeApiBook(normalized, index);
    })
    .filter((book): book is Book => book !== null);
}

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className={`w-3 h-3 ${i < count ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function AvatarImg({ src, initials, size = 24, color = '#6b7280' }: { src: string; initials: string; size?: number; color?: string }) {
  const [err, setErr] = useState(false);
  const showFallback = err || !src;
  return (
    <div
      className="rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-white font-bold"
      style={{ width: size, height: size, background: showFallback ? color : undefined, fontSize: size * 0.38 }}
    >
      {!showFallback
        ? <img src={src} alt={initials} className="w-full h-full object-cover" onError={() => setErr(true)} />
        : <span>{initials[0]}</span>}
    </div>
  );
}

function BookCoverImg({ src, color, title }: { src: string; color: string; title: string }) {
  const [err, setErr] = useState(false);
  const showFallback = err || !src;
  return (
    <div className="w-full h-full rounded overflow-hidden" style={{ background: showFallback ? color : undefined }}>
      {!showFallback
        ? <img src={src} alt={title} className="w-full h-full object-cover" onError={() => setErr(true)} />
        : (
          <div className="w-full h-full flex items-center justify-center p-2" style={{ background: color }}>
            <span className="text-white text-[10px] font-bold text-center leading-tight">{title}</span>
          </div>
        )}
    </div>
  );
}

/* ══════════════════════════════════════
   SIDEBAR
══════════════════════════════════════ */
function Sidebar({
  onGenreClick,
  genres,
  books,
  authorsOfWeek,
  authorsLoading,
  booksOfYear,
  booksOfYearLoading,
}: {
  onGenreClick: (g: string) => void;
  genres: string[];
  books: Book[];
  authorsOfWeek: SidebarAuthor[];
  authorsLoading: boolean;
  booksOfYear: SidebarBook[];
  booksOfYearLoading: boolean;
}) {
  return (
    <aside className="flex flex-col gap-8" style={{ width: 180, minWidth: 180 }}>
      <div>
        <h3 className="text-sm font-bold text-gray-800 mb-3">Author of the week</h3>
        <ul className="space-y-2.5">
          {authorsOfWeek.map((a, i) => (
            <li key={i} className="flex items-center gap-2.5 group cursor-pointer">
              <AvatarImg src={a.src} initials={a.initials} size={30} color={a.color} />
              <span className="text-xs text-gray-700 group-hover:text-blue-600 transition font-medium">{a.name}</span>
            </li>
          ))}
          {authorsLoading && (
            <li className="text-[11px] text-gray-400">Loading authors...</li>
          )}
          {!authorsLoading && authorsOfWeek.length === 0 && (
            <li className="text-[11px] text-gray-400">No authors available</li>
          )}
        </ul>
      </div>
      <div className="h-px bg-gray-100" />
      <div>
        <h3 className="text-sm font-bold text-gray-800 mb-3">Books of the year</h3>
        <ul className="space-y-3">
          {booksOfYear.map((b, i) => (
            <li key={i} className="flex gap-2.5 group cursor-pointer">
              <div className="flex-shrink-0 rounded-md shadow-sm overflow-hidden w-12 aspect-[2/3]">
                <BookCoverImg src={b.img} color={['#7c3aed', '#0d9488', '#b45309', '#be185d'][i % 4]} title={b.title} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-gray-800 group-hover:text-blue-600 transition leading-tight line-clamp-2">{b.title}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{b.author}</p>
              </div>
            </li>
          ))}
          {booksOfYearLoading && (
            <li className="text-[11px] text-gray-400">Loading books...</li>
          )}
          {!booksOfYearLoading && booksOfYear.length === 0 && (
            <li className="text-[11px] text-gray-400">No books available</li>
          )}
        </ul>
      </div>
      {/* Genre quick links */}
      <div className="h-px bg-gray-100" />
      <div>
        <h3 className="text-sm font-bold text-gray-800 mb-3">Browse Genres</h3>
        <ul className="space-y-1.5">
          {genres.filter(g => g !== 'All Genres').map(g => {
            const meta = GENRE_META[g] ?? GENRE_META['All Genres'];
            return (
              <li key={g}>
                <button
                  onClick={() => onGenreClick(g)}
                  className="w-full flex items-center justify-between text-xs text-gray-600 hover:text-blue-600 transition font-medium py-1 px-2 rounded-lg hover:bg-blue-50 group"
                >
                  <span>{g}</span>
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: meta.accent, color: meta.color }}
                  >
                    {books.filter(b => b.genre === g).length}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}

/* ══════════════════════════════════════
   BOOK CARD — horizontal
══════════════════════════════════════ */
function BookCard({ book }: { book: Book }) {
  const [liked, setLiked] = useState(false);
  return (
    <div className="flex gap-4 py-5 border-b border-gray-100 group">
      <Link href={`/book?slug=${book.slug}`} className="flex-shrink-0 rounded-lg shadow-md overflow-hidden w-24 sm:w-28 aspect-[2/3] block">
        <BookCoverImg src={book.img} color={book.imgFallbackColor} title={book.title} />
      </Link>
      <div className="flex-1 min-w-0">
        <Link href={`/book?slug=${book.slug}`} className="block">
          <h4 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition leading-tight mb-0.5 cursor-pointer line-clamp-1">{book.title}</h4>
        </Link>
        <p className="text-xs text-gray-400 mb-2">{book.author}</p>
        <div className="flex items-center gap-2 mb-2">
          <Stars count={book.rating} />
          <span className="text-[11px] text-gray-400">{book.reviews} ({book.reviews})</span>
        </div>
        <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2 mb-3">{book.excerpt}</p>
        <div className="flex items-center gap-1.5">
          <div className="flex -space-x-1.5">
            {book.likedByImg.slice(0, 2).map((src, i) => (
              <div key={i} className="rounded-full border-2 border-white overflow-hidden" style={{ width: 20, height: 20 }}>
                <AvatarImg src={src} initials="U" size={20} color={['#0d9488', '#2563eb', '#7c3aed'][i]} />
              </div>
            ))}
          </div>
          <button onClick={() => setLiked(l => !l)} className={`flex items-center gap-0.5 transition ${liked ? 'text-blue-500' : 'text-gray-300 hover:text-blue-400'}`}>
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
            </svg>
          </button>
          <span className="text-[10px] text-gray-400 leading-tight">{book.likedBy}</span>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   BOOK CARD — grid/detail (used in category detail page)
══════════════════════════════════════ */
function BookCardGrid({ book }: { book: Book }) {
  const [liked, setLiked] = useState(false);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
      <Link href={`/book?slug=${book.slug}`} className="relative overflow-hidden w-full aspect-[2/3] block">
        <BookCoverImg src={book.img} color={book.imgFallbackColor} title={book.title} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </Link>
      <div className="p-3 flex-1 flex flex-col">
        <Link href={`/book?slug=${book.slug}`} className="block group-hover:text-blue-600 transition">
          <h4 className="text-xs font-bold text-gray-900 transition leading-tight mb-0.5 line-clamp-1 group-hover:text-blue-600">{book.title}</h4>
        </Link>
        <p className="text-[10px] text-gray-400 mb-1.5">{book.author}</p>
        <div className="flex items-center gap-1.5 mb-2">
          <Stars count={book.rating} />
          <span className="text-[10px] text-gray-400">({book.reviews})</span>
        </div>
        <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed mb-2">{book.excerpt}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div className="flex -space-x-1">
              {book.likedByImg.slice(0, 2).map((src, i) => (
                <div key={i} className="rounded-full border border-white overflow-hidden" style={{ width: 16, height: 16 }}>
                  <AvatarImg src={src} initials="U" size={16} color={['#0d9488', '#2563eb'][i]} />
                </div>
              ))}
            </div>
            <span className="text-[9px] text-gray-400">{book.likes} likes</span>
          </div>
          <button
            onClick={() => setLiked(l => !l)}
            className={`transition ${liked ? 'text-blue-500' : 'text-gray-300 hover:text-blue-400'}`}
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   CATEGORY DETAIL PAGE
══════════════════════════════════════ */
const DETAIL_PAGE_SIZE = 6;

function CategoryDetailPage({
  genre,
  genres,
  books,
  onBack,
  onGenreSwitch,
}: {
  genre: string;
  genres: string[];
  books: Book[];
  onBack: () => void;
  onGenreSwitch: (g: string) => void;
}) {
  const [visibleCount, setVisibleCount] = useState(DETAIL_PAGE_SIZE);
  const [sort, setSort] = useState<'popular' | 'rating' | 'reviews'>('popular');

  const meta = GENRE_META[genre] ?? GENRE_META['All Genres'];
  const allBooks = books;

  const sorted = [...allBooks].sort((a, b) => {
    if (sort === 'popular') return b.likes - a.likes;
    if (sort === 'rating') return b.rating - a.rating;
    return b.reviews - a.reviews;
  });

  const shown = sorted.slice(0, visibleCount);
  const hasMore = visibleCount < sorted.length;

  return (
    <div>
      {/* ── Hero banner ── */}
      <div
        className="rounded-2xl px-8 py-8 mb-7 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${meta.color} 0%, ${meta.color}cc 100%)` }}
      >
        {/* Decorative circles */}
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full opacity-10 bg-white" />
        <div className="absolute -right-4 -bottom-8 w-32 h-32 rounded-full opacity-10 bg-white" />

        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-white/80 hover:text-white text-xs font-semibold mb-4 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to all books
        </button>

        <div className="flex items-end justify-between relative z-10">
          <div>
            <span
              className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-2"
              style={{ background: meta.accent, color: meta.color }}
            >
              {allBooks.length} Books
            </span>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">{genre}</h2>
            <p className="text-white/70 text-sm mt-1 max-w-sm">{meta.description}</p>
          </div>

          {/* Other genre quick links */}
          <div className="flex gap-2 flex-wrap justify-end max-w-xs">
            {genres.filter(g => g !== 'All Genres' && g !== genre).map(g => (
              <button
                key={g}
                onClick={() => onGenreSwitch(g)}
                className="text-[11px] font-semibold px-3 py-1.5 rounded-full bg-white/20 text-white hover:bg-white/40 transition"
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Sort bar ── */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-gray-500 font-medium">
          Showing <span className="text-gray-800 font-bold">{shown.length}</span> of <span className="text-gray-800 font-bold">{allBooks.length}</span> books
        </p>
        <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-full">
          {(['popular', 'rating', 'reviews'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all capitalize ${sort === s ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ── Book grid ── */}
      {shown.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-300">
          <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <p className="text-sm font-medium">No books in this genre yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {shown.map(book => <BookCardGrid key={book.id} book={book} />)}
        </div>
      )}

      {/* ── Fixed-position View More ── */}
      {hasMore && (
        <div className="sticky bottom-6 flex justify-center mt-6 pointer-events-none">
          <button
            onClick={() => setVisibleCount(c => c + DETAIL_PAGE_SIZE)}
            className="pointer-events-auto flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-sm px-8 py-3 rounded-full shadow-xl shadow-blue-300/40 transition-all duration-200"
            style={{ animation: 'viewMorePulse 2.5s ease-in-out infinite' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13" />
            </svg>
            View More {genre === 'All Genres' ? 'Books' : genre + ' Books'}
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.25)' }}
            >
              +{Math.min(DETAIL_PAGE_SIZE, sorted.length - visibleCount)} more
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN VIEW — genre cards grid
══════════════════════════════════════ */
const PREVIEW_SIZE = 4;

function GenrePreviewSection({
  genre,
  books,
  onViewMore,
}: {
  genre: string;
  books: Book[];
  onViewMore: (g: string) => void;
}) {
  const meta = GENRE_META[genre] ?? GENRE_META['All Genres'];
  const genreBooks = books.filter(b => b.genre === genre).slice(0, PREVIEW_SIZE);
  const total = books.filter(b => b.genre === genre).length;

  return (
    <div className="mb-8">
      {/* Section header */}
      <div
        className="flex items-center justify-between px-4 py-3 rounded-xl mb-3"
        style={{ background: meta.accent }}
      >
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full" style={{ background: meta.color }} />
          <h3 className="text-sm font-extrabold" style={{ color: meta.color }}>{genre}</h3>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
            style={{ background: meta.color }}
          >
            {total} books
          </span>
        </div>

        {/* ── Fixed "View More" button always visible ── */}
        <button
          onClick={() => onViewMore(genre)}
          className="flex items-center gap-1.5 text-white font-bold text-xs px-4 py-2 rounded-full shadow-md transition-all duration-200 hover:opacity-90 active:scale-[0.97]"
          style={{ background: meta.color, boxShadow: `0 4px 12px ${meta.color}55` }}
        >
          View More
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Preview cards row */}
      <div className="grid grid-cols-2 gap-x-6">
        {genreBooks.map(book => <BookCard key={book.id} book={book} />)}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════ */
export default function Books() {
  const [genreOptions, setGenreOptions] = useState<GenreOption[]>(DEFAULT_GENRE_OPTIONS);
  const [activeGenre, setActiveGenre] = useState('All Genres');
  const [detailGenre, setDetailGenre] = useState<string | null>(null);
  const [allGenreVisible, setAllGenreVisible] = useState(PREVIEW_SIZE);
  const [genreError, setGenreError] = useState<string | null>(null);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [genreBooks, setGenreBooks] = useState<Book[]>([]);
  const [booksLoading, setBooksLoading] = useState(true);
  const [booksError, setBooksError] = useState<string | null>(null);
  const [authorLookup, setAuthorLookup] = useState<AuthorLookup>({});
  const [authorsOfWeek, setAuthorsOfWeek] = useState<SidebarAuthor[]>([]);
  const [authorsLoading, setAuthorsLoading] = useState(true);
  const [authorsError, setAuthorsError] = useState<string | null>(null);
  const [booksOfYear, setBooksOfYear] = useState<SidebarBook[]>([]);
  const [booksOfYearLoading, setBooksOfYearLoading] = useState(true);
  const [booksOfYearError, setBooksOfYearError] = useState<string | null>(null);

  const genres = genreOptions.map((option) => option.name);

  useEffect(() => {
    const loadGenres = async () => {
      try {
        setGenreError(null);
        const payload = await booksService.getCategories();
        const apiGenres = extractGenreOptions(payload);

        if (apiGenres.length === 0) {
          setGenreOptions(DEFAULT_GENRE_OPTIONS);
          return;
        }

        setGenreOptions([
          { name: 'All Genres', slug: '' },
          ...apiGenres.filter((genre) => genre.slug !== ''),
        ]);
      } catch (error) {
        setGenreError(error instanceof ApiError ? error.message : 'Failed to load genres.');
        setGenreOptions(DEFAULT_GENRE_OPTIONS);
      }
    };

    void loadGenres();
  }, []);

  useEffect(() => {
    const loadAllBooks = async () => {
      setBooksLoading(true);
      setBooksError(null);

      try {
        const payload = await booksService.getCatalog();
        const lookupFromPayload = extractAuthorLookupFromPayload(payload);
        setAuthorLookup((prev) => mergeAuthorLookups(prev, lookupFromPayload));
        const mapped = normalizeApiBooks(payload, lookupFromPayload);
        setAllBooks(mapped);
      } catch (error) {
        setBooksError(error instanceof ApiError ? error.message : 'Failed to load books.');
        setAllBooks([]);
      } finally {
        setBooksLoading(false);
      }
    };

    void loadAllBooks();
  }, []);

  useEffect(() => {
    const loadAuthorsOfWeek = async () => {
      setAuthorsLoading(true);
      setAuthorsError(null);

      try {
        const payload = await booksService.getAuthorOfWeek();
        setAuthorsOfWeek(extractAuthorsFromPayload(payload));
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          setAuthorsError(null);
        } else {
          setAuthorsError(error instanceof ApiError ? error.message : 'Failed to load author of the week.');
        }
        setAuthorsOfWeek([]);
      } finally {
        setAuthorsLoading(false);
      }
    };

    void loadAuthorsOfWeek();
  }, []);

  useEffect(() => {
    const loadBooksOfYear = async () => {
      setBooksOfYearLoading(true);
      setBooksOfYearError(null);

      try {
        const currentYear = new Date().getFullYear();
        const payload = await booksService.getBooksOfYear({
          year: currentYear,
          limit: SIDEBAR_BOOKS_OF_YEAR_LIMIT,
        });
        const lookupFromPayload = extractAuthorLookupFromPayload(payload);
        setAuthorLookup((prev) => mergeAuthorLookups(prev, lookupFromPayload));
        const mergedLookup = mergeAuthorLookups(authorLookup, lookupFromPayload);
        setBooksOfYear(extractBooksOfYearFromPayload(payload, mergedLookup));
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          setBooksOfYearError(null);
        } else {
          setBooksOfYearError(error instanceof ApiError ? error.message : 'Failed to load books of the year.');
        }
        setBooksOfYear([]);
      } finally {
        setBooksOfYearLoading(false);
      }
    };

    void loadBooksOfYear();
  }, [authorLookup]);

  const effectiveActiveGenre = genres.includes(activeGenre) ? activeGenre : 'All Genres';
  const effectiveDetailGenre = detailGenre && genres.includes(detailGenre) ? detailGenre : null;
  const targetGenre = effectiveDetailGenre ?? effectiveActiveGenre;

  useEffect(() => {
    const loadGenreBooks = async () => {
      if (targetGenre === 'All Genres') {
        setGenreBooks(allBooks);
        return;
      }

      const slug = genreOptions.find((option) => option.name === targetGenre)?.slug || slugifyCategory(targetGenre);
      if (!slug) {
        setGenreBooks([]);
        return;
      }

      setBooksLoading(true);
      setBooksError(null);
      setGenreBooks([]);

      try {
        const payload = await booksService.getCatalog({ category: slug });
        const lookupFromPayload = extractAuthorLookupFromPayload(payload);
        setAuthorLookup((prev) => mergeAuthorLookups(prev, lookupFromPayload));
        const mergedLookup = mergeAuthorLookups(authorLookup, lookupFromPayload);
        setGenreBooks(normalizeApiBooks(payload, mergedLookup));
      } catch (error) {
        setBooksError(error instanceof ApiError ? error.message : 'Failed to load books.');
        setGenreBooks([]);
      } finally {
        setBooksLoading(false);
      }
    };

    void loadGenreBooks();
  }, [allBooks, genreOptions, targetGenre, authorLookup]);

  // navigate to detail view
  const goToDetail = (g: string) => {
    setDetailGenre(g);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // back to list
  const goBack = () => setDetailGenre(null);

  /* ── filtered list for "All Genres" tab ── */
  const filteredAll = effectiveActiveGenre === 'All Genres' ? allBooks : genreBooks;
  const shownAll = filteredAll.slice(0, allGenreVisible);
  const hasMoreAll = allGenreVisible < filteredAll.length;
  const activeMeta = GENRE_META[effectiveActiveGenre] ?? GENRE_META['All Genres'];
  const detailBooks = effectiveDetailGenre === 'All Genres' ? allBooks : genreBooks;

  return (
    <>
      <style>{`
        @keyframes viewMorePulse {
          0%,100% { box-shadow: 0 8px 24px rgba(37,99,235,0.35); }
          50%      { box-shadow: 0 8px 36px rgba(37,99,235,0.60); }
        }
      `}</style>

      <section className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex gap-8">

          {/* ── Sidebar ── */}
          <Sidebar
            onGenreClick={goToDetail}
            genres={genres}
            books={allBooks}
            authorsOfWeek={authorsOfWeek}
            authorsLoading={authorsLoading}
            booksOfYear={booksOfYear}
            booksOfYearLoading={booksOfYearLoading}
          />

          {/* ── Divider ── */}
          <div className="w-px bg-gray-100 flex-shrink-0" />

          {/* ── Main content ── */}
          <div className="flex-1 min-w-0">

            {/* ════ DETAIL PAGE ════ */}
            {effectiveDetailGenre ? (
              <CategoryDetailPage
                genre={effectiveDetailGenre}
                genres={genres}
                books={detailBooks}
                onBack={goBack}
                onGenreSwitch={g => { setDetailGenre(g); }}
              />
            ) : (
              <>
                {/* Genre tab bar */}
                <div className="flex items-center gap-1 mb-2 flex-wrap">
                  {genres.map(g => (
                    <button
                      key={g}
                      onClick={() => { setActiveGenre(g); setAllGenreVisible(PREVIEW_SIZE); }}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${effectiveActiveGenre === g
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                        : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                        }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
                <div className="h-0.5 bg-gray-100 rounded-full mb-4" />

                {/* ── "All Genres" shows per-genre sections with fixed View More buttons ── */}
                {effectiveActiveGenre === 'All Genres' ? (
                  <div>
                    {genres.filter(g => g !== 'All Genres').map(g => (
                      allBooks.some(b => b.genre === g) && (
                        <GenrePreviewSection key={g} genre={g} books={allBooks} onViewMore={goToDetail} />
                      )
                    ))}
                  </div>
                ) : (
                  /* ── Single genre filtered list ── */
                  <div>
                    {/* Genre banner */}
                    <div
                      className="rounded-xl px-5 py-4 mb-4 flex items-center justify-between"
                      style={{ background: activeMeta.accent }}
                    >
                      <div>
                        <h3 className="text-base font-extrabold" style={{ color: activeMeta.color }}>{effectiveActiveGenre}</h3>
                        <p className="text-xs mt-0.5" style={{ color: activeMeta.color, opacity: 0.75 }}>
                          {activeMeta.description}
                        </p>
                      </div>
                      {/* ── Fixed View More button always visible ── */}
                      <button
                        onClick={() => goToDetail(effectiveActiveGenre)}
                        className="flex items-center gap-1.5 text-white font-bold text-xs px-5 py-2.5 rounded-full shadow-md transition-all duration-200 hover:opacity-90 active:scale-[0.97] flex-shrink-0"
                        style={{
                          background: activeMeta.color,
                          boxShadow: `0 4px 14px ${activeMeta.color}55`,
                        }}
                      >
                        View More
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>

                    {shownAll.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-gray-300">
                        <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <p className="text-sm font-medium">No books in this genre yet</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-x-6">
                        {shownAll.map(book => <BookCard key={book.id} book={book} />)}
                      </div>
                    )}

                    {hasMoreAll && (
                      <div className="flex justify-center mt-6">
                        <button
                          onClick={() => setAllGenreVisible(c => c + PREVIEW_SIZE)}
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-sm px-8 py-2.5 rounded-full shadow-md shadow-blue-200 transition-all duration-200"
                        >
                          Load More
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {genreError && (
                  <p className="text-xs text-amber-600 mt-4">
                    Showing default genres. {genreError}
                  </p>
                )}

                {booksError && (
                  <p className="text-xs text-amber-600 mt-2">
                    Failed to load books. {booksError}
                  </p>
                )}

                {authorsError && (
                  <p className="text-xs text-amber-600 mt-2">
                    {authorsError}
                  </p>
                )}

                {booksOfYearError && (
                  <p className="text-xs text-amber-600 mt-2">
                    {booksOfYearError}
                  </p>
                )}

                {booksLoading && (
                  <p className="text-xs text-gray-400 mt-2">
                    Refreshing books...
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
