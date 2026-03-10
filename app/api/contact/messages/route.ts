import { NextResponse } from 'next/server';
import { createContactMessage } from '@/lib/server/contact-store';
import type { ContactMessagePayload } from '@/lib/api/contracts/contact';

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function validatePayload(payload: unknown): { valid: true; data: ContactMessagePayload } | { valid: false; message: string } {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, message: 'Invalid payload.' };
  }

  const record = payload as Record<string, unknown>;
  const name = asString(record.name);
  const email = asString(record.email);
  const subject = asString(record.subject);
  const message = asString(record.message);
  const preferredDate = asString(record.preferredDate);

  if (!name) return { valid: false, message: 'Name is required.' };
  if (!email) return { valid: false, message: 'Email is required.' };
  if (!subject) return { valid: false, message: 'Subject is required.' };
  if (!message) return { valid: false, message: 'Message is required.' };

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOk) return { valid: false, message: 'Email format is invalid.' };

  if (preferredDate && Number.isNaN(Date.parse(preferredDate))) {
    return { valid: false, message: 'preferredDate must be a valid date string.' };
  }

  return {
    valid: true,
    data: {
      name,
      email,
      subject,
      message,
      ...(preferredDate ? { preferredDate } : {}),
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
    return NextResponse.json({ message: validated.message }, { status: 400 });
  }

  const created = createContactMessage(validated.data);
  return NextResponse.json(created, { status: 201 });
}
