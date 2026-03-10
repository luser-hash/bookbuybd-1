import { apiClient } from '@/lib/api/client';
import type {
  ContactAvailabilitySlot,
  ContactInfoResponse,
  ContactMessagePayload,
  ContactMessageResponse,
  ContactMessageStatus,
  ContactSubjectOption,
} from '@/lib/api/contracts/contact';
import { endpoints } from '@/lib/api/endpoints';

export const contactService = {
  getInfo() {
    return apiClient.get<ContactInfoResponse>(endpoints.contact.info);
  },

  getSubjects() {
    return apiClient.get<ContactSubjectOption[]>(endpoints.contact.subjects);
  },

  getAvailability(date?: string) {
    return apiClient.get<ContactAvailabilitySlot[]>(endpoints.contact.availability, {
      query: date ? { date } : undefined,
    });
  },

  sendMessage(payload: ContactMessagePayload) {
    return apiClient.post<ContactMessageResponse, ContactMessagePayload>(endpoints.contact.messages, payload);
  },

  getMessageStatus(messageId: string) {
    return apiClient.get<ContactMessageStatus>(endpoints.contact.messageDetail(messageId));
  },
};
