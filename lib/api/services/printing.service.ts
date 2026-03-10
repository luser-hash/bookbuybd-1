import { apiClient } from '@/lib/api/client';
import type {
  CreatePrintingRequestPayload,
  CreatePrintingRequestResponse,
  PrintingEstimatePayload,
  PrintingEstimateResponse,
  PrintingItemOption,
  PrintingRequestStatus,
  PrintingCategory,
  UploadAssetRequest,
  UploadAssetResponse,
} from '@/lib/api/contracts/printing';
import { endpoints } from '@/lib/api/endpoints';

export const printingService = {
  getCategories() {
    return apiClient.get<PrintingCategory[]>(endpoints.printing.categories);
  },

  getCategoryItems(categoryId: string) {
    return apiClient.get<PrintingItemOption[]>(endpoints.printing.categoryItems(categoryId));
  },

  estimate(payload: PrintingEstimatePayload) {
    return apiClient.post<PrintingEstimateResponse, PrintingEstimatePayload>(endpoints.printing.estimate, payload);
  },

  createRequest(payload: CreatePrintingRequestPayload) {
    return apiClient.post<CreatePrintingRequestResponse, CreatePrintingRequestPayload>(endpoints.printing.requests, payload);
  },

  getRequestStatus(requestId: string) {
    return apiClient.get<PrintingRequestStatus>(endpoints.printing.requestDetail(requestId));
  },

  createUploadUrl(payload: UploadAssetRequest) {
    return apiClient.post<UploadAssetResponse, UploadAssetRequest>(endpoints.printing.uploads, payload);
  },
};
