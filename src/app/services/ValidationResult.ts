import { ValidationError } from './ValidationError';


export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  messageId?: string;
  creationDateTime?: string;
  transactionCount?: number;
  totalAmount?: number;
}
