'use client';
import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { apiClient, endpoints } from '@/lib/api';

/* ═══════════════════════════════ DATA ═══════════════════════════════ */
interface DashboardOverview {
    total_revenue: number;
    total_orders: number;
    pending_orders: number;
    confirmed_orders: number;
    rejected_orders: number;
    pending_deliveries: number;
    processing_deliveries: number;
    shipped_deliveries: number;
    delivered_deliveries: number;
    cancelled_deliveries: number;
    total_books: number;
    active_books: number;
    in_stock_books: number;
    out_of_stock_books: number;
    low_stock_books: number;
}

interface DashboardOverviewApiResponse extends Omit<DashboardOverview, 'total_revenue'> {
    total_revenue: string | number;
}

interface AuthUser {
    id: number;
    username: string;
    email: string;
    is_staff: boolean;
}

interface LoginResponse {
    token: string;
    user: AuthUser;
}

interface DashboardRevenuePoint {
    label: string;
    value: number;
}

interface DashboardRetentionPoint {
    label: string;
    smes: number;
    startups: number;
    enterprises: number;
}

interface DashboardLeads {
    open: number;
    in_progress: number;
    lost: number;
    won: number;
    total_leads: number;
    conversion_rate: number;
    customer_ltv_days: number;
    leads_delta: number;
    leads_delta_pct: number;
    conversion_delta_pct: number;
    ltv_delta_pct: number;
    spark_leads: number[];
    spark_conversion: number[];
    spark_ltv: number[];
}

interface DashboardOrder {
    id: string;
    customer: string;
    book: string;
    amount: number;
    status: string;
    delivery: string;
}

interface DashboardOrderDetail extends DashboardOrder {
    items: number;
    email: string;
    phone: string;
    address: string;
    createdAt: string;
    notes: string;
}

interface DashboardBook {
    id: string | number;
    title: string;
    author: string;
    genre: string;
    image: string;
    thumbnail: string;
    stock: number;
    price: number;
    status: string;
    orders: number;
}

interface NewDashboardBookInput {
    category: number;
    title: string;
    slug: string;
    author: number;
    description: string;
    price: string;
    stock_quantity: number;
    is_coming_soon: boolean;
    is_active: boolean;
    imageFile?: File | null;
}

interface DashboardBookManageDetail extends NewDashboardBookInput {
    id: string;
    slug: string;
    categoryName: string;
    authorName: string;
}

interface DashboardCategory {
    id: number;
    name: string;
    slug: string;
    is_active: boolean;
}

interface NewDashboardCategoryInput {
    name: string;
    slug: string;
    is_active: boolean;
}

interface UpdateDashboardCategoryInput {
    name: string;
    is_active: boolean;
}

interface NamedOption {
    id: number;
    name: string;
}

interface DashboardNotification {
    id: string | number;
    type: string;
    msg: string;
    time: string;
    read: boolean;
}

interface DashboardCalendarDay {
    l: string;
    d: number;
}

interface DashboardCalendarEvent {
    id: string | number;
    title: string;
    time: string;
    color: 'blue' | 'violet';
    attendees: string[];
    duration?: string;
}

interface DashboardFavorite {
    id: string | number;
    label: string;
    color: string;
}

interface DashboardInboxMessage {
    id: string;
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
    status: string;
    submittedAt: string;
    updatedAt: string;
}

const DASHBOARD_OVERVIEW_EMPTY: DashboardOverview = {
    total_revenue: 0, total_orders: 0, pending_orders: 0,
    confirmed_orders: 0, rejected_orders: 0, pending_deliveries: 0,
    processing_deliveries: 0, shipped_deliveries: 0,
    delivered_deliveries: 0, cancelled_deliveries: 0,
    total_books: 0, active_books: 0, in_stock_books: 0,
    out_of_stock_books: 0, low_stock_books: 0,
};

const DASHBOARD_LEADS_EMPTY: DashboardLeads = {
    open: 0,
    in_progress: 0,
    lost: 0,
    won: 0,
    total_leads: 0,
    conversion_rate: 0,
    customer_ltv_days: 0,
    leads_delta: 0,
    leads_delta_pct: 0,
    conversion_delta_pct: 0,
    ltv_delta_pct: 0,
    spark_leads: [],
    spark_conversion: [],
    spark_ltv: [],
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function resolveEndpoint<T = string>(resolver: () => T | undefined, fallback: T): T {
    try {
        return resolver() ?? fallback;
    } catch {
        return fallback;
    }
}

function parseNumeric(value: unknown, fallback = 0): number {
    const normalized = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(normalized) ? normalized : fallback;
}

function parseText(value: unknown, fallback = ''): string {
    if (typeof value === 'string' && value.trim()) return value;
    if (typeof value === 'number') return String(value);
    return fallback;
}

function parseBoolean(value: unknown, fallback = false): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (['true', '1', 'yes', 'active'].includes(normalized)) return true;
        if (['false', '0', 'no', 'inactive'].includes(normalized)) return false;
    }
    if (typeof value === 'number') {
        if (value === 1) return true;
        if (value === 0) return false;
    }
    return fallback;
}

function slugify(value: string): string {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function appendResourceId(collectionUrl: string, id: string | number): string {
    const normalized = collectionUrl.endsWith('/') ? collectionUrl : `${collectionUrl}/`;
    return `${normalized}${encodeURIComponent(String(id))}/`;
}

const API_MEDIA_ORIGIN = (() => {
    const raw = (process.env.NEXT_PUBLIC_API_BASE_URL || '').trim();
    if (!raw) return '';
    return raw.replace(/\/api\/?$/i, '').replace(/\/$/, '');
})();

function toAssetUrl(value: unknown): string {
    const text = parseText(value);
    if (!text) return '';
    if (/^https?:\/\//i.test(text) || text.startsWith('data:') || text.startsWith('blob:')) {
        return text;
    }
    if (!API_MEDIA_ORIGIN) return text;
    return text.startsWith('/') ? `${API_MEDIA_ORIGIN}${text}` : `${API_MEDIA_ORIGIN}/${text}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function readArrayPayload(payload: unknown): unknown[] {
    if (Array.isArray(payload)) return payload;
    if (isRecord(payload)) {
        if (Array.isArray(payload.results)) return payload.results as unknown[];
        if (Array.isArray(payload.items)) return payload.items as unknown[];
        if (Array.isArray(payload.data)) return payload.data as unknown[];
    }
    return [];
}

function normalizeDashboardOverview(response: DashboardOverviewApiResponse | null | undefined): DashboardOverview {
    if (!response || typeof response !== 'object') return DASHBOARD_OVERVIEW_EMPTY;

    return {
        total_revenue: parseNumeric(response.total_revenue, DASHBOARD_OVERVIEW_EMPTY.total_revenue),
        total_orders: parseNumeric(response.total_orders, DASHBOARD_OVERVIEW_EMPTY.total_orders),
        pending_orders: parseNumeric(response.pending_orders, DASHBOARD_OVERVIEW_EMPTY.pending_orders),
        confirmed_orders: parseNumeric(response.confirmed_orders, DASHBOARD_OVERVIEW_EMPTY.confirmed_orders),
        rejected_orders: parseNumeric(response.rejected_orders, DASHBOARD_OVERVIEW_EMPTY.rejected_orders),
        pending_deliveries: parseNumeric(response.pending_deliveries, DASHBOARD_OVERVIEW_EMPTY.pending_deliveries),
        processing_deliveries: parseNumeric(response.processing_deliveries, DASHBOARD_OVERVIEW_EMPTY.processing_deliveries),
        shipped_deliveries: parseNumeric(response.shipped_deliveries, DASHBOARD_OVERVIEW_EMPTY.shipped_deliveries),
        delivered_deliveries: parseNumeric(response.delivered_deliveries, DASHBOARD_OVERVIEW_EMPTY.delivered_deliveries),
        cancelled_deliveries: parseNumeric(response.cancelled_deliveries, DASHBOARD_OVERVIEW_EMPTY.cancelled_deliveries),
        total_books: parseNumeric(response.total_books, DASHBOARD_OVERVIEW_EMPTY.total_books),
        active_books: parseNumeric(response.active_books, DASHBOARD_OVERVIEW_EMPTY.active_books),
        in_stock_books: parseNumeric(response.in_stock_books, DASHBOARD_OVERVIEW_EMPTY.in_stock_books),
        out_of_stock_books: parseNumeric(response.out_of_stock_books, DASHBOARD_OVERVIEW_EMPTY.out_of_stock_books),
        low_stock_books: parseNumeric(response.low_stock_books, DASHBOARD_OVERVIEW_EMPTY.low_stock_books),
    };
}

function normalizeRevenue(payload: unknown): DashboardRevenuePoint[] {
    return readArrayPayload(payload).map((row, idx) => {
        const rec = isRecord(row) ? row : {};
        return {
            label: parseText(rec.label ?? rec.month ?? rec.period, MONTHS[idx % MONTHS.length]),
            value: parseNumeric(rec.value ?? rec.revenue ?? rec.amount),
        };
    });
}

function normalizeRetention(payload: unknown): DashboardRetentionPoint[] {
    return readArrayPayload(payload).map((row, idx) => {
        const rec = isRecord(row) ? row : {};
        return {
            label: parseText(rec.label ?? rec.month ?? rec.period, MONTHS[idx % MONTHS.length]),
            smes: parseNumeric(rec.smes),
            startups: parseNumeric(rec.startups),
            enterprises: parseNumeric(rec.enterprises),
        };
    });
}

function normalizeLeads(payload: unknown): DashboardLeads {
    if (!isRecord(payload)) return DASHBOARD_LEADS_EMPTY;
    return {
        open: parseNumeric(payload.open),
        in_progress: parseNumeric(payload.in_progress ?? payload.inProgress),
        lost: parseNumeric(payload.lost),
        won: parseNumeric(payload.won),
        total_leads: parseNumeric(payload.total_leads ?? payload.totalLeads),
        conversion_rate: parseNumeric(payload.conversion_rate ?? payload.conversionRate),
        customer_ltv_days: parseNumeric(payload.customer_ltv_days ?? payload.customerLtvDays),
        leads_delta: parseNumeric(payload.leads_delta ?? payload.leadsDelta),
        leads_delta_pct: parseNumeric(payload.leads_delta_pct ?? payload.leadsDeltaPct),
        conversion_delta_pct: parseNumeric(payload.conversion_delta_pct ?? payload.conversionDeltaPct),
        ltv_delta_pct: parseNumeric(payload.ltv_delta_pct ?? payload.ltvDeltaPct),
        spark_leads: readArrayPayload(payload.spark_leads ?? payload.sparkLeads).map((v) => parseNumeric(v)),
        spark_conversion: readArrayPayload(payload.spark_conversion ?? payload.sparkConversion).map((v) => parseNumeric(v)),
        spark_ltv: readArrayPayload(payload.spark_ltv ?? payload.sparkLtv).map((v) => parseNumeric(v)),
    };
}

function normalizeOrders(payload: unknown): DashboardOrder[] {
    return readArrayPayload(payload).map((row, idx) => {
        const rec = isRecord(row) ? row : {};
        return {
            id: parseText(rec.id ?? rec.order_id ?? rec.orderId, `ORD-${idx + 1}`),
            customer: parseText(rec.customer_name ?? rec.customer ?? rec.customerName, 'Unknown'),
            book: `${parseNumeric(rec.total_items ?? rec.items_count ?? rec.item_count, 0)} item(s)`,
            amount: parseNumeric(rec.total_amount ?? rec.amount ?? rec.total),
            status: parseText(rec.order_status ?? rec.status, 'pending'),
            delivery: parseText(rec.delivery_status ?? rec.delivery ?? rec.deliveryStatus, 'pending'),
        };
    });
}

function normalizeOrderDetail(payload: unknown): DashboardOrderDetail | null {
    if (!isRecord(payload)) return null;

    const customerObj = isRecord(payload.customer) ? payload.customer : {};
    const itemsPayload = readArrayPayload(payload.items ?? payload.order_items);

    const id = parseText(payload.id ?? payload.order_id ?? payload.orderId);
    if (!id) return null;

    const customer = parseText(
        payload.customer_name ?? payload.customer ?? customerObj.name ?? customerObj.full_name,
        'Unknown',
    );
    const amount = parseNumeric(payload.total_amount ?? payload.amount ?? payload.total);
    const status = parseText(payload.order_status ?? payload.status, 'pending');
    const delivery = parseText(payload.delivery_status ?? payload.delivery ?? payload.deliveryStatus, 'pending');

    return {
        id,
        customer,
        book: `${parseNumeric(payload.total_items ?? payload.items_count ?? payload.item_count, itemsPayload.length)} item(s)`,
        amount,
        status,
        delivery,
        items: parseNumeric(payload.total_items ?? payload.items_count ?? payload.item_count, itemsPayload.length),
        email: parseText(payload.customer_email ?? payload.email ?? customerObj.email),
        phone: parseText(payload.customer_phone ?? payload.phone ?? customerObj.phone),
        address: parseText(payload.shipping_address ?? payload.address ?? customerObj.address),
        createdAt: parseText(payload.created_at ?? payload.createdAt ?? payload.date),
        notes: parseText(payload.notes ?? payload.note ?? payload.customer_note),
    };
}

function normalizeBooks(payload: unknown): DashboardBook[] {
    return readArrayPayload(payload).map((row, idx) => {
        const rec = isRecord(row) ? row : {};
        const author = parseText(rec.author_name ?? rec.author, 'Unknown');
        const genre = parseText(rec.category_name ?? rec.genre, 'General');
        const inStock = Boolean(rec.is_in_stock ?? false);
        const isComingSoon = Boolean(rec.is_coming_soon ?? false);
        const isActive = rec.is_active !== false;
        const status = isComingSoon ? 'coming soon' : (inStock ? 'active' : (isActive ? 'out of stock' : 'inactive'));
        return {
            id: parseText(rec.id, String(idx + 1)),
            title: parseText(rec.title, 'Untitled'),
            author,
            genre,
            image: toAssetUrl(rec.image),
            thumbnail: toAssetUrl(rec.thumbnail),
            stock: parseNumeric(rec.stock_quantity ?? rec.stock),
            price: parseNumeric(rec.price),
            status,
            orders: parseNumeric(rec.orders ?? rec.total_orders ?? rec.totalOrders),
        };
    });
}

function normalizeBookManageDetail(payload: unknown): DashboardBookManageDetail | null {
    if (!isRecord(payload)) return null;

    const categoryObj = isRecord(payload.category) ? payload.category : {};
    const authorObj = isRecord(payload.author) ? payload.author : {};

    const id = parseText(payload.id);
    if (!id) return null;

    const category = parseNumeric(
        payload.category_id
        ?? (typeof payload.category === 'number' ? payload.category : undefined)
        ?? categoryObj.id,
    );
    const author = parseNumeric(
        payload.author_id
        ?? (typeof payload.author === 'number' ? payload.author : undefined)
        ?? authorObj.id,
    );

    if (!Number.isInteger(category) || category <= 0 || !Number.isInteger(author) || author <= 0) {
        return null;
    }

    return {
        id,
        slug: parseText(payload.slug),
        category,
        title: parseText(payload.title),
        author,
        description: parseText(payload.description),
        price: parseNumeric(payload.price).toFixed(2),
        stock_quantity: Math.max(0, Math.trunc(parseNumeric(payload.stock_quantity ?? payload.stock))),
        is_coming_soon: parseBoolean(payload.is_coming_soon, false),
        is_active: parseBoolean(payload.is_active, true),
        categoryName: parseText(categoryObj.name ?? payload.category_name),
        authorName: parseText(authorObj.name ?? authorObj.full_name ?? payload.author_name),
    };
}

function normalizeNotifications(payload: unknown): DashboardNotification[] {
    return readArrayPayload(payload).map((row, idx) => {
        const rec = isRecord(row) ? row : {};
        return {
            id: parseText(rec.id, String(idx + 1)),
            type: parseText(rec.type, 'system'),
            msg: parseText(rec.msg ?? rec.message, ''),
            time: parseText(rec.time, ''),
            read: Boolean(rec.read),
        };
    });
}

function normalizeCalendar(payload: unknown): { days: DashboardCalendarDay[]; events: DashboardCalendarEvent[] } {
    if (!isRecord(payload)) return { days: [], events: [] };

    const days = readArrayPayload(payload.days).map((row, idx) => {
        const rec = isRecord(row) ? row : {};
        return {
            l: parseText(rec.l ?? rec.label ?? rec.day, MONTHS[idx % 7].slice(0, 3)),
            d: parseNumeric(rec.d ?? rec.date),
        };
    });

    const events: DashboardCalendarEvent[] = readArrayPayload(payload.events).map((row, idx) => {
        const rec = isRecord(row) ? row : {};
        return {
            id: parseText(rec.id, String(idx + 1)),
            title: parseText(rec.title, 'Event'),
            time: parseText(rec.time, ''),
            color: (parseText(rec.color, 'blue') === 'violet' ? 'violet' : 'blue'),
            attendees: readArrayPayload(rec.attendees).map((a) => parseText(a)).filter(Boolean),
            duration: parseText(rec.duration, ''),
        };
    });

    return { days, events };
}

function normalizeFavorites(payload: unknown): DashboardFavorite[] {
    return readArrayPayload(payload).map((row, idx) => {
        const rec = isRecord(row) ? row : {};
        return {
            id: parseText(rec.id, String(idx + 1)),
            label: parseText(rec.label, ''),
            color: parseText(rec.color, 'bg-gray-400'),
        };
    });
}

function normalizeInboxMessages(payload: unknown): DashboardInboxMessage[] {
    return readArrayPayload(payload).map((row, idx) => {
        const rec = isRecord(row) ? row : {};
        return {
            id: parseText(rec.messageId ?? rec.id, `msg-${idx + 1}`),
            name: parseText(rec.name, 'Unknown'),
            email: parseText(rec.email, ''),
            phone: parseText(rec.phone, ''),
            subject: parseText(rec.subject, 'No subject'),
            message: parseText(rec.message, ''),
            status: parseText(rec.status, 'received'),
            submittedAt: parseText(rec.submittedAt ?? rec.submitted_at ?? rec.updatedAt, ''),
            updatedAt: parseText(rec.updatedAt ?? rec.updated_at ?? rec.submittedAt, ''),
        };
    });
}

function dedupeNamedOptions(options: NamedOption[]): NamedOption[] {
    const seen = new Set<number>();
    return options.filter((option) => {
        if (seen.has(option.id)) return false;
        seen.add(option.id);
        return true;
    });
}

function normalizeDashboardCategories(payload: unknown): DashboardCategory[] {
    const seen = new Set<number>();

    return readArrayPayload(payload).map((row) => {
        const rec = isRecord(row) ? row : {};
        const id = parseNumeric(rec.id ?? rec.category_id);
        const name = parseText(rec.name ?? rec.category_name ?? rec.title);

        if (!Number.isFinite(id) || id <= 0 || !name || seen.has(id)) {
            return null;
        }

        seen.add(id);
        return {
            id,
            name,
            slug: parseText(rec.slug, slugify(name)),
            is_active: parseBoolean(rec.is_active ?? rec.isActive, true),
        };
    }).filter((category): category is DashboardCategory => category !== null);
}

function normalizeAuthorOptionsFromBooks(payload: unknown): NamedOption[] {
    const options = readArrayPayload(payload).map((row) => {
        const rec = isRecord(row) ? row : {};
        const authorObj = isRecord(rec.author) ? rec.author : null;
        const id = parseNumeric(rec.author_id ?? (typeof rec.author === 'number' ? rec.author : undefined) ?? authorObj?.id);
        const name = parseText(rec.author_name ?? (typeof rec.author === 'string' ? rec.author : undefined) ?? authorObj?.name ?? authorObj?.full_name);
        return Number.isFinite(id) && id > 0 && name ? { id, name } : null;
    }).filter((option): option is NamedOption => option !== null);

    return dedupeNamedOptions(options);
}

/* ═══════════════════════════════ ICONS ═══════════════════════════════ */
const Sv = (d: string, sw = 1.8) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} className="w-4 h-4"><path d={d} /></svg>;
const Ico = {
    grid: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>,
    deals: Sv("M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"),
    notes: Sv("M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"),
    inbox: Sv("M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"),
    reports: Sv("M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"),
    workflows: Sv("M4 6h16M4 10h16M4 14h16M4 18h16"),
    settings: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><circle cx="12" cy="12" r="3" /></svg>,
    help: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" /></svg>,
    search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>,
    bell: Sv("M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"),
    chevD: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><path d="M19 9l-7 7-7-7" /></svg>,
    chevR: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><path d="M9 18l6-6-6-6" /></svg>,
    plus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3 h-3"><path d="M12 5v14M5 12h14" /></svg>,
    check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5"><path d="M20 6L9 17l-5-5" /></svg>,
    book: Sv("M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 004 17V5a2 2 0 012-2h14v14H6.5"),
    truck: Sv("M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3m0 0h4l2 4v5h-6m0 0a2 2 0 11-4 0m4 0a2 2 0 01-4 0M3 12h12"),
    moon: Sv("M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"),
    sun: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>,
    users: Sv("M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"),
    calendar: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
    clock: Sv("M12 6v6l4 2M12 22a10 10 0 100-20 10 10 0 000 20z"),
    export: Sv("M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"),
    star: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
    folder: Sv("M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"),
    cloud: Sv("M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"),
    x: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M18 6L6 18M6 6l12 12" /></svg>,
    warn: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" /></svg>,
    refresh: Sv("M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"),
    msg: Sv("M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"),
    package: Sv("M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"),
    trend: Sv("M23 6l-9.5 9.5-5-5L1 18"),
    percent: Sv("M19 5L5 19M6.5 5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM17.5 16a1.5 1.5 0 100 3 1.5 1.5 0 000-3z"),
    edit: Sv("M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"),
    camera: Sv("M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2zM12 17a4 4 0 100-8 4 4 0 000 8z"),
    save: Sv("M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2zM17 21v-8H7v8M7 3v5h8"),
    shield: Sv("M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"),
    credit: Sv("M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"),
    team: Sv("M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"),
    dots: <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></svg>,
};

/* ═══════════════════════════════ HELPERS ═══════════════════════════════ */
function AnimCount({ to, prefix = '', suffix = '', dec = 0, dur = 1200 }: { to: number; prefix?: string; suffix?: string; dec?: number; dur?: number }) {
    const [v, setV] = useState(0);
    useEffect(() => {
        const t0 = performance.now();
        const tick = (now: number) => {
            const p = Math.min((now - t0) / dur, 1), e = 1 - Math.pow(1 - p, 4);
            setV(e * to); if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }, [to, dur]);
    return <>{prefix}{v.toFixed(dec)}{suffix}</>;
}

function Sparkline({ data, color = '#3b82f6', h = 28 }: { data: number[]; color?: string; h?: number }) {
    const safeData = data.length >= 2 ? data : [0, data[0] ?? 0];
    const w = 80, mx = Math.max(...safeData), mn = Math.min(...safeData);
    const pts = safeData.map((v, i) => [i / (safeData.length - 1) * w, h - ((v - mn) / (mx - mn || 1)) * (h - 4) - 2]);
    const path = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ');
    const area = path + ` L${w},${h} L0,${h} Z`;
    const id = `sg${color.replace(/[^a-z0-9]/gi, '')}`;
    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-16" preserveAspectRatio="none">
            <defs><linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.3" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
            <path d={area} fill={`url(#${id})`} /><path d={path} fill="none" stroke={color} strokeWidth="1.5" />
        </svg>
    );
}

function Ring({ pct, color, size = 48, stroke = 5 }: { pct: number; color: string; size?: number; stroke?: number }) {
    const r = (size - stroke * 2) / 2, circ = 2 * Math.PI * r;
    const [off, setOff] = useState(circ);
    useEffect(() => { setTimeout(() => setOff(circ * (1 - pct / 100)), 400); }, [pct, circ]);
    return (
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
                strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }} />
        </svg>
    );
}

