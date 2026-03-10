export type OrderPaymentMethod = 'cod';

export type OrderStatus = 'pending' | 'confirmed' | 'rejected';

export type DeliveryStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderCreateItemPayload {
  book_id: number;
  quantity: number;
  unit_price?: number;
}

export interface OrderCreatePayload {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  shipping_address: string;
  city: string;
  district: string;
  postal_code?: string;
  notes?: string;
  payment_method: OrderPaymentMethod;
  items: OrderCreateItemPayload[];
  subtotal?: number;
  delivery_charge?: number;
  total_amount?: number;
}

export interface OrderCreateResponse {
  id: string;
  order_status: OrderStatus;
  delivery_status: DeliveryStatus;
  total_items: number;
  subtotal: number;
  delivery_charge: number;
  total_amount: number;
  created_at: string;
}

export interface StoredOrder extends OrderCreatePayload, OrderCreateResponse {
  updated_at: string;
}
