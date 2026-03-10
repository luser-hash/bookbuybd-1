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

const revenueSeries = [
  { label: 'Apr', value: 58200 },
  { label: 'May', value: 60750 },
  { label: 'Jun', value: 63400 },
  { label: 'Jul', value: 66800 },
  { label: 'Aug', value: 69550 },
  { label: 'Sep', value: 72120 },
  { label: 'Oct', value: 74890 },
  { label: 'Nov', value: 77940 },
  { label: 'Dec', value: 81400 },
  { label: 'Jan', value: 84230 },
  { label: 'Feb', value: 86980 },
  { label: 'Mar', value: 90350 },
];

const retentionSeries = [
  { label: 'Jul', smes: 45, startups: 52, enterprises: 59 },
  { label: 'Aug', smes: 48, startups: 54, enterprises: 61 },
  { label: 'Sep', smes: 50, startups: 57, enterprises: 64 },
  { label: 'Oct', smes: 52, startups: 59, enterprises: 66 },
  { label: 'Nov', smes: 54, startups: 61, enterprises: 68 },
  { label: 'Dec', smes: 56, startups: 64, enterprises: 71 },
  { label: 'Jan', smes: 58, startups: 66, enterprises: 73 },
  { label: 'Feb', smes: 60, startups: 68, enterprises: 75 },
  { label: 'Mar', smes: 62, startups: 70, enterprises: 78 },
];

const leads = {
  open: 38,
  in_progress: 27,
  lost: 12,
  won: 31,
  total_leads: 108,
  conversion_rate: 28.7,
  customer_ltv_days: 146,
  leads_delta: 9,
  leads_delta_pct: 9.1,
  conversion_delta_pct: 2.8,
  ltv_delta_pct: 1.9,
  spark_leads: [72, 76, 79, 83, 87, 90, 94, 99, 103, 108],
  spark_conversion: [20, 21, 21, 22, 24, 24, 25, 26, 28, 29],
  spark_ltv: [131, 133, 134, 137, 139, 141, 142, 144, 145, 146],
};

const orders: DashboardOrder[] = [
  { id: 'ORD-1021', customer: 'Nusrat Jahan', book: 'Sapiens', amount: 900, status: 'confirmed', delivery: 'processing' },
  { id: 'ORD-1022', customer: 'Rahim Uddin', book: 'Harrison Internal Medicine', amount: 3500, status: 'pending', delivery: 'pending' },
  { id: 'ORD-1023', customer: 'Sadia Islam', book: 'Cambridge IELTS 18', amount: 450, status: 'confirmed', delivery: 'shipped' },
  { id: 'ORD-1024', customer: 'Arafat Hossain', book: 'Higher Engineering Mathematics', amount: 550, status: 'pending', delivery: 'processing' },
  { id: 'ORD-1025', customer: 'Tanvir Ahmed', book: 'Chokher Bali', amount: 480, status: 'rejected', delivery: 'cancelled' },
  { id: 'ORD-1026', customer: 'Rimi Akter', book: 'Pather Panchali', amount: 450, status: 'confirmed', delivery: 'delivered' },
  { id: 'ORD-1027', customer: 'Sabbir Hasan', book: 'Aparajito', amount: 380, status: 'confirmed', delivery: 'shipped' },
  { id: 'ORD-1028', customer: 'Faria Noman', book: 'Agni Veena', amount: 280, status: 'pending', delivery: 'pending' },
];

const books: DashboardBook[] = [
  { id: 1, title: 'Pather Panchali', author: 'Bibhutibhushan Bandyopadhyay', genre: 'Fiction', stock: 18, price: 450, status: 'active', orders: 126 },
  { id: 2, title: 'Aparajito', author: 'Bibhutibhushan Bandyopadhyay', genre: 'Fiction', stock: 6, price: 380, status: 'active', orders: 98 },
  { id: 3, title: 'Chokher Bali', author: 'Rabindranath Tagore', genre: 'Fiction', stock: 3, price: 480, status: 'active', orders: 142 },
  { id: 4, title: 'Cambridge IELTS 18', author: 'Cambridge University Press', genre: 'IELTS', stock: 14, price: 450, status: 'active', orders: 164 },
  { id: 5, title: 'Harrison Internal Medicine', author: 'J. Larry Jameson', genre: 'Medical', stock: 4, price: 3500, status: 'active', orders: 57 },
  { id: 6, title: 'Higher Engineering Mathematics', author: 'B.S. Grewal', genre: 'Engineering', stock: 0, price: 550, status: 'inactive', orders: 73 },
  { id: 7, title: 'Sapiens', author: 'Yuval Noah Harari', genre: 'Knowledge', stock: 11, price: 400, status: 'active', orders: 119 },
  { id: 8, title: 'The Rebel', author: 'Kazi Nazrul Islam', genre: 'Poetry', stock: 2, price: 220, status: 'active', orders: 49 },
];

const notifications = [
  { id: 1, type: 'order', msg: 'New order ORD-1028 is waiting for confirmation.', time: '5m ago', read: false },
  { id: 2, type: 'stock', msg: 'Chokher Bali stock dropped to 3 units.', time: '18m ago', read: false },
  { id: 3, type: 'system', msg: 'Daily revenue report generated successfully.', time: '1h ago', read: true },
  { id: 4, type: 'order', msg: 'Order ORD-1026 marked as delivered.', time: '3h ago', read: true },
  { id: 5, type: 'stock', msg: 'Higher Engineering Mathematics is out of stock.', time: '6h ago', read: false },
];

const calendar = {
  days: [
    { l: 'Mon', d: 9 },
    { l: 'Tue', d: 10 },
    { l: 'Wed', d: 11 },
    { l: 'Thu', d: 12 },
    { l: 'Fri', d: 13 },
    { l: 'Sat', d: 14 },
    { l: 'Sun', d: 15 },
  ],
  events: [
    { id: 1, title: 'Inventory Review', time: '10:00 AM', color: 'blue' as const, attendees: ['NA', 'RH', 'SI'], duration: '45m' },
    { id: 2, title: 'Publisher Call', time: '2:30 PM', color: 'violet' as const, attendees: ['TA', 'FA'], duration: '30m' },
    { id: 3, title: 'Dispatch Follow-up', time: '5:00 PM', color: 'blue' as const, attendees: ['SU', 'RJ', 'KM', 'AI'], duration: '20m' },
  ],
};

const favorites = [
  { id: 1, label: 'High Demand Books', color: 'bg-blue-500' },
  { id: 2, label: 'Low Stock Alerts', color: 'bg-amber-500' },
  { id: 3, label: 'Pending Deliveries', color: 'bg-violet-500' },
];

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
  return revenueSeries;
}

export function getDashboardRetention() {
  return retentionSeries;
}

export function getDashboardLeads() {
  return leads;
}

export function getDashboardOrders() {
  return orders;
}

export function getDashboardBooks() {
  return books;
}

export function getDashboardNotifications() {
  return notifications;
}

export function getDashboardCalendar() {
  return calendar;
}

export function getDashboardFavorites() {
  return favorites;
}