function Toggle({ v, onChange }: { v: boolean; onChange: (b: boolean) => void }) {
    return (
        <button onClick={() => onChange(!v)}
            className={`w-10 h-5 rounded-full relative transition-all duration-300 flex-shrink-0 ${v ? 'bg-blue-600' : 'bg-gray-200'}`}>
            <span className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300"
                style={{ left: v ? 'calc(100% - 1.125rem)' : '0.125rem' }} />
        </button>
    );
}

/* ═══════════════════════════════ REVENUE CHART ═══════════════════════════════ */
function RevenueChart({ dark, overview, series }: { dark: boolean; overview: DashboardOverview; series: DashboardRevenuePoint[] }) {
    const [range, setRange] = useState('1Y');
    const [anim, setAnim] = useState(false);
    const [hover, setHover] = useState<number | null>(null);
    useEffect(() => { setTimeout(() => setAnim(true), 400); }, []);
    const chartSeries = series.length > 0 ? series : [{ label: 'No data', value: 0 }];
    const slices: Record<string, DashboardRevenuePoint[]> = {
        '1M': chartSeries.slice(-1),
        '3M': chartSeries.slice(-3),
        '6M': chartSeries.slice(-6),
        '1Y': chartSeries.slice(-12),
        'ALL': chartSeries,
    };
    const data = slices[range] || chartSeries;
    const values = data.map((point) => point.value);
    const labels = data.map((point) => point.label);
    const hasData = series.length > 0;
    const W = 700, H = 220, leftPad = 44, rightPad = 16, topPad = 14, bottomPad = 48;
    const plotW = W - leftPad - rightPad;
    const plotH = H - topPad - bottomPad;
    const rawMax = Math.max(...values, 1);
    const rawMin = Math.min(...values, 0);
    const margin = Math.max((rawMax - rawMin) * 0.12, 1);
    const max = rawMax + margin;
    const min = Math.max(0, rawMin - margin);
    const ySpan = max - min || 1;
    const px = (i: number) => data.length > 1 ? leftPad + (i / (data.length - 1)) * plotW : leftPad + plotW / 2;
    const py = (v: number) => topPad + (1 - (v - min) / ySpan) * plotH;
    const pts = values.map((v, i) => [px(i), py(v)] as [number, number]);
    const path = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    const yTicks = Array.from({ length: 6 }, (_, i) => max - (i * ySpan) / 5);
    const formatTick = (v: number) => {
        if (Math.abs(v) >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
        if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(1)}K`;
        return v.toFixed(0);
    };
    const card = dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100';
    return (
        <div className={`rounded-xl border p-4 ${card} transition-colors duration-300`}>
            <div className="flex items-center justify-between mb-2">
                <div>
                    <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${dark ? 'text-gray-100' : 'text-gray-800'}`}>Revenue</span>
                        <span className="text-[10px] bg-emerald-50 text-emerald-600 font-bold px-2 py-0.5 rounded-full">↑ 22%</span>
                    </div>
                    <span className={`text-2xl font-black font-mono ${dark ? 'text-white' : 'text-gray-900'}`}>
                        TK <AnimCount to={overview.total_revenue} dec={2} />
                    </span>
                </div>
                <div className="flex gap-0.5">
                    {['1M', '3M', '6M', '1Y', 'ALL'].map(r => (
                        <button key={r} onClick={() => { setRange(r); setAnim(false); setTimeout(() => setAnim(true), 50); }}
                            className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-all ${r === range ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>{r}</button>
                    ))}
                </div>
            </div>
            <div className="relative" onMouseLeave={() => setHover(null)}>
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-52 rounded-lg" preserveAspectRatio="none">
                    <rect x={0} y={0} width={W} height={H} fill={dark ? '#111827' : '#f3f4f6'} rx={10} />
                    {yTicks.map((tick, i) => (
                        <g key={i}>
                            <line x1={leftPad} x2={W - rightPad} y1={py(tick)} y2={py(tick)} stroke={dark ? '#374151' : '#d1d5db'} strokeWidth="1" />
                            <text x={leftPad - 6} y={py(tick) + 3} textAnchor="end" className={dark ? 'fill-gray-400' : 'fill-gray-500'} fontSize="9">{formatTick(tick)}</text>
                        </g>
                    ))}
                    <line x1={leftPad} x2={leftPad} y1={topPad} y2={H - bottomPad} stroke={dark ? '#6b7280' : '#9ca3af'} strokeWidth="1.2" />
                    <line x1={leftPad} x2={W - rightPad} y1={H - bottomPad} y2={H - bottomPad} stroke={dark ? '#6b7280' : '#9ca3af'} strokeWidth="1.2" />
                    <path d={path} fill="none" stroke="#fb923c" strokeWidth="2.3"
                        style={{ strokeDasharray: 2200, strokeDashoffset: anim ? 0 : 2200, transition: 'stroke-dashoffset 1.6s cubic-bezier(0.4,0,0.2,1)' }} />
                    {hover !== null && <line x1={pts[hover][0]} x2={pts[hover][0]} y1={topPad} y2={H - bottomPad} stroke="#fb923c" strokeWidth="1" strokeDasharray="3" opacity="0.6" />}
                    {hover !== null && <circle cx={pts[hover][0]} cy={pts[hover][1]} r={4} fill="#fb923c" stroke="#fff" strokeWidth="1.2" />}
                    {labels.map((label, i) => {
                        const x = px(i);
                        return (
                            <text
                                key={`${label}-${i}`}
                                x={x}
                                y={H - bottomPad + 12}
                                textAnchor="end"
                                transform={`rotate(-65 ${x} ${H - bottomPad + 12})`}
                                className={dark ? 'fill-gray-400' : 'fill-gray-500'}
                                fontSize="8"
                            >
                                {label}
                            </text>
                        );
                    })}
                    {pts.map(([x], i) => (
                        <rect
                            key={i}
                            x={x - Math.max(plotW / Math.max(data.length * 2, 1), 12)}
                            y={topPad}
                            width={Math.max((plotW / Math.max(data.length, 1)), 18)}
                            height={plotH}
                            fill="transparent"
                            onMouseEnter={() => setHover(i)}
                            style={{ cursor: 'crosshair' }}
                        />
                    ))}
                </svg>
                {hover !== null && (
                    <div className="absolute top-0 pointer-events-none bg-gray-900 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-xl z-10"
                        style={{ left: `${data.length > 1 ? (hover / (data.length - 1)) * 100 : 50}%`, transform: 'translateX(-50%)' }}>
                        <div className="text-gray-300">{labels[hover]}</div>
                        <div className="text-orange-300">TK {values[hover].toLocaleString()}</div>
                    </div>
                )}
            </div>
            {!hasData && <p className="mt-2 text-[10px] text-gray-400">No revenue data available.</p>}
        </div>
    );
}

