import type {
  ContactInfoResponse,
  ContactMessagePayload,
  ContactMessageResponse,
  ContactMessageStatus,
  ContactSubjectOption,
} from '@/lib/api/contracts/contact';

type StoredContactMessage = ContactMessagePayload & ContactMessageResponse & { updatedAt: string };

const CONTACT_INFO: ContactInfoResponse = {
  phone: '+880 1712-345678',
  email: 'support@bookbuybd.com',
  address: 'Dhaka, Bangladesh',
  mapEmbedUrl:
    'https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d58410.109183500055!2d90.38069759999999!3d23.7961216!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sbd!4v1773080633091!5m2!1sen!2sbd',
  supportHours: 'Sat-Thu 10:00-20:00',
};

const CONTACT_SUBJECTS: ContactSubjectOption[] = [
  { id: 'general', label: 'General Inquiry' },
  { id: 'order', label: 'Order Support' },
  { id: 'printing', label: 'Printing Service' },
  { id: 'payment', label: 'Payment Issue' },
];

const messageStore = new Map<string, StoredContactMessage>();

function buildMessageId() {
  return `msg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function getContactInfo(): ContactInfoResponse {
  return CONTACT_INFO;
}

export function getContactSubjects(): ContactSubjectOption[] {
  return CONTACT_SUBJECTS;
}

export function createContactMessage(payload: ContactMessagePayload): ContactMessageResponse {
  const submittedAt = new Date().toISOString();
  const messageId = buildMessageId();
  const status: ContactMessageResponse['status'] = 'received';

  messageStore.set(messageId, {
    ...payload,
    messageId,
    status,
    submittedAt,
    updatedAt: submittedAt,
  });

  return { messageId, status, submittedAt };
}

export function listContactMessages(): StoredContactMessage[] {
  return Array.from(messageStore.values()).sort((a, b) => (
    new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  ));
}

export function getContactMessageStatus(messageId: string): ContactMessageStatus | null {
  const record = messageStore.get(messageId);
  if (!record) return null;

  return {
    messageId: record.messageId,
    status: record.status,
    updatedAt: record.updatedAt,
  };
}
