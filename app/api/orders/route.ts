import { NextResponse } from 'next/server';
import { createOrder, listOrders } from '@/lib/server/order-store';
import type { OrderCreateItemPayload, OrderCreatePayload } from '@/lib/api/contracts/orders';

type ValidationFailure = { valid: false; errors: Record<string, string[]> };
type ValidationSuccess = { valid: true; data: OrderCreatePayload };

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function addError(errors: Record<string, string[]>, key: string, message: string): void {
  if (!errors[key]) errors[key] = [];
  errors[key].push(message);
}

function pickFirst(record: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (key in record) return record[key];
  }
  return undefined;
}

function parseOptionalNumber(value: unknown): { hasValue: boolean; value?: number; valid: boolean } {
  if (value === undefined || value === null || value === '') return { hasValue: false, valid: true };
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return { hasValue: true, valid: false };
  return { hasValue: true, value: numeric, valid: true };
}

function parseItem(raw: unknown, index: number, errors: Record<string, string[]>): OrderCreateItemPayload | null {
  const rec = asRecord(raw);
  if (!rec) {
    addError(errors, `items[${index}]`, 'Item must be an object.');
    return null;
  }

  const rawBookId = pickFirst(rec, ['book_id', 'bookId', 'id']);
  const rawQuantity = pickFirst(rec, ['quantity', 'qty']);
  const rawUnitPrice = pickFirst(rec, ['unit_price', 'unitPrice', 'price']);

  const bookId = Number(rawBookId);
  const quantity = Number(rawQuantity);
  const parsedUnitPrice = parseOptionalNumber(rawUnitPrice);

  if (!Number.isInteger(bookId) || bookId <= 0) {
    addError(errors, `items[${index}].book_id`, 'book_id must be a positive integer.');
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    addError(errors, `items[${index}].quantity`, 'quantity must be a positive integer.');
  }

  if (!parsedUnitPrice.valid) {
    addError(errors, `items[${index}].unit_price`, 'unit_price must be a valid number.');
  } else if (parsedUnitPrice.hasValue && (parsedUnitPrice.value as number) < 0) {
    addError(errors, `items[${index}].unit_price`, 'unit_price cannot be negative.');
  }

  if (!Number.isInteger(bookId) || bookId <= 0 || !Number.isInteger(quantity) || quantity <= 0) {
    return null;
  }

  return {
    book_id: bookId,
    quantity,
    ...(parsedUnitPrice.hasValue ? { unit_price: parsedUnitPrice.value } : {}),
  };
}

function validatePayload(payload: unknown): ValidationFailure | ValidationSuccess {
  const errors: Record<string, string[]> = {};
  const record = asRecord(payload);

  if (!record) {
    return { valid: false, errors: { payload: ['Invalid payload.'] } };
  }

  const customerName = asTrimmedString(pickFirst(record, ['customer_name', 'customerName', 'fullName', 'full_name']));
  const customerPhone = asTrimmedString(pickFirst(record, ['customer_phone', 'customerPhone', 'phone']));
  const customerEmail = asTrimmedString(pickFirst(record, ['customer_email', 'customerEmail', 'email']));
  const shippingAddress = asTrimmedString(pickFirst(record, ['shipping_address', 'shippingAddress', 'address']));
  const city = asTrimmedString(record.city);
  const district = asTrimmedString(record.district);
  const postalCode = asTrimmedString(pickFirst(record, ['postal_code', 'postalCode']));
  const notes = asTrimmedString(pickFirst(record, ['notes', 'note']));
  const paymentMethod = asTrimmedString(pickFirst(record, ['payment_method', 'paymentMethod']));
  const rawItems = record.items;

  const subtotalParsed = parseOptionalNumber(record.subtotal);
  const deliveryParsed = parseOptionalNumber(pickFirst(record, ['delivery_charge', 'deliveryCharge']));
  const totalParsed = parseOptionalNumber(pickFirst(record, ['total_amount', 'totalAmount']));

  if (!customerName) addError(errors, 'customer_name', 'customer_name is required.');

  if (!customerPhone) {
    addError(errors, 'customer_phone', 'customer_phone is required.');
  } else if (!/^(\+8801|01)[0-9]{9}$/.test(customerPhone.replace(/\s/g, ''))) {
    addError(errors, 'customer_phone', 'Enter a valid BD phone number.');
  }

  if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    addError(errors, 'customer_email', 'Enter a valid email address.');
  }

  if (!shippingAddress) addError(errors, 'shipping_address', 'shipping_address is required.');
  if (!city) addError(errors, 'city', 'city is required.');
  if (!district) addError(errors, 'district', 'district is required.');

  if (notes.length > 400) {
    addError(errors, 'notes', 'notes cannot be longer than 400 characters.');
  }

  const normalizedPayment = paymentMethod || 'cod';
  if (normalizedPayment !== 'cod') {
    addError(errors, 'payment_method', 'Only cash on delivery (cod) is supported.');
  }

  if (!subtotalParsed.valid) addError(errors, 'subtotal', 'subtotal must be a valid number.');
  if (!deliveryParsed.valid) addError(errors, 'delivery_charge', 'delivery_charge must be a valid number.');
  if (!totalParsed.valid) addError(errors, 'total_amount', 'total_amount must be a valid number.');

  const items = Array.isArray(rawItems)
    ? rawItems.map((item, index) => parseItem(item, index, errors)).filter((item): item is OrderCreateItemPayload => item !== null)
    : [];

  if (!Array.isArray(rawItems)) {
    addError(errors, 'items', 'items must be an array.');
  } else if (rawItems.length === 0) {
    addError(errors, 'items', 'At least one item is required.');
  }

  const subtotalProvided = subtotalParsed.hasValue;
  if (!subtotalProvided) {
    items.forEach((item, index) => {
      if (typeof item.unit_price !== 'number') {
        addError(
          errors,
          `items[${index}].unit_price`,
          'unit_price is required when subtotal is not provided.',
        );
      }
    });
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      customer_name: customerName,
      customer_phone: customerPhone,
      ...(customerEmail ? { customer_email: customerEmail } : {}),
      shipping_address: shippingAddress,
      city,
      district,
      ...(postalCode ? { postal_code: postalCode } : {}),
      ...(notes ? { notes } : {}),
      payment_method: 'cod',
      items,
      ...(subtotalParsed.hasValue ? { subtotal: subtotalParsed.value } : {}),
      ...(deliveryParsed.hasValue ? { delivery_charge: deliveryParsed.value } : {}),
      ...(totalParsed.hasValue ? { total_amount: totalParsed.value } : {}),
    },
  };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const validated = validatePayload(body);
  if (!validated.valid) {
    return NextResponse.json({ errors: validated.errors }, { status: 400 });
  }

  const created = createOrder(validated.data);
  return NextResponse.json(created, { status: 201 });
}

export async function GET() {
  return NextResponse.json(listOrders());
}