/* ═══════════════════════════════ RETENTION CHART ═══════════════════════════════ */
function RetentionChart({ dark, series }: { dark: boolean; series: DashboardRetentionPoint[] }) {
    const [anim, setAnim] = useState(false);
    useEffect(() => { setTimeout(() => setAnim(true), 600); }, []);
    const data = series.slice(-9);
    const latest = data[data.length - 1];
    const previous = data[data.length - 2];
    const latestRate = latest ? latest.enterprises : 0;
    const delta = latest && previous ? latest.enterprises - previous.enterprises : 0;
    const card = dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100';
    return (
        <div className={`rounded-xl border p-4 ${card} transition-colors duration-300`}>
            <div className="flex items-center justify-between mb-2">
                <div>
                    <span className={`text-sm font-bold ${dark ? 'text-gray-100' : 'text-gray-800'}`}>Delivery Momentum</span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                        <span className={`text-xl font-black font-mono ${dark ? 'text-white' : 'text-gray-900'}`}>{latestRate.toFixed(0)}%</span>
                        <span className={`text-xs font-bold ${delta >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{delta >= 0 ? '+' : ''}{delta.toFixed(0)}% vs last month</span>
                    </div>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-gray-400">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-300 inline-block" />Pending</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />Confirmed</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-800 inline-block" />Delivered</span>
                </div>
            </div>
            <div className="flex items-end gap-1 h-16 mt-2">
                {data.map((point, i) => (
                    <div key={point.label || i} className="flex-1 flex items-end gap-0.5">
                        {[{ v: point.smes, c: 'bg-sky-300' }, { v: point.startups, c: 'bg-blue-500' }, { v: point.enterprises, c: 'bg-blue-800' }].map(({ v, c }, j) => (
                            <div key={j} className={`flex-1 rounded-sm ${c}`}
                                style={{ height: anim ? `${v}%` : '0%', transition: `height 0.7s cubic-bezier(0.4,0,0.2,1) ${(i * 3 + j) * 0.04}s` }} />
                        ))}
                    </div>
                ))}
            </div>
            <div className="flex justify-between mt-1">
                {data.map((point, idx) => <span key={`${point.label}-${idx}`} className="text-[8px] text-gray-400">{point.label}</span>)}
            </div>
            {data.length === 0 && <p className="mt-2 text-[10px] text-gray-400">No retention data available.</p>}
        </div>
    );
}

/* ═══════════════════════════════ KPI CARD ═══════════════════════════════ */
function KpiCard({ title, value, sub, delta, up, icon, color, sparkData, dark, delay = 0 }:
    { title: string; value: ReactNode; sub: string; delta: string; up: boolean; icon: ReactNode; color: string; sparkData: number[]; dark: boolean; delay?: number }) {
    const [vis, setVis] = useState(false);
    useEffect(() => { setTimeout(() => setVis(true), delay); }, [delay]);
    const card = dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100';
    return (
        <div className={`rounded-xl border p-4 flex-1 transition-all duration-500 ${card}`}
            style={{ opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(16px)' }}>
            <div className="flex items-start justify-between mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: color + '20' }}>
                    <span style={{ color }}>{icon}</span>
                </div>
                <Sparkline data={sparkData} color={color} />
            </div>
            <div className={`text-xl font-black font-mono mb-0.5 ${dark ? 'text-white' : 'text-gray-900'}`}>{value}</div>
            <div className={`text-[10px] mb-1.5 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{sub}</div>
            <div className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${up ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                {up ? '↑' : '↓'} {delta} <span className="font-normal opacity-70">vs last week</span>
            </div>
            <p className={`text-[10px] mt-1 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{title}</p>
        </div>
    );
}

/* ═══════════════════════════════ LEADS PANEL ═══════════════════════════════ */
function LeadsPanel({ dark, leads }: { dark: boolean; leads: DashboardLeads }) {
    const total = [leads.open, leads.in_progress, leads.lost, leads.won].reduce((a, b) => a + b, 0);
    const items = [
        { label: 'Pending', val: leads.open, pct: total > 0 ? Math.round((leads.open / total) * 100) : 0, color: '#60a5fa' },
        { label: 'Confirmed', val: leads.in_progress, pct: total > 0 ? Math.round((leads.in_progress / total) * 100) : 0, color: '#3b82f6' },
        { label: 'Rejected', val: leads.lost, pct: total > 0 ? Math.round((leads.lost / total) * 100) : 0, color: '#1d4ed8' },
        { label: 'Delivered', val: leads.won, pct: total > 0 ? Math.round((leads.won / total) * 100) : 0, color: '#1e3a8a' },
    ];
    const card = dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100';
    return (
        <div className={`rounded-xl border p-4 ${card} transition-colors duration-300`}>
            <h3 className={`text-sm font-bold mb-3 ${dark ? 'text-gray-100' : 'text-gray-800'}`}>Order Status Mix</h3>
            <div className="flex rounded-full overflow-hidden h-1.5 mb-4 gap-px">
                {items.map(it => <div key={it.label} className="transition-all duration-1000 rounded-sm" style={{ width: `${it.pct}%`, background: it.color }} />)}
            </div>
            <div className="space-y-2">
                {items.map(it => (
                    <div key={it.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: it.color }} />
                            <span className={`text-[11px] font-medium ${dark ? 'text-gray-300' : 'text-gray-600'}`}>{it.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`text-[10px] ${dark ? 'text-gray-400' : 'text-gray-400'}`}>{it.val} leads</span>
                            <span className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full" style={{ background: it.color }}>{it.pct}%</span>
                        </div>
                    </div>
                ))}
            </div>
            {total === 0 && <p className="mt-2 text-[10px] text-gray-400">No leads data available.</p>}
        </div>
    );
}

/* ═══════════════════════════════ DELIVERY PIPELINE ═══════════════════════════════ */
function DeliveryPipeline({ dark, overview }: { dark: boolean; overview: DashboardOverview }) {
    const card = dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100';
    const stages = [
        { label: 'Pending', val: overview.pending_deliveries, color: '#f59e0b', icon: Ico.clock },
        { label: 'Processing', val: overview.processing_deliveries, color: '#3b82f6', icon: Ico.refresh },
        { label: 'Shipped', val: overview.shipped_deliveries, color: '#8b5cf6', icon: Ico.truck },
        { label: 'Delivered', val: overview.delivered_deliveries, color: '#10b981', icon: Ico.check },
        { label: 'Cancelled', val: overview.cancelled_deliveries, color: '#ef4444', icon: Ico.x },
    ];
    return (
        <div className={`rounded-xl border p-4 ${card} transition-colors duration-300`}>
            <h3 className={`text-sm font-bold mb-4 ${dark ? 'text-gray-100' : 'text-gray-800'}`}>Delivery Pipeline</h3>
            <div className="flex items-center justify-between relative">
                <div className={`absolute top-4 left-0 right-0 h-0.5 mx-6 ${dark ? 'bg-gray-800' : 'bg-gray-100'}`} />
                {stages.map((s, i) => (
                    <div key={i} className="flex flex-col items-center gap-1.5 z-10">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm relative"
                            style={{ background: s.val > 0 ? s.color + '20' : '', backgroundColor: s.val > 0 ? undefined : (dark ? '#1f2937' : '#f9fafb'), border: `2px solid ${s.val > 0 ? s.color : dark ? '#374151' : '#e5e7eb'}` }}>
                            <span style={{ color: s.val > 0 ? s.color : dark ? '#4b5563' : '#d1d5db' }}>{s.icon}</span>
                            {s.val > 0 && <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-white text-[9px] font-black flex items-center justify-center" style={{ background: s.color }}>{s.val}</span>}
                        </div>
                        <span className={`text-[9px] font-semibold ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{s.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ═══════════════════════════════ ORDERS TABLE ═══════════════════════════════ */
function OrdersTable({ dark, orders, onManageOrder }: { dark: boolean; orders: DashboardOrder[]; onManageOrder: (orderId: string) => void }) {
    const [filter, setFilter] = useState('All');
    const filtered = filter === 'All' ? orders : orders.filter((o) => o.status === filter.toLowerCase());
    const sColors: Record<string, string> = { confirmed: 'bg-emerald-100 text-emerald-700', pending: 'bg-amber-100 text-amber-700', rejected: 'bg-red-100 text-red-600' };
    const card = dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100';
    const rowH = dark ? 'hover:bg-gray-800 border-gray-800' : 'hover:bg-gray-50 border-gray-50';
    const th = dark ? 'text-gray-500 border-gray-800' : 'text-gray-400 border-gray-100';
    return (
        <div className={`rounded-xl border ${card} transition-colors duration-300`}>
            <div className="flex items-center justify-between p-4 pb-3">
                <h3 className={`text-sm font-bold ${dark ? 'text-gray-100' : 'text-gray-800'}`}>Recent Orders</h3>
                <div className="flex gap-1">
                    {['All', 'Confirmed', 'Pending'].map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`text-[10px] font-semibold px-2.5 py-1 rounded-full transition-all ${filter === f ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-600'}`}>{f}</button>
                    ))}
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className={`border-t text-[10px] font-semibold uppercase tracking-wide ${th}`}>
                            {['Order', 'Customer', 'Book', 'Amount', 'Status', 'Delivery', 'Action'].map(h => (
                                <th key={h} className="px-4 py-2 text-left">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(o => (
                            <tr key={o.id} className={`border-t transition-colors ${rowH}`}>
                                <td className="px-4 py-2.5 text-[11px] font-bold text-blue-500">{o.id}</td>
                                <td className={`px-4 py-2.5 text-[11px] ${dark ? 'text-gray-300' : 'text-gray-700'}`}>{o.customer}</td>
                                <td className={`px-4 py-2.5 text-[11px] ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{o.book}</td>
                                <td className={`px-4 py-2.5 text-[11px] font-bold font-mono ${dark ? 'text-gray-200' : 'text-gray-800'}`}>TK {o.amount}</td>
                                <td className="px-4 py-2.5"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sColors[o.status]}`}>{o.status}</span></td>
                                <td className="px-4 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">{o.delivery}</span></td>
                                <td className="px-4 py-2.5">
                                    <button onClick={() => onManageOrder(o.id)} className="text-[10px] font-semibold bg-blue-600 text-white px-2.5 py-1 rounded-full hover:bg-blue-700 transition">
                                        Manage Order
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {filtered.length === 0 && <p className="px-4 py-3 text-[11px] text-gray-400">No orders found.</p>}
        </div>
    );
}

/* ═══════════════════════════════ BOOKS TABLE ═══════════════════════════════ */
function BooksTable({
    dark,
    overview,
    books,
    onAddBook,
    onManageBook,
}: {
    dark: boolean;
    overview: DashboardOverview;
    books: DashboardBook[];
    onAddBook: () => void;
    onManageBook: (bookId: string) => void;
}) {
    const card = dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100';
    const th = dark ? 'text-gray-500 border-gray-800' : 'text-gray-400 border-gray-100';
    const rowH = dark ? 'hover:bg-gray-800 border-gray-800' : 'hover:bg-gray-50 border-gray-50';
    return (
        <div className={`rounded-xl border ${card} transition-colors duration-300`}>
            <div className="flex items-center justify-between p-4 pb-3">
                <h3 className={`text-sm font-bold ${dark ? 'text-gray-100' : 'text-gray-800'}`}>Book Inventory</h3>
                <div className="flex gap-2">
                    <span className="text-[10px] text-amber-600 bg-amber-50 font-bold px-2 py-1 rounded-full flex items-center gap-1">{Ico.warn}{overview.low_stock_books} Low Stock</span>
                    <button onClick={onAddBook} className="text-[10px] font-semibold bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700 transition">+ Add Book</button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className={`border-t text-[10px] font-semibold uppercase tracking-wide ${th}`}>
                            {['Image', 'Title', 'Author', 'Genre', 'Stock', 'Price', 'Orders', 'Status', 'Action'].map(h => <th key={h} className="px-4 py-2 text-left">{h}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {books.map(b => (
                            <tr key={b.id} className={`border-t transition-colors cursor-pointer ${rowH}`}>
                                <td className="px-4 py-3">
                                    {(b.thumbnail || b.image) ? (
                                        <img
                                            src={b.thumbnail || b.image}
                                            alt={b.title}
                                            className="w-9 h-12 rounded object-cover border border-gray-200"
                                        />
                                    ) : (
                                        <div className={`w-9 h-12 rounded border flex items-center justify-center text-[9px] font-bold ${dark ? 'border-gray-700 text-gray-500 bg-gray-800' : 'border-gray-200 text-gray-400 bg-gray-50'}`}>
                                            N/A
                                        </div>
                                    )}
                                </td>
                                <td className={`px-4 py-3 text-[11px] font-semibold ${dark ? 'text-gray-200' : 'text-gray-800'}`}>{b.title}</td>
                                <td className={`px-4 py-3 text-[11px] ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{b.author}</td>
                                <td className="px-4 py-3"><span className="text-[10px] bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded-full">{b.genre}</span></td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[11px] font-bold ${b.stock <= 3 ? 'text-amber-500' : 'text-gray-700'}`}>{b.stock}</span>
                                        <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full ${b.stock <= 3 ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${Math.min(100, (b.stock / 20) * 100)}%`, transition: 'width 1s ease' }} />
                                        </div>
                                    </div>
                                </td>
                                <td className={`px-4 py-3 text-[11px] font-mono font-bold ${dark ? 'text-gray-300' : 'text-gray-700'}`}>TK {b.price}</td>
                                <td className="px-4 py-3 text-[11px] font-bold text-blue-500">{b.orders}</td>
                                <td className="px-4 py-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.status === 'coming soon' ? 'bg-blue-100 text-blue-700' : b.status === 'out of stock' ? 'bg-amber-100 text-amber-700' : b.status === 'inactive' ? 'bg-gray-200 text-gray-700' : 'bg-emerald-100 text-emerald-700'}`}>{b.status}</span></td>
                                <td className="px-4 py-3">
                                    <button onClick={() => onManageBook(String(b.id))} className="text-[10px] font-semibold bg-blue-600 text-white px-2.5 py-1 rounded-full hover:bg-blue-700 transition">
                                        Manage Book
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {books.length === 0 && <p className="px-4 py-3 text-[11px] text-gray-400">No books found.</p>}
        </div>
    );
}

/* ═══════════════════════════════ CATEGORIES ═══════════════════════════════ */
function CategoriesSection({
    dark,
    categories,
    onCreateCategory,
    onManageCategory,
}: {
    dark: boolean;
    categories: DashboardCategory[];
    onCreateCategory: (payload: NewDashboardCategoryInput) => Promise<void>;
    onManageCategory: (categoryId: number) => void;
}) {
    const [form, setForm] = useState({
        name: '',
        slug: '',
        is_active: true,
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const card = dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100';
    const sec = dark ? 'border-gray-800' : 'border-gray-100';
    const tp = dark ? 'text-gray-100' : 'text-gray-800';
    const ts = dark ? 'text-gray-400' : 'text-gray-500';
    const inp = dark ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-700 placeholder-gray-400';

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;

        const name = form.name.trim();
        const slug = form.slug.trim();

        if (!name) {
            setError('Category name is required.');
            return;
        }

        setError('');
        setSuccess('');
        setSubmitting(true);

        try {
            await onCreateCategory({
                name,
                slug,
                is_active: form.is_active,
            });
            setForm({
                name: '',
                slug: '',
                is_active: true,
            });
            setSuccess(`Category "${name}" created.`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create category.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <form onSubmit={submit} className={`rounded-xl border p-4 lg:col-span-2 space-y-3 ${card}`}>
                <div>
                    <h3 className={`text-sm font-bold ${tp}`}>Create Category</h3>
                </div>

                <div>
                    <label className={`block text-[11px] font-semibold mb-1.5 ${ts}`}>Name</label>
                    <input
                        value={form.name}
                        onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="Science Fiction"
                        className={`w-full text-xs px-3 py-2.5 rounded-xl border outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition ${inp}`}
                    />
                </div>

                <div>
                    <label className={`block text-[11px] font-semibold mb-1.5 ${ts}`}>Slug (optional)</label>
                    <input
                        value={form.slug}
                        onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                        placeholder="science-fiction"
                        className={`w-full text-xs px-3 py-2.5 rounded-xl border outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition ${inp}`}
                    />
                </div>

                <label className={`flex items-center gap-2 text-xs font-semibold ${tp}`}>
                    <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                    />
                    is_active
                </label>

                {error && <p className="text-[11px] font-semibold text-red-500">{error}</p>}
                {success && <p className="text-[11px] font-semibold text-emerald-500">{success}</p>}

                <button
                    type="submit"
                    disabled={submitting}
                    className={`text-xs font-bold text-white bg-blue-600 px-5 py-2.5 rounded-xl hover:bg-blue-700 transition ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                    {submitting ? 'Creating...' : 'Create Category'}
                </button>
            </form>

            <div className={`rounded-xl border lg:col-span-3 ${card}`}>
                <div className={`flex items-center justify-between px-4 py-3 border-b ${sec}`}>
                    <h3 className={`text-sm font-bold ${tp}`}>Categories</h3>
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                        {categories.length} total
                    </span>
                </div>

                <div className="max-h-[290px] overflow-y-auto">
                    {categories.map((category) => (
                        <div key={category.id} className={`px-4 py-3 border-b ${sec}`}>
                            <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <p className={`text-xs font-bold ${tp}`}>{category.name}</p>
                                    <p className={`text-[11px] ${ts}`}>{category.slug || '-'}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${category.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-700'}`}>
                                        {category.is_active ? 'active' : 'inactive'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => onManageCategory(category.id)}
                                        className="text-[10px] font-semibold bg-blue-600 text-white px-2.5 py-1 rounded-full hover:bg-blue-700 transition"
                                    >
                                        Manage
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {categories.length === 0 && (
                    <p className="px-4 py-6 text-[11px] text-gray-400 text-center">No categories found.</p>
                )}
            </div>
        </div>
    );
}

/* ═══════════════════════════════ CALENDAR ═══════════════════════════════ */
function CalendarWidget({ dark, days, events }: { dark: boolean; days: DashboardCalendarDay[]; events: DashboardCalendarEvent[] }) {
    const [activeDay, setActiveDay] = useState<number | null>(null);
    const effectiveActiveDay = days.some((day) => day.d === activeDay) ? activeDay : (days[0]?.d ?? null);
    const card = dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100';
    const primaryEvents = events.slice(0, 2);
    return (
        <div className={`rounded-xl border p-4 ${card} transition-colors duration-300`}>
            <div className="flex items-center justify-between mb-3">
                <h3 className={`text-sm font-bold ${dark ? 'text-gray-100' : 'text-gray-800'}`}>Calendar</h3>
                <button className={`flex items-center gap-1 text-xs border rounded-full px-2.5 py-1 ${dark ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>March {Ico.chevD}</button>
            </div>
            <div className="flex gap-1 mb-3">
                {days.map(d => (
                    <button key={d.d} onClick={() => setActiveDay(d.d)}
                        className={`flex-1 flex flex-col items-center py-2 rounded-xl text-xs transition-all duration-200 ${effectiveActiveDay === d.d ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'text-gray-500 hover:bg-gray-50'}`}>
                        <span className="text-[9px] mb-0.5 opacity-70">{d.l}</span><span className="font-bold">{d.d}</span>
                    </button>
                ))}
            </div>
            <div className="space-y-2">
                {primaryEvents.map((event) => (
                    <div key={event.id} className={`border rounded-xl px-3 py-2.5 ${event.color === 'violet' ? (dark ? 'bg-violet-950 border-violet-800' : 'bg-violet-50 border-violet-200') : (dark ? 'bg-blue-950 border-blue-800' : 'bg-blue-50 border-blue-200')}`}>
                        <div className="flex items-center justify-between">
                            <span className={`text-[11px] font-bold ${event.color === 'violet' ? (dark ? 'text-violet-300' : 'text-violet-800') : (dark ? 'text-blue-300' : 'text-blue-800')}`}>{event.title}</span>
                            <span className={`text-[9px] ${event.color === 'violet' ? 'text-violet-500' : 'text-blue-500'}`}>{event.time}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="flex -space-x-1">
                                {event.attendees.slice(0, 3).map((attendee, i) => <div key={`${event.id}-${i}`} className={`w-4 h-4 rounded-full ${event.color === 'violet' ? 'bg-violet-500' : 'bg-blue-500'} border border-white text-white text-[7px] font-bold flex items-center justify-center`}>{attendee}</div>)}
                                {event.attendees.length > 3 && <div className="w-4 h-4 rounded-full bg-gray-200 border border-white text-gray-500 text-[7px] font-bold flex items-center justify-center">+{event.attendees.length - 3}</div>}
                            </div>
                            {event.duration && <span className={`text-[9px] ${event.color === 'violet' ? (dark ? 'text-violet-400' : 'text-violet-600') : (dark ? 'text-blue-400' : 'text-blue-600')} flex items-center gap-0.5`}>{Ico.clock} {event.duration}</span>}
                        </div>
                    </div>
                ))}
                {primaryEvents.length === 0 && <p className="text-[10px] text-gray-400">No upcoming calendar events.</p>}
            </div>
        </div>
    );
}

/* ═══════════════════════════════ QUICK STATS ═══════════════════════════════ */
function QuickStats({ dark, overview }: { dark: boolean; overview: DashboardOverview }) {
    const card = dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100';
    const items = [
        { label: 'Total Revenue', val: <>TK <AnimCount to={overview.total_revenue} dec={2} /></>, color: '#3b82f6', pct: 100, icon: Ico.trend },
        { label: 'Total Orders', val: <AnimCount to={overview.total_orders} />, color: '#10b981', pct: 50, icon: Ico.deals },
        { label: 'Total Books', val: <AnimCount to={overview.total_books} />, color: '#8b5cf6', pct: 100, icon: Ico.book },
        { label: 'Low Stock', val: <AnimCount to={overview.low_stock_books} />, color: '#f59e0b', pct: 33, icon: Ico.warn },
    ];
    return (
        <div className={`rounded-xl border p-4 ${card} transition-colors duration-300`}>
            <h3 className={`text-sm font-bold mb-3 ${dark ? 'text-gray-100' : 'text-gray-800'}`}>Quick Stats</h3>
            <div className="space-y-3">
                {items.map((it, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: it.color + '18' }}>
                            <span style={{ color: it.color }}>{it.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={`text-[10px] ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{it.label}</p>
                            <p className={`text-sm font-black font-mono ${dark ? 'text-white' : 'text-gray-900'}`}>{it.val}</p>
                        </div>
                        <Ring pct={it.pct} color={it.color} size={36} stroke={4} />
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ═══════════════════════════════ PROFILE FORM ═══════════════════════════════ */
function ProfileForm({ dark, onClose, user }: { dark: boolean; onClose: () => void; user: AuthUser | null }) {
    const [form, setForm] = useState({
        firstName: user?.username || '',
        lastName: '',
        email: user?.email || '',
        phone: '',
        role: user?.is_staff ? 'Admin' : 'User',
        company: '',
        timezone: 'UTC+6',
        bio: '',
    });
    const [avatar, setAvatar] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const bg = dark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200';
    const inp = dark ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400';
    const lbl = dark ? 'text-gray-300' : 'text-gray-600';
    const sec = dark ? 'border-gray-800' : 'border-gray-100';

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => { setSaved(false); onClose(); }, 1500);
    };
    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) { const r = new FileReader(); r.onload = ev => setAvatar(ev.target?.result as string); r.readAsDataURL(f); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative w-[520px] max-h-[90vh] rounded-2xl border shadow-2xl overflow-hidden flex flex-col ${bg}`}
                style={{ animation: 'fadeUp 0.3s ease' }}>
                {/* Header */}
                <div className={`flex items-center justify-between px-6 py-4 border-b ${sec}`}>
                    <div className="flex items-center gap-2">
                        <span className="text-blue-600">{Ico.edit}</span>
                        <span className={`font-bold text-base ${dark ? 'text-white' : 'text-gray-800'}`}>Edit Profile</span>
                    </div>
                    <button onClick={onClose} className={`w-7 h-7 rounded-lg flex items-center justify-center ${dark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-400 hover:bg-gray-100'} transition`}>{Ico.x}</button>
                </div>

                <div className="overflow-y-auto flex-1 px-6 py-5">
                    {/* Avatar */}
                    <div className="flex items-center gap-4 mb-6 pb-5 border-b" style={{ borderColor: dark ? '#1f2937' : '#f3f4f6' }}>
                        <div className="relative">
                            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-blue-500 flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600">
                                {avatar ? <img src={avatar} alt="Avatar" className="w-full h-full object-cover" /> :
                                    <span className="text-white text-xl font-black">{form.firstName[0]}{form.lastName[0]}</span>}
                            </div>
                            <button onClick={() => fileRef.current?.click()}
                                className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white text-white hover:bg-blue-700 transition shadow-sm">
                                <span className="scale-75">{Ico.camera}</span>
                            </button>
                            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
                        </div>
                        <div>
                            <p className={`text-sm font-bold ${dark ? 'text-white' : 'text-gray-800'}`}>{form.firstName} {form.lastName}</p>
                            <p className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{form.email}</p>
                            <span className="mt-1 inline-flex text-[10px] bg-blue-100 text-blue-600 font-bold px-2 py-0.5 rounded-full">{form.role}</span>
                        </div>
                    </div>

                    {/* Fields */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        {[['First Name', 'firstName'], ['Last Name', 'lastName']].map(([l, k]) => (
                            <div key={k}>
                                <label className={`block text-[11px] font-semibold mb-1.5 ${lbl}`}>{l}</label>
                                <input value={form[k as keyof typeof form]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                                    className={`w-full text-xs px-3 py-2.5 rounded-xl border outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition ${inp}`} />
                            </div>
                        ))}
                    </div>
                    <div className="mb-4">
                        <label className={`block text-[11px] font-semibold mb-1.5 ${lbl}`}>Email Address</label>
                        <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                            className={`w-full text-xs px-3 py-2.5 rounded-xl border outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition ${inp}`} />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        {[['Phone', 'phone'], ['Company', 'company']].map(([l, k]) => (
                            <div key={k}>
                                <label className={`block text-[11px] font-semibold mb-1.5 ${lbl}`}>{l}</label>
                                <input value={form[k as keyof typeof form]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                                    className={`w-full text-xs px-3 py-2.5 rounded-xl border outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition ${inp}`} />
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className={`block text-[11px] font-semibold mb-1.5 ${lbl}`}>Role</label>
                            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                                className={`w-full text-xs px-3 py-2.5 rounded-xl border outline-none focus:border-blue-400 transition ${inp}`}>
                                {['Admin', 'Editor', 'Viewer', 'Manager'].map(r => <option key={r}>{r}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={`block text-[11px] font-semibold mb-1.5 ${lbl}`}>Timezone</label>
                            <select value={form.timezone} onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}
                                className={`w-full text-xs px-3 py-2.5 rounded-xl border outline-none focus:border-blue-400 transition ${inp}`}>
                                {['UTC+0', 'UTC+3', 'UTC+5', 'UTC+6', 'UTC+8', 'UTC-5', 'UTC-8'].map(t => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="mb-2">
                        <label className={`block text-[11px] font-semibold mb-1.5 ${lbl}`}>Bio</label>
                        <textarea rows={3} value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                            className={`w-full text-xs px-3 py-2.5 rounded-xl border outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition resize-none ${inp}`} />
                    </div>
                </div>

                {/* Footer with Save */}
                <div className={`px-6 py-4 border-t flex items-center justify-between ${sec}`}>
                    <button onClick={onClose} className={`text-xs font-semibold px-4 py-2.5 rounded-xl border transition ${dark ? 'border-gray-700 text-gray-400 hover:bg-gray-800' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                        Cancel
                    </button>
                    <button onClick={handleSave}
                        className={`flex items-center gap-2 text-xs font-bold px-6 py-2.5 rounded-xl transition-all shadow-sm ${saved ? 'bg-emerald-500 shadow-emerald-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'} text-white`}>
                        {saved ? <>{Ico.check} Saved!</> : <>{Ico.save} Save Changes</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════ SETTINGS PANEL ═══════════════════════════════ */
function SettingsPanel({ dark, setDark, onClose }: { dark: boolean; setDark: (v: boolean) => void; onClose: () => void }) {
    const [notifs, setNotifs] = useState(true);
    const [emails, setEmails] = useState(false);
    const [compact, setCompact] = useState(false);
    const [auto, setAuto] = useState(true);
    const [currency, setCurrency] = useState('USD');
    const [language, setLanguage] = useState('English');
    const [saved, setSaved] = useState(false);
    const bg = dark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200';
    const sec = dark ? 'border-gray-800' : 'border-gray-100';
    const tp = dark ? 'text-gray-100' : 'text-gray-800';
    const ts = dark ? 'text-gray-400' : 'text-gray-500';
    const inp = dark ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-700';

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => { setSaved(false); onClose(); }, 1500);
    };

    return (
        <div className="fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className={`absolute right-0 top-0 h-full w-80 shadow-2xl border-l flex flex-col ${bg}`}
                style={{ animation: 'slideInRight 0.3s ease' }}>
                <div className={`flex items-center justify-between p-5 border-b ${sec}`}>
                    <div className="flex items-center gap-2"><span className="text-blue-600">{Ico.settings}</span><span className={`font-bold ${tp}`}>Settings</span></div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">{Ico.x}</button>
                </div>
                <div className="overflow-y-auto flex-1 p-5 space-y-6">
                    {/* Appearance */}
                    <div>
                        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-3">Appearance</p>
                        <div className={`flex items-center justify-between py-3 border-b ${sec}`}>
                            <div><p className={`text-xs font-semibold ${tp}`}>Dark Mode</p><p className={`text-[10px] ${ts}`}>Switch to dark theme</p></div>
                            <Toggle v={dark} onChange={setDark} />
                        </div>
                    </div>
                    {/* Notifications */}
                    <div>
                        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-3">Notifications</p>
                        {[
                            { label: 'Push Notifications', desc: 'Order & stock alerts', v: notifs, fn: setNotifs },
                            { label: 'Email Digest', desc: 'Daily summary', v: emails, fn: setEmails },
                            { label: 'Auto Refresh', desc: 'Live data updates', v: auto, fn: setAuto },
                        ].map(({ label, desc, v, fn }) => (
                            <div key={label} className={`flex items-center justify-between py-3 border-b ${sec}`}>
                                <div><p className={`text-xs font-semibold ${tp}`}>{label}</p><p className={`text-[10px] ${ts}`}>{desc}</p></div>
                                <Toggle v={v} onChange={fn} />
                            </div>
                        ))}
                    </div>
                    {/* Display */}
                    <div>
                        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-3">Display</p>
                        <div className={`flex items-center justify-between py-3 border-b ${sec}`}>
                            <div><p className={`text-xs font-semibold ${tp}`}>Compact View</p><p className={`text-[10px] ${ts}`}>Dense layout</p></div>
                            <Toggle v={compact} onChange={setCompact} />
                        </div>
                        <div className={`flex items-center justify-between py-3 border-b ${sec}`}>
                            <p className={`text-xs font-semibold ${tp}`}>Currency</p>
                            <select value={currency} onChange={e => setCurrency(e.target.value)} className={`text-xs border rounded-lg px-2 py-1 outline-none ${inp}`}>
                                {['USD', 'EUR', 'GBP', 'BDT', 'JPY'].map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className={`flex items-center justify-between py-3 border-b ${sec}`}>
                            <p className={`text-xs font-semibold ${tp}`}>Language</p>
                            <select value={language} onChange={e => setLanguage(e.target.value)} className={`text-xs border rounded-lg px-2 py-1 outline-none ${inp}`}>
                                {['English', 'Bangla', 'Spanish', 'French'].map(l => <option key={l}>{l}</option>)}
                            </select>
                        </div>
                    </div>
                    {/* Security */}
                    <div>
                        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-3">Security</p>
                        {['Change Password', 'Two-Factor Auth', 'Login History', 'Active Sessions'].map(item => (
                            <button key={item} className={`w-full flex items-center justify-between py-3 border-b text-xs font-medium text-left transition ${sec} ${dark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                                {item}<span className="text-gray-300">{Ico.chevR}</span>
                            </button>
                        ))}
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-2">Danger Zone</p>
                        <button className="w-full text-xs font-bold text-red-500 border border-red-200 rounded-xl py-2.5 hover:bg-red-50 transition">Delete Account</button>
                    </div>
                </div>
                {/* Save button */}
                <div className={`p-5 border-t ${sec}`}>
                    <button onClick={handleSave}
                        className={`w-full flex items-center justify-center gap-2 text-sm font-bold py-3 rounded-xl transition-all shadow-sm ${saved ? 'bg-emerald-500 shadow-emerald-200 text-white' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 text-white'}`}>
                        {saved ? <>{Ico.check} Settings Saved!</> : <>{Ico.save} Save Settings</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════ NOTIFICATION PANEL ═══════════════════════════════ */
function NotifPanel({ dark, onClose, notifications, onNotificationsChange }: { dark: boolean; onClose: () => void; notifications: DashboardNotification[]; onNotificationsChange: (next: DashboardNotification[]) => void }) {
    const markAll = () => onNotificationsChange(notifications.map((x) => ({ ...x, read: true })));
    const bg = dark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200';
    const row = dark ? 'hover:bg-gray-800 border-gray-800' : 'hover:bg-gray-50 border-gray-100';
    const icons: Record<string, ReactNode> = { order: Ico.deals, stock: Ico.warn, system: Ico.refresh };
    const clrs: Record<string, string> = { order: 'text-blue-500', stock: 'text-amber-500', system: 'text-emerald-500' };
    return (
        <div className="fixed inset-0 z-50" onClick={onClose}>
            <div className={`absolute right-4 top-14 w-72 rounded-2xl border shadow-2xl overflow-hidden ${bg}`} onClick={e => e.stopPropagation()}>
                <div className={`flex items-center justify-between px-4 py-3 border-b ${dark ? 'border-gray-800' : 'border-gray-100'}`}>
                    <span className={`text-sm font-bold ${dark ? 'text-white' : 'text-gray-800'}`}>Notifications</span>
                    <button onClick={markAll} className="text-[10px] font-semibold text-blue-500 hover:text-blue-600 transition">Mark all read</button>
                </div>
                <div className="max-h-72 overflow-y-auto">
                    {notifications.map(n => (
                        <div key={n.id} onClick={() => onNotificationsChange(notifications.map((x) => x.id === n.id ? { ...x, read: true } : x))}
                            className={`flex gap-3 px-4 py-3 border-b transition cursor-pointer ${row} ${!n.read ? (dark ? 'bg-blue-950' : 'bg-blue-50/60') : ''}`}>
                            <span className={`mt-0.5 flex-shrink-0 ${clrs[n.type] || 'text-blue-500'}`}>{icons[n.type] ?? Ico.refresh}</span>
                            <div className="flex-1 min-w-0">
                                <p className={`text-[11px] font-medium leading-snug ${dark ? 'text-gray-200' : 'text-gray-700'}`}>{n.msg}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">{n.time}</p>
                            </div>
                            {!n.read && <span className="w-2 h-2 bg-blue-500 rounded-full mt-1 flex-shrink-0" />}
                        </div>
                    ))}
                </div>
                {notifications.length === 0 && <p className="px-4 py-3 text-[11px] text-gray-400">No notifications available.</p>}
                <button onClick={onClose} className={`w-full text-[11px] font-semibold text-blue-500 py-2.5 hover:bg-gray-50 ${dark ? 'hover:bg-gray-800' : ''} transition`}>View all →</button>
            </div>
        </div>
    );
}

/* ═══════════════════════════════ HELP CENTER ═══════════════════════════════ */
/* ═══════════════════════════════ FAVORITES/PROJECTS MODALS ═══════════════════════════════ */
function ManageOrderModal({
    dark,
    onClose,
    orderId,
    token,
    onSaved,
}: {
    dark: boolean;
    onClose: () => void;
    orderId: string;
    token: string | null;
    onSaved: (orderId: string, orderStatus: string, deliveryStatus: string) => Promise<void>;
}) {
    const [detail, setDetail] = useState<DashboardOrderDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [orderStatus, setOrderStatus] = useState('');
    const [deliveryStatus, setDeliveryStatus] = useState('');

    const bg = dark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200';
    const sec = dark ? 'border-gray-800' : 'border-gray-100';
    const tp = dark ? 'text-gray-100' : 'text-gray-800';
    const ts = dark ? 'text-gray-400' : 'text-gray-500';
    const inp = dark ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-700';

    useEffect(() => {
        let active = true;

        const fetchOrder = async () => {
            if (!token) {
                if (active) {
                    setError('Missing admin token. Please sign in again.');
                    setLoading(false);
                }
                return;
            }

            setLoading(true);
            setError('');
            try {
                const detailUrl = `/orders/dashboard/${encodeURIComponent(orderId)}/`;
                const response = await apiClient.get<unknown>(detailUrl, {
                    cache: 'no-store',
                    headers: { Authorization: `Token ${token}` },
                });

                if (!active) return;

                const normalized = normalizeOrderDetail(response);
                if (!normalized) {
                    setError('Failed to read order details.');
                    setLoading(false);
                    return;
                }

                setDetail(normalized);
                setOrderStatus(normalized.status);
                setDeliveryStatus(normalized.delivery);
            } catch (err) {
                if (!active) return;
                setError(err instanceof Error ? err.message : 'Failed to load order details.');
            } finally {
                if (active) setLoading(false);
            }
        };

        void fetchOrder();
        return () => { active = false; };
    }, [orderId, token]);

    const orderStatusOptions = Array.from(new Set(['pending', 'confirmed', 'rejected', orderStatus].filter(Boolean)));
    const deliveryStatusOptions = Array.from(new Set(['pending', 'processing', 'shipped', 'delivered', 'cancelled', deliveryStatus].filter(Boolean)));

    const save = async () => {
        if (!detail) return;
        if (!token) {
            setError('Missing admin token. Please sign in again.');
            return;
        }

        const payload: Record<string, string> = {};
        if (orderStatus && orderStatus !== detail.status) payload.order_status = orderStatus;
        if (deliveryStatus && deliveryStatus !== detail.delivery) payload.delivery_status = deliveryStatus;

        if (!Object.keys(payload).length) {
            onClose();
            return;
        }

        setSaving(true);
        setError('');
        try {
            const statusUrl = `/orders/dashboard/${encodeURIComponent(detail.id)}/status/`;
            try {
                await apiClient.patch<unknown, Record<string, string>>(statusUrl, payload, {
                    cache: 'no-store',
                    headers: { Authorization: `Token ${token}` },
                });
            } catch {
                await apiClient.put<unknown, Record<string, string>>(statusUrl, payload, {
                    cache: 'no-store',
                    headers: { Authorization: `Token ${token}` },
                });
            }

            await onSaved(detail.id, orderStatus || detail.status, deliveryStatus || detail.delivery);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update order status.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden ${bg}`} style={{ animation: 'fadeUp 0.3s ease' }}>
                <div className={`flex items-center justify-between px-5 py-4 border-b ${sec}`}>
                    <div className="flex items-center gap-2">
                        <span className="text-blue-500">{Ico.package}</span>
                        <span className={`font-bold ${tp}`}>Manage Order</span>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">{Ico.x}</button>
                </div>

                <div className="p-5 space-y-4">
                    {loading && <p className={`text-xs ${ts}`}>Loading order details...</p>}
                    {!loading && detail && (
                        <>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div><p className={`${ts}`}>Order</p><p className={`font-semibold ${tp}`}>{detail.id}</p></div>
                                <div><p className={`${ts}`}>Customer</p><p className={`font-semibold ${tp}`}>{detail.customer}</p></div>
                                <div><p className={`${ts}`}>Amount</p><p className={`font-semibold ${tp}`}>TK {detail.amount}</p></div>
                                <div><p className={`${ts}`}>Items</p><p className={`font-semibold ${tp}`}>{detail.items}</p></div>
                                <div><p className={`${ts}`}>Email</p><p className={`font-semibold ${tp}`}>{detail.email || 'N/A'}</p></div>
                                <div><p className={`${ts}`}>Phone</p><p className={`font-semibold ${tp}`}>{detail.phone || 'N/A'}</p></div>
                                <div className="col-span-2"><p className={`${ts}`}>Address</p><p className={`font-semibold ${tp}`}>{detail.address || 'N/A'}</p></div>
                            </div>

                            <div className={`grid grid-cols-2 gap-3 pt-3 border-t ${sec}`}>
                                <div>
                                    <label className={`block text-[11px] font-semibold mb-1.5 ${ts}`}>Order Status</label>
                                    <select value={orderStatus} onChange={(e) => setOrderStatus(e.target.value)} className={`w-full text-xs px-3 py-2.5 rounded-xl border outline-none focus:border-blue-400 transition ${inp}`}>
                                        {orderStatusOptions.map((status) => <option key={`order-${status}`} value={status}>{status}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={`block text-[11px] font-semibold mb-1.5 ${ts}`}>Delivery Status</label>
                                    <select value={deliveryStatus} onChange={(e) => setDeliveryStatus(e.target.value)} className={`w-full text-xs px-3 py-2.5 rounded-xl border outline-none focus:border-blue-400 transition ${inp}`}>
                                        {deliveryStatusOptions.map((status) => <option key={`delivery-${status}`} value={status}>{status}</option>)}
                                    </select>
                                </div>
                            </div>
                        </>
                    )}

                    {error && <p className="text-[11px] font-semibold text-red-500">{error}</p>}
                </div>

                <div className={`px-5 py-4 border-t flex items-center justify-end gap-2 ${sec}`}>
                    <button onClick={onClose} disabled={saving} className={`text-xs font-semibold px-4 py-2.5 rounded-xl border transition ${dark ? 'border-gray-700 text-gray-400 hover:bg-gray-800' : 'border-gray-200 text-gray-500 hover:bg-gray-50'} ${saving ? 'opacity-60 cursor-not-allowed' : ''}`}>Close</button>
                    <button onClick={save} disabled={loading || saving || !detail} className={`text-xs font-bold text-white bg-blue-600 px-5 py-2.5 rounded-xl hover:bg-blue-700 transition ${(loading || saving || !detail) ? 'opacity-70 cursor-not-allowed' : ''}`}>
                        {saving ? 'Updating...' : 'Update Status'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function ManageCategoryModal({
    dark,
    onClose,
    category,
    onSubmit,
}: {
    dark: boolean;
    onClose: () => void;
    category: DashboardCategory;
    onSubmit: (categoryId: number, payload: UpdateDashboardCategoryInput) => Promise<void>;
}) {
    const [name, setName] = useState(category.name);
    const [isActive, setIsActive] = useState(category.is_active);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const bg = dark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200';
    const sec = dark ? 'border-gray-800' : 'border-gray-100';
    const tp = dark ? 'text-gray-100' : 'text-gray-800';
    const ts = dark ? 'text-gray-400' : 'text-gray-500';
    const inp = dark ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-700 placeholder-gray-400';

    useEffect(() => {
        setName(category.name);
        setIsActive(category.is_active);
        setError('');
    }, [category]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;

        const trimmedName = name.trim();
        if (!trimmedName) {
            setError('Category name is required.');
            return;
        }

        setSubmitting(true);
        setError('');
        try {
            await onSubmit(category.id, {
                name: trimmedName,
                is_active: isActive,
            });
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update category.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <form onSubmit={submit} className={`relative w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden ${bg}`} style={{ animation: 'fadeUp 0.3s ease' }}>
                <div className={`flex items-center justify-between px-5 py-4 border-b ${sec}`}>
                    <div className="flex items-center gap-2">
                        <span className="text-blue-500">{Ico.edit}</span>
                        <span className={`font-bold ${tp}`}>Manage Category</span>
                    </div>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">{Ico.x}</button>
                </div>

                <div className="p-5 space-y-4">
                    <div>
                        <label className={`block text-[11px] font-semibold mb-1.5 ${ts}`}>Name</label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Sci-Fi"
                            className={`w-full text-xs px-3 py-2.5 rounded-xl border outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition ${inp}`}
                        />
                    </div>

                    <div>
                        <label className={`block text-[11px] font-semibold mb-1.5 ${ts}`}>Slug</label>
                        <p className={`text-xs font-semibold ${tp}`}>{category.slug || '-'}</p>
                    </div>

                    <label className={`flex items-center gap-2 text-xs font-semibold ${tp}`}>
                        <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                        />
                        is_active
                    </label>

                    {error && <p className="text-[11px] font-semibold text-red-500">{error}</p>}
                </div>

                <div className={`px-5 py-4 border-t flex items-center justify-end gap-2 ${sec}`}>
                    <button type="button" onClick={onClose} disabled={submitting} className={`text-xs font-semibold px-4 py-2.5 rounded-xl border transition ${dark ? 'border-gray-700 text-gray-400 hover:bg-gray-800' : 'border-gray-200 text-gray-500 hover:bg-gray-50'} ${submitting ? 'opacity-60 cursor-not-allowed' : ''}`}>
                        Cancel
                    </button>
                    <button type="submit" disabled={submitting} className={`text-xs font-bold text-white bg-blue-600 px-5 py-2.5 rounded-xl hover:bg-blue-700 transition ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}>
                        {submitting ? 'Updating...' : 'Update Category'}
                    </button>
                </div>
            </form>
        </div>
    );
}

function ManageBookModal({
    dark,
    onClose,
    bookId,
    token,
    categoryOptions,
    authorOptions,
    onSaved,
}: {
    dark: boolean;
    onClose: () => void;
    bookId: string;
    token: string | null;
    categoryOptions: NamedOption[];
    authorOptions: NamedOption[];
    onSaved: () => Promise<void>;
}) {
    const [detail, setDetail] = useState<DashboardBookManageDetail | null>(null);
    const [initialDetail, setInitialDetail] = useState<DashboardBookManageDetail | null>(null);
    const [form, setForm] = useState({
        categoryId: '',
        title: '',
        authorId: '',
        description: '',
        price: '0.00',
        stock_quantity: '0',
        is_coming_soon: false,
        is_active: true,
        imageFile: null as File | null,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deactivating, setDeactivating] = useState(false);
    const [error, setError] = useState('');

    const bg = dark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200';
    const sec = dark ? 'border-gray-800' : 'border-gray-100';
    const tp = dark ? 'text-gray-100' : 'text-gray-800';
    const ts = dark ? 'text-gray-400' : 'text-gray-500';
    const inp = dark ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-700 placeholder-gray-400';

    const applyDetail = useCallback((next: DashboardBookManageDetail) => {
        setDetail(next);
        setInitialDetail(next);
        setForm({
            categoryId: String(next.category),
            title: next.title,
            authorId: String(next.author),
            description: next.description,
            price: next.price,
            stock_quantity: String(next.stock_quantity),
            is_coming_soon: next.is_coming_soon,
            is_active: next.is_active,
            imageFile: null,
        });
    }, []);

    useEffect(() => {
        let active = true;

        const fetchBook = async () => {
            if (!token) {
                if (active) {
                    setError('Missing admin token. Please sign in again.');
                    setLoading(false);
                }
                return;
            }

            setLoading(true);
            setError('');
            try {
                const booksBaseUrl = resolveEndpoint(() => endpoints.books.dashboardList, '/books/dashboard/');
                const detailUrl = appendResourceId(booksBaseUrl, bookId);
                const response = await apiClient.get<unknown>(detailUrl, {
                    cache: 'no-store',
                    headers: { Authorization: `Token ${token}` },
                });

                if (!active) return;

                const normalized = normalizeBookManageDetail(response);
                if (!normalized) {
                    setError('Failed to read book details.');
                    setLoading(false);
                    return;
                }

                applyDetail(normalized);
            } catch (err) {
                if (!active) return;
                setError(err instanceof Error ? err.message : 'Failed to load book details.');
            } finally {
                if (active) setLoading(false);
            }
        };

        void fetchBook();
        return () => { active = false; };
    }, [applyDetail, bookId, token]);

    const effectiveCategoryOptions = detail && detail.categoryName && !categoryOptions.some((option) => option.id === detail.category)
        ? dedupeNamedOptions([{ id: detail.category, name: detail.categoryName }, ...categoryOptions])
        : categoryOptions;
    const effectiveAuthorOptions = detail && detail.authorName && !authorOptions.some((option) => option.id === detail.author)
        ? dedupeNamedOptions([{ id: detail.author, name: detail.authorName }, ...authorOptions])
        : authorOptions;

    const buildPayload = (): NewDashboardBookInput => {
        const category = Number(form.categoryId);
        const author = Number(form.authorId);
        const title = form.title.trim();
        const description = form.description.trim();
        const price = Number(form.price);
        const stockQuantity = Number(form.stock_quantity);

        if (!Number.isInteger(category) || category <= 0) {
            throw new Error('Select a valid category.');
        }
        if (!title) {
            throw new Error('Title is required.');
        }
        if (!Number.isInteger(author) || author <= 0) {
            throw new Error('Select a valid author.');
        }
        if (!description) {
            throw new Error('Description is required.');
        }
        if (!Number.isFinite(price) || price <= 0) {
            throw new Error('Price must be greater than 0.');
        }
        if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
            throw new Error('Stock quantity must be 0 or greater.');
        }

        return {
            category,
            title,
            slug: detail?.slug ?? '',
            author,
            description,
            price: price.toFixed(2),
            stock_quantity: stockQuantity,
            is_coming_soon: form.is_coming_soon,
            is_active: form.is_active,
            imageFile: form.imageFile,
        };
    };

    const withDetailUrl = (): string => {
        const booksBaseUrl = resolveEndpoint(() => endpoints.books.dashboardList, '/books/dashboard/');
        const currentId = detail?.id ?? bookId;
        return appendResourceId(booksBaseUrl, currentId);
    };

    const save = async () => {
        if (!token) {
            setError('Missing admin token. Please sign in again.');
            return;
        }
        if (!detail || !initialDetail) return;

        try {
            setError('');
            const payload = buildPayload();
            const patchPayload: Partial<NewDashboardBookInput> = {};
            if (payload.category !== initialDetail.category) patchPayload.category = payload.category;
            if (payload.title !== initialDetail.title) patchPayload.title = payload.title;
            if (payload.slug !== initialDetail.slug) patchPayload.slug = payload.slug;
            if (payload.author !== initialDetail.author) patchPayload.author = payload.author;
            if (payload.description !== initialDetail.description) patchPayload.description = payload.description;
            if (payload.price !== initialDetail.price) patchPayload.price = payload.price;
            if (payload.stock_quantity !== initialDetail.stock_quantity) patchPayload.stock_quantity = payload.stock_quantity;
            if (payload.is_coming_soon !== initialDetail.is_coming_soon) patchPayload.is_coming_soon = payload.is_coming_soon;
            if (payload.is_active !== initialDetail.is_active) patchPayload.is_active = payload.is_active;

            if (!Object.keys(patchPayload).length && !payload.imageFile) {
                onClose();
                return;
            }

            setSaving(true);

            const doPatch = async () => {
                if (payload.imageFile) {
                    const formData = new FormData();
                    Object.entries(patchPayload).forEach(([key, value]) => {
                        if (value === undefined || value === null) return;
                        formData.append(key, typeof value === 'boolean' ? String(value) : String(value));
                    });
                    formData.append('image', payload.imageFile);
                    return apiClient.request<unknown>(
                        withDetailUrl(),
                        {
                            method: 'PATCH',
                            cache: 'no-store',
                            headers: { Authorization: `Token ${token}` },
                            body: formData,
                        },
                    );
                }

                return apiClient.patch<unknown, Partial<NewDashboardBookInput>>(
                    withDetailUrl(),
                    patchPayload,
                    {
                        cache: 'no-store',
                        headers: { Authorization: `Token ${token}` },
                    },
                );
            };

            const doPut = async () => {
                if (payload.imageFile) {
                    const formData = new FormData();
                    formData.append('category', String(payload.category));
                    formData.append('title', payload.title);
                    formData.append('slug', payload.slug);
                    formData.append('author', String(payload.author));
                    formData.append('description', payload.description);
                    formData.append('price', payload.price);
                    formData.append('stock_quantity', String(payload.stock_quantity));
                    formData.append('is_coming_soon', String(payload.is_coming_soon));
                    formData.append('is_active', String(payload.is_active));
                    formData.append('image', payload.imageFile);
                    return apiClient.request<unknown>(
                        withDetailUrl(),
                        {
                            method: 'PUT',
                            cache: 'no-store',
                            headers: { Authorization: `Token ${token}` },
                            body: formData,
                        },
                    );
                }

                return apiClient.put<unknown, NewDashboardBookInput>(
                    withDetailUrl(),
                    payload,
                    {
                        cache: 'no-store',
                        headers: { Authorization: `Token ${token}` },
                    },
                );
            };

            let updated: unknown;
            try {
                updated = await doPatch();
            } catch {
                updated = await doPut();
            }

            const normalizedUpdated = normalizeBookManageDetail(updated);
            if (normalizedUpdated) {
                applyDetail(normalizedUpdated);
            }
            await onSaved();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save the book.');
        } finally {
            setSaving(false);
        }
    };

    const deactivate = async () => {
        if (!token) {
            setError('Missing admin token. Please sign in again.');
            return;
        }
        if (!detail) return;

        setDeactivating(true);
        setError('');
        try {
            const deactivateUrl = `${withDetailUrl()}deactivate/`;
            await apiClient.patch<unknown, Record<string, never>>(
                deactivateUrl,
                {},
                {
                    cache: 'no-store',
                    headers: { Authorization: `Token ${token}` },
                },
            );
            await onSaved();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to deactivate the book.');
        } finally {
            setDeactivating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden ${bg}`} style={{ animation: 'fadeUp 0.3s ease' }}>
                <div className={`flex items-center justify-between px-5 py-4 border-b ${sec}`}>
                    <div className="flex items-center gap-2">
                        <span className="text-blue-500">{Ico.book}</span>
                        <span className={`font-bold ${tp}`}>Manage Book</span>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">{Ico.x}</button>
                </div>

                <div className="p-5 space-y-4">
                    {loading && <p className={`text-xs ${ts}`}>Loading book details...</p>}
                    {!loading && detail && (
                        <>
                            <div className={`grid grid-cols-2 gap-3 text-xs pb-3 border-b ${sec}`}>
                                <div><p className={`${ts}`}>Book ID</p><p className={`font-semibold ${tp}`}>{detail.id}</p></div>
                                <div><p className={`${ts}`}>Slug</p><p className={`font-semibold ${tp}`}>{detail.slug || '-'}</p></div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2">
                                    <label className={`block text-[11px] font-semibold mb-1.5 ${ts}`}>Title</label>
                                    <input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} className={`w-full text-xs px-3 py-2.5 rounded-xl border outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition ${inp}`} />
                                </div>
                                <div>
                                    <label className={`block text-[11px] font-semibold mb-1.5 ${ts}`}>Category</label>
                                    <select value={form.categoryId} onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))} disabled={effectiveCategoryOptions.length === 0} className={`w-full text-xs px-3 py-2.5 rounded-xl border outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition ${inp}`}>
                                        <option value="" disabled>{effectiveCategoryOptions.length ? 'Select category' : 'No categories available'}</option>
                                        {effectiveCategoryOptions.map((option) => (
                                            <option key={`manage-book-category-${option.id}`} value={String(option.id)}>{option.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className={`block text-[11px] font-semibold mb-1.5 ${ts}`}>Author</label>
                                    <select value={form.authorId} onChange={(e) => setForm((prev) => ({ ...prev, authorId: e.target.value }))} disabled={effectiveAuthorOptions.length === 0} className={`w-full text-xs px-3 py-2.5 rounded-xl border outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition ${inp}`}>
                                        <option value="" disabled>{effectiveAuthorOptions.length ? 'Select author' : 'No authors available'}</option>
                                        {effectiveAuthorOptions.map((option) => (
                                            <option key={`manage-book-author-${option.id}`} value={String(option.id)}>{option.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className={`block text-[11px] font-semibold mb-1.5 ${ts}`}>Description</label>
                                    <textarea rows={3} value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} className={`w-full text-xs px-3 py-2.5 rounded-xl border outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition resize-none ${inp}`} />
                                </div>
                                <div>
                                    <label className={`block text-[11px] font-semibold mb-1.5 ${ts}`}>Price</label>
                                    <input type="number" min={0.01} step="0.01" value={form.price} onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))} className={`w-full text-xs px-3 py-2.5 rounded-xl border outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition ${inp}`} />
                                </div>
                                <div>
                                    <label className={`block text-[11px] font-semibold mb-1.5 ${ts}`}>Stock Quantity</label>
                                    <input type="number" min={0} value={form.stock_quantity} onChange={(e) => setForm((prev) => ({ ...prev, stock_quantity: e.target.value }))} className={`w-full text-xs px-3 py-2.5 rounded-xl border outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition ${inp}`} />
                                </div>
                                <div className="col-span-2">
                                    <label className={`block text-[11px] font-semibold mb-1.5 ${ts}`}>Image Upload (optional)</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setForm((prev) => ({ ...prev, imageFile: e.target.files?.[0] ?? null }))}
                                        className={`w-full text-xs px-3 py-2 rounded-xl border outline-none ${inp}`}
                                    />
                                    {form.imageFile && <p className={`text-[10px] mt-1 ${ts}`}>{form.imageFile.name}</p>}
                                </div>
                                <label className={`col-span-1 flex items-center gap-2 text-xs font-semibold ${tp}`}>
                                    <input type="checkbox" checked={form.is_coming_soon} onChange={(e) => setForm((prev) => ({ ...prev, is_coming_soon: e.target.checked }))} />
                                    is_coming_soon
                                </label>
                                <label className={`col-span-1 flex items-center gap-2 text-xs font-semibold ${tp}`}>
                                    <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))} />
                                    is_active
                                </label>
                            </div>
                        </>
                    )}

                    {error && <p className="text-[11px] font-semibold text-red-500">{error}</p>}
                </div>

                <div className={`px-5 py-4 border-t flex items-center justify-between gap-2 ${sec}`}>
                    <button onClick={deactivate} disabled={loading || !detail || deactivating || saving} className={`text-xs font-bold px-4 py-2.5 rounded-xl border border-red-300 text-red-600 hover:bg-red-50 transition ${(loading || !detail || deactivating || saving) ? 'opacity-60 cursor-not-allowed' : ''}`}>
                        {deactivating ? 'Deactivating...' : 'Deactivate'}
                    </button>
                    <div className="flex items-center gap-2">
                        <button onClick={onClose} disabled={saving || deactivating} className={`text-xs font-semibold px-4 py-2.5 rounded-xl border transition ${dark ? 'border-gray-700 text-gray-400 hover:bg-gray-800' : 'border-gray-200 text-gray-500 hover:bg-gray-50'} ${(saving || deactivating) ? 'opacity-60 cursor-not-allowed' : ''}`}>Cancel</button>
                        <button onClick={save} disabled={loading || !detail || saving || deactivating} className={`text-xs font-bold text-white bg-blue-600 px-5 py-2.5 rounded-xl hover:bg-blue-700 transition ${(loading || !detail || saving || deactivating) ? 'opacity-70 cursor-not-allowed' : ''}`}>
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function AddBookModal({
    dark,
    onClose,
    onSubmit,
    categoryOptions,
    authorOptions,
}: {
    dark: boolean;
    onClose: () => void;
    onSubmit: (payload: NewDashboardBookInput) => Promise<void>;
    categoryOptions: NamedOption[];
    authorOptions: NamedOption[];
}) {
    const [form, setForm] = useState({
        categoryId: '',
        title: '',
        slug: '',
        authorId: '',
        description: '',
        price: '0.00',
        stock_quantity: '0',
        is_coming_soon: false,
        is_active: true,
        imageFile: null as File | null,
    });
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const bg = dark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200';
    const sec = dark ? 'border-gray-800' : 'border-gray-100';
    const tp = dark ? 'text-gray-100' : 'text-gray-800';
    const lbl = dark ? 'text-gray-400' : 'text-gray-500';
    const inp = dark ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-700 placeholder-gray-400';

    useEffect(() => {
        setForm((prev) => ({
            ...prev,
            categoryId: categoryOptions.some((option) => String(option.id) === prev.categoryId)
                ? prev.categoryId
                : (categoryOptions[0] ? String(categoryOptions[0].id) : ''),
            authorId: authorOptions.some((option) => String(option.id) === prev.authorId)
                ? prev.authorId
                : (authorOptions[0] ? String(authorOptions[0].id) : ''),
        }));
    }, [categoryOptions, authorOptions]);

    const updateText = (key: 'categoryId' | 'title' | 'slug' | 'authorId' | 'description' | 'price' | 'stock_quantity', value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const updateBoolean = (key: 'is_coming_soon' | 'is_active', value: boolean) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;

        setError('');
        const category = Number(form.categoryId);
        const title = form.title.trim();
        const slug = form.slug.trim();
        const author = Number(form.authorId);
        const description = form.description.trim();
        const price = Number(form.price);
        const stockQuantity = Number(form.stock_quantity);

        if (!Number.isInteger(category) || category <= 0) {
            setError('Select a category from the backend list.');
            return;
        }
        if (!title) {
            setError('Title is required.');
            return;
        }
        if (!Number.isInteger(author) || author <= 0) {
            setError('Select an author from the backend list.');
            return;
        }
        if (!description) {
            setError('Description is required.');
            return;
        }
        if (!Number.isFinite(price) || price <= 0) {
            setError('Price must be greater than 0.');
            return;
        }
        if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
            setError('Stock quantity must be 0 or greater.');
            return;
        }

        try {
            setSubmitting(true);
            await onSubmit({
                category,
                title,
                slug,
                author,
                description,
                price: price.toFixed(2),
                stock_quantity: stockQuantity,
                is_coming_soon: form.is_coming_soon,
                is_active: form.is_active,
                imageFile: form.imageFile,
            });
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create the book.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <form onSubmit={submit} className={`relative w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden ${bg}`} style={{ animation: 'fadeUp 0.3s ease' }}>
                <div className={`flex items-center justify-between px-5 py-4 border-b ${sec}`}>
                    <div className="flex items-center gap-2">
                        <span className="text-blue-500">{Ico.book}</span>
                        <span className={`font-bold ${tp}`}>Add Book</span>
                    </div>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">{Ico.x}</button>
                </div>
                <div className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                            <label className={`block text-[11px] font-semibold mb-1.5 ${lbl}`}>Title</label>
                            <input value={form.title} onChange={(e) => updateText('title', e.target.value)} placeholder="Book title"
                                className={`w-full text-xs px-3 py-2.5 rounded-xl border outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition ${inp}`} />
                        </div>
                        <div className="col-span-2">
                            <label className={`block text-[11px] font-semibold mb-1.5 ${lbl}`}>Slug (optional)</label>
                            <input value={form.slug} onChange={(e) => updateText('slug', e.target.value)} placeholder="sample-book"
                                className={`w-full text-xs px-3 py-2.5 rounded-xl border outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition ${inp}`} />
                        </div>
                        <div>
                            <label className={`block text-[11px] font-semibold mb-1.5 ${lbl}`}>Category</label>
                            <select value={form.categoryId} onChange={(e) => updateText('categoryId', e.target.value)} disabled={categoryOptions.length === 0}
                                className={`w-full text-xs px-3 py-2.5 rounded-xl border outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition ${inp} ${categoryOptions.length === 0 ? 'opacity-70 cursor-not-allowed' : ''}`}>
                                <option value="" disabled>{categoryOptions.length ? 'Select category' : 'No categories from backend'}</option>
                                {categoryOptions.map((option) => (
                                    <option key={`category-${option.id}`} value={String(option.id)}>{option.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={`block text-[11px] font-semibold mb-1.5 ${lbl}`}>Author</label>
                            <select value={form.authorId} onChange={(e) => updateText('authorId', e.target.value)} disabled={authorOptions.length === 0}
                                className={`w-full text-xs px-3 py-2.5 rounded-xl border outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition ${inp} ${authorOptions.length === 0 ? 'opacity-70 cursor-not-allowed' : ''}`}>
                                <option value="" disabled>{authorOptions.length ? 'Select author' : 'No authors from backend'}</option>
                                {authorOptions.map((option) => (
                                    <option key={`author-${option.id}`} value={String(option.id)}>{option.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label className={`block text-[11px] font-semibold mb-1.5 ${lbl}`}>Description</label>
                            <textarea rows={3} value={form.description} onChange={(e) => updateText('description', e.target.value)} placeholder="A practical guide to building good habits."
                                className={`w-full text-xs px-3 py-2.5 rounded-xl border outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition resize-none ${inp}`} />
                        </div>
                        <div>
                            <label className={`block text-[11px] font-semibold mb-1.5 ${lbl}`}>Price</label>
                            <input type="number" min={0.01} step="0.01" value={form.price} onChange={(e) => updateText('price', e.target.value)}
                                className={`w-full text-xs px-3 py-2.5 rounded-xl border outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition ${inp}`} />
                        </div>
                        <div>
                            <label className={`block text-[11px] font-semibold mb-1.5 ${lbl}`}>Stock Quantity</label>
                            <input type="number" min={0} value={form.stock_quantity} onChange={(e) => updateText('stock_quantity', e.target.value)}
                                className={`w-full text-xs px-3 py-2.5 rounded-xl border outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition ${inp}`} />
                        </div>
                        <div>
                            <label className={`block text-[11px] font-semibold mb-1.5 ${lbl}`}>Image</label>
                            <input type="file" accept="image/*" onChange={(e) => setForm((prev) => ({ ...prev, imageFile: e.target.files?.[0] ?? null }))}
                                className={`w-full text-xs px-3 py-2 rounded-xl border outline-none ${inp}`} />
                        </div>
                        <label className={`col-span-1 flex items-center gap-2 text-xs font-medium ${tp}`}>
                            <input type="checkbox" checked={form.is_coming_soon} onChange={(e) => updateBoolean('is_coming_soon', e.target.checked)} />
                            is_coming_soon
                        </label>
                        <label className={`col-span-1 flex items-center gap-2 text-xs font-medium ${tp}`}>
                            <input type="checkbox" checked={form.is_active} onChange={(e) => updateBoolean('is_active', e.target.checked)} />
                            is_active
                        </label>
                    </div>
                    {error && <p className="text-[11px] font-semibold text-red-500">{error}</p>}
                </div>
                <div className={`px-5 py-4 border-t flex items-center justify-end gap-2 ${sec}`}>
                    <button type="button" onClick={onClose} disabled={submitting} className={`text-xs font-semibold px-4 py-2.5 rounded-xl border transition ${dark ? 'border-gray-700 text-gray-400 hover:bg-gray-800' : 'border-gray-200 text-gray-500 hover:bg-gray-50'} ${submitting ? 'opacity-60 cursor-not-allowed' : ''}`}>Cancel</button>
                    <button type="submit" disabled={submitting} className={`text-xs font-bold text-white bg-blue-600 px-5 py-2.5 rounded-xl hover:bg-blue-700 transition ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}>{submitting ? 'Creating...' : 'Create Book'}</button>
                </div>
            </form>
        </div>
    );
}

function FavoritesModal({ dark, onClose, initialItems }: { dark: boolean; onClose: () => void; initialItems: DashboardFavorite[] }) {
    const [items, setItems] = useState<DashboardFavorite[]>(initialItems);
    useEffect(() => {
        setItems(initialItems);
    }, [initialItems]);
    const [adding, setAdding] = useState(false);
    const [newName, setNewName] = useState('');
    const bg = dark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200';
    const sec = dark ? 'border-gray-800' : 'border-gray-100';
    const tp = dark ? 'text-gray-100' : 'text-gray-800';
    const ts = dark ? 'text-gray-400' : 'text-gray-500';
    const add = () => {
        if (!newName.trim()) return;
        setItems(p => [...p, { id: Date.now(), label: newName, color: 'bg-gray-400' }]);
        setNewName(''); setAdding(false);
    };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative w-80 rounded-2xl border shadow-2xl overflow-hidden ${bg}`} style={{ animation: 'fadeUp 0.3s ease' }}>
                <div className={`flex items-center justify-between px-5 py-4 border-b ${sec}`}>
                    <div className="flex items-center gap-2"><span className="text-yellow-500">{Ico.star}</span><span className={`font-bold ${tp}`}>Favorites</span></div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">{Ico.x}</button>
                </div>
                <div className="px-5 py-4 space-y-2 max-h-64 overflow-y-auto">
                    {items.map(it => (
                        <div key={it.id} className={`flex items-center gap-3 p-2.5 rounded-xl border transition ${dark ? 'border-gray-800 hover:bg-gray-800' : 'border-gray-100 hover:bg-gray-50'}`}>
                            <span className={`w-2 h-2 rounded-full ${it.color}`} />
                            <span className={`flex-1 text-xs font-medium ${tp}`}>{it.label}</span>
                            <button onClick={() => setItems(p => p.filter(x => x.id !== it.id))} className="text-gray-300 hover:text-red-400 transition">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3"><path d="M18 6L6 18M6 6l12 12" /></svg>
                            </button>
                        </div>
                    ))}
                    {adding ? (
                        <div className="flex gap-2 mt-1">
                            <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') add(); if (e.key === 'Escape') { setAdding(false); setNewName(''); } }}
                                placeholder="Favorite name..." className={`flex-1 text-xs px-2.5 py-2 rounded-xl border outline-none ${dark ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500' : 'bg-gray-50 border-gray-200'}`} />
                            <button onClick={add} className="text-xs font-bold bg-blue-600 text-white px-3 py-2 rounded-xl hover:bg-blue-700 transition">Add</button>
                        </div>
                    ) : (
                        <button onClick={() => setAdding(true)} className={`flex items-center gap-1.5 w-full text-xs font-semibold py-2 text-blue-500 hover:text-blue-600 transition`}>
                            {Ico.plus} Add favorite
                        </button>
                    )}
                </div>
                <div className={`px-5 py-3 border-t ${sec}`}>
                    <button onClick={onClose} className="w-full text-xs font-bold bg-blue-600 text-white py-2.5 rounded-xl hover:bg-blue-700 transition">Done</button>
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════ DASHBOARD HOME ═══════════════════════════════ */
function DashboardHome({
    dark,
    overview,
    leads,
    revenueSeries,
    retentionSeries,
    orders,
    books,
    onAddBook,
    onManageOrder,
    onManageBook,
}: {
    dark: boolean;
    overview: DashboardOverview;
    leads: DashboardLeads;
    revenueSeries: DashboardRevenuePoint[];
    retentionSeries: DashboardRetentionPoint[];
    orders: DashboardOrder[];
    books: DashboardBook[];
    onAddBook: () => void;
    onManageOrder: (orderId: string) => void;
    onManageBook: (bookId: string) => void;
}) {
    const leadsUp = leads.leads_delta_pct >= 0;
    const conversionUp = leads.conversion_delta_pct >= 0;
    const ltvUp = leads.ltv_delta_pct >= 0;
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
                <KpiCard dark={dark} title="Total Revenue" value={<>TK <AnimCount to={overview.total_revenue} dec={2} /></>} sub="Confirmed order revenue" delta={`${Math.abs(leads.leads_delta_pct)}%`} up={leadsUp} color="#3b82f6" icon={Ico.trend} sparkData={leads.spark_leads} delay={100} />
                <KpiCard dark={dark} title="Total Orders" value={<AnimCount to={overview.total_orders} />} sub={`${overview.pending_orders} pending orders`} delta={`${Math.abs(leads.conversion_delta_pct)}%`} up={conversionUp} color="#10b981" icon={Ico.deals} sparkData={leads.spark_conversion} delay={200} />
                <KpiCard dark={dark} title="Delivered Orders" value={<AnimCount to={overview.delivered_deliveries} />} sub={`${overview.shipped_deliveries} shipped`} delta={`${Math.abs(leads.ltv_delta_pct)}%`} up={ltvUp} color="#f59e0b" icon={Ico.truck} sparkData={leads.spark_ltv} delay={300} />
            </div>
            <div className="flex gap-4">
                <div className="flex-1 min-w-0"><RevenueChart dark={dark} overview={overview} series={revenueSeries} /></div>
                <div className="w-56 flex-shrink-0"><LeadsPanel dark={dark} leads={leads} /></div>
            </div>
            <div className="flex gap-4">
                <div className="w-56 flex-shrink-0"><QuickStats dark={dark} overview={overview} /></div>
                <div className="flex-1 min-w-0"><RetentionChart dark={dark} series={retentionSeries} /></div>
            </div>
            <DeliveryPipeline dark={dark} overview={overview} />
            <div className="grid grid-cols-4 gap-3">
                {[
                    { l: 'Total Books', v: overview.total_books, c: '#3b82f6', pct: 100, icon: Ico.book },
                    { l: 'Active Books', v: overview.active_books, c: '#10b981', pct: 100, icon: Ico.check },
                    { l: 'In Stock', v: overview.in_stock_books, c: '#8b5cf6', pct: 100, icon: Ico.package },
                    { l: 'Low Stock', v: overview.low_stock_books, c: '#f59e0b', pct: 33, icon: Ico.warn },
                ].map((it, i) => (
                    <div key={i} className={`rounded-xl border p-4 flex items-center gap-3 transition-colors ${dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                        <Ring pct={it.pct} color={it.c} size={44} stroke={5} />
                        <div><div className="text-xl font-black font-mono" style={{ color: it.c }}><AnimCount to={it.v} /></div><p className={`text-[10px] ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{it.l}</p></div>
                    </div>
                ))}
            </div>
            <OrdersTable dark={dark} orders={orders} onManageOrder={onManageOrder} />
            <BooksTable dark={dark} overview={overview} books={books} onAddBook={onAddBook} onManageBook={onManageBook} />
        </div>
    );
}

type Modal = 'settings' | 'notifs' | 'profile' | 'favorites' | 'addBook' | 'manageOrder' | 'manageCategory' | 'manageBook' | null;

/* ═══════════════════════════════ LOGIN FORM ═══════════════════════════════ */
function LoginForm({ onLogin, dark }: { onLogin: (payload: LoginResponse) => void; dark: boolean }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await apiClient.post<LoginResponse, { username: string; password: string }>(
                endpoints.auth.login,
                { username, password },
                { cache: 'no-store' },
            );
            onLogin(response);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const bg = dark ? 'bg-gray-950' : 'bg-[#f0f4f8]';
    const card = dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100';
    const inp = dark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-800';

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center ${bg} p-4`}>
            <div className={`w-full max-w-sm p-8 rounded-3xl border shadow-2xl ${card} transition-all duration-300`}>
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 mb-4">
                        <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <h2 className={`text-xl font-black ${dark ? 'text-white' : 'text-gray-900'}`}>Super Admin Login</h2>
                    <p className={`text-xs mt-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Enter your credentials to access the dashboard</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className={`block text-[11px] font-bold mb-1.5 uppercase tracking-wider ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Username</label>
                        <input type="text" required value={username} onChange={e => setUsername(e.target.value)}
                            className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${inp}`} placeholder="admin" />
                    </div>
                    <div>
                        <label className={`block text-[11px] font-bold mb-1.5 uppercase tracking-wider ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Password</label>
                        <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                            className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${inp}`} placeholder="••••••••" />
                    </div>

                    {error && <p className="text-red-500 text-[10px] font-bold text-center mt-2">{error}</p>}

                    <button type="submit" disabled={loading}
                        className={`w-full py-3.5 rounded-xl bg-blue-600 text-white font-black text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200/50 flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}>
                        {loading ? 'Authenticating...' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className={`text-[10px] ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Protected by BookBuyBD Security Layer</p>
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════ ROOT COMPONENT ═══════════════════════════════ */
export default function Dashboard() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authUser, setAuthUser] = useState<AuthUser | null>(null);
    const [dark, setDark] = useState(false);
    const [sidebar, setSidebar] = useState(true);
    const [activeNav, setNav] = useState('dashboard');
    const [modal, setModal] = useState<Modal>(null);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQ, setSearchQ] = useState('');
    const [profileOpen, setProfileOpen] = useState(false);
    const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
    const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
    const [activeBookId, setActiveBookId] = useState<string | null>(null);
    const [overview, setOverview] = useState<DashboardOverview>(DASHBOARD_OVERVIEW_EMPTY);
    const [revenueSeries, setRevenueSeries] = useState<DashboardRevenuePoint[]>([]);
    const [retentionSeries, setRetentionSeries] = useState<DashboardRetentionPoint[]>([]);
    const [leads, setLeads] = useState<DashboardLeads>(DASHBOARD_LEADS_EMPTY);
    const [orders, setOrders] = useState<DashboardOrder[]>([]);
    const [books, setBooks] = useState<DashboardBook[]>([]);
    const [categories, setCategories] = useState<DashboardCategory[]>([]);
    const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
    const [inboxMessages, setInboxMessages] = useState<DashboardInboxMessage[]>([]);
    const [calendarDays, setCalendarDays] = useState<DashboardCalendarDay[]>([]);
    const [calendarEvents, setCalendarEvents] = useState<DashboardCalendarEvent[]>([]);
    const [favorites, setFavorites] = useState<DashboardFavorite[]>([]);
    const [categoryOptions, setCategoryOptions] = useState<NamedOption[]>([]);
    const [authorOptions, setAuthorOptions] = useState<NamedOption[]>([]);
    const [authToken, setAuthToken] = useState<string | null>(null);
    const tokenRef = useRef<string | null>(null);
    const profileRef = useRef<HTMLDivElement>(null);
    const unread = notifications.filter((n) => !n.read).length;
    const inboxUnread = inboxMessages.filter((msg) => {
        const normalized = msg.status.toLowerCase();
        return normalized === 'received' || normalized === 'in_review';
    }).length;

    const resetDashboardData = useCallback(() => {
        setOverview(DASHBOARD_OVERVIEW_EMPTY);
        setRevenueSeries([]);
        setRetentionSeries([]);
        setLeads(DASHBOARD_LEADS_EMPTY);
        setOrders([]);
        setBooks([]);
        setCategories([]);
        setNotifications([]);
        setInboxMessages([]);
        setCalendarDays([]);
        setCalendarEvents([]);
        setFavorites([]);
        setCategoryOptions([]);
        setAuthorOptions([]);
        setActiveOrderId(null);
        setActiveCategoryId(null);
        setActiveBookId(null);
    }, []);

    const loadDashboardData = useCallback(async (token: string) => {
        const headers = { Authorization: `Token ${token}` };
        const overviewUrl = resolveEndpoint(() => endpoints.dashboard.overview, '/dashboard/overview/');
        const monthlyRevenueUrl = resolveEndpoint(() => (endpoints.dashboard as Record<string, string>).monthlyRevenue || (endpoints.dashboard as Record<string, string>).monthly_revenue, '/dashboard/monthly-revenue/');
        const recentOrdersUrl = resolveEndpoint(() => (endpoints.dashboard as Record<string, string>).recentOrders || (endpoints.dashboard as Record<string, string>).recent_orders, '/dashboard/recent-orders/');
        const dashboardOrdersUrl = resolveEndpoint(() => (endpoints.orders as Record<string, string>).dashboardList || (endpoints.orders as Record<string, string>).dashboard_list, '/orders/dashboard/list/');
        const dashboardBooksUrl = resolveEndpoint(() => (endpoints.books as Record<string, string>).dashboardList || (endpoints.books as Record<string, string>).dashboard, '/books/dashboard/');
        const booksCatalogUrl = resolveEndpoint(() => endpoints.books.list, '/books/');
        const dashboardCategoriesUrl = resolveEndpoint(
            () => (endpoints.books as Record<string, string>).dashboardCategories
                || (endpoints.books as Record<string, string>).dashboard_categories
                || (endpoints.books as Record<string, string>).categoriesDashboard,
            '/books/dashboard/categories/',
        );
        const categoriesUrl = resolveEndpoint(() => endpoints.books.categories, '/books/categories/');
        const contactMessagesUrl = resolveEndpoint(
            () => (endpoints.contact as Record<string, string>).dashboardMessages || endpoints.contact.messages,
            '/contact/dashboard/messages',
        );

        const [overviewResult, revenueResult, ordersResult, booksResult, booksCatalogResult, categoriesResult, inboxResult] = await Promise.allSettled([
            apiClient.get<DashboardOverviewApiResponse>(overviewUrl, { cache: 'no-store', headers }),
            apiClient.get<unknown>(monthlyRevenueUrl, { cache: 'no-store', headers }),
            apiClient.get<unknown>(dashboardOrdersUrl, { cache: 'no-store', headers }).catch(async () => apiClient.get<unknown>(recentOrdersUrl, { cache: 'no-store', headers })),
            apiClient.get<unknown>(dashboardBooksUrl, { cache: 'no-store', headers }),
            apiClient.get<unknown>(booksCatalogUrl, { cache: 'no-store', headers }),
            apiClient.get<unknown>(dashboardCategoriesUrl, { cache: 'no-store', headers }).catch(async () => apiClient.get<unknown>(categoriesUrl, { cache: 'no-store', headers })),
            apiClient.get<unknown>(contactMessagesUrl, { cache: 'no-store', headers }),
        ]);

        const nextOverview = overviewResult.status === 'fulfilled' ? normalizeDashboardOverview(overviewResult.value) : DASHBOARD_OVERVIEW_EMPTY;
        const nextRevenue = revenueResult.status === 'fulfilled' ? normalizeRevenue(revenueResult.value) : [];
        const nextOrders = ordersResult.status === 'fulfilled' ? normalizeOrders(ordersResult.value) : [];
        const nextBooks = booksResult.status === 'fulfilled' ? normalizeBooks(booksResult.value) : [];
        const nextCategories = categoriesResult.status === 'fulfilled' ? normalizeDashboardCategories(categoriesResult.value) : [];
        const nextCategoryOptions = dedupeNamedOptions(
            nextCategories.map((category) => ({ id: category.id, name: category.name })),
        );
        const dashboardBookAuthorOptions = booksResult.status === 'fulfilled' ? normalizeAuthorOptionsFromBooks(booksResult.value) : [];
        const catalogAuthorOptions = booksCatalogResult.status === 'fulfilled' ? normalizeAuthorOptionsFromBooks(booksCatalogResult.value) : [];
        const nextAuthorOptions = dedupeNamedOptions([...dashboardBookAuthorOptions, ...catalogAuthorOptions]);
        const nextInbox = inboxResult.status === 'fulfilled' ? normalizeInboxMessages(inboxResult.value) : [];

        setOverview(nextOverview);
        setRevenueSeries(nextRevenue);
        setOrders(nextOrders);
        setBooks(nextBooks);
        setCategories(nextCategories);
        setInboxMessages(nextInbox);
        setCategoryOptions(nextCategoryOptions);
        setAuthorOptions(nextAuthorOptions);

        const orderMix = nextOverview.total_orders || (nextOverview.pending_orders + nextOverview.confirmed_orders + nextOverview.rejected_orders);
        setLeads({
            open: nextOverview.pending_orders,
            in_progress: nextOverview.confirmed_orders,
            lost: nextOverview.rejected_orders,
            won: nextOverview.delivered_deliveries,
            total_leads: nextOverview.total_orders,
            conversion_rate: nextOverview.total_orders ? Number(((nextOverview.confirmed_orders / nextOverview.total_orders) * 100).toFixed(1)) : 0,
            customer_ltv_days: nextOverview.total_orders ? Math.max(1, Math.round((nextOverview.processing_deliveries + nextOverview.shipped_deliveries + nextOverview.delivered_deliveries) / nextOverview.total_orders * 30)) : 0,
            leads_delta: nextOverview.confirmed_orders - nextOverview.pending_orders,
            leads_delta_pct: orderMix ? Number((((nextOverview.confirmed_orders - nextOverview.pending_orders) / Math.max(orderMix, 1)) * 100).toFixed(1)) : 0,
            conversion_delta_pct: nextOverview.total_orders ? Number((((nextOverview.delivered_deliveries - nextOverview.shipped_deliveries) / Math.max(nextOverview.total_orders, 1)) * 100).toFixed(1)) : 0,
            ltv_delta_pct: nextOverview.total_orders ? Number((((nextOverview.in_stock_books - nextOverview.low_stock_books) / Math.max(nextOverview.total_books || 1, 1)) * 100).toFixed(1)) : 0,
            spark_leads: nextRevenue.map((point) => point.value),
            spark_conversion: nextRevenue.map((point) => point.value / Math.max(nextOverview.total_orders || 1, 1)),
            spark_ltv: nextRevenue.map((point) => point.value / Math.max(nextOverview.total_books || 1, 1)),
        });

        setRetentionSeries(nextRevenue.map((point) => ({
            label: point.label,
            smes: nextOverview.pending_orders,
            startups: nextOverview.confirmed_orders,
            enterprises: nextOverview.delivered_deliveries,
        })));

        setNotifications([
            ...(nextOverview.pending_orders > 0 ? [{ id: 'pending-orders', type: 'order', msg: `${nextOverview.pending_orders} pending order(s) need review`, time: 'Now', read: false }] : []),
            ...(nextOverview.low_stock_books > 0 ? [{ id: 'low-stock', type: 'stock', msg: `${nextOverview.low_stock_books} book(s) are low in stock`, time: 'Now', read: false }] : []),
            ...(nextOverview.out_of_stock_books > 0 ? [{ id: 'out-stock', type: 'stock', msg: `${nextOverview.out_of_stock_books} book(s) are out of stock`, time: 'Now', read: false }] : []),
        ]);

        setCalendarDays([]);
        setCalendarEvents([]);
        setFavorites([
            ...(nextBooks.slice(0, 2).map((book, index) => ({ id: `book-${index}`, label: book.title, color: index % 2 === 0 ? 'bg-violet-500' : 'bg-emerald-500' }))),
        ]);
    }, []);

    const handleLogin = useCallback((payload: LoginResponse) => {
        tokenRef.current = payload.token;
        setAuthToken(payload.token);
        setAuthUser(payload.user);
        setIsAuthenticated(true);
        void loadDashboardData(payload.token);
    }, [loadDashboardData]);

    const handleAddBook = useCallback(async (payload: NewDashboardBookInput) => {
        const token = tokenRef.current;
        if (!token) {
            throw new Error('Missing admin token. Please sign in again.');
        }

        const createBookUrl = resolveEndpoint(
            () => (endpoints.books as Record<string, string>).dashboardCreate
                || (endpoints.books as Record<string, string>).dashboard
                || (endpoints.books as Record<string, string>).dashboardList,
            '/books/dashboard/',
        );

        const formData = new FormData();
        formData.append('category', String(payload.category));
        formData.append('title', payload.title);
        formData.append('slug', payload.slug);
        formData.append('author', String(payload.author));
        formData.append('description', payload.description);
        formData.append('price', payload.price);
        formData.append('stock_quantity', String(payload.stock_quantity));
        formData.append('is_coming_soon', String(payload.is_coming_soon));
        formData.append('is_active', String(payload.is_active));
        if (payload.imageFile) formData.append('image', payload.imageFile);

        const created = await apiClient.request<unknown>(
            createBookUrl,
            {
                method: 'POST',
                cache: 'no-store',
                headers: { Authorization: `Token ${token}` },
                body: formData,
            },
        );

        const normalizedCreated = normalizeBooks([created])[0];
        const authorName = authorOptions.find((option) => option.id === payload.author)?.name ?? `Author #${payload.author}`;
        const categoryName = categoryOptions.find((option) => option.id === payload.category)?.name ?? `Category #${payload.category}`;
        const nextBook: DashboardBook = normalizedCreated ?? {
            id: `book-${Date.now().toString(36)}`,
            title: payload.title,
            author: authorName,
            genre: categoryName,
            image: '',
            thumbnail: '',
            stock: payload.stock_quantity,
            price: parseNumeric(payload.price),
            status: payload.is_coming_soon ? 'coming soon' : (payload.is_active ? (payload.stock_quantity > 0 ? 'active' : 'out of stock') : 'inactive'),
            orders: 0,
        };

        setBooks((prev) => [nextBook, ...prev]);
        setOverview((prev) => ({
            ...prev,
            total_books: prev.total_books + 1,
            active_books: prev.active_books + (nextBook.status === 'active' ? 1 : 0),
            in_stock_books: prev.in_stock_books + (nextBook.stock > 0 ? 1 : 0),
            out_of_stock_books: prev.out_of_stock_books + (nextBook.stock <= 0 ? 1 : 0),
            low_stock_books: prev.low_stock_books + (nextBook.stock > 0 && nextBook.stock <= 5 ? 1 : 0),
        }));
    }, [authorOptions, categoryOptions]);

    const handleCreateCategory = useCallback(async (payload: NewDashboardCategoryInput) => {
        const token = tokenRef.current;
        if (!token) {
            throw new Error('Missing admin token. Please sign in again.');
        }

        const createCategoryUrl = resolveEndpoint(
            () => (endpoints.books as Record<string, string>).dashboardCategories
                || (endpoints.books as Record<string, string>).dashboard_categories
                || (endpoints.books as Record<string, string>).categoriesDashboard,
            '/books/dashboard/categories/',
        );

        const created = await apiClient.post<unknown, NewDashboardCategoryInput>(
            createCategoryUrl,
            payload,
            {
                cache: 'no-store',
                headers: { Authorization: `Token ${token}` },
            },
        );

        const createdCategory = normalizeDashboardCategories([created])[0];
        if (!createdCategory) {
            await loadDashboardData(token);
            return;
        }

        setCategories((prev) => {
            const filtered = prev.filter((category) => category.id !== createdCategory.id);
            return [createdCategory, ...filtered];
        });
        setCategoryOptions((prev) => dedupeNamedOptions([
            { id: createdCategory.id, name: createdCategory.name },
            ...prev,
        ]));
    }, [loadDashboardData]);

    const handleUpdateCategory = useCallback(async (categoryId: number, payload: UpdateDashboardCategoryInput) => {
        const token = tokenRef.current;
        if (!token) {
            throw new Error('Missing admin token. Please sign in again.');
        }

        const categoriesBaseUrl = resolveEndpoint(
            () => endpoints.books.dashboardCategories,
            '/books/dashboard/categories/',
        );
        const categoryDetailUrl = appendResourceId(categoriesBaseUrl, categoryId);

        const updated = await apiClient.patch<unknown, UpdateDashboardCategoryInput>(
            categoryDetailUrl,
            payload,
            {
                cache: 'no-store',
                headers: { Authorization: `Token ${token}` },
            },
        );

        const updatedCategory = normalizeDashboardCategories([updated])[0] ?? {
            id: categoryId,
            name: payload.name,
            slug: slugify(payload.name),
            is_active: payload.is_active,
        };

        setCategories((prev) => {
            const exists = prev.some((category) => category.id === updatedCategory.id);
            if (!exists) return [updatedCategory, ...prev];
            return prev.map((category) => (
                category.id === updatedCategory.id ? updatedCategory : category
            ));
        });

        setCategoryOptions((prev) => {
            const exists = prev.some((option) => option.id === updatedCategory.id);
            if (!exists) {
                return dedupeNamedOptions([
                    { id: updatedCategory.id, name: updatedCategory.name },
                    ...prev,
                ]);
            }

            return prev.map((option) => (
                option.id === updatedCategory.id
                    ? { ...option, name: updatedCategory.name }
                    : option
            ));
        });
    }, []);

    const openManageCategory = useCallback((categoryId: number) => {
        setActiveCategoryId(categoryId);
        setModal('manageCategory');
    }, []);

    const openManageBook = useCallback((bookId: string) => {
        setActiveBookId(bookId);
        setModal('manageBook');
    }, []);

    const openManageOrder = useCallback((orderId: string) => {
        setActiveOrderId(orderId);
        setModal('manageOrder');
    }, []);

    const handleBookSaved = useCallback(async () => {
        const token = tokenRef.current;
        if (token) {
            await loadDashboardData(token);
        }
    }, [loadDashboardData]);

    const handleOrderStatusSaved = useCallback(async (orderId: string, orderStatus: string, deliveryStatus: string) => {
        setOrders((prev) => prev.map((order) => (
            order.id === orderId
                ? { ...order, status: orderStatus, delivery: deliveryStatus }
                : order
        )));

        const token = tokenRef.current;
        if (token) {
            await loadDashboardData(token);
        }
    }, [loadDashboardData]);

    useEffect(() => {
        const h = (e: MouseEvent) => { if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    const bg = dark ? 'bg-gray-950' : 'bg-[#f0f4f8]';
    const sbBg = dark ? 'bg-gray-900' : 'bg-white';
    const bdr = dark ? 'border-gray-800' : 'border-gray-100';
    const tp = dark ? 'text-gray-100' : 'text-gray-800';
    const ts = dark ? 'text-gray-400' : 'text-gray-500';
    const activeCategory = activeCategoryId === null
        ? null
        : (categories.find((category) => category.id === activeCategoryId) ?? null);
    const profileName = authUser?.username ?? 'User';
    const profileEmail = authUser?.email ?? '';
    const profileInitials = profileName.slice(0, 2).toUpperCase() || 'AD';
    const profileRole = authUser?.is_staff ? 'Admin' : 'User';
    const workspaceUsers = authUser ? 1 : 0;

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: Ico.grid, badge: 0 },
        { id: 'books', label: 'Books', icon: Ico.book, badge: 0 },
        { id: 'orders', label: 'Orders', icon: Ico.package, badge: overview.pending_orders },
        { id: 'reports', label: 'Reports', icon: Ico.reports, badge: 0 },
        { id: 'inbox', label: 'Inbox', icon: Ico.inbox, badge: inboxUnread },
    ];

    const renderPage = () => {
        switch (activeNav) {
            case 'orders': return <div className="space-y-4"><h2 className={`text-lg font-bold ${tp}`}>Orders</h2><DeliveryPipeline dark={dark} overview={overview} /><OrdersTable dark={dark} orders={orders} onManageOrder={openManageOrder} /></div>;
            case 'books':
                return (
                    <div className="space-y-4">
                        <h2 className={`text-lg font-bold ${tp}`}>Book Inventory</h2>
                        <div className="grid grid-cols-4 gap-3">
                            {[
                                { l: 'Total Books', v: overview.total_books, c: '#3b82f6', pct: 100, icon: Ico.book },
                                { l: 'Active', v: overview.active_books, c: '#10b981', pct: 100, icon: Ico.check },
                                { l: 'In Stock', v: overview.in_stock_books, c: '#8b5cf6', pct: 100, icon: Ico.package },
                                { l: 'Low Stock', v: overview.low_stock_books, c: '#f59e0b', pct: 33, icon: Ico.warn },
                            ].map((it, i) => (
                                <div key={i} className={`rounded-xl border p-4 flex items-center gap-3 ${dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                                    <Ring pct={it.pct} color={it.c} size={44} stroke={5} />
                                    <div>
                                        <div className="text-xl font-black font-mono" style={{ color: it.c }}>
                                            <AnimCount to={it.v} />
                                        </div>
                                        <p className={`text-[10px] ${ts}`}>{it.l}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <BooksTable dark={dark} overview={overview} books={books} onAddBook={() => setModal('addBook')} onManageBook={openManageBook} />
                        <CategoriesSection
                            dark={dark}
                            categories={categories}
                            onCreateCategory={handleCreateCategory}
                            onManageCategory={openManageCategory}
                        />
                    </div>
                );
            case 'reports': return <div className="space-y-4"><h2 className={`text-lg font-bold ${tp}`}>Reports</h2><RevenueChart dark={dark} overview={overview} series={revenueSeries} /><RetentionChart dark={dark} series={retentionSeries} /></div>;
            case 'inbox':
                return (
                    <div className={`rounded-xl border ${dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                        <div className={`px-4 py-3 border-b flex items-center justify-between ${dark ? 'border-gray-800' : 'border-gray-100'}`}>
                            <div>
                                <h3 className={`text-sm font-bold ${tp}`}>Inbox</h3>
                                <p className={`text-[11px] ${ts}`}>Contact Us submissions</p>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-blue-100 text-blue-700">{inboxMessages.length} message(s)</span>
                        </div>
                        <div className="max-h-[460px] overflow-y-auto">
                            {inboxMessages.map((msg) => (
                                <div key={msg.id} className={`px-4 py-3 border-b ${dark ? 'border-gray-800' : 'border-gray-100'}`}>
                                    <div className="flex items-center justify-between gap-3 mb-1">
                                        <p className={`text-xs font-bold ${tp}`}>{msg.subject}</p>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${msg.status.toLowerCase() === 'resolved' ? 'bg-emerald-100 text-emerald-700' : msg.status.toLowerCase() === 'closed' ? 'bg-gray-200 text-gray-700' : 'bg-amber-100 text-amber-700'}`}>{msg.status}</span>
                                    </div>
                                    <p className={`text-[11px] ${ts}`}>{msg.name} • {msg.email || 'No email'}{msg.phone ? ` • ${msg.phone}` : ''}</p>
                                    <p className={`text-[11px] mt-1 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>{msg.message || 'No message body.'}</p>
                                    <p className="text-[10px] text-gray-400 mt-1">
                                        Submitted: {msg.submittedAt ? new Date(msg.submittedAt).toLocaleString() : 'N/A'} • Updated: {msg.updatedAt ? new Date(msg.updatedAt).toLocaleString() : 'N/A'}
                                    </p>
                                </div>
                            ))}
                        </div>
                        {inboxMessages.length === 0 && (
                            <p className="px-4 py-6 text-[11px] text-gray-400 text-center">No contact messages yet.</p>
                        )}
                    </div>
                );
            default: return <DashboardHome dark={dark} overview={overview} leads={leads} revenueSeries={revenueSeries} retentionSeries={retentionSeries} orders={orders} books={books} onAddBook={() => setModal('addBook')} onManageOrder={openManageOrder} onManageBook={openManageBook} />;
        }
    };

    return (
        <div className={`flex h-screen ${bg} overflow-hidden transition-colors duration-300`}
            style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
            {!isAuthenticated && <LoginForm onLogin={handleLogin} dark={dark} />}
            <style>{`
        @keyframes slideInRight{from{transform:translateX(100%)}to{transform:translateX(0)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        .fi{animation:fadeIn 0.25s ease}
        ::-webkit-scrollbar{width:3px;height:3px}
        ::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:99px}
        ::-webkit-scrollbar-track{background:transparent}
      `}</style>

            {/* ── ICON RAIL ── */}
            <div className={`w-11 flex flex-col items-center py-3 gap-2 border-r ${bdr} ${sbBg} flex-shrink-0 z-20 transition-colors duration-300`}>
                <div className="w-7 h-7 bg-blue-600 rounded-xl flex items-center justify-center mb-1 shadow-md shadow-blue-200/60">
                    <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                </div>
                {[Ico.grid, Ico.book, Ico.reports, Ico.package].map((ic, i) => (
                    <button key={i} className={`w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition`}>{ic}</button>
                ))}
                <div className="flex-1" />
                <button onClick={() => setDark(v => !v)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${dark ? 'bg-yellow-100 text-yellow-500' : 'text-gray-400 hover:bg-gray-100'}`}>
                    {dark ? Ico.sun : Ico.moon}
                </button>
            </div>

            {/* ── SIDEBAR ── */}
            <div className={`${sidebar ? 'w-48' : 'w-0'} flex-shrink-0 border-r ${bdr} ${sbBg} overflow-hidden transition-all duration-300 ease-in-out`}>
                <div className="w-48 h-full flex flex-col">
                    {/* Workspace */}
                    <div className="p-3.5 border-b" style={{ borderColor: dark ? '#1f2937' : '#f3f4f6' }}>
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-8 flex-shrink-0 overflow-hidden">
                                <img src="/logo.png" alt="BookBuyBD Logo" className="w-full h-12 object-contain object-top" />
                            </div>
                            <span className={ts}>{Ico.chevD}</span>
                        </div>
                        <div className={`flex items-center gap-3 mt-2 text-[9px] ${ts}`}>
                            <span className="flex items-center gap-1">{Ico.users} {workspaceUsers}</span>
                            <span className="flex items-center gap-1">{Ico.msg} {inboxMessages.length}</span>
                            <span className="flex items-center gap-1">{Ico.calendar} {calendarEvents.length}</span>
                        </div>
                    </div>

                    {/* Nav */}
                    <div className="p-2 flex-1 overflow-y-auto">
                        <div className="space-y-0.5 mb-2">
                            {navItems.map(item => (
                                <button key={item.id} onClick={() => setNav(item.id)}
                                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${activeNav === item.id ? 'bg-blue-600 text-white shadow-sm shadow-blue-200' : `${ts} hover:bg-gray-50 ${dark ? 'hover:bg-gray-800 hover:text-gray-200' : ''}`
                                        }`}>
                                    {item.icon} {item.label}
                                    {item.badge > 0 && <span className={`ml-auto text-[9px] font-black px-1.5 py-0.5 rounded-full ${activeNav === item.id ? 'bg-white/25 text-white' : 'bg-blue-100 text-blue-600'}`}>{item.badge}</span>}
                                </button>
                            ))}
                        </div>

                        <div className={`my-2 h-px ${dark ? 'bg-gray-800' : 'bg-gray-100'}`} />

                        {/* ── FAVORITES ── fully functional */}
                        <button onClick={() => setModal('favorites')}
                            className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-xs font-semibold ${ts} hover:bg-gray-50 ${dark ? 'hover:bg-gray-800 hover:text-gray-200' : ''} transition group`}>
                            <span className="text-yellow-400">{Ico.star}</span>
                            Favorites
                            <span className={`ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition`}>
                                <span className="hover:text-blue-500">{Ico.plus}</span>
                            </span>
                        </button>

                    </div>

                    {/* Bottom */}
                    <div className="p-2 border-t" style={{ borderColor: dark ? '#1f2937' : '#f3f4f6' }}>
                        <button onClick={() => setModal('settings')}
                            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold ${ts} hover:bg-gray-50 ${dark ? 'hover:bg-gray-800' : ''} transition`}>
                            {Ico.settings} Settings
                        </button>

                        {/* ── PROFILE ── */}
                        <div className="relative mt-1" ref={profileRef}>
                            <button onClick={() => setProfileOpen(v => !v)}
                                className={`w-full flex items-center gap-2 p-2 rounded-xl border transition-all ${dark ? 'border-gray-800 hover:border-blue-700 hover:bg-gray-800' : 'border-gray-100 hover:border-blue-200 hover:bg-blue-50'}`}>
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[9px] font-black flex-shrink-0">{profileInitials}</div>
                                <div className="flex-1 min-w-0 text-left">
                                    <p className={`text-[10px] font-bold ${tp} truncate`}>{profileName}</p>
                                    <p className={`text-[8px] ${ts} truncate`}>{profileEmail}</p>
                                </div>
                                <span className={ts}>{Ico.chevD}</span>
                            </button>

                            {/* Profile dropdown — three working buttons */}
                            {profileOpen && (
                                <div className={`absolute bottom-full left-0 right-0 mb-1 rounded-xl border shadow-xl overflow-hidden z-50 fi ${dark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
                                    {/* Header */}
                                    <div className={`p-3 border-b flex items-center gap-2 ${dark ? 'border-gray-800' : 'border-gray-100'}`}>
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0">{profileInitials}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-xs font-bold ${tp} truncate`}>{profileName}</p>
                                            <span className="text-[9px] bg-blue-100 text-blue-600 font-bold px-1.5 py-0.5 rounded-full">{profileRole}</span>
                                        </div>
                                    </div>
                                    {/* Profile Settings */}
                                    <button onClick={() => { setProfileOpen(false); setModal('profile'); }}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold transition-all ${dark ? 'text-gray-300 hover:bg-gray-800 hover:text-white' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`}>
                                        <span style={{ color: '#3b82f6' }}>{Ico.edit}</span> Profile Settings
                                    </button>
                                    {/* Divider + Sign Out */}
                                    <div className={`h-px ${dark ? 'bg-gray-800' : 'bg-gray-100'}`} />
                                    <button onClick={() => {
                                        tokenRef.current = null;
                                        setAuthToken(null);
                                        setAuthUser(null);
                                        resetDashboardData();
                                        setProfileOpen(false);
                                        setIsAuthenticated(false);
                                    }} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 transition">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" /></svg>
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── MAIN CONTENT ── */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top bar */}
                <div className={`h-12 flex items-center justify-between px-5 border-b ${bdr} ${sbBg} flex-shrink-0 z-10 transition-colors duration-300`}>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSidebar(v => !v)}
                            className={`w-7 h-7 flex items-center justify-center rounded-lg ${ts} hover:bg-gray-100 ${dark ? 'hover:bg-gray-800' : ''} transition`}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
                        </button>
                        <div className="flex items-center gap-1.5">
                            <span className="text-blue-600">{navItems.find(n => n.id === activeNav)?.icon}</span>
                            <span className={`text-sm font-bold ${tp}`}>{navItems.find(n => n.id === activeNav)?.label ?? 'Dashboard'}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 text-emerald-500 text-[11px] font-semibold bg-emerald-50 px-2.5 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" style={{ animation: 'pulse 2s infinite' }} />
                            Live
                        </div>
                        {searchOpen ? (
                            <div className={`flex items-center gap-2 rounded-xl px-3 py-1.5 border ${dark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                                <span className={ts}>{Ico.search}</span>
                                <input autoFocus value={searchQ} onChange={e => setSearchQ(e.target.value)}
                                    placeholder="Search..." className={`text-xs outline-none bg-transparent w-32 ${dark ? 'text-gray-200 placeholder-gray-500' : 'text-gray-700 placeholder-gray-400'}`} />
                                <button onClick={() => { setSearchOpen(false); setSearchQ(''); }} className="text-gray-400 hover:text-gray-600">{Ico.x}</button>
                            </div>
                        ) : (
                            <button onClick={() => setSearchOpen(true)} className={`w-8 h-8 flex items-center justify-center rounded-xl ${ts} hover:bg-gray-100 ${dark ? 'hover:bg-gray-800' : ''} transition`}>{Ico.search}</button>
                        )}
                        <button className={`w-8 h-8 flex items-center justify-center rounded-xl ${ts} hover:bg-gray-100 ${dark ? 'hover:bg-gray-800' : ''} transition`}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
                        </button>
                        <button onClick={() => setModal('notifs')} className={`relative w-8 h-8 flex items-center justify-center rounded-xl ${ts} hover:bg-gray-100 ${dark ? 'hover:bg-gray-800' : ''} transition`}>
                            {Ico.bell}
                            {unread > 0 && <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-white text-[7px] font-black flex items-center justify-center">{unread}</span>}
                        </button>
                        <button className={`flex items-center gap-1.5 text-[11px] font-semibold border rounded-xl px-3 py-1.5 transition ${dark ? 'border-gray-700 text-gray-400 hover:bg-gray-800' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                            {Ico.cloud} Import
                        </button>
                        <button className="flex items-center gap-1.5 text-[11px] font-bold text-white bg-blue-600 rounded-xl px-3 py-1.5 hover:bg-blue-700 transition shadow-sm shadow-blue-200">
                            {Ico.export} Export
                        </button>
                    </div>
                </div>

                {/* Page */}
                <div className="flex-1 overflow-y-auto p-4">{renderPage()}</div>
            </div>

            {/* ── MODALS ── */}
            {modal === 'settings' && <SettingsPanel dark={dark} setDark={setDark} onClose={() => setModal(null)} />}
            {modal === 'notifs' && <NotifPanel dark={dark} notifications={notifications} onNotificationsChange={setNotifications} onClose={() => setModal(null)} />}
            {modal === 'profile' && <ProfileForm dark={dark} user={authUser} onClose={() => setModal(null)} />}
            {modal === 'favorites' && <FavoritesModal dark={dark} initialItems={favorites} onClose={() => setModal(null)} />}
            {modal === 'addBook' && <AddBookModal dark={dark} onClose={() => setModal(null)} onSubmit={handleAddBook} categoryOptions={categoryOptions} authorOptions={authorOptions} />}
            {modal === 'manageBook' && activeBookId && (
                <ManageBookModal
                    dark={dark}
                    bookId={activeBookId}
                    token={authToken}
                    categoryOptions={categoryOptions}
                    authorOptions={authorOptions}
                    onSaved={handleBookSaved}
                    onClose={() => {
                        setModal(null);
                        setActiveBookId(null);
                    }}
                />
            )}
            {modal === 'manageCategory' && activeCategory && (
                <ManageCategoryModal
                    dark={dark}
                    category={activeCategory}
                    onSubmit={handleUpdateCategory}
                    onClose={() => {
                        setModal(null);
                        setActiveCategoryId(null);
                    }}
                />
            )}
            {modal === 'manageOrder' && activeOrderId && (
                <ManageOrderModal
                    dark={dark}
                    orderId={activeOrderId}
                    token={authToken}
                    onSaved={handleOrderStatusSaved}
                    onClose={() => {
                        setModal(null);
                        setActiveOrderId(null);
                    }}
                />
            )}
        </div>
    );
}
