export interface ValidationReport {
  timestamp: string;
  summary: {
    status: 'valid' | 'invalid';
    totalErrors: number;
    totalWarnings: number;
    totalInfo: number;
  };
  message: {
    id?: string;
    createdAt?: string;
    transactionCount?: number;
    totalAmount?: number;
  };
  details: {
    level: string;
    message: string;
    element?: string;
    path?: string;
  }[];
}
