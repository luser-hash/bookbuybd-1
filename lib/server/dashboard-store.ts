type OrderStatus = 'pending' | 'confirmed' | 'rejected';
type DeliveryStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

interface DashboardOrder {
  id: string;
  customer: string;
  book: string;
  amount: number;
  status: OrderStatus;
  delivery: DeliveryStatus;
}

interface DashboardBook {
  id: number;
  title: string;
  author: string;
  genre: string;
  stock: number;
  price: number;
  status: 'active' | 'inactive';
  orders: number;
}

const orders: DashboardOrder[] = [];
const books: DashboardBook[] = [];

function countOrdersByStatus(status: OrderStatus): number {
  return orders.filter((order) => order.status === status).length;
}

function countOrdersByDelivery(status: DeliveryStatus): number {
  return orders.filter((order) => order.delivery === status).length;
}

export function getDashboardOverview() {
  return {
    total_revenue: orders.reduce((sum, order) => sum + order.amount, 0),
    total_orders: orders.length,
    pending_orders: countOrdersByStatus('pending'),
    confirmed_orders: countOrdersByStatus('confirmed'),
    rejected_orders: countOrdersByStatus('rejected'),
    pending_deliveries: countOrdersByDelivery('pending'),
    processing_deliveries: countOrdersByDelivery('processing'),
    shipped_deliveries: countOrdersByDelivery('shipped'),
    delivered_deliveries: countOrdersByDelivery('delivered'),
    cancelled_deliveries: countOrdersByDelivery('cancelled'),
    total_books: books.length,
    active_books: books.filter((book) => book.status === 'active').length,
    in_stock_books: books.filter((book) => book.stock > 0).length,
    out_of_stock_books: books.filter((book) => book.stock <= 0).length,
    low_stock_books: books.filter((book) => book.stock > 0 && book.stock <= 5).length,
  };
}

export function getDashboardRevenue() {
  return [] as Array<{ label: string; value: number }>;
}

export function getDashboardRetention() {
  return [] as Array<{ label: string; smes: number; startups: number; enterprises: number }>;
}

export function getDashboardLeads() {
  return {
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
}

export function getDashboardOrders() {
  return orders;
}

export function getDashboardBooks() {
  return books;
}

export function getDashboardNotifications() {
  return [] as Array<{ id: number; type: string; msg: string; time: string; read: boolean }>;
}

export function getDashboardCalendar() {
  return {
    days: [] as Array<{ l: string; d: number }>,
    events: [] as Array<{ id: number; title: string; time: string; color: 'blue' | 'violet'; attendees: string[]; duration?: string }>,
  };
}

export function getDashboardFavorites() {
  return [] as Array<{ id: number; label: string; color: string }>;
}

