export type Money = number; // Or string for arbitrary precision

export enum DocStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELED = 'CANCELED',
  CLOSED = 'CLOSED',
}

export interface BaseEntity {
  id: string;
  docNo?: string;
  docDate?: string;
  status?: DocStatus;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    currentPage: number;
    perPage: number;
    totalPages: number;
    total: number;
  };
}

export interface ApiError {
  message: string;
  fieldErrors?: Record<string, string>;
}
