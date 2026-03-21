export interface SampleMessage {
  id: string;
  name: string;
  description: string;
  content: string;
  category: 'valid' | 'invalid' | 'warning';
}
