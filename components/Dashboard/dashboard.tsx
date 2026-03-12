'use client';
import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import Image from 'next/image';
import { apiClient, endpoints } from '@/lib/api';
import { CART_UPDATED_EVENT, getStoredCartItems } from '@/components/pages/cartStore';

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

interface DashboardPrintingOrder {
    order_id: string;
    customer_name: string;
    customer_phone: string;
    total_amount: number;
    status: string;
    payment_method: string;
    submitted_at: string;
    items_count: number;
}

interface DashboardPrintingOrderItemDetail {
    id: number;
    category_label: string;
    item_name: string;
    item_icon: string;
    quantity: number;
    unit_price: number;
    line_total: number;
    notes: string;
    primary_file_url: string;
    secondary_file_url: string;
}

interface DashboardPrintingOrderDetail {
    order_id: string;
    customer_name: string;
    customer_phone: string;
    customer_email: string;
    shipping_address: string;
    city: string;
    district: string;
    postal_code: string;
    notes: string;
    payment_method: string;
    status: string;
    subtotal: number;
    delivery_charge: number;
    total_amount: number;
    submitted_at: string;
    order_items: DashboardPrintingOrderItemDetail[];
}

interface DashboardPrintingPricingItem {
    id: string;
    name: string;
    icon: string;
    description: string;
    baseRate: number;
    sortOrder: number;
}

interface DashboardPrintingPricingCategory {
    id: string;
    label: string;
    icon: string;
    sortOrder: number;
    items: DashboardPrintingPricingItem[];
}

interface DashboardOrderDetail extends DashboardOrder {
    items: number;
    email: string;
    phone: string;
    address: string;
    shippingAddress: string;
    city: string;
    district: string;
    postalCode: string;
    paymentMethod: string;
    createdAt: string;
    updatedAt: string;
    requestedDeliveryAt: string;
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
    paperbackPrice: number;
    hardcoverPrice: number;
    paperbackQuality: string;
    hardcoverQuality: string;
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
    paperback_price: string;
    hardcover_price: string;
    paperback_quality: string;
    hardcover_quality: string;
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
    isRead: boolean;
}

interface DashboardSearchSuggestion {
    id: string;
    type: 'book' | 'order' | 'printing' | 'inbox';
    label: string;
    description: string;
    nav: 'books' | 'orders' | 'printing' | 'inbox';
    entityId: string;
    status: string;
    isRead: boolean;
}

