import { ValidationResult } from './ValidationResult';

export interface HistoryEntry {
  id: string;
  timestamp: Date;
  xmlContent: string;
  result: ValidationResult;
  isValid: boolean;
  messageId?: string;
}

export interface HistoryStatistics {
  totalValidations: number;
  validMessages: number;
  invalidMessages: number;
  successRate: string;
}
