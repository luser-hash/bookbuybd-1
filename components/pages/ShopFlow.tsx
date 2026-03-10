'use client';
import { useState } from 'react';
import Cart from './cart';
import Checkout from './checkout';
import EditCheckout from './editcheckout';
import ConfirmOrder from './confirmorder';
import { CartItem, CheckoutForm, EMPTY_FORM, clearStoredCartItems } from './cartStore';
import { ApiError, apiClient, endpoints } from '@/lib/api';

type Page = 'cart' | 'checkout' | 'editcheckout' | 'confirm';

export default function ShopFlow() {
  const [page, setPage] = useState<Page>('cart');
  const [items, setItems] = useState<CartItem[]>([]);
  const [form, setForm] = useState<CheckoutForm>(EMPTY_FORM);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [placeOrderError, setPlaceOrderError] = useState<string | null>(null);

  return (
    <>
      {/* ── Page router ── */}
      {page === 'cart' && (
        <Cart
          onCheckout={(cartItems) => {
            setItems(cartItems);
            setPage('checkout');
          }}
        />
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
          onConfirm={async (f) => {
            if (isPlacingOrder) return;

            setPlaceOrderError(null);
            setIsPlacingOrder(true);
            const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
            const deliveryCharge = subtotal >= 1000 ? 0 : 60;
            const totalAmount = subtotal + deliveryCharge;

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
                items: items.map((item) => ({
                  book_id: item.id,
                  quantity: item.qty,
                  unit_price: item.price,
                })),
                subtotal,
                delivery_charge: deliveryCharge,
                total_amount: totalAmount,
              });

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
          onContinueShopping={() => {
            clearStoredCartItems();
            setPage('cart');
            setItems([]);
            setForm({ fullName: '', phone: '', email: '', address: '', city: '', district: '', postalCode: '', note: '', paymentMethod: 'cod' });
          }}
        />
      )}
    </>
  );
}