interface DashboardHeroSlide {
    id: number;
    tag: string;
    title: string;
    ctaLabel: string;
    ctaHref: string;
    imageUrl: string;
    backgroundFrom: string;
    backgroundTo: string;
    displayOrder: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

interface DashboardHeroSlideInput {
    tag: string;
    title: string;
    ctaLabel: string;
    ctaHref: string;
    backgroundFrom: string;
    backgroundTo: string;
    displayOrder: number;
    isActive: boolean;
    imageFile?: File | null;
}

interface DashboardDeliverySettings {
    deliveryCharge: number;
    freeDeliveryThreshold: number;
    printingEmergencyFee: number;
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
const DEFAULT_DELIVERY_SETTINGS: DashboardDeliverySettings = {
    deliveryCharge: 60,
    freeDeliveryThreshold: 1000,
    printingEmergencyFee: 350,
};

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

function parseLabelText(value: unknown): string {
    if (typeof value !== 'string') return '';
    const text = value.trim();
    if (!text) return '';
    if (/^\d+$/.test(text)) return '';
    return text;
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

function normalizeDeliverySettings(payload: unknown): DashboardDeliverySettings {
    if (!payload || typeof payload !== 'object') {
        return DEFAULT_DELIVERY_SETTINGS;
    }
    const record = payload as Record<string, unknown>;
    return {
        deliveryCharge: Math.max(
            0,
            parseNumeric(record.deliveryCharge ?? record.delivery_charge, DEFAULT_DELIVERY_SETTINGS.deliveryCharge),
        ),
        freeDeliveryThreshold: Math.max(
            0,
            parseNumeric(record.freeDeliveryThreshold ?? record.free_delivery_threshold, DEFAULT_DELIVERY_SETTINGS.freeDeliveryThreshold),
        ),
        printingEmergencyFee: Math.max(
            0,
            parseNumeric(record.printingEmergencyFee ?? record.printing_emergency_fee, DEFAULT_DELIVERY_SETTINGS.printingEmergencyFee),
        ),
    };
}

function normalizePrintingPricingCatalog(payload: unknown): DashboardPrintingPricingCategory[] {
    const categories = readArrayPayload(payload).map((row, categoryIndex) => {
        const rec = isRecord(row) ? row : {};
        const id = parseText(rec.id);
        const label = parseText(rec.label);
        if (!id || !label) return null;

        const items = readArrayPayload(rec.items).map((itemRow, itemIndex) => {
            const itemRec = isRecord(itemRow) ? itemRow : {};
            const itemId = parseText(itemRec.id);
            const name = parseText(itemRec.name);
            if (!itemId || !name) return null;

            return {
                id: itemId,
                name,
                icon: parseText(itemRec.icon),
                description: parseText(itemRec.description),
                baseRate: Math.max(0, parseNumeric(itemRec.baseRate ?? itemRec.base_rate, 0)),
                sortOrder: Math.max(0, Math.trunc(parseNumeric(itemRec.sortOrder ?? itemRec.sort_order, itemIndex))),
            };
        }).filter((item): item is DashboardPrintingPricingItem => item !== null)
            .sort((a, b) => (a.sortOrder - b.sortOrder) || a.name.localeCompare(b.name));

        return {
            id,
            label,
            icon: parseText(rec.icon),
            sortOrder: Math.max(0, Math.trunc(parseNumeric(rec.sortOrder ?? rec.sort_order, categoryIndex))),
            items,
        };
    }).filter((category): category is DashboardPrintingPricingCategory => category !== null);

    return categories.sort((a, b) => (a.sortOrder - b.sortOrder) || a.label.localeCompare(b.label));
}

function readBookVariantPrice(record: Record<string, unknown>, variant: 'paperback' | 'hardcover'): number {
    const variantsObj = isRecord(record.variants) ? record.variants : {};
    const variantObj = isRecord(variantsObj[variant]) ? variantsObj[variant] : {};
    const directKey = `${variant}_price`;

    if (variant === 'paperback') {
        return parseNumeric(variantObj.price ?? record[directKey] ?? record.price);
    }

    return parseNumeric(variantObj.price ?? record[directKey]);
}

function readBookVariantPriceText(record: Record<string, unknown>, variant: 'paperback' | 'hardcover'): string {
    return readBookVariantPrice(record, variant).toFixed(2);
}

function readBookVariantQuality(record: Record<string, unknown>, variant: 'paperback' | 'hardcover'): string {
    const variantsObj = isRecord(record.variants) ? record.variants : {};
    const variantObj = isRecord(variantsObj[variant]) ? variantsObj[variant] : {};
    const directKey = `${variant}_quality`;
    const fallback = variant === 'paperback' ? 'Standard' : 'Premium';
    return parseText(variantObj.quality ?? record[directKey], fallback);
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

function normalizePrintingOrders(payload: unknown): DashboardPrintingOrder[] {
    return readArrayPayload(payload).map((row, idx) => {
        const rec = isRecord(row) ? row : {};
        const orderItems = readArrayPayload(rec.order_items);
        const orderId = parseText(rec.order_id ?? rec.id ?? rec.orderId, `PRNO-${idx + 1}`);

        return {
            order_id: orderId,
            customer_name: parseText(rec.customer_name ?? rec.customer, 'Unknown'),
            customer_phone: parseText(rec.customer_phone ?? rec.phone),
            total_amount: parseNumeric(rec.total_amount ?? rec.amount ?? rec.total),
            status: parseText(rec.status ?? rec.order_status, 'pending'),
            payment_method: parseText(rec.payment_method ?? rec.payment, 'cod'),
            submitted_at: parseText(rec.submitted_at ?? rec.created_at ?? rec.createdAt),
            items_count: parseNumeric(rec.items_count ?? rec.total_items ?? rec.item_count, orderItems.length),
        };
    });
}

function normalizePrintingOrderDetail(payload: unknown): DashboardPrintingOrderDetail | null {
    if (!isRecord(payload)) return null;
    const orderId = parseText(payload.order_id ?? payload.id ?? payload.orderId);
    if (!orderId) return null;

    const orderItems = readArrayPayload(payload.order_items ?? payload.items).map((row) => {
        const rec = isRecord(row) ? row : {};
        return {
            id: parseNumeric(rec.id),
            category_label: parseText(rec.category_label ?? rec.category ?? rec.category_name),
            item_name: parseText(rec.item_name ?? rec.name),
            item_icon: parseText(rec.item_icon ?? rec.icon),
            quantity: parseNumeric(rec.quantity, 1),
            unit_price: parseNumeric(rec.unit_price ?? rec.price),
            line_total: parseNumeric(rec.line_total ?? rec.total),
            notes: parseText(rec.notes),
            primary_file_url: parseText(rec.primary_file_url),
            secondary_file_url: parseText(rec.secondary_file_url),
        };
    });

    return {
        order_id: orderId,
        customer_name: parseText(payload.customer_name, 'Unknown'),
        customer_phone: parseText(payload.customer_phone),
        customer_email: parseText(payload.customer_email),
        shipping_address: parseText(payload.shipping_address),
        city: parseText(payload.city),
        district: parseText(payload.district),
        postal_code: parseText(payload.postal_code),
        notes: parseText(payload.notes),
        payment_method: parseText(payload.payment_method, 'cod'),
        status: parseText(payload.status, 'pending'),
        subtotal: parseNumeric(payload.subtotal),
        delivery_charge: parseNumeric(payload.delivery_charge),
        total_amount: parseNumeric(payload.total_amount),
        submitted_at: parseText(payload.submitted_at ?? payload.created_at),
        order_items: orderItems,
    };
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
        address: parseText(payload.shipping_address ?? payload.customer_address ?? payload.address ?? customerObj.address),
        shippingAddress: parseText(payload.shipping_address ?? payload.customer_address ?? payload.address ?? customerObj.address),
        city: parseText(payload.city),
        district: parseText(payload.district),
        postalCode: parseText(payload.postal_code),
        paymentMethod: parseText(payload.payment_method, 'cod'),
        createdAt: parseText(payload.created_at ?? payload.createdAt ?? payload.date),
        updatedAt: parseText(payload.updated_at ?? payload.updatedAt),
        requestedDeliveryAt: parseText(
            payload.requested_delivery_at
            ?? payload.delivery_date
            ?? payload.required_by
            ?? payload.requiredBy,
        ),
        notes: parseText(payload.notes ?? payload.note ?? payload.customer_note),
    };
}

function normalizeBooks(payload: unknown): DashboardBook[] {
    return readArrayPayload(payload).map((row, idx) => {
        const rec = isRecord(row) ? row : {};
        const authorObj = isRecord(rec.author) ? rec.author : {};
        const categoryObj = isRecord(rec.category) ? rec.category : {};
        const author = parseText(
            parseLabelText(rec.author_name)
            || parseLabelText(rec.author)
            || parseLabelText(authorObj.name)
            || parseLabelText(authorObj.full_name),
            'Unknown',
        );
        const genre = parseText(
            parseLabelText(rec.category_name)
            || parseLabelText(rec.genre)
            || parseLabelText(categoryObj.name)
            || parseLabelText(categoryObj.title),
            'General',
        );
        const inStock = Boolean(rec.is_in_stock ?? false);
        const isComingSoon = Boolean(rec.is_coming_soon ?? false);
        const isActive = rec.is_active !== false;
        const status = isComingSoon ? 'coming soon' : (inStock ? 'active' : (isActive ? 'out of stock' : 'inactive'));
        const paperbackPrice = readBookVariantPrice(rec, 'paperback');
        const hardcoverPrice = readBookVariantPrice(rec, 'hardcover');
        return {
            id: parseText(rec.id, String(idx + 1)),
            title: parseText(rec.title, 'Untitled'),
            author,
            genre,
            image: toAssetUrl(rec.image),
            thumbnail: toAssetUrl(rec.thumbnail),
            stock: parseNumeric(rec.stock_quantity ?? rec.stock),
            price: paperbackPrice || parseNumeric(rec.price),
            paperbackPrice,
            hardcoverPrice,
            paperbackQuality: readBookVariantQuality(rec, 'paperback'),
            hardcoverQuality: readBookVariantQuality(rec, 'hardcover'),
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
        price: readBookVariantPriceText(payload, 'paperback'),
        paperback_price: readBookVariantPriceText(payload, 'paperback'),
        hardcover_price: readBookVariantPriceText(payload, 'hardcover'),
        paperback_quality: readBookVariantQuality(payload, 'paperback'),
        hardcover_quality: readBookVariantQuality(payload, 'hardcover'),
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

const dashboardUnusedNormalizers = [
    normalizeRetention,
    normalizeLeads,
    normalizeNotifications,
    normalizeCalendar,
    normalizeFavorites,
];
void dashboardUnusedNormalizers;

function normalizeInboxMessages(payload: unknown): DashboardInboxMessage[] {
    return readArrayPayload(payload).map((row, idx) => {
        const rec = isRecord(row) ? row : {};
        const status = parseText(rec.status, 'received');
        const explicitReadValue = rec.is_read ?? rec.isRead ?? rec.read;
        const isRead = explicitReadValue === undefined
            ? ['resolved', 'closed'].includes(status.toLowerCase())
            : parseBoolean(explicitReadValue, false);

        return {
            id: parseText(rec.messageId ?? rec.id, `msg-${idx + 1}`),
            name: parseText(rec.name, 'Unknown'),
            email: parseText(rec.email, ''),
            phone: parseText(rec.phone, ''),
            subject: parseText(rec.subject, 'No subject'),
            message: parseText(rec.message, ''),
            status,
            submittedAt: parseText(rec.submittedAt ?? rec.submitted_at ?? rec.updatedAt, ''),
            updatedAt: parseText(rec.updatedAt ?? rec.updated_at ?? rec.submittedAt, ''),
            isRead,
        };
    });
}

function normalizeSearchSuggestions(payload: unknown): DashboardSearchSuggestion[] {
    return readArrayPayload(payload).map((row, idx) => {
        const rec = isRecord(row) ? row : {};
        const typeRaw = parseText(rec.type, '').toLowerCase();
        const type = (typeRaw === 'book' || typeRaw === 'order' || typeRaw === 'printing' || typeRaw === 'inbox')
            ? typeRaw
            : null;
        const navRaw = parseText(rec.nav, '').toLowerCase();
        const nav = (navRaw === 'books' || navRaw === 'orders' || navRaw === 'printing' || navRaw === 'inbox')
            ? navRaw
            : null;
        const label = parseText(rec.label ?? rec.title);
        const entityId = parseText(rec.entityId ?? rec.entity_id ?? rec.id);

        if (!type || !nav || !label || !entityId) return null;

        return {
            id: parseText(rec.id, `${type}-${idx + 1}`),
            type,
            label,
            description: parseText(rec.description ?? rec.subtitle),
            nav,
            entityId,
            status: parseText(rec.status, ''),
            isRead: parseBoolean(rec.isRead ?? rec.is_read ?? rec.read, false),
        };
    }).filter((item): item is DashboardSearchSuggestion => item !== null);
}

function normalizeHeroSlides(payload: unknown): DashboardHeroSlide[] {
    const seen = new Set<number>();

    return readArrayPayload(payload).map((row, idx) => {
        const rec = isRecord(row) ? row : {};
        const id = parseNumeric(rec.id);
        if (!Number.isFinite(id) || id <= 0 || seen.has(id)) return null;
        seen.add(id);

        return {
            id,
            tag: parseText(rec.tag),
            title: parseText(rec.title, `Slide ${idx + 1}`),
            ctaLabel: parseText(rec.ctaLabel ?? rec.cta_label),
            ctaHref: parseText(rec.ctaHref ?? rec.cta_href),
            imageUrl: toAssetUrl(rec.imageUrl ?? rec.image_url ?? rec.image),
            backgroundFrom: parseText(rec.backgroundFrom ?? rec.background_from, 'blue-50'),
            backgroundTo: parseText(rec.backgroundTo ?? rec.background_to, 'indigo-100'),
            displayOrder: Math.max(0, Math.trunc(parseNumeric(rec.displayOrder ?? rec.display_order, idx))),
            isActive: parseBoolean(rec.isActive ?? rec.is_active, true),
            createdAt: parseText(rec.createdAt ?? rec.created_at),
            updatedAt: parseText(rec.updatedAt ?? rec.updated_at),
        };
    }).filter((slide): slide is DashboardHeroSlide => slide !== null)
        .sort((a, b) => (a.displayOrder - b.displayOrder) || (a.id - b.id));
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
        // Some dashboard endpoints include both `id` and `category_id`.
        // `category_id` is the canonical category PK for create/update operations.
        const id = parseNumeric(rec.category_id ?? rec.id);
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

function normalizeAuthorOptions(payload: unknown): NamedOption[] {
    const options = readArrayPayload(payload).map((row) => {
        const rec = isRecord(row) ? row : {};
        const id = parseNumeric(rec.id ?? rec.author_id);
        const name = parseText(rec.name ?? rec.full_name ?? rec.author_name ?? rec.title);
        return Number.isFinite(id) && id > 0 && name ? { id, name } : null;
    }).filter((option): option is NamedOption => option !== null);

    return dedupeNamedOptions(options);
}

function normalizeAuthorOption(payload: unknown): NamedOption | null {
    const candidates: unknown[] = [];

    if (Array.isArray(payload) && payload.length > 0) {
        candidates.push(payload[0]);
    }

    candidates.push(payload);

    if (isRecord(payload)) {
        candidates.push(payload.data, payload.author, payload.item, payload.result);
    }

    for (const candidate of candidates) {
        if (!isRecord(candidate)) continue;

        const id = parseNumeric(candidate.id ?? candidate.author_id);
        const name = parseText(candidate.name ?? candidate.full_name ?? candidate.author_name ?? candidate.title);
        if (Number.isFinite(id) && id > 0 && name) {
            return { id, name };
        }
    }

    return null;
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
                            <tr
                                key={o.id}
                                className={`border-t transition-colors cursor-pointer ${rowH}`}
                                title="Click to view order details"
                                onClick={() => onManageOrder(o.id)}
                            >
                                <td className="px-4 py-2.5 text-[11px] font-bold text-blue-500">{o.id}</td>
                                <td className={`px-4 py-2.5 text-[11px] ${dark ? 'text-gray-300' : 'text-gray-700'}`}>{o.customer}</td>
                                <td className={`px-4 py-2.5 text-[11px] ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{o.book}</td>
                                <td className={`px-4 py-2.5 text-[11px] font-bold font-mono ${dark ? 'text-gray-200' : 'text-gray-800'}`}>TK {o.amount}</td>
                                <td className="px-4 py-2.5"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sColors[o.status]}`}>{o.status}</span></td>
                                <td className="px-4 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">{o.delivery}</span></td>
                                <td className="px-4 py-2.5">
                                    <button
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            onManageOrder(o.id);
                                        }}
                                        className="text-[10px] font-semibold bg-blue-600 text-white px-2.5 py-1 rounded-full hover:bg-blue-700 transition"
                                    >
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

/* ═══════════════════════════════ PRINTING OPS TABLE ═══════════════════════════════ */
function PrintingOperationsTable({
    dark,
    orders,
    onUpdateStatus,
    onOpenOrder,
}: {
    dark: boolean;
    orders: DashboardPrintingOrder[];
    onUpdateStatus: (orderId: string, status: string) => Promise<void>;
    onOpenOrder: (orderId: string) => void;
}) {
    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState('');
    const [draftStatus, setDraftStatus] = useState<Record<string, string>>({});
    const [savingOrderId, setSavingOrderId] = useState<string | null>(null);

    const q = search.trim().toLowerCase();
    const filtered = orders.filter((order) => {
        const statusPass = filter === 'All' ? true : order.status === filter.toLowerCase();
        if (!statusPass) return false;
        if (!q) return true;
        return (
            order.order_id.toLowerCase().includes(q)
            || order.customer_name.toLowerCase().includes(q)
            || order.customer_phone.toLowerCase().includes(q)
        );
    });

    const statusOptions = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
    const sColors: Record<string, string> = {
        pending: 'bg-amber-100 text-amber-700',
        confirmed: 'bg-blue-100 text-blue-700',
        in_progress: 'bg-violet-100 text-violet-700',
        completed: 'bg-emerald-100 text-emerald-700',
        cancelled: 'bg-red-100 text-red-600',
    };
    const card = dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100';
    const rowH = dark ? 'hover:bg-gray-800 border-gray-800' : 'hover:bg-gray-50 border-gray-50';
    const th = dark ? 'text-gray-500 border-gray-800' : 'text-gray-400 border-gray-100';
    const inp = dark ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-700';

    return (
        <div className={`rounded-xl border ${card} transition-colors duration-300`}>
            <div className="flex flex-wrap items-center justify-between gap-2 p-4 pb-3">
                <h3 className={`text-sm font-bold ${dark ? 'text-gray-100' : 'text-gray-800'}`}>Printing Orders</h3>
                <div className="flex flex-wrap gap-2">
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search order/customer/phone"
                        className={`text-[11px] px-2.5 py-1.5 rounded-lg border outline-none focus:ring-2 focus:ring-blue-200 ${inp}`}
                    />
                    <div className="flex gap-1">
                        {['All', 'Pending', 'In_Progress', 'Completed'].map((value) => (
                            <button
                                key={value}
                                onClick={() => setFilter(value)}
                                className={`text-[10px] font-semibold px-2.5 py-1 rounded-full transition-all ${
                                    filter === value ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-600'
                                }`}
                            >
                                {value.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className={`border-t text-[10px] font-semibold uppercase tracking-wide ${th}`}>
                            {['Order', 'Customer', 'Items', 'Amount', 'Status', 'Submitted', 'Action'].map((h) => (
                                <th key={h} className="px-4 py-2 text-left">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((order) => {
                            const nextStatus = draftStatus[order.order_id] ?? order.status;
                            const canSave = nextStatus !== order.status;
                            const submittedAtLabel = order.submitted_at
                                ? new Date(order.submitted_at).toLocaleString()
                                : 'N/A';

                            return (
                                <tr
                                    key={order.order_id}
                                    className={`border-t transition-colors cursor-pointer ${rowH}`}
                                    title="Click to view order details"
                                    onClick={() => onOpenOrder(order.order_id)}
                                >
                                    <td className="px-4 py-2.5 text-[11px] font-bold text-blue-500">{order.order_id}</td>
                                    <td className={`px-4 py-2.5 text-[11px] ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        <p className="font-semibold">{order.customer_name}</p>
                                        <p className={dark ? 'text-gray-500' : 'text-gray-500'}>{order.customer_phone || 'No phone'}</p>
                                    </td>
                                    <td className={`px-4 py-2.5 text-[11px] ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{order.items_count}</td>
                                    <td className={`px-4 py-2.5 text-[11px] font-bold font-mono ${dark ? 'text-gray-200' : 'text-gray-800'}`}>
                                        TK {order.total_amount}
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <select
                                            value={nextStatus}
                                            onClick={(event) => event.stopPropagation()}
                                            onChange={(event) => {
                                                const value = event.target.value;
                                                setDraftStatus((prev) => ({ ...prev, [order.order_id]: value }));
                                            }}
                                            className={`text-[10px] font-bold px-2 py-1 rounded-lg border outline-none ${inp}`}
                                        >
                                            {statusOptions.map((statusOption) => (
                                                <option key={`${order.order_id}-${statusOption}`} value={statusOption}>
                                                    {statusOption}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="mt-1">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sColors[order.status] || 'bg-gray-100 text-gray-700'}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className={`px-4 py-2.5 text-[11px] ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{submittedAtLabel}</td>
                                    <td className="px-4 py-2.5">
                                        <button
                                            onMouseDown={(event) => event.stopPropagation()}
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                if (!canSave || savingOrderId) return;
                                                setSavingOrderId(order.order_id);
                                                void onUpdateStatus(order.order_id, nextStatus)
                                                    .then(() => {
                                                        setDraftStatus((prev) => {
                                                            const next = { ...prev };
                                                            delete next[order.order_id];
                                                            return next;
                                                        });
                                                    })
                                                    .finally(() => setSavingOrderId(null));
                                            }}
                                            disabled={!canSave || savingOrderId !== null}
                                            className={`text-[10px] font-semibold px-2.5 py-1 rounded-full transition ${
                                                canSave && savingOrderId === null
                                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                            }`}
                                        >
                                            {savingOrderId === order.order_id ? 'Saving...' : 'Save'}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {filtered.length === 0 && <p className="px-4 py-3 text-[11px] text-gray-400">No printing orders found.</p>}
        </div>
    );
}

/* ═══════════════════════════════ BOOKS TABLE ═══════════════════════════════ */
function BooksTable({
    dark,
    books,
    onAddBook,
    onManageBook,
}: {
    dark: boolean;
    books: DashboardBook[];
    onAddBook: () => void;
    onManageBook: (bookId: string) => void;
}) {
    const [reservedByBook, setReservedByBook] = useState<Record<number, number>>({});
    const card = dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100';
    const th = dark ? 'text-gray-500 border-gray-800' : 'text-gray-400 border-gray-100';
    const rowH = dark ? 'hover:bg-gray-800 border-gray-800' : 'hover:bg-gray-50 border-gray-50';

    useEffect(() => {
        const syncReserved = () => {
            const next: Record<number, number> = {};
            getStoredCartItems().forEach((item) => {
                next[item.id] = (next[item.id] || 0) + item.qty;
            });
            setReservedByBook(next);
        };

        syncReserved();
        window.addEventListener('storage', syncReserved);
        window.addEventListener(CART_UPDATED_EVENT, syncReserved as EventListener);

        return () => {
            window.removeEventListener('storage', syncReserved);
            window.removeEventListener(CART_UPDATED_EVENT, syncReserved as EventListener);
        };
    }, []);

    const effectiveBooks = books.map((book) => {
        const numericId = Number(book.id);
        const reserved = Number.isFinite(numericId) ? (reservedByBook[numericId] || 0) : 0;
        const effectiveStock = Math.max(0, book.stock - reserved);
        const effectiveStatus = book.status === 'coming soon' || book.status === 'inactive'
            ? book.status
            : (effectiveStock <= 0 ? 'out of stock' : 'active');

        return {
            ...book,
            stock: effectiveStock,
            status: effectiveStatus,
        };
    });

    const lowStockCount = effectiveBooks.filter((book) => book.stock > 0 && book.stock <= 3).length;

    return (
        <div className={`rounded-xl border ${card} transition-colors duration-300`}>
            <div className="flex items-center justify-between p-4 pb-3">
                <h3 className={`text-sm font-bold ${dark ? 'text-gray-100' : 'text-gray-800'}`}>Book Inventory</h3>
                <div className="flex gap-2">
                    <span className="text-[10px] text-amber-600 bg-amber-50 font-bold px-2 py-1 rounded-full flex items-center gap-1">{Ico.warn}{lowStockCount} Low Stock</span>
                    <button onClick={onAddBook} className="text-[10px] font-semibold bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700 transition">+ Add Book</button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className={`border-t text-[10px] font-semibold uppercase tracking-wide ${th}`}>
                            {['Image', 'Title', 'Author', 'Genre', 'Stock', 'Variants', 'Orders', 'Status', 'Action'].map(h => <th key={h} className="px-4 py-2 text-left">{h}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {effectiveBooks.map(b => (
                            <tr key={b.id} className={`border-t transition-colors cursor-pointer ${rowH}`}>
                                <td className="px-4 py-3">
                                    {(b.thumbnail || b.image) ? (
                                        <Image
                                            src={b.thumbnail || b.image}
                                            alt={b.title}
                                            width={36}
                                            height={48}
                                            unoptimized
                                            loader={({ src }) => src}
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
                                <td className={`px-4 py-3 text-[11px] font-mono font-bold ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    <p>PB TK {b.paperbackPrice.toFixed(2)} ({b.paperbackQuality})</p>
                                    <p className={dark ? 'text-gray-500' : 'text-gray-500'}>HC TK {b.hardcoverPrice.toFixed(2)} ({b.hardcoverQuality})</p>
                                </td>
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

/* ═══════════════════════════════ HERO SLIDES ═══════════════════════════════ */
function HeroSlidesSection({
    dark,
    slides,
    onCreateSlide,
    onUpdateSlide,
    onDeleteSlide,
}: {
    dark: boolean;
    slides: DashboardHeroSlide[];
    onCreateSlide: (payload: DashboardHeroSlideInput) => Promise<void>;
    onUpdateSlide: (slideId: number, payload: DashboardHeroSlideInput) => Promise<void>;
    onDeleteSlide: (slideId: number) => Promise<void>;
}) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState<DashboardHeroSlideInput>({
        tag: '',
        title: '',
        ctaLabel: '',
        ctaHref: '',
        backgroundFrom: 'blue-50',
        backgroundTo: 'indigo-100',
        displayOrder: slides.length,
        isActive: true,
        imageFile: null,
    });
    const [submitting, setSubmitting] = useState(false);
    const [busyId, setBusyId] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const card = dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100';
    const sec = dark ? 'border-gray-800' : 'border-gray-100';
    const tp = dark ? 'text-gray-100' : 'text-gray-800';
    const ts = dark ? 'text-gray-400' : 'text-gray-500';
    const inp = dark ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-700 placeholder-gray-400';

    const resetForm = useCallback((nextOrder: number) => {
        setEditingId(null);
        setForm({
            tag: '',
            title: '',
            ctaLabel: '',
            ctaHref: '',
            backgroundFrom: 'blue-50',
            backgroundTo: 'indigo-100',
            displayOrder: nextOrder,
            isActive: true,
            imageFile: null,
        });
    }, []);

    useEffect(() => {
        if (editingId !== null) return;
        setForm((prev) => ({ ...prev, displayOrder: slides.length }));
    }, [editingId, slides.length]);

    const startEdit = (slide: DashboardHeroSlide) => {
        setError('');
        setSuccess('');
        setEditingId(slide.id);
        setForm({
            tag: slide.tag,
            title: slide.title,
            ctaLabel: slide.ctaLabel,
            ctaHref: slide.ctaHref,
            backgroundFrom: slide.backgroundFrom,
            backgroundTo: slide.backgroundTo,
            displayOrder: slide.displayOrder,
            isActive: slide.isActive,
            imageFile: null,
        });
    };

    const submit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (submitting) return;

        const title = form.title.trim();
        if (!title) {
            setError('Slide title is required.');
            return;
        }
        if (editingId === null && !form.imageFile) {
            setError('Slide image is required.');
            return;
        }

        setError('');
        setSuccess('');
        setSubmitting(true);

        try {
            const payload: DashboardHeroSlideInput = {
                ...form,
                tag: form.tag.trim(),
                title,
                ctaLabel: form.ctaLabel.trim(),
                ctaHref: form.ctaHref.trim(),
                backgroundFrom: form.backgroundFrom.trim() || 'blue-50',
                backgroundTo: form.backgroundTo.trim() || 'indigo-100',
                displayOrder: Math.max(0, Math.trunc(form.displayOrder)),
                isActive: form.isActive,
                imageFile: form.imageFile ?? null,
            };

            if (editingId === null) {
                await onCreateSlide(payload);
                setSuccess(`Slide "${title}" created.`);
                resetForm(slides.length + 1);
            } else {
                await onUpdateSlide(editingId, payload);
                setSuccess(`Slide "${title}" updated.`);
                resetForm(slides.length);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save hero slide.');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleActive = async (slide: DashboardHeroSlide) => {
        setBusyId(slide.id);
        setError('');
        setSuccess('');
        try {
            await onUpdateSlide(slide.id, {
                tag: slide.tag,
                title: slide.title,
                ctaLabel: slide.ctaLabel,
                ctaHref: slide.ctaHref,
                backgroundFrom: slide.backgroundFrom,
                backgroundTo: slide.backgroundTo,
                displayOrder: slide.displayOrder,
                isActive: !slide.isActive,
                imageFile: null,
            });
            setSuccess(`Slide "${slide.title}" marked ${slide.isActive ? 'inactive' : 'active'}.`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update slide status.');
        } finally {
            setBusyId(null);
        }
    };

    const removeSlide = async (slide: DashboardHeroSlide) => {
        if (!window.confirm(`Delete slide "${slide.title}"?`)) return;
        setBusyId(slide.id);
        setError('');
        setSuccess('');
        try {
            await onDeleteSlide(slide.id);
            setSuccess(`Slide "${slide.title}" deleted.`);
            if (editingId === slide.id) {
                resetForm(slides.length > 0 ? Math.max(0, slides.length - 1) : 0);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete slide.');
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
            <form onSubmit={submit} className={`rounded-xl border p-4 xl:col-span-2 space-y-3 ${card}`}>
                <div className="flex items-center justify-between gap-2">
                    <h3 className={`text-sm font-bold ${tp}`}>{editingId === null ? 'Add Hero Slide' : 'Edit Hero Slide'}</h3>
                    {editingId !== null && (
                        <button
                            type="button"
                            onClick={() => resetForm(slides.length)}
                            className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
                        >
                            Cancel Edit
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className={`block text-[11px] font-semibold mb-1.5 ${ts}`}>Tag</label>
                        <input
                            value={form.tag}
                            onChange={(e) => setForm((prev) => ({ ...prev, tag: e.target.value }))}
                            placeholder="NEW ARRIVALS"
                            className={`w-full text-xs px-3 py-2.5 rounded-xl border outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition ${inp}`}
                        />
                    </div>
                    <div>
                        <label className={`block text-[11px] font-semibold mb-1.5 ${ts}`}>Display Order</label>
                        <input
                            type="number"
                            min={0}
                            value={form.displayOrder}
                            onChange={(e) => setForm((prev) => ({ ...prev, displayOrder: parseNumeric(e.target.value, 0) }))}
                            className={`w-full text-xs px-3 py-2.5 rounded-xl border outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition ${inp}`}
                        />
                    </div>
                </div>

                <div>
                    <label className={`block text-[11px] font-semibold mb-1.5 ${ts}`}>Title</label>
                    <textarea
                        rows={2}
                        value={form.title}
                        onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                        placeholder="Discover Your Next Great Read"
                        className={`w-full text-xs px-3 py-2.5 rounded-xl border outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition resize-none ${inp}`}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className={`block text-[11px] font-semibold mb-1.5 ${ts}`}>CTA Label</label>
                        <input
                            value={form.ctaLabel}
                            onChange={(e) => setForm((prev) => ({ ...prev, ctaLabel: e.target.value }))}
                            placeholder="Shop Now"
                            className={`w-full text-xs px-3 py-2.5 rounded-xl border outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition ${inp}`}
                        />
                    </div>
                    <div>
                        <label className={`block text-[11px] font-semibold mb-1.5 ${ts}`}>CTA Href</label>
                        <input
                            value={form.ctaHref}
                            onChange={(e) => setForm((prev) => ({ ...prev, ctaHref: e.target.value }))}
                            placeholder="/shop"
                            className={`w-full text-xs px-3 py-2.5 rounded-xl border outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition ${inp}`}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className={`block text-[11px] font-semibold mb-1.5 ${ts}`}>Background From</label>
                        <input
                            value={form.backgroundFrom}
                            onChange={(e) => setForm((prev) => ({ ...prev, backgroundFrom: e.target.value }))}
                            placeholder="blue-50"
                            className={`w-full text-xs px-3 py-2.5 rounded-xl border outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition ${inp}`}
                        />
                    </div>
                    <div>
                        <label className={`block text-[11px] font-semibold mb-1.5 ${ts}`}>Background To</label>
                        <input
                            value={form.backgroundTo}
                            onChange={(e) => setForm((prev) => ({ ...prev, backgroundTo: e.target.value }))}
                            placeholder="indigo-100"
                            className={`w-full text-xs px-3 py-2.5 rounded-xl border outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition ${inp}`}
                        />
                    </div>
                </div>

                <div>
                    <label className={`block text-[11px] font-semibold mb-1.5 ${ts}`}>
                        {editingId === null ? 'Slide Image' : 'Slide Image (optional for update)'}
                    </label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setForm((prev) => ({ ...prev, imageFile: e.target.files?.[0] ?? null }))}
                        className={`w-full text-xs px-3 py-2.5 rounded-xl border outline-none transition ${inp}`}
                    />
                    {form.imageFile && <p className={`text-[10px] mt-1 ${ts}`}>{form.imageFile.name}</p>}
                </div>

                <label className={`flex items-center gap-2 text-xs font-semibold ${tp}`}>
                    <input
                        type="checkbox"
                        checked={form.isActive}
                        onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                    />
                    Active
                </label>

                {error && <p className="text-[11px] font-semibold text-red-500">{error}</p>}
                {success && <p className="text-[11px] font-semibold text-emerald-500">{success}</p>}

                <button
                    type="submit"
                    disabled={submitting}
                    className={`text-xs font-bold text-white bg-blue-600 px-5 py-2.5 rounded-xl hover:bg-blue-700 transition ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                    {submitting ? 'Saving...' : (editingId === null ? 'Create Slide' : 'Update Slide')}
                </button>
            </form>

            <div className={`rounded-xl border xl:col-span-3 ${card}`}>
                <div className={`flex items-center justify-between px-4 py-3 border-b ${sec}`}>
                    <h3 className={`text-sm font-bold ${tp}`}>Hero Slides</h3>
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                        {slides.length} total
                    </span>
                </div>

                <div className="max-h-[520px] overflow-y-auto">
                    {slides.map((slide) => (
                        <div key={slide.id} className={`px-4 py-3 border-b ${sec}`}>
                            <div className="flex items-start gap-3">
                                <div className="w-20 h-12 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center flex-shrink-0">
                                    {slide.imageUrl ? (
                                        <Image
                                            src={slide.imageUrl}
                                            alt={slide.title}
                                            width={80}
                                            height={48}
                                            unoptimized
                                            loader={({ src }) => src}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-[9px] font-bold text-gray-500">No Image</span>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className={`text-xs font-bold ${tp}`}>{slide.title}</p>
                                        {slide.tag && (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                                {slide.tag}
                                            </span>
                                        )}
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${slide.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-700'}`}>
                                            {slide.isActive ? 'active' : 'inactive'}
                                        </span>
                                    </div>
                                    <p className={`text-[11px] mt-1 ${ts}`}>
                                        Order: {slide.displayOrder} {slide.ctaLabel ? `• CTA: ${slide.ctaLabel}` : ''} {slide.ctaHref ? `• ${slide.ctaHref}` : ''}
                                    </p>
                                    <p className={`text-[11px] ${ts}`}>
                                        {slide.backgroundFrom} → {slide.backgroundTo}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => startEdit(slide)}
                                        disabled={busyId !== null}
                                        className="text-[10px] font-semibold bg-blue-600 text-white px-2.5 py-1 rounded-full hover:bg-blue-700 transition disabled:opacity-60"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            void toggleActive(slide);
                                        }}
                                        disabled={busyId !== null}
                                        className="text-[10px] font-semibold bg-amber-500 text-white px-2.5 py-1 rounded-full hover:bg-amber-600 transition disabled:opacity-60"
                                    >
                                        {busyId === slide.id ? 'Saving...' : (slide.isActive ? 'Deactivate' : 'Activate')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            void removeSlide(slide);
                                        }}
                                        disabled={busyId !== null}
                                        className="text-[10px] font-semibold bg-rose-600 text-white px-2.5 py-1 rounded-full hover:bg-rose-700 transition disabled:opacity-60"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {slides.length === 0 && (
                    <p className="px-4 py-6 text-[11px] text-gray-400 text-center">No hero slides found.</p>
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
            <div className={`relative w-[min(92vw,520px)] max-h-[90vh] rounded-2xl border shadow-2xl overflow-hidden flex flex-col ${bg}`}
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
                                {avatar ? (
                                    <Image
                                        src={avatar}
                                        alt="Avatar"
                                        width={64}
                                        height={64}
                                        unoptimized
                                        loader={({ src }) => src}
                                        className="w-full h-full object-cover"
                                    />
                                ) :
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
function SettingsPanel({
    dark,
    setDark,
    onClose,
    token,
}: {
    dark: boolean;
    setDark: (v: boolean) => void;
    onClose: () => void;
    token: string | null;
}) {
    const [notifs, setNotifs] = useState(true);
    const [emails, setEmails] = useState(false);
    const [compact, setCompact] = useState(false);
    const [auto, setAuto] = useState(true);
    const [currency, setCurrency] = useState('USD');
    const [language, setLanguage] = useState('English');
    const [saved, setSaved] = useState(false);
    const [deliveryCharge, setDeliveryCharge] = useState(String(DEFAULT_DELIVERY_SETTINGS.deliveryCharge));
    const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(String(DEFAULT_DELIVERY_SETTINGS.freeDeliveryThreshold));
    const [pricingLoading, setPricingLoading] = useState(false);
    const [pricingSaving, setPricingSaving] = useState(false);
    const [pricingError, setPricingError] = useState('');
    const bg = dark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200';
    const sec = dark ? 'border-gray-800' : 'border-gray-100';
    const tp = dark ? 'text-gray-100' : 'text-gray-800';
    const ts = dark ? 'text-gray-400' : 'text-gray-500';
    const inp = dark ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-700';

    useEffect(() => {
        let mounted = true;
        if (!token) {
            setPricingLoading(false);
            setPricingError('Missing admin token. Please sign in again.');
            return () => { mounted = false; };
        }

        const settingsUrl = resolveEndpoint(
            () => (endpoints.business as unknown as Record<string, string>).dashboardDeliverySettings,
            '/business/delivery-settings/dashboard/',
        );

        const loadPricing = async () => {
            setPricingLoading(true);
            setPricingError('');
            try {
                const payload = await apiClient.get<unknown>(settingsUrl, {
                    cache: 'no-store',
                    headers: { Authorization: `Token ${token}` },
                });
                if (!mounted) return;
                const normalized = normalizeDeliverySettings(payload);
                setDeliveryCharge(String(normalized.deliveryCharge));
                setFreeDeliveryThreshold(String(normalized.freeDeliveryThreshold));
            } catch (error) {
                if (!mounted) return;
                const message = error instanceof Error ? error.message : 'Failed to load delivery settings.';
                setPricingError(message);
            } finally {
                if (mounted) setPricingLoading(false);
            }
        };

        void loadPricing();
        return () => { mounted = false; };
    }, [token]);

    const handleSave = async () => {
        if (!token) {
            setPricingError('Missing admin token. Please sign in again.');
            return;
        }

        const nextDeliveryCharge = parseNumeric(deliveryCharge, Number.NaN);
        const nextFreeThreshold = parseNumeric(freeDeliveryThreshold, Number.NaN);
        if (!Number.isFinite(nextDeliveryCharge) || nextDeliveryCharge < 0) {
            setPricingError('Delivery charge must be a valid non-negative number.');
            return;
        }
        if (!Number.isFinite(nextFreeThreshold) || nextFreeThreshold < 0) {
            setPricingError('Free delivery threshold must be a valid non-negative number.');
            return;
        }

        const settingsUrl = resolveEndpoint(
            () => (endpoints.business as unknown as Record<string, string>).dashboardDeliverySettings,
            '/business/delivery-settings/dashboard/',
        );

        setPricingSaving(true);
        setPricingError('');
        try {
            await apiClient.patch<unknown, Record<string, number>>(settingsUrl, {
                deliveryCharge: Number(nextDeliveryCharge.toFixed(2)),
                freeDeliveryThreshold: Number(nextFreeThreshold.toFixed(2)),
            }, {
                headers: { Authorization: `Token ${token}` },
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to save delivery settings.';
            setPricingError(message);
            setPricingSaving(false);
            return;
        }

        setPricingSaving(false);
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
                    {/* Commerce */}
                    <div>
                        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-3">Commerce</p>
                        <div className={`py-3 border-b ${sec}`}>
                            <label className={`block text-[10px] font-semibold mb-1.5 ${tp}`}>Delivery Charge (BDT)</label>
                            <input
                                type="number"
                                min={0}
                                step="0.01"
                                value={deliveryCharge}
                                onChange={(e) => setDeliveryCharge(e.target.value)}
                                className={`w-full text-xs border rounded-lg px-2.5 py-2 outline-none ${inp}`}
                            />
                        </div>
                        <div className={`py-3 border-b ${sec}`}>
                            <label className={`block text-[10px] font-semibold mb-1.5 ${tp}`}>Free Delivery Threshold (BDT)</label>
                            <input
                                type="number"
                                min={0}
                                step="0.01"
                                value={freeDeliveryThreshold}
                                onChange={(e) => setFreeDeliveryThreshold(e.target.value)}
                                className={`w-full text-xs border rounded-lg px-2.5 py-2 outline-none ${inp}`}
                            />
                        </div>
                        {pricingLoading && <p className={`mt-2 text-[10px] font-semibold ${ts}`}>Loading delivery settings...</p>}
                        {pricingError && <p className="mt-2 text-[10px] font-semibold text-rose-500">{pricingError}</p>}
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
                    <button onClick={() => { void handleSave(); }}
                        className={`w-full flex items-center justify-center gap-2 text-sm font-bold py-3 rounded-xl transition-all shadow-sm ${saved ? 'bg-emerald-500 shadow-emerald-200 text-white' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 text-white'}`}>
                        {saved ? <>{Ico.check} Settings Saved!</> : pricingSaving ? <>{Ico.save} Saving...</> : <>{Ico.save} Save Settings</>}
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

function InboxMessageDetailModal({
    dark,
    onClose,
    message,
}: {
    dark: boolean;
    onClose: () => void;
    message: DashboardInboxMessage;
}) {
    const bg = dark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200';
    const sec = dark ? 'border-gray-800' : 'border-gray-100';
    const tp = dark ? 'text-gray-100' : 'text-gray-800';
    const ts = dark ? 'text-gray-400' : 'text-gray-500';
    const normalizedStatus = message.status.toLowerCase();
    const statusTone = normalizedStatus === 'resolved'
        ? 'bg-emerald-100 text-emerald-700'
        : normalizedStatus === 'closed'
            ? 'bg-gray-200 text-gray-700'
            : 'bg-amber-100 text-amber-700';

    const formatDateTime = (value: string) => {
        if (!value) return 'N/A';
        const parsed = Date.parse(value);
        return Number.isNaN(parsed) ? value : new Date(parsed).toLocaleString();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden ${bg}`} style={{ animation: 'fadeUp 0.3s ease' }}>
                <div className={`flex items-center justify-between px-5 py-4 border-b ${sec}`}>
                    <div className="flex items-center gap-2">
                        <span className="text-blue-500">{Ico.inbox}</span>
                        <span className={`font-bold ${tp}`}>Inbox Message Detail</span>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">{Ico.x}</button>
                </div>

                <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm font-bold ${tp}`}>{message.subject || 'No subject'}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusTone}`}>{message.status || 'received'}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                        <div><p className={ts}>Name</p><p className={`font-semibold ${tp}`}>{message.name || 'Unknown'}</p></div>
                        <div><p className={ts}>Phone</p><p className={`font-semibold ${tp}`}>{message.phone || 'N/A'}</p></div>
                        <div className="col-span-2"><p className={ts}>Email</p><p className={`font-semibold ${tp}`}>{message.email || 'N/A'}</p></div>
                        <div><p className={ts}>Submitted</p><p className={`font-semibold ${tp}`}>{formatDateTime(message.submittedAt)}</p></div>
                        <div><p className={ts}>Updated</p><p className={`font-semibold ${tp}`}>{formatDateTime(message.updatedAt)}</p></div>
                    </div>

                    <div className={`rounded-xl border p-3 ${dark ? 'border-gray-800 bg-gray-800/40' : 'border-gray-100 bg-gray-50'}`}>
                        <p className={`text-[11px] font-semibold mb-1 ${ts}`}>Message</p>
                        <p className={`text-xs whitespace-pre-wrap break-words ${tp}`}>{message.message || 'No message body.'}</p>
                    </div>
                </div>

                <div className={`px-5 py-4 border-t flex items-center justify-end ${sec}`}>
                    <button onClick={onClose} className={`text-xs font-semibold px-4 py-2.5 rounded-xl border transition ${dark ? 'border-gray-700 text-gray-400 hover:bg-gray-800' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                        Close
                    </button>
                </div>
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
                                <div><p className={`${ts}`}>Phone</p><p className={`font-semibold ${tp}`}>{detail.phone || 'N/A'}</p></div>
                                <div><p className={`${ts}`}>Email</p><p className={`font-semibold ${tp}`}>{detail.email || 'N/A'}</p></div>
                                <div><p className={`${ts}`}>Amount</p><p className={`font-semibold ${tp}`}>TK {detail.amount}</p></div>
                                <div><p className={`${ts}`}>Items</p><p className={`font-semibold ${tp}`}>{detail.items}</p></div>
                                <div><p className={`${ts}`}>Payment</p><p className={`font-semibold ${tp}`}>{detail.paymentMethod?.toUpperCase() || 'N/A'}</p></div>
                                <div><p className={`${ts}`}>Delivery Status</p><p className={`font-semibold ${tp}`}>{detail.delivery || 'N/A'}</p></div>
                                <div><p className={`${ts}`}>Ordered At</p><p className={`font-semibold ${tp}`}>{detail.createdAt ? new Date(detail.createdAt).toLocaleString() : 'N/A'}</p></div>
                                <div><p className={`${ts}`}>Requested Delivery</p><p className={`font-semibold ${tp}`}>{detail.requestedDeliveryAt ? new Date(detail.requestedDeliveryAt).toLocaleString() : 'Not specified'}</p></div>
                                <div className="col-span-2">
                                    <p className={`${ts}`}>Shipping Address</p>
                                    <p className={`font-semibold ${tp}`}>{detail.shippingAddress || 'N/A'}</p>
                                </div>
                                <div><p className={`${ts}`}>City/Thana</p><p className={`font-semibold ${tp}`}>{detail.city || 'N/A'}</p></div>
                                <div><p className={`${ts}`}>District</p><p className={`font-semibold ${tp}`}>{detail.district || 'N/A'}</p></div>
                                <div><p className={`${ts}`}>Postal Code</p><p className={`font-semibold ${tp}`}>{detail.postalCode || 'N/A'}</p></div>
                                <div><p className={`${ts}`}>Last Updated</p><p className={`font-semibold ${tp}`}>{detail.updatedAt ? new Date(detail.updatedAt).toLocaleString() : 'N/A'}</p></div>
                                {detail.notes && (
                                    <div className="col-span-2">
                                        <p className={`${ts}`}>Customer Note</p>
                                        <p className={`font-semibold ${tp}`}>{detail.notes}</p>
                                    </div>
                                )}
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

function PrintingOrderDetailModal({
    dark,
    onClose,
    orderId,
    token,
}: {
    dark: boolean;
    onClose: () => void;
    orderId: string;
    token: string | null;
}) {
    const [detail, setDetail] = useState<DashboardPrintingOrderDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const bg = dark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200';
    const sec = dark ? 'border-gray-800' : 'border-gray-100';
    const tp = dark ? 'text-gray-100' : 'text-gray-800';
    const ts = dark ? 'text-gray-400' : 'text-gray-500';

    useEffect(() => {
        let active = true;

        const fetchOrderDetail = async () => {
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
                const detailUrl = resolveEndpoint(
                    () => endpoints.printing.dashboardOrderDetail(orderId),
                    `/printing/dashboard/orders/${encodeURIComponent(orderId)}/`,
                );
                const response = await apiClient.get<unknown>(detailUrl, {
                    cache: 'no-store',
                    headers: { Authorization: `Token ${token}` },
                });
                if (!active) return;

                const normalized = normalizePrintingOrderDetail(response);
                if (!normalized) {
                    setError('Failed to read printing order details.');
                    setLoading(false);
                    return;
                }

                setDetail(normalized);
            } catch (err) {
                if (!active) return;
                setError(err instanceof Error ? err.message : 'Failed to load printing order details.');
            } finally {
                if (active) setLoading(false);
            }
        };

        void fetchOrderDetail();
        return () => { active = false; };
    }, [orderId, token]);

    const formatCurrency = (value: number) => `TK ${value.toFixed(2)}`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative w-full max-w-3xl max-h-[90vh] rounded-2xl border shadow-2xl overflow-hidden flex flex-col ${bg}`} style={{ animation: 'fadeUp 0.3s ease' }}>
                <div className={`flex items-center justify-between px-5 py-4 border-b ${sec}`}>
                    <div className="flex items-center gap-2">
                        <span className="text-blue-500">{Ico.package}</span>
                        <span className={`font-bold ${tp}`}>Printing Order Detail</span>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">{Ico.x}</button>
                </div>

                <div className="p-5 overflow-y-auto space-y-4">
                    {loading && <p className={`text-xs ${ts}`}>Loading printing order details...</p>}
                    {!loading && detail && (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                <div><p className={`${ts}`}>Order</p><p className={`font-semibold ${tp}`}>{detail.order_id}</p></div>
                                <div><p className={`${ts}`}>Status</p><p className={`font-semibold ${tp}`}>{detail.status}</p></div>
                                <div><p className={`${ts}`}>Payment</p><p className={`font-semibold ${tp}`}>{detail.payment_method.toUpperCase()}</p></div>
                                <div><p className={`${ts}`}>Submitted</p><p className={`font-semibold ${tp}`}>{detail.submitted_at ? new Date(detail.submitted_at).toLocaleString() : 'N/A'}</p></div>
                                <div><p className={`${ts}`}>Customer</p><p className={`font-semibold ${tp}`}>{detail.customer_name}</p></div>
                                <div><p className={`${ts}`}>Phone</p><p className={`font-semibold ${tp}`}>{detail.customer_phone || 'N/A'}</p></div>
                                <div><p className={`${ts}`}>Email</p><p className={`font-semibold ${tp}`}>{detail.customer_email || 'N/A'}</p></div>
                                <div><p className={`${ts}`}>Postal</p><p className={`font-semibold ${tp}`}>{detail.postal_code || 'N/A'}</p></div>
                                <div className="col-span-2 md:col-span-4">
                                    <p className={`${ts}`}>Address</p>
                                    <p className={`font-semibold ${tp}`}>{detail.shipping_address || 'N/A'}{detail.city ? `, ${detail.city}` : ''}{detail.district ? `, ${detail.district}` : ''}</p>
                                </div>
                                {detail.notes && (
                                    <div className="col-span-2 md:col-span-4">
                                        <p className={`${ts}`}>Notes</p>
                                        <p className={`font-semibold ${tp}`}>{detail.notes}</p>
                                    </div>
                                )}
                            </div>

                            <div className={`rounded-xl border ${dark ? 'border-gray-800' : 'border-gray-100'}`}>
                                <div className={`px-4 py-3 border-b ${sec}`}>
                                    <h4 className={`text-sm font-bold ${tp}`}>Order Items</h4>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {detail.order_items.map((item) => (
                                        <div key={`${detail.order_id}-${item.id}`} className="p-4">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <p className={`text-sm font-semibold ${tp}`}>{item.item_icon} {item.item_name}</p>
                                                <p className={`text-xs font-bold ${tp}`}>{formatCurrency(item.line_total)}</p>
                                            </div>
                                            <p className={`mt-1 text-xs ${ts}`}>{item.category_label || 'N/A'} • Qty: {item.quantity}</p>
                                            <p className={`text-xs ${ts}`}>Unit: {formatCurrency(item.unit_price)}</p>
                                            {item.notes && <p className={`mt-1 text-xs ${ts}`}>Note: {item.notes}</p>}
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {item.primary_file_url ? (
                                                    <a
                                                        href={item.primary_file_url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        download
                                                        className="text-[11px] font-semibold bg-blue-600 text-white px-2.5 py-1 rounded-full hover:bg-blue-700 transition"
                                                    >
                                                        Download Primary Photo
                                                    </a>
                                                ) : (
                                                    <span className={`text-[11px] ${ts}`}>No primary photo</span>
                                                )}
                                                {item.secondary_file_url ? (
                                                    <a
                                                        href={item.secondary_file_url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        download
                                                        className="text-[11px] font-semibold bg-indigo-600 text-white px-2.5 py-1 rounded-full hover:bg-indigo-700 transition"
                                                    >
                                                        Download Secondary Photo
                                                    </a>
                                                ) : (
                                                    <span className={`text-[11px] ${ts}`}>No secondary photo</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {detail.order_items.length === 0 && (
                                        <p className="px-4 py-4 text-[11px] text-gray-400">No items found in this printing order.</p>
                                    )}
                                </div>
                            </div>

                            <div className={`rounded-xl border p-3 ${dark ? 'border-gray-800 bg-gray-800/40' : 'border-gray-100 bg-gray-50'}`}>
                                <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2 xl:grid-cols-3">
                                    <div><p className={ts}>Subtotal</p><p className={`font-bold ${tp}`}>{formatCurrency(detail.subtotal)}</p></div>
                                    <div><p className={ts}>Delivery</p><p className={`font-bold ${tp}`}>{formatCurrency(detail.delivery_charge)}</p></div>
                                    <div><p className={ts}>Total</p><p className={`font-black ${tp}`}>{formatCurrency(detail.total_amount)}</p></div>
                                </div>
                            </div>
                        </>
                    )}
                    {error && <p className="text-[11px] font-semibold text-red-500">{error}</p>}
                </div>

                <div className={`px-5 py-4 border-t flex items-center justify-end ${sec}`}>
                    <button onClick={onClose} className={`text-xs font-semibold px-4 py-2.5 rounded-xl border transition ${dark ? 'border-gray-700 text-gray-400 hover:bg-gray-800' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                        Close
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
        paperback_price: '0.00',
        hardcover_price: '0.00',
        paperback_quality: 'Standard',
        hardcover_quality: 'Premium',
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
            paperback_price: next.paperback_price,
            hardcover_price: next.hardcover_price,
            paperback_quality: next.paperback_quality,
            hardcover_quality: next.hardcover_quality,
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
        const paperbackPrice = Number(form.paperback_price);
        const hardcoverPrice = Number(form.hardcover_price);
        const paperbackQuality = form.paperback_quality.trim();
        const hardcoverQuality = form.hardcover_quality.trim();
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
        if (!Number.isFinite(paperbackPrice) || paperbackPrice <= 0) {
            throw new Error('Paperback price must be greater than 0.');
        }
        if (!Number.isFinite(hardcoverPrice) || hardcoverPrice <= 0) {
            throw new Error('Hardcover price must be greater than 0.');
        }
        if (!paperbackQuality) {
            throw new Error('Paperback quality is required.');
        }
        if (!hardcoverQuality) {
            throw new Error('Hardcover quality is required.');
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
            price: paperbackPrice.toFixed(2),
            paperback_price: paperbackPrice.toFixed(2),
            hardcover_price: hardcoverPrice.toFixed(2),
            paperback_quality: paperbackQuality,
            hardcover_quality: hardcoverQuality,
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
            if (payload.paperback_price !== initialDetail.paperback_price) patchPayload.paperback_price = payload.paperback_price;
            if (payload.hardcover_price !== initialDetail.hardcover_price) patchPayload.hardcover_price = payload.hardcover_price;
            if (payload.paperback_quality !== initialDetail.paperback_quality) patchPayload.paperback_quality = payload.paperback_quality;
            if (payload.hardcover_quality !== initialDetail.hardcover_quality) patchPayload.hardcover_quality = payload.hardcover_quality;
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
                    formData.append('paperback_price', payload.paperback_price);
                    formData.append('hardcover_price', payload.hardcover_price);
                    formData.append('paperback_quality', payload.paperback_quality);
                    formData.append('hardcover_quality', payload.hardcover_quality);
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
        <div className="fixed inset-0 z-50 overflow-y-auto p-2 sm:p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative mx-auto my-2 sm:my-4 w-full max-w-2xl max-h-[calc(100vh-1rem)] sm:max-h-[90vh] rounded-2xl border shadow-2xl overflow-hidden flex flex-col ${bg}`} style={{ animation: 'fadeUp 0.3s ease' }}>
                <div className={`flex items-center justify-between px-5 py-4 border-b ${sec}`}>
                    <div className="flex items-center gap-2">
                        <span className="text-blue-500">{Ico.book}</span>
                        <span className={`font-bold ${tp}`}>Manage Book</span>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">{Ico.x}</button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                    {loading && <p className={`text-xs ${ts}`}>Loading book details...</p>}
                    {!loading && detail && (
                        <>
                            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pb-3 border-b ${sec}`}>
                                <div><p className={`${ts}`}>Book ID</p><p className={`font-semibold ${tp}`}>{detail.id}</p></div>
                                <div><p className={`${ts}`}>Slug</p><p className={`font-semibold ${tp}`}>{detail.slug || '-'}</p></div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="sm:col-span-2">
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
                                <div className="sm:col-span-2">
                                    <label className={`block text-[11px] font-semibold mb-1.5 ${ts}`}>Description</label>
                                    <textarea rows={3} value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} className={`w-full text-xs px-3 py-2.5 rounded-xl border outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition resize-none ${inp}`} />
                                </div>
                                <div>
                                    <label className={`block text-[11px] font-semibold mb-1.5 ${ts}`}>Paperback Price</label>
                                    <input type="number" min={0.01} step="0.01" value={form.paperback_price} onChange={(e) => setForm((prev) => ({ ...prev, paperback_price: e.target.value }))} className={`w-full text-xs px-3 py-2.5 rounded-xl border outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition ${inp}`} />
                                </div>
                                <div>
                                    <label className={`block text-[11px] font-semibold mb-1.5 ${ts}`}>Hardcover Price</label>
                                    <input type="number" min={0.01} step="0.01" value={form.hardcover_price} onChange={(e) => setForm((prev) => ({ ...prev, hardcover_price: e.target.value }))} className={`w-full text-xs px-3 py-2.5 rounded-xl border outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition ${inp}`} />
                                </div>
                                <div>
                                    <label className={`block text-[11px] font-semibold mb-1.5 ${ts}`}>Paperback Quality</label>
                                    <input value={form.paperback_quality} onChange={(e) => setForm((prev) => ({ ...prev, paperback_quality: e.target.value }))} className={`w-full text-xs px-3 py-2.5 rounded-xl border outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition ${inp}`} />
                                </div>
                                <div>
                                    <label className={`block text-[11px] font-semibold mb-1.5 ${ts}`}>Hardcover Quality</label>
                                    <input value={form.hardcover_quality} onChange={(e) => setForm((prev) => ({ ...prev, hardcover_quality: e.target.value }))} className={`w-full text-xs px-3 py-2.5 rounded-xl border outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition ${inp}`} />
                                </div>
                                <div>
                                    <label className={`block text-[11px] font-semibold mb-1.5 ${ts}`}>Stock Quantity</label>
                                    <input type="number" min={0} value={form.stock_quantity} onChange={(e) => setForm((prev) => ({ ...prev, stock_quantity: e.target.value }))} className={`w-full text-xs px-3 py-2.5 rounded-xl border outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition ${inp}`} />
                                </div>
                                <div className="sm:col-span-2">
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

                <div className={`px-4 sm:px-5 py-4 border-t flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between ${sec}`}>
                    <button onClick={deactivate} disabled={loading || !detail || deactivating || saving} className={`text-xs font-bold px-4 py-2.5 rounded-xl border border-red-300 text-red-600 hover:bg-red-50 transition ${(loading || !detail || deactivating || saving) ? 'opacity-60 cursor-not-allowed' : ''}`}>
                        {deactivating ? 'Deactivating...' : 'Deactivate'}
                    </button>
                    <div className="flex w-full sm:w-auto items-center justify-end gap-2">
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
    onCreateAuthor,
    categoryOptions,
    authorOptions,
}: {
    dark: boolean;
    onClose: () => void;
    onSubmit: (payload: NewDashboardBookInput) => Promise<void>;
    onCreateAuthor: (authorName: string) => Promise<NamedOption>;
    categoryOptions: NamedOption[];
    authorOptions: NamedOption[];
}) {
    const [form, setForm] = useState({
        categoryId: '',
        title: '',
        slug: '',
        authorId: '',
        description: '',
        paperback_price: '0.00',
        hardcover_price: '0.00',
        paperback_quality: 'Standard',
        hardcover_quality: 'Premium',
        stock_quantity: '0',
        is_coming_soon: false,
        is_active: true,
        imageFile: null as File | null,
    });
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [addingAuthor, setAddingAuthor] = useState(false);
    const [newAuthorName, setNewAuthorName] = useState('');
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

    const updateText = (
        key: 'categoryId' | 'title' | 'slug' | 'authorId' | 'description' | 'paperback_price' | 'hardcover_price' | 'paperback_quality' | 'hardcover_quality' | 'stock_quantity',
        value: string,
    ) => {
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
        let author = Number(form.authorId);
        const description = form.description.trim();
        const paperbackPrice = Number(form.paperback_price);
        const hardcoverPrice = Number(form.hardcover_price);
        const paperbackQuality = form.paperback_quality.trim();
        const hardcoverQuality = form.hardcover_quality.trim();
        const stockQuantity = Number(form.stock_quantity);

        if (!Number.isInteger(category) || category <= 0) {
            setError('Select a category from the backend list.');
            return;
        }
        if (!title) {
            setError('Title is required.');
            return;
        }
        if (addingAuthor && !newAuthorName.trim()) {
            setError('Enter the new author name.');
            return;
        }
        if (!addingAuthor && (!Number.isInteger(author) || author <= 0)) {
            setError('Select an author from the backend list.');
            return;
        }
        if (!description) {
            setError('Description is required.');
            return;
        }
        if (!Number.isFinite(paperbackPrice) || paperbackPrice <= 0) {
            setError('Paperback price must be greater than 0.');
            return;
        }
        if (!Number.isFinite(hardcoverPrice) || hardcoverPrice <= 0) {
            setError('Hardcover price must be greater than 0.');
            return;
        }
        if (!paperbackQuality) {
            setError('Paperback quality is required.');
            return;
        }
        if (!hardcoverQuality) {
            setError('Hardcover quality is required.');
            return;
        }
        if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
            setError('Stock quantity must be 0 or greater.');
            return;
        }

        try {
            setSubmitting(true);
            if (addingAuthor) {
                const createdAuthor = await onCreateAuthor(newAuthorName.trim());
                author = createdAuthor.id;
                setForm((prev) => ({ ...prev, authorId: String(createdAuthor.id) }));
            }

            await onSubmit({
                category,
                title,
                slug,
                author,
                description,
                price: paperbackPrice.toFixed(2),
                paperback_price: paperbackPrice.toFixed(2),
                hardcover_price: hardcoverPrice.toFixed(2),
                paperback_quality: paperbackQuality,
                hardcover_quality: hardcoverQuality,
                stock_quantity: stockQuantity,
                is_coming_soon: form.is_coming_soon,
                is_active: form.is_active,
                imageFile: form.imageFile,
            });
            setAddingAuthor(false);
            setNewAuthorName('');
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
                            <select value={form.authorId} onChange={(e) => updateText('authorId', e.target.value)} disabled={authorOptions.length === 0 || addingAuthor}
                                className={`w-full text-xs px-3 py-2.5 rounded-xl border outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition ${inp} ${(authorOptions.length === 0 || addingAuthor) ? 'opacity-70 cursor-not-allowed' : ''}`}>
                                <option value="" disabled>{authorOptions.length ? 'Select author' : 'No authors from backend'}</option>
                                {authorOptions.map((option) => (
                                    <option key={`author-${option.id}`} value={String(option.id)}>{option.name}</option>
                                ))}
                            </select>
                            <div className="mt-2 flex items-center justify-between">
                                <button
                                    type="button"
                                    disabled={submitting}
                                    onClick={() => {
                                        setError('');
                                        setAddingAuthor((prev) => !prev);
                                    }}
                                    className={`text-[10px] font-semibold transition ${dark ? 'text-blue-300 hover:text-blue-200' : 'text-blue-600 hover:text-blue-700'} ${submitting ? 'opacity-60 cursor-not-allowed' : ''}`}
                                >
                                    {addingAuthor ? 'Use existing author' : '+ Add new author'}
                                </button>
                                {addingAuthor && <span className={`text-[10px] font-medium ${lbl}`}>Will create author first</span>}
                            </div>
                            {addingAuthor && (
                                <input
                                    value={newAuthorName}
                                    onChange={(e) => setNewAuthorName(e.target.value)}
                                    placeholder="New author name"
                                    className={`mt-2 w-full text-xs px-3 py-2.5 rounded-xl border outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition ${inp}`}
                                />
                            )}
                        </div>
                        <div className="col-span-2">
                            <label className={`block text-[11px] font-semibold mb-1.5 ${lbl}`}>Description</label>
                            <textarea rows={3} value={form.description} onChange={(e) => updateText('description', e.target.value)} placeholder="A practical guide to building good habits."
                                className={`w-full text-xs px-3 py-2.5 rounded-xl border outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition resize-none ${inp}`} />
                        </div>
                        <div>
                            <label className={`block text-[11px] font-semibold mb-1.5 ${lbl}`}>Paperback Price</label>
                            <input type="number" min={0.01} step="0.01" value={form.paperback_price} onChange={(e) => updateText('paperback_price', e.target.value)}
                                className={`w-full text-xs px-3 py-2.5 rounded-xl border outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition ${inp}`} />
                        </div>
                        <div>
                            <label className={`block text-[11px] font-semibold mb-1.5 ${lbl}`}>Hardcover Price</label>
                            <input type="number" min={0.01} step="0.01" value={form.hardcover_price} onChange={(e) => updateText('hardcover_price', e.target.value)}
                                className={`w-full text-xs px-3 py-2.5 rounded-xl border outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition ${inp}`} />
                        </div>
                        <div>
                            <label className={`block text-[11px] font-semibold mb-1.5 ${lbl}`}>Paperback Quality</label>
                            <input value={form.paperback_quality} onChange={(e) => updateText('paperback_quality', e.target.value)}
                                className={`w-full text-xs px-3 py-2.5 rounded-xl border outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition ${inp}`} />
                        </div>
                        <div>
                            <label className={`block text-[11px] font-semibold mb-1.5 ${lbl}`}>Hardcover Quality</label>
                            <input value={form.hardcover_quality} onChange={(e) => updateText('hardcover_quality', e.target.value)}
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

const dashboardUnusedWidgets = [CalendarWidget, FavoritesModal];
void dashboardUnusedWidgets;

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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
            <BooksTable dark={dark} books={books} onAddBook={onAddBook} onManageBook={onManageBook} />
        </div>
    );
}

function BusinessSettingsTab({ dark, token }: { dark: boolean; token: string | null }) {
    const [settingsForm, setSettingsForm] = useState<DashboardDeliverySettings>(DEFAULT_DELIVERY_SETTINGS);
    const [pricingCatalog, setPricingCatalog] = useState<DashboardPrintingPricingCategory[]>([]);
    const [rateDrafts, setRateDrafts] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [savingSettings, setSavingSettings] = useState(false);
    const [savingItemId, setSavingItemId] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    const card = dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100';
    const tp = dark ? 'text-gray-100' : 'text-gray-800';
    const ts = dark ? 'text-gray-400' : 'text-gray-500';
    const inp = dark ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-gray-50 border-gray-200 text-gray-700';

    useEffect(() => {
        let mounted = true;
        if (!token) {
            setLoading(false);
            setError('Missing admin token. Please sign in again.');
            return () => { mounted = false; };
        }

        const settingsUrl = resolveEndpoint(
            () => (endpoints.business as unknown as Record<string, string>).dashboardDeliverySettings,
            '/business/delivery-settings/dashboard/',
        );
        const pricingUrl = resolveEndpoint(
            () => (endpoints.printing as unknown as Record<string, string>).dashboardPricing,
            '/printing/dashboard/pricing/',
        );

        const load = async () => {
            setLoading(true);
            setError('');
            setNotice('');
            try {
                const [settingsPayload, pricingPayload] = await Promise.all([
                    apiClient.get<unknown>(settingsUrl, {
                        cache: 'no-store',
                        headers: { Authorization: `Token ${token}` },
                    }),
                    apiClient.get<unknown>(pricingUrl, {
                        cache: 'no-store',
                        headers: { Authorization: `Token ${token}` },
                    }),
                ]);

                if (!mounted) return;

                const normalizedSettings = normalizeDeliverySettings(settingsPayload);
                const normalizedPricing = normalizePrintingPricingCatalog(pricingPayload);
                const drafts = normalizedPricing
                    .flatMap((category) => category.items)
                    .reduce<Record<string, string>>((acc, item) => {
                        acc[item.id] = item.baseRate.toFixed(2);
                        return acc;
                    }, {});

                setSettingsForm(normalizedSettings);
                setPricingCatalog(normalizedPricing);
                setRateDrafts(drafts);
            } catch (err) {
                if (!mounted) return;
                setError(err instanceof Error ? err.message : 'Failed to load business settings.');
            } finally {
                if (mounted) setLoading(false);
            }
        };

        void load();
        return () => { mounted = false; };
    }, [token]);

    const updateSetting = (key: keyof DashboardDeliverySettings, value: string) => {
        const numeric = parseNumeric(value, Number.NaN);
        setSettingsForm((prev) => ({
            ...prev,
            [key]: Number.isFinite(numeric) ? Math.max(0, numeric) : 0,
        }));
    };

    const saveSettings = async () => {
        if (!token) {
            setError('Missing admin token. Please sign in again.');
            return;
        }
        const settingsUrl = resolveEndpoint(
            () => (endpoints.business as unknown as Record<string, string>).dashboardDeliverySettings,
            '/business/delivery-settings/dashboard/',
        );

        setSavingSettings(true);
        setError('');
        setNotice('');
        try {
            const payload = await apiClient.patch<unknown, Record<string, number>>(settingsUrl, {
                deliveryCharge: Number(settingsForm.deliveryCharge.toFixed(2)),
                freeDeliveryThreshold: Number(settingsForm.freeDeliveryThreshold.toFixed(2)),
                printingEmergencyFee: Number(settingsForm.printingEmergencyFee.toFixed(2)),
            }, {
                headers: { Authorization: `Token ${token}` },
            });
            setSettingsForm(normalizeDeliverySettings(payload));
            setNotice('Business pricing settings saved.');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save business settings.');
        } finally {
            setSavingSettings(false);
        }
    };

    const saveItemRate = async (itemId: string) => {
        if (!token) {
            setError('Missing admin token. Please sign in again.');
            return;
        }
        const rateValue = parseNumeric(rateDrafts[itemId], Number.NaN);
        if (!Number.isFinite(rateValue) || rateValue < 0) {
            setError('Base rate must be a non-negative number.');
            return;
        }

        const itemRateUrl = resolveEndpoint(
            () => (endpoints.printing as unknown as { dashboardItemPricing?: (id: string) => string }).dashboardItemPricing?.(itemId),
            `/printing/dashboard/items/${encodeURIComponent(itemId)}/pricing/`,
        );

        setSavingItemId(itemId);
        setError('');
        setNotice('');
        try {
            const response = await apiClient.patch<unknown, Record<string, number>>(itemRateUrl, {
                base_rate: Number(rateValue.toFixed(2)),
            }, {
                headers: { Authorization: `Token ${token}` },
            });

            const updatedRate = Math.max(0, parseNumeric((response as Record<string, unknown>).base_rate ?? (response as Record<string, unknown>).baseRate, rateValue));
            setRateDrafts((prev) => ({ ...prev, [itemId]: updatedRate.toFixed(2) }));
            setPricingCatalog((prev) => prev.map((category) => ({
                ...category,
                items: category.items.map((item) => (
                    item.id === itemId
                        ? { ...item, baseRate: updatedRate }
                        : item
                )),
            })));
            setNotice(`Updated rate for ${itemId}.`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update printing base rate.');
        } finally {
            setSavingItemId(null);
        }
    };

    return (
        <div className="space-y-4">
            <h2 className={`text-lg font-bold ${tp}`}>Business Settings</h2>

            {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">{error}</div>}
            {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">{notice}</div>}

            <div className={`rounded-xl border p-4 ${card}`}>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className={`text-sm font-bold ${tp}`}>Checkout Pricing Rules</h3>
                        <p className={`text-[11px] ${ts}`}>Applied to both book and printing checkout totals.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => { void saveSettings(); }}
                        disabled={savingSettings || loading}
                        className={`px-3 py-2 rounded-lg text-[11px] font-bold transition ${savingSettings || loading ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                    >
                        {savingSettings ? 'Saving...' : 'Save Rules'}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                        <label className={`block text-[11px] font-semibold mb-1.5 ${tp}`}>Delivery Charge (BDT)</label>
                        <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={settingsForm.deliveryCharge}
                            onChange={(e) => updateSetting('deliveryCharge', e.target.value)}
                            className={`w-full text-xs px-3 py-2.5 rounded-xl border outline-none ${inp}`}
                        />
                    </div>
                    <div>
                        <label className={`block text-[11px] font-semibold mb-1.5 ${tp}`}>Free Delivery Threshold (BDT)</label>
                        <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={settingsForm.freeDeliveryThreshold}
                            onChange={(e) => updateSetting('freeDeliveryThreshold', e.target.value)}
                            className={`w-full text-xs px-3 py-2.5 rounded-xl border outline-none ${inp}`}
                        />
                    </div>
                    <div>
                        <label className={`block text-[11px] font-semibold mb-1.5 ${tp}`}>Printing Emergency Fee (BDT)</label>
                        <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={settingsForm.printingEmergencyFee}
                            onChange={(e) => updateSetting('printingEmergencyFee', e.target.value)}
                            className={`w-full text-xs px-3 py-2.5 rounded-xl border outline-none ${inp}`}
                        />
                    </div>
                </div>
            </div>

            <div className={`rounded-xl border p-4 ${card}`}>
                <div className="mb-4">
                    <h3 className={`text-sm font-bold ${tp}`}>Printing Base Rates</h3>
                    <p className={`text-[11px] ${ts}`}>Update per-item base rate used by estimate and checkout.</p>
                </div>

                {loading ? (
                    <p className={`text-xs font-semibold ${ts}`}>Loading pricing catalog...</p>
                ) : pricingCatalog.length === 0 ? (
                    <p className={`text-xs font-semibold ${ts}`}>No printing categories found.</p>
                ) : (
                    <div className="space-y-4">
                        {pricingCatalog.map((category) => (
                            <div key={category.id} className={`rounded-xl border ${dark ? 'border-gray-800' : 'border-gray-100'}`}>
                                <div className={`px-3 py-2 border-b text-xs font-bold ${dark ? 'border-gray-800 text-gray-100 bg-gray-900/60' : 'border-gray-100 text-gray-800 bg-gray-50'}`}>
                                    {category.icon ? `${category.icon} ` : ''}{category.label}
                                </div>
                                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {category.items.map((item) => (
                                        <div key={item.id} className="px-3 py-2.5 flex items-center gap-3">
                                            <div className="min-w-0 flex-1">
                                                <p className={`text-xs font-semibold ${tp}`}>{item.name}</p>
                                                <p className={`text-[10px] ${ts}`}>{item.id}</p>
                                            </div>
                                            <div className="w-32">
                                                <input
                                                    type="number"
                                                    min={0}
                                                    step="0.01"
                                                    value={rateDrafts[item.id] ?? item.baseRate.toFixed(2)}
                                                    onChange={(e) => setRateDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))}
                                                    className={`w-full text-xs px-2.5 py-2 rounded-lg border outline-none ${inp}`}
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => { void saveItemRate(item.id); }}
                                                disabled={savingItemId === item.id}
                                                className={`px-2.5 py-2 rounded-lg text-[10px] font-bold transition ${savingItemId === item.id ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                                            >
                                                {savingItemId === item.id ? 'Saving...' : 'Save'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

type Modal = 'settings' | 'notifs' | 'profile' | 'addBook' | 'manageOrder' | 'manageCategory' | 'manageBook' | 'printingOrderDetail' | 'inboxMessageDetail' | null;

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
                        <Image src="/logo.png" alt="Logo" width={64} height={64} className="w-full h-full object-contain" />
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
    const [searchResults, setSearchResults] = useState<DashboardSearchSuggestion[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
    const [activePrintingOrderId, setActivePrintingOrderId] = useState<string | null>(null);
    const [activeInboxMessageId, setActiveInboxMessageId] = useState<string | null>(null);
    const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
    const [activeBookId, setActiveBookId] = useState<string | null>(null);
    const [overview, setOverview] = useState<DashboardOverview>(DASHBOARD_OVERVIEW_EMPTY);
    const [revenueSeries, setRevenueSeries] = useState<DashboardRevenuePoint[]>([]);
    const [retentionSeries, setRetentionSeries] = useState<DashboardRetentionPoint[]>([]);
    const [leads, setLeads] = useState<DashboardLeads>(DASHBOARD_LEADS_EMPTY);
    const [orders, setOrders] = useState<DashboardOrder[]>([]);
    const [printingOrders, setPrintingOrders] = useState<DashboardPrintingOrder[]>([]);
    const [books, setBooks] = useState<DashboardBook[]>([]);
    const [heroSlides, setHeroSlides] = useState<DashboardHeroSlide[]>([]);
    const [categories, setCategories] = useState<DashboardCategory[]>([]);
    const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
    const [inboxMessages, setInboxMessages] = useState<DashboardInboxMessage[]>([]);
    const [calendarEvents, setCalendarEvents] = useState<DashboardCalendarEvent[]>([]);
    const [categoryOptions, setCategoryOptions] = useState<NamedOption[]>([]);
    const [authorOptions, setAuthorOptions] = useState<NamedOption[]>([]);
    const [authToken, setAuthToken] = useState<string | null>(null);
    const tokenRef = useRef<string | null>(null);
    const profileRef = useRef<HTMLDivElement>(null);
    const unread = notifications.filter((n) => !n.read).length;
    const inboxUnread = inboxMessages.filter((msg) => !msg.isRead).length;

    const resetDashboardData = useCallback(() => {
        setOverview(DASHBOARD_OVERVIEW_EMPTY);
        setRevenueSeries([]);
        setRetentionSeries([]);
        setLeads(DASHBOARD_LEADS_EMPTY);
        setOrders([]);
        setPrintingOrders([]);
        setBooks([]);
        setHeroSlides([]);
        setCategories([]);
        setNotifications([]);
        setInboxMessages([]);
        setCalendarEvents([]);
        setCategoryOptions([]);
        setAuthorOptions([]);
        setActiveOrderId(null);
        setActivePrintingOrderId(null);
        setActiveInboxMessageId(null);
        setActiveCategoryId(null);
        setActiveBookId(null);
        setSearchOpen(false);
        setSearchQ('');
        setSearchResults([]);
        setSearchLoading(false);
    }, []);

    const loadDashboardData = useCallback(async (token: string) => {
        const headers = { Authorization: `Token ${token}` };
        const overviewUrl = resolveEndpoint(() => endpoints.dashboard.overview, '/dashboard/overview/');
        const monthlyRevenueUrl = resolveEndpoint(() => (endpoints.dashboard as Record<string, string>).monthlyRevenue || (endpoints.dashboard as Record<string, string>).monthly_revenue, '/dashboard/monthly-revenue/');
        const recentOrdersUrl = resolveEndpoint(() => (endpoints.dashboard as Record<string, string>).recentOrders || (endpoints.dashboard as Record<string, string>).recent_orders, '/dashboard/recent-orders/');
        const dashboardOrdersUrl = resolveEndpoint(() => (endpoints.orders as unknown as Record<string, string>).dashboardList || (endpoints.orders as unknown as Record<string, string>).dashboard_list, '/orders/dashboard/list/');
        const dashboardBooksUrl = resolveEndpoint(() => (endpoints.books as unknown as Record<string, string>).dashboardList || (endpoints.books as unknown as Record<string, string>).dashboard, '/books/dashboard/');
        const printingDashboardOrdersUrl = resolveEndpoint(
            () => (endpoints.printing as unknown as Record<string, string>).dashboardOrders,
            '/printing/dashboard/orders/',
        );
        const booksCatalogUrl = resolveEndpoint(() => endpoints.books.list, '/books/');
        const heroSlidesDashboardUrl = resolveEndpoint(
            () => (endpoints.home as unknown as Record<string, string>).dashboardHeroSlides,
            '/home/hero-slides/dashboard/',
        );
        const dashboardCategoriesUrl = resolveEndpoint(
            () => (endpoints.books as unknown as Record<string, string>).dashboardCategories
                || (endpoints.books as unknown as Record<string, string>).dashboard_categories
                || (endpoints.books as unknown as Record<string, string>).categoriesDashboard,
            '/books/dashboard/categories/',
        );
        const categoriesUrl = resolveEndpoint(() => endpoints.books.categories, '/books/categories/');
        const contactMessagesUrl = resolveEndpoint(
            () => (endpoints.contact as unknown as Record<string, string>).dashboardMessages || endpoints.contact.messages,
            '/contact/dashboard/messages',
        );

        const [overviewResult, revenueResult, ordersResult, printingOrdersResult, booksResult, booksCatalogResult, heroSlidesResult, categoriesResult, inboxResult] = await Promise.allSettled([
            apiClient.get<DashboardOverviewApiResponse>(overviewUrl, { cache: 'no-store', headers }),
            apiClient.get<unknown>(monthlyRevenueUrl, { cache: 'no-store', headers }),
            apiClient.get<unknown>(dashboardOrdersUrl, { cache: 'no-store', headers }).catch(async () => apiClient.get<unknown>(recentOrdersUrl, { cache: 'no-store', headers })),
            apiClient.get<unknown>(printingDashboardOrdersUrl, { cache: 'no-store', headers }),
            apiClient.get<unknown>(dashboardBooksUrl, { cache: 'no-store', headers }),
            apiClient.get<unknown>(booksCatalogUrl, { cache: 'no-store', headers }),
            apiClient.get<unknown>(heroSlidesDashboardUrl, { cache: 'no-store', headers }),
            apiClient.get<unknown>(dashboardCategoriesUrl, { cache: 'no-store', headers }).catch(async () => apiClient.get<unknown>(categoriesUrl, { cache: 'no-store', headers })),
            apiClient.get<unknown>(contactMessagesUrl, { cache: 'no-store', headers }),
        ]);

        const nextOverview = overviewResult.status === 'fulfilled' ? normalizeDashboardOverview(overviewResult.value) : DASHBOARD_OVERVIEW_EMPTY;
        const nextRevenue = revenueResult.status === 'fulfilled' ? normalizeRevenue(revenueResult.value) : [];
        const nextOrders = ordersResult.status === 'fulfilled' ? normalizeOrders(ordersResult.value) : [];
        const nextPrintingOrders = printingOrdersResult.status === 'fulfilled' ? normalizePrintingOrders(printingOrdersResult.value) : [];
        const nextBooks = booksResult.status === 'fulfilled' ? normalizeBooks(booksResult.value) : [];
        const nextHeroSlides = heroSlidesResult.status === 'fulfilled' ? normalizeHeroSlides(heroSlidesResult.value) : [];
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
        setPrintingOrders(nextPrintingOrders);
        setBooks(nextBooks);
        setHeroSlides(nextHeroSlides);
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

        setCalendarEvents([]);
    }, []);

    const handleLogin = useCallback((payload: LoginResponse) => {
        tokenRef.current = payload.token;
        setAuthToken(payload.token);
        setAuthUser(payload.user);
        setIsAuthenticated(true);
        void loadDashboardData(payload.token);
    }, [loadDashboardData]);

    const handleCreateAuthor = useCallback(async (rawAuthorName: string): Promise<NamedOption> => {
        const token = tokenRef.current;
        if (!token) {
            throw new Error('Missing admin token. Please sign in again.');
        }

        const name = rawAuthorName.trim();
        if (!name) {
            throw new Error('Author name is required.');
        }

        const existing = authorOptions.find((option) => option.name.trim().toLowerCase() === name.toLowerCase());
        if (existing) {
            return existing;
        }

        const booksEndpoints = endpoints.books as unknown as Record<string, string>;
        const createCandidates = Array.from(new Set([
            resolveEndpoint(
                () => booksEndpoints.dashboardAuthors
                    || booksEndpoints.dashboardAuthorList
                    || booksEndpoints.authorsDashboard,
                '/books/dashboard/authors/',
            ),
            resolveEndpoint(() => booksEndpoints.authors || booksEndpoints.authorList, '/books/authors/'),
        ])).filter((url): url is string => Boolean(url));

        let lastError: unknown = null;

        for (const url of createCandidates) {
            try {
                const created = await apiClient.post<unknown, Record<string, unknown>>(
                    url,
                    {
                        name,
                        slug: slugify(name),
                        is_active: true,
                    },
                    {
                        cache: 'no-store',
                        headers: { Authorization: `Token ${token}` },
                    },
                );

                const option = normalizeAuthorOption(created);
                if (option) {
                    setAuthorOptions((prev) => dedupeNamedOptions([option, ...prev]));
                    return option;
                }
            } catch (error) {
                lastError = error;
            }
        }

        const listCandidates = Array.from(new Set([
            resolveEndpoint(() => booksEndpoints.authors || booksEndpoints.authorList, '/books/authors/'),
        ])).filter((url): url is string => Boolean(url));

        for (const url of listCandidates) {
            try {
                const listPayload = await apiClient.get<unknown>(url, {
                    cache: 'no-store',
                    headers: { Authorization: `Token ${token}` },
                });
                const options = normalizeAuthorOptions(listPayload);
                const match = options.find((option) => option.name.trim().toLowerCase() === name.toLowerCase());
                if (match) {
                    setAuthorOptions((prev) => dedupeNamedOptions([match, ...prev]));
                    return match;
                }
            } catch (error) {
                lastError = error;
            }
        }

        throw new Error(lastError instanceof Error ? lastError.message : 'Failed to create author.');
    }, [authorOptions]);

    const handleAddBook = useCallback(async (payload: NewDashboardBookInput) => {
        const token = tokenRef.current;
        if (!token) {
            throw new Error('Missing admin token. Please sign in again.');
        }

        const createBookUrl = resolveEndpoint(
            () => (endpoints.books as unknown as Record<string, string>).dashboardCreate
                || (endpoints.books as unknown as Record<string, string>).dashboard
                || (endpoints.books as unknown as Record<string, string>).dashboardList,
            '/books/dashboard/',
        );

        const formData = new FormData();
        formData.append('category', String(payload.category));
        formData.append('title', payload.title);
        formData.append('slug', payload.slug);
        formData.append('author', String(payload.author));
        formData.append('description', payload.description);
        formData.append('price', payload.price);
        formData.append('paperback_price', payload.paperback_price);
        formData.append('hardcover_price', payload.hardcover_price);
        formData.append('paperback_quality', payload.paperback_quality);
        formData.append('hardcover_quality', payload.hardcover_quality);
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
        const nextBook: DashboardBook = normalizedCreated ? {
            ...normalizedCreated,
            author: (
                normalizedCreated.author
                && normalizedCreated.author !== 'Unknown'
                && !/^\d+$/.test(normalizedCreated.author.trim())
            ) ? normalizedCreated.author : authorName,
            genre: (
                normalizedCreated.genre
                && normalizedCreated.genre !== 'General'
                && !/^\d+$/.test(normalizedCreated.genre.trim())
            ) ? normalizedCreated.genre : categoryName,
        } : {
            id: `book-${Date.now().toString(36)}`,
            title: payload.title,
            author: authorName,
            genre: categoryName,
            image: '',
            thumbnail: '',
            stock: payload.stock_quantity,
            price: parseNumeric(payload.price),
            paperbackPrice: parseNumeric(payload.paperback_price),
            hardcoverPrice: parseNumeric(payload.hardcover_price),
            paperbackQuality: parseText(payload.paperback_quality, 'Standard'),
            hardcoverQuality: parseText(payload.hardcover_quality, 'Premium'),
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
            () => (endpoints.books as unknown as Record<string, string>).dashboardCategories
                || (endpoints.books as unknown as Record<string, string>).dashboard_categories
                || (endpoints.books as unknown as Record<string, string>).categoriesDashboard,
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

    const handleCreateHeroSlide = useCallback(async (payload: DashboardHeroSlideInput) => {
        const token = tokenRef.current;
        if (!token) {
            throw new Error('Missing admin token. Please sign in again.');
        }

        if (!payload.imageFile) {
            throw new Error('Slide image is required.');
        }

        const createUrl = resolveEndpoint(
            () => (endpoints.home as unknown as Record<string, string>).dashboardHeroSlides,
            '/home/hero-slides/dashboard/',
        );

        const formData = new FormData();
        formData.append('tag', payload.tag);
        formData.append('title', payload.title);
        formData.append('ctaLabel', payload.ctaLabel);
        formData.append('ctaHref', payload.ctaHref);
        formData.append('backgroundFrom', payload.backgroundFrom);
        formData.append('backgroundTo', payload.backgroundTo);
        formData.append('displayOrder', String(payload.displayOrder));
        formData.append('isActive', String(payload.isActive));
        formData.append('image', payload.imageFile);

        const created = await apiClient.request<unknown>(createUrl, {
            method: 'POST',
            cache: 'no-store',
            headers: { Authorization: `Token ${token}` },
            body: formData,
        });

        const normalized = normalizeHeroSlides([created])[0];
        if (!normalized) {
            throw new Error('Created slide response is invalid.');
        }

        setHeroSlides((prev) => [...prev, normalized].sort((a, b) => (a.displayOrder - b.displayOrder) || (a.id - b.id)));
    }, []);

    const handleUpdateHeroSlide = useCallback(async (slideId: number, payload: DashboardHeroSlideInput) => {
        const token = tokenRef.current;
        if (!token) {
            throw new Error('Missing admin token. Please sign in again.');
        }

        const detailUrl = resolveEndpoint(
            () => (endpoints.home as unknown as {
                dashboardHeroSlideDetail?: (id: string | number) => string;
            }).dashboardHeroSlideDetail?.(slideId),
            `/home/hero-slides/dashboard/${encodeURIComponent(String(slideId))}/`,
        );

        const formData = new FormData();
        formData.append('tag', payload.tag);
        formData.append('title', payload.title);
        formData.append('ctaLabel', payload.ctaLabel);
        formData.append('ctaHref', payload.ctaHref);
        formData.append('backgroundFrom', payload.backgroundFrom);
        formData.append('backgroundTo', payload.backgroundTo);
        formData.append('displayOrder', String(payload.displayOrder));
        formData.append('isActive', String(payload.isActive));
        if (payload.imageFile) {
            formData.append('image', payload.imageFile);
        }

        const updated = await apiClient.request<unknown>(detailUrl, {
            method: 'PATCH',
            cache: 'no-store',
            headers: { Authorization: `Token ${token}` },
            body: formData,
        });

        const normalized = normalizeHeroSlides([updated])[0];
        if (!normalized) {
            throw new Error('Updated slide response is invalid.');
        }

        setHeroSlides((prev) => {
            const exists = prev.some((slide) => slide.id === normalized.id);
            const next = exists
                ? prev.map((slide) => (slide.id === normalized.id ? normalized : slide))
                : [normalized, ...prev];
            return next.sort((a, b) => (a.displayOrder - b.displayOrder) || (a.id - b.id));
        });
    }, []);

    const handleDeleteHeroSlide = useCallback(async (slideId: number) => {
        const token = tokenRef.current;
        if (!token) {
            throw new Error('Missing admin token. Please sign in again.');
        }

        const detailUrl = resolveEndpoint(
            () => (endpoints.home as unknown as {
                dashboardHeroSlideDetail?: (id: string | number) => string;
            }).dashboardHeroSlideDetail?.(slideId),
            `/home/hero-slides/dashboard/${encodeURIComponent(String(slideId))}/`,
        );

        await apiClient.delete(detailUrl, {
            cache: 'no-store',
            headers: { Authorization: `Token ${token}` },
        });

        setHeroSlides((prev) => prev.filter((slide) => slide.id !== slideId));
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

    const openPrintingOrderDetail = useCallback((orderId: string) => {
        setActivePrintingOrderId(orderId);
        setModal('printingOrderDetail');
    }, []);

    const openInboxMessageDetail = useCallback((messageId: string) => {
        setInboxMessages((prev) => prev.map((message) => (
            message.id === messageId
                ? { ...message, isRead: true }
                : message
        )));
        setActiveInboxMessageId(messageId);
        setModal('inboxMessageDetail');

        const token = tokenRef.current;
        if (!token) return;

        const detailUrl = resolveEndpoint(
            () => endpoints.contact.messageDetail(messageId),
            `/contact/messages/${encodeURIComponent(messageId)}`,
        );

        void apiClient.patch(detailUrl, { is_read: true }, {
            cache: 'no-store',
            headers: { Authorization: `Token ${token}` },
        }).catch(() => {
            // Keep UI responsive; next dashboard refresh can resync state.
        });
    }, []);

    const handleDashboardSearchSelect = useCallback((suggestion: DashboardSearchSuggestion) => {
        setSearchQ('');
        setSearchOpen(false);
        setSearchResults([]);

        switch (suggestion.nav) {
            case 'books':
                setNav('books');
                openManageBook(suggestion.entityId);
                return;
            case 'orders':
                setNav('orders');
                openManageOrder(suggestion.entityId);
                return;
            case 'printing':
                setNav('printing');
                openPrintingOrderDetail(suggestion.entityId);
                return;
            case 'inbox':
                setNav('inbox');
                openInboxMessageDetail(suggestion.entityId);
                return;
            default:
                return;
        }
    }, [openInboxMessageDetail, openManageBook, openManageOrder, openPrintingOrderDetail]);

    useEffect(() => {
        if (!searchOpen) {
            setSearchResults([]);
            setSearchLoading(false);
            return;
        }

        const query = searchQ.trim();
        if (query.length < 2 || !authToken) {
            setSearchResults([]);
            setSearchLoading(false);
            return;
        }

        let active = true;
        const timer = setTimeout(async () => {
            setSearchLoading(true);
            try {
                const payload = await apiClient.get<unknown>(endpoints.search.suggestions, {
                    cache: 'no-store',
                    headers: { Authorization: `Token ${authToken}` },
                    query: { q: query, limit: 8 },
                });
                if (!active) return;
                setSearchResults(normalizeSearchSuggestions(payload));
            } catch {
                if (!active) return;
                setSearchResults([]);
            } finally {
                if (active) setSearchLoading(false);
            }
        }, 250);

        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [authToken, searchOpen, searchQ]);

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

    const handlePrintingStatusSaved = useCallback(async (orderId: string, status: string) => {
        const token = tokenRef.current;
        if (!token) {
            throw new Error('Missing admin token. Please sign in again.');
        }

        const statusUrl = resolveEndpoint(
            () => endpoints.printing.dashboardOrderStatus(orderId),
            `/printing/dashboard/orders/${encodeURIComponent(orderId)}/status/`,
        );

        const updated = await apiClient.patch<unknown, Record<string, string>>(
            statusUrl,
            { status },
            {
                cache: 'no-store',
                headers: { Authorization: `Token ${token}` },
            },
        );

        const normalizedUpdated = normalizePrintingOrders([updated])[0];
        setPrintingOrders((prev) => prev.map((order) => (
            order.order_id === orderId
                ? (normalizedUpdated ?? { ...order, status })
                : order
        )));
    }, []);

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
    const activeInboxMessage = activeInboxMessageId === null
        ? null
        : (inboxMessages.find((message) => message.id === activeInboxMessageId) ?? null);
    const profileName = authUser?.username ?? 'User';
    const profileEmail = authUser?.email ?? '';
    const profileInitials = profileName.slice(0, 2).toUpperCase() || 'AD';
    const profileRole = authUser?.is_staff ? 'Admin' : 'User';
    const workspaceUsers = authUser ? 1 : 0;
    const printingPendingCount = printingOrders.filter((order) => order.status === 'pending').length;

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: Ico.grid, badge: 0 },
        { id: 'business', label: 'Business Settings', icon: Ico.settings, badge: 0 },
        { id: 'books', label: 'Books', icon: Ico.book, badge: 0 },
        { id: 'hero', label: 'Hero', icon: Ico.camera, badge: 0 },
        { id: 'orders', label: 'Orders', icon: Ico.package, badge: overview.pending_orders },
        { id: 'printing', label: 'Printing', icon: Ico.package, badge: printingPendingCount },
        { id: 'reports', label: 'Reports', icon: Ico.reports, badge: 0 },
        { id: 'inbox', label: 'Inbox', icon: Ico.inbox, badge: inboxUnread },
    ];

    const renderPage = () => {
        switch (activeNav) {
            case 'business':
                return <BusinessSettingsTab dark={dark} token={authToken} />;
            case 'orders': return <div className="space-y-4"><h2 className={`text-lg font-bold ${tp}`}>Orders</h2><DeliveryPipeline dark={dark} overview={overview} /><OrdersTable dark={dark} orders={orders} onManageOrder={openManageOrder} /></div>;
            case 'printing': {
                const printingRevenue = printingOrders
                    .filter((order) => order.status.toLowerCase() === 'confirmed')
                    .reduce((sum, order) => sum + order.total_amount, 0);
                const inProgressCount = printingOrders.filter((order) => order.status === 'in_progress').length;
                const completedCount = printingOrders.filter((order) => order.status === 'completed').length;

                return (
                    <div className="space-y-4">
                        <h2 className={`text-lg font-bold ${tp}`}>Printing Operations</h2>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            {[
                                { l: 'Total Orders', v: printingOrders.length, c: '#3b82f6' },
                                { l: 'Pending', v: printingPendingCount, c: '#f59e0b' },
                                { l: 'In Progress', v: inProgressCount, c: '#8b5cf6' },
                                { l: 'Completed', v: completedCount, c: '#10b981' },
                            ].map((it, i) => (
                                <div key={i} className={`rounded-xl border p-4 flex items-center gap-3 ${dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                                    <Ring pct={100} color={it.c} size={44} stroke={5} />
                                    <div>
                                        <div className="text-xl font-black font-mono" style={{ color: it.c }}>
                                            <AnimCount to={it.v} />
                                        </div>
                                        <p className={`text-[10px] ${ts}`}>{it.l}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className={`rounded-xl border p-3 ${dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                            <p className={`text-xs font-semibold ${ts}`}>Confirmed Printing Revenue</p>
                            <p className={`text-xl font-black mt-1 ${tp}`}>TK <AnimCount to={printingRevenue} dec={2} /></p>
                        </div>
                        <PrintingOperationsTable
                            dark={dark}
                            orders={printingOrders}
                            onUpdateStatus={handlePrintingStatusSaved}
                            onOpenOrder={openPrintingOrderDetail}
                        />
                    </div>
                );
            }
            case 'books':
                return (
                    <div className="space-y-4">
                        <h2 className={`text-lg font-bold ${tp}`}>Book Inventory</h2>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
                        <BooksTable dark={dark} books={books} onAddBook={() => setModal('addBook')} onManageBook={openManageBook} />
                        <CategoriesSection
                            dark={dark}
                            categories={categories}
                            onCreateCategory={handleCreateCategory}
                            onManageCategory={openManageCategory}
                        />
                    </div>
                );
            case 'hero':
                return (
                    <div className="space-y-4">
                        <h2 className={`text-lg font-bold ${tp}`}>Hero Slides</h2>
                        <div className="space-y-2">
                            <h3 className={`text-sm font-bold ${tp}`}>Hero Slides Management</h3>
                            <HeroSlidesSection
                                dark={dark}
                                slides={heroSlides}
                                onCreateSlide={handleCreateHeroSlide}
                                onUpdateSlide={handleUpdateHeroSlide}
                                onDeleteSlide={handleDeleteHeroSlide}
                            />
                        </div>
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
                            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-blue-100 text-blue-700">{inboxUnread} unread</span>
                        </div>
                        <div className="max-h-[460px] overflow-y-auto">
                            {inboxMessages.map((msg) => (
                                <button
                                    type="button"
                                    key={msg.id}
                                    onClick={() => openInboxMessageDetail(msg.id)}
                                    className={`w-full text-left px-4 py-3 border-b transition ${dark ? 'border-gray-800 hover:bg-gray-800/70' : 'border-gray-100 hover:bg-blue-50/50'} ${!msg.isRead ? (dark ? 'bg-blue-950/20' : 'bg-blue-50/40') : ''}`}
                                >
                                    <div className="flex items-center justify-between gap-3 mb-1">
                                        <p className={`text-xs font-bold ${tp}`}>{msg.subject}</p>
                                        <div className="flex items-center gap-2">
                                            {!msg.isRead && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${msg.isRead ? 'bg-gray-200 text-gray-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {msg.isRead ? 'Read' : 'Unread'}
                                            </span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${msg.status.toLowerCase() === 'resolved' ? 'bg-emerald-100 text-emerald-700' : msg.status.toLowerCase() === 'closed' ? 'bg-gray-200 text-gray-700' : 'bg-amber-100 text-amber-700'}`}>{msg.status}</span>
                                            <span className="text-[10px] font-semibold text-blue-500">View</span>
                                        </div>
                                    </div>
                                    <p className={`text-[11px] ${ts}`}>{msg.name} • {msg.email || 'No email'}{msg.phone ? ` • ${msg.phone}` : ''}</p>
                                    <p className={`text-[11px] mt-1 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>{msg.message || 'No message body.'}</p>
                                    <p className="text-[10px] text-gray-400 mt-1">
                                        Submitted: {msg.submittedAt ? new Date(msg.submittedAt).toLocaleString() : 'N/A'} • Updated: {msg.updatedAt ? new Date(msg.updatedAt).toLocaleString() : 'N/A'}
                                    </p>
                                </button>
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

            {/* ── SIDEBAR ── */}
            <div className={`${sidebar ? 'w-48' : 'w-0'} flex-shrink-0 border-r ${bdr} ${sbBg} overflow-hidden transition-all duration-300 ease-in-out`}>
                <div className="w-48 h-full flex flex-col">
                    {/* Workspace */}
                    <div className="p-3.5 border-b" style={{ borderColor: dark ? '#1f2937' : '#f3f4f6' }}>
                        <div className="flex items-center">
                            <div className="w-16 h-12 flex-shrink-0 overflow-hidden">
                                <Image src="/logo.png" alt="BookBuyBD Logo" width={64} height={48} className="w-full h-full object-contain object-center" />
                            </div>
                        </div>
                        <div className={`flex items-center gap-3 mt-2 text-[9px] ${ts}`}>
                            <span className="flex items-center gap-1">{Ico.users} {workspaceUsers}</span>
                            <span className="flex items-center gap-1">{Ico.msg} {inboxUnread}</span>
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
                            <div className="relative">
                                <div className={`flex items-center gap-2 rounded-xl px-3 py-1.5 border ${dark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                                    <span className={ts}>{Ico.search}</span>
                                    <input
                                        autoFocus
                                        value={searchQ}
                                        onChange={(e) => setSearchQ(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Escape') {
                                                setSearchOpen(false);
                                                setSearchQ('');
                                                setSearchResults([]);
                                            }
                                            if (e.key === 'Enter' && searchResults[0]) {
                                                e.preventDefault();
                                                handleDashboardSearchSelect(searchResults[0]);
                                            }
                                        }}
                                        placeholder="Search books, orders, printing, inbox..."
                                        className={`text-xs outline-none bg-transparent w-64 ${dark ? 'text-gray-200 placeholder-gray-500' : 'text-gray-700 placeholder-gray-400'}`}
                                    />
                                    <button onClick={() => { setSearchOpen(false); setSearchQ(''); setSearchResults([]); }} className="text-gray-400 hover:text-gray-600">{Ico.x}</button>
                                </div>

                                <div className={`absolute right-0 top-full mt-2 w-80 rounded-xl border shadow-xl z-30 overflow-hidden ${dark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
                                    {searchQ.trim().length < 2 ? (
                                        <p className={`px-3 py-2 text-[11px] ${ts}`}>Type at least 2 characters</p>
                                    ) : searchLoading ? (
                                        <p className={`px-3 py-2 text-[11px] ${ts}`}>Searching...</p>
                                    ) : searchResults.length === 0 ? (
                                        <p className={`px-3 py-2 text-[11px] ${ts}`}>No results found.</p>
                                    ) : (
                                        <div className="max-h-72 overflow-y-auto">
                                            {searchResults.map((result) => (
                                                <button
                                                    key={result.id}
                                                    type="button"
                                                    onClick={() => handleDashboardSearchSelect(result)}
                                                    className={`w-full text-left px-3 py-2.5 border-b transition ${dark ? 'border-gray-800 hover:bg-gray-800' : 'border-gray-100 hover:bg-blue-50/60'}`}
                                                >
                                                    <div className="flex items-center justify-between gap-2">
                                                        <p className={`text-xs font-semibold truncate ${tp}`}>{result.label}</p>
                                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${result.type === 'book'
                                                            ? 'bg-indigo-100 text-indigo-700'
                                                            : result.type === 'order'
                                                                ? 'bg-emerald-100 text-emerald-700'
                                                                : result.type === 'printing'
                                                                    ? 'bg-amber-100 text-amber-700'
                                                                    : (result.isRead ? 'bg-gray-200 text-gray-700' : 'bg-blue-100 text-blue-700')
                                                            }`}>
                                                            {result.type === 'inbox' ? (result.isRead ? 'inbox-read' : 'inbox-unread') : result.type}
                                                        </span>
                                                    </div>
                                                    {result.description && <p className={`text-[10px] mt-0.5 truncate ${ts}`}>{result.description}</p>}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
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
            {modal === 'settings' && <SettingsPanel dark={dark} setDark={setDark} onClose={() => setModal(null)} token={authToken} />}
            {modal === 'notifs' && <NotifPanel dark={dark} notifications={notifications} onNotificationsChange={setNotifications} onClose={() => setModal(null)} />}
            {modal === 'profile' && <ProfileForm dark={dark} user={authUser} onClose={() => setModal(null)} />}
            {modal === 'addBook' && <AddBookModal dark={dark} onClose={() => setModal(null)} onSubmit={handleAddBook} onCreateAuthor={handleCreateAuthor} categoryOptions={categoryOptions} authorOptions={authorOptions} />}
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
            {modal === 'printingOrderDetail' && activePrintingOrderId && (
                <PrintingOrderDetailModal
                    dark={dark}
                    orderId={activePrintingOrderId}
                    token={authToken}
                    onClose={() => {
                        setModal(null);
                        setActivePrintingOrderId(null);
                    }}
                />
            )}
            {modal === 'inboxMessageDetail' && activeInboxMessage && (
                <InboxMessageDetailModal
                    dark={dark}
                    message={activeInboxMessage}
                    onClose={() => {
                        setModal(null);
                        setActiveInboxMessageId(null);
                    }}
                />
            )}
        </div>
    );
}
