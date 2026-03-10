export interface PrintingItemOption {
  id: string;
  name: string;
  description: string;
  icon?: string;
}

export interface PrintingCategory {
  id: string;
  label: string;
  icon?: string;
  items: PrintingItemOption[];
}

export interface UploadAssetRequest {
  fileName: string;
  contentType: string;
  sizeInBytes: number;
}

export interface UploadAssetResponse {
  uploadUrl: string;
  fileUrl: string;
  expiresAt: string;
}

export interface CreatePrintingRequestPayload {
  categoryId: string | null;
  itemIds: string[];
  quantity?: number;
  budget?: number;
  requiredBy?: string;
  notes?: string;
  emergency?: boolean;
  assetUrls?: string[];
}

export interface CreatePrintingRequestResponse {
  requestId: string;
  status: 'received' | 'processing' | 'quoted';
  submittedAt: string;
}

export interface PrintingRequestStatus {
  requestId: string;
  status: 'received' | 'processing' | 'quoted' | 'approved' | 'in_production' | 'completed' | 'cancelled';
  submittedAt: string;
  updatedAt: string;
}

export interface PrintingEstimatePayload {
  categoryId: string | null;
  itemIds: string[];
  quantity?: number;
  emergency?: boolean;
}

export interface PrintingEstimateResponse {
  estimatedTotal: number;
  currency: 'BDT' | string;
  minimumLeadDays?: number;
  maximumLeadDays?: number;
}
