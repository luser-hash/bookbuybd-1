import type {
  OrderCreatePayload,
  OrderCreateResponse,
  StoredOrder,
} from '@/lib/api/contracts/orders';

const orderStore = new Map<string, StoredOrder>();
let sequence = 0;

function toMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function buildOrderId(now: Date): string {
  sequence += 1;
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  return `ORD-${date}-${String(sequence).padStart(4, '0')}`;
}

function resolveSubtotal(payload: OrderCreatePayload): number {
  if (typeof payload.subtotal === 'number') return toMoney(payload.subtotal);
  return toMoney(
    payload.items.reduce((sum, item) => sum + (item.unit_price ?? 0) * item.quantity, 0),
  );
}

function resolveDeliveryCharge(payload: OrderCreatePayload, subtotal: number): number {
  if (typeof payload.delivery_charge === 'number') return toMoney(payload.delivery_charge);
  return subtotal >= 1000 ? 0 : 60;
}

function resolveTotalAmount(payload: OrderCreatePayload, subtotal: number, deliveryCharge: number): number {
  if (typeof payload.total_amount === 'number') return toMoney(payload.total_amount);
  return toMoney(subtotal + deliveryCharge);
}

export function createOrder(payload: OrderCreatePayload): OrderCreateResponse {
  const now = new Date();
  const createdAt = now.toISOString();
  const id = buildOrderId(now);
  const totalItems = payload.items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = resolveSubtotal(payload);
  const deliveryCharge = resolveDeliveryCharge(payload, subtotal);
  const totalAmount = resolveTotalAmount(payload, subtotal, deliveryCharge);

  const record: StoredOrder = {
    ...payload,
    id,
    order_status: 'pending',
    delivery_status: 'pending',
    total_items: totalItems,
    subtotal,
    delivery_charge: deliveryCharge,
    total_amount: totalAmount,
    created_at: createdAt,
    updated_at: createdAt,
  };

  orderStore.set(id, record);

  return {
    id,
    order_status: record.order_status,
    delivery_status: record.delivery_status,
    total_items: totalItems,
    subtotal,
    delivery_charge: deliveryCharge,
    total_amount: totalAmount,
    created_at: createdAt,
  };
}

export function listOrders(): StoredOrder[] {
  return Array.from(orderStore.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}
