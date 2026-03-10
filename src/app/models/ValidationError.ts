
export interface ValidationError {
  level: 'error' | 'warning' | 'info';
  message: string;
  element?: string;
  path?: string;
}
