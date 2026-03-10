/* ═══════════════════════════════════════════════
   SHARED CART TYPES  (used by all 4 pages)
═══════════════════════════════════════════════ */

export interface CartItem {
  id: number;
  title: string;
  author: string;
  cover: string;
  coverFallback: string;
  price: number;
  originalPrice?: number;
  qty: number;
  edition: string;
}

export interface CheckoutForm {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  district: string;
  postalCode: string;
  note: string;
  paymentMethod: 'cod';
}

export const INITIAL_CART: CartItem[] = [];

export const EMPTY_FORM: CheckoutForm = {
  fullName: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  district: '',
  postalCode: '',
  note: '',
  paymentMethod: 'cod',
};

export const DISTRICTS = [
  'Dhaka','Chittagong','Rajshahi','Khulna','Sylhet',
  'Barisal','Rangpur','Mymensingh','Comilla','Gazipur',
  'Narayanganj','Tangail','Bogra','Dinajpur','Jessore',
];

export const DELIVERY_CHARGE = 60;
export const FREE_DELIVERY_THRESHOLD = 1000;

const CART_STORAGE_KEY = 'bookbuybd_cart_v1';

function hasLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function normalizeCartItem(raw: unknown): CartItem | null {
  if (!raw || typeof raw !== 'object') return null;

  const rec = raw as Partial<CartItem>;
  const id = Number(rec.id);
  const title = typeof rec.title === 'string' ? rec.title.trim() : '';
  const author = typeof rec.author === 'string' ? rec.author.trim() : '';
  const cover = typeof rec.cover === 'string' ? rec.cover : '';
  const coverFallback = typeof rec.coverFallback === 'string' ? rec.coverFallback : '#e2e8f0';
  const price = Number(rec.price);
  const originalPrice = rec.originalPrice === undefined ? undefined : Number(rec.originalPrice);
  const qty = Math.max(1, Number(rec.qty) || 1);
  const edition = typeof rec.edition === 'string' && rec.edition.trim() ? rec.edition.trim() : 'Standard';

  if (!Number.isFinite(id) || id <= 0 || !title || !author || !Number.isFinite(price) || price < 0) {
    return null;
  }

  return {
    id,
    title,
    author,
    cover,
    coverFallback,
    price,
    originalPrice: Number.isFinite(originalPrice) ? originalPrice : undefined,
    qty,
    edition,
  };
}

function normalizeCartItems(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => normalizeCartItem(entry))
    .filter((entry): entry is CartItem => entry !== null);
}

export function getStoredCartItems(): CartItem[] {
  if (!hasLocalStorage()) return [];

  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    return normalizeCartItems(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function persistCartItems(items: CartItem[]): void {
  if (!hasLocalStorage()) return;

  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(normalizeCartItems(items)));
  } catch {
    // Intentionally ignore storage write errors.
  }
}

export function clearStoredCartItems(): void {
  if (!hasLocalStorage()) return;

  try {
    window.localStorage.removeItem(CART_STORAGE_KEY);
  } catch {
    // Intentionally ignore storage write errors.
  }
}

export function addItemToStoredCart(item: CartItem): CartItem[] {
  const normalizedItem = normalizeCartItem(item);
  if (!normalizedItem) return getStoredCartItems();

  const current = getStoredCartItems();
  const existingIndex = current.findIndex((entry) => entry.id === normalizedItem.id);

  if (existingIndex === -1) {
    const next = [...current, normalizedItem];
    persistCartItems(next);
    return next;
  }

  const next = current.map((entry, index) => {
    if (index !== existingIndex) return entry;
    return {
      ...normalizedItem,
      qty: entry.qty + normalizedItem.qty,
    };
  });

  persistCartItems(next);
  return next;
}
