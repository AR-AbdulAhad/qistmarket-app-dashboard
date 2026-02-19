export type DeletionRequestStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: number;
  full_name: string;
  username: string;
  phone?: string;
  role?: {
    name: string;
  };
}

export interface AccountDeletionRequest {
  id: number;
  userId: number;
  reason?: string;
  status: DeletionRequestStatus;
  requestedAt: string; // ISO Date string
  reviewedAt?: string; // ISO Date string
  reviewedById?: number;
  reviewRemarks?: string;
  user?: User;
  reviewedBy?: {
    full_name: string;
    username: string;
  };
}

export interface DeletionRequestResponse {
  requests: AccountDeletionRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
  };
}
