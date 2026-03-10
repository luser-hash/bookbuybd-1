export interface ContactMessagePayload {
  name: string;
  email: string;
  subject: string;
  message: string;
  preferredDate?: string;
}

export interface ContactMessageResponse {
  messageId: string;
  status: 'received';
  submittedAt: string;
}

export interface ContactInfoResponse {
  phone: string;
  email: string;
  address: string;
  mapEmbedUrl?: string;
  supportHours?: string;
}

export interface ContactSubjectOption {
  id: string;
  label: string;
}

export interface ContactAvailabilitySlot {
  date: string;
  isAvailable: boolean;
  note?: string;
}

export interface ContactMessageStatus {
  messageId: string;
  status: 'received' | 'in_review' | 'resolved' | 'closed';
  updatedAt: string;
}
