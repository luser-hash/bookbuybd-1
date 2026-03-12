'use client';
import { useState, useEffect } from 'react';
import Cart from './cart';
import Checkout from './checkout';
import EditCheckout from './editcheckout';
import ConfirmOrder from './confirmorder';
import {
  CartItem,
  CheckoutForm,
  DEFAULT_DELIVERY_SETTINGS,
  DeliverySettings,
  EMPTY_FORM,
  calculateDeliveryCharge,
  clearStoredCartItems,
  getStoredCartItems,
  persistCartItems,
} from './cartStore';
import { ApiError, apiClient, endpoints } from '@/lib/api';

type Page = 'cart' | 'checkout' | 'editcheckout' | 'confirm';
type DeliverySettingsPayload = {
  deliveryCharge?: number | string;
  delivery_charge?: number | string;
  freeDeliveryThreshold?: number | string;
  free_delivery_threshold?: number | string;
};

function toNumber(value: unknown, fallback: number): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeDeliverySettings(payload: unknown): DeliverySettings {
  const record = (payload && typeof payload === 'object') ? (payload as DeliverySettingsPayload) : {};
  return {
    deliveryCharge: Math.max(0, toNumber(record.deliveryCharge ?? record.delivery_charge, DEFAULT_DELIVERY_SETTINGS.deliveryCharge)),
    freeDeliveryThreshold: Math.max(0, toNumber(record.freeDeliveryThreshold ?? record.free_delivery_threshold, DEFAULT_DELIVERY_SETTINGS.freeDeliveryThreshold)),
  };
}

export default function ShopFlow() {
  const [page, setPage] = useState<Page>('cart');
  const [items, setItems] = useState<CartItem[]>([]);
  const [form, setForm] = useState<CheckoutForm>(EMPTY_FORM);
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings>(DEFAULT_DELIVERY_SETTINGS);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [placeOrderError, setPlaceOrderError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load local book cart
  useEffect(() => {
    const loadCart = () => {
      setItems(getStoredCartItems());
      setIsLoading(false);
    };

    loadCart();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (items.length === 0) {
      clearStoredCartItems();
      return;
    }

    persistCartItems(items);
  }, [items, isLoading]);

  useEffect(() => {
    let mounted = true;
    const deliverySettingsUrl =
      (endpoints as unknown as { business?: { deliverySettings?: string } }).business?.deliverySettings
      ?? '/business/delivery-settings/';

    const loadDeliverySettings = async () => {
      try {
        const payload = await apiClient.get<unknown>(deliverySettingsUrl, { cache: 'no-store' });
        if (mounted) setDeliverySettings(normalizeDeliverySettings(payload));
      } catch {
        if (mounted) setDeliverySettings(DEFAULT_DELIVERY_SETTINGS);
      }
    };

    void loadDeliverySettings();
    return () => { mounted = false; };
  }, []);

  return (
    <>
      {/* ── Page router ── */}
      {page === 'cart' && (
        isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-pulse flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
              <p className="text-gray-500 font-medium">Loading your cart...</p>
            </div>
          </div>
        ) : (
          <Cart
            items={items}
            setItems={setItems}
            onCheckout={() => setPage('checkout')}
            deliverySettings={deliverySettings}
          />
        )
      )}

      {page === 'checkout' && (
        <Checkout
          items={items}
          onBack={() => {
            setPlaceOrderError(null);
            setPage('cart');
          }}
          isSubmitting={isPlacingOrder}
          submitError={placeOrderError}
          deliverySettings={deliverySettings}
          onConfirm={async (f) => {
            if (isPlacingOrder) return;
            if (items.length === 0) {
              setPlaceOrderError('Your cart is empty.');
              return;
            }

            setPlaceOrderError(null);
            setIsPlacingOrder(true);
            const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
            const deliveryCharge = calculateDeliveryCharge(subtotal, deliverySettings);
            const orderItems = items
              .map((item) => {
                const bookId = Number(item.id);
                if (!Number.isInteger(bookId) || bookId <= 0) return null;
                return {
                  book_id: bookId,
                  quantity: item.qty,
                  unit_price: item.price,
                  ...(item.variant ? { book_variant: item.variant } : {}),
                  ...(item.quality ? { book_quality: item.quality } : {}),
                  ...(item.edition ? { edition: item.edition } : {}),
                };
              })
              .filter((item): item is {
                book_id: number;
                quantity: number;
                unit_price: number;
                book_variant?: 'paperback' | 'hardcover';
                book_quality?: string;
                edition?: string;
              } => item !== null);

            if (orderItems.length !== items.length) {
              setIsPlacingOrder(false);
              setPlaceOrderError('Some cart items are invalid. Please remove and add them again.');
              return;
            }

            try {
              await apiClient.post(endpoints.orders.create, {
                customer_name: f.fullName,
                customer_phone: f.phone,
                customer_email: f.email || undefined,
                shipping_address: f.address,
                city: f.city,
                district: f.district,
                postal_code: f.postalCode || undefined,
                notes: f.note || undefined,
                payment_method: 'cod',
                items: orderItems,
                subtotal,
                delivery_charge: deliveryCharge,
                total_amount: subtotal + deliveryCharge,
              });

              clearStoredCartItems();
              setForm(f);
              setPage('confirm');
            } catch (error) {
              if (error instanceof ApiError) {
                setPlaceOrderError(error.message || 'Failed to place order.');
              } else {
                setPlaceOrderError('Failed to place order.');
              }
            } finally {
              setIsPlacingOrder(false);
            }
          }}
          onEdit={(f) => {
            setForm(f);
            setPage('editcheckout');
          }}
        />
      )}

      {page === 'editcheckout' && (
        <EditCheckout
          initial={form}
          onSave={(f) => {
            setForm(f);
            setPlaceOrderError(null);
            setPage('checkout');
          }}
          onBack={() => setPage('checkout')}
        />
      )}

      {page === 'confirm' && (
        <ConfirmOrder
          items={items}
          form={form}
          deliverySettings={deliverySettings}
          onContinueShopping={() => {
            clearStoredCartItems();
            setPage('cart');
            setItems([]);
            setForm(EMPTY_FORM);
          }}
        />
      )}
    </>
  );
}
