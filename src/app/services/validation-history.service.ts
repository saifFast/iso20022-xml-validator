import { Injectable } from '@angular/core';
import { ValidationResult } from './ValidationResult';

export interface HistoryEntry {
  id: string;
  timestamp: Date;
  xmlContent: string;
  result: ValidationResult;
  isValid: boolean;
  messageId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ValidationHistoryService {
  
  private readonly STORAGE_KEY = 'pacs008_validation_history';
  private readonly MAX_ENTRIES = 50;

  /**
   * Add validation result to history
   */
  addEntry(xmlContent: string, result: ValidationResult): HistoryEntry {
    const entry: HistoryEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      xmlContent,
      result,
      isValid: result.isValid,
      messageId: result.messageId
    };

    const history = this.getHistory();
    history.unshift(entry);

    // Keep only last MAX_ENTRIES
    if (history.length > this.MAX_ENTRIES) {
      history.pop();
    }

    this.saveHistory(history);
    return entry;
  }

  /**
   * Get all history entries
   */
  getHistory(): HistoryEntry[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return [];

      const entries = JSON.parse(data) as any[];
      return entries.map(e => ({
        ...e,
        timestamp: new Date(e.timestamp)
      }));
    } catch (error) {
      console.error('Error loading history:', error);
      return [];
    }
  }

  /**
   * Get history entry by ID
   */
  getEntryById(id: string): HistoryEntry | undefined {
    return this.getHistory().find(e => e.id === id);
  }

  /**
   * Delete entry by ID
   */
  deleteEntry(id: string): void {
    const history = this.getHistory().filter(e => e.id !== id);
    this.saveHistory(history);
  }

  /**
   * Clear all history
   */
  clearHistory(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Get statistics
   */
  getStatistics(): HistoryStatistics {
    const history = this.getHistory();
    const validCount = history.filter(e => e.isValid).length;
    const invalidCount = history.length - validCount;

    return {
      totalValidations: history.length,
      validMessages: validCount,
      invalidMessages: invalidCount,
      successRate: history.length > 0 
        ? ((validCount / history.length) * 100).toFixed(2)
        : '0.00'
    };
  }

  /**
   * Export history as JSON
   */
  exportAsJson(): string {
    const history = this.getHistory();
    return JSON.stringify(history, null, 2);
  }

  /**
   * Import history from JSON
   */
  importFromJson(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (!Array.isArray(data)) {
        throw new Error('Invalid format');
      }

      const history = data.map(e => ({
        ...e,
        timestamp: new Date(e.timestamp)
      }));

      this.saveHistory(history.slice(0, this.MAX_ENTRIES));
      return true;
    } catch (error) {
      console.error('Error importing history:', error);
      return false;
    }
  }

  private saveHistory(history: HistoryEntry[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
  }

  private generateId(): string {
    return 'hist_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}

export interface HistoryStatistics {
  totalValidations: number;
  validMessages: number;
  invalidMessages: number;
  successRate: string;
}