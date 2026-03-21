import { Injectable } from '@angular/core';
import { ValidationResult } from '../models/ValidationResult';
import { HistoryEntry, HistoryStatistics } from '../models/history-entry';

export type { HistoryEntry, HistoryStatistics } from '../models/history-entry';

@Injectable({
  providedIn: 'root'
})
export class ValidationHistoryService {

  private readonly STORAGE_KEY = 'pacs008_validation_history';
  private readonly MAX_ENTRIES = 50;

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
    if (history.length > this.MAX_ENTRIES) history.pop();
    this.saveHistory(history);
    return entry;
  }

  getHistory(): HistoryEntry[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return [];
      return (JSON.parse(data) as any[]).map(e => ({ ...e, timestamp: new Date(e.timestamp) }));
    } catch {
      return [];
    }
  }

  getEntryById(id: string): HistoryEntry | undefined {
    return this.getHistory().find(e => e.id === id);
  }

  deleteEntry(id: string): void {
    this.saveHistory(this.getHistory().filter(e => e.id !== id));
  }

  clearHistory(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  getStatistics(): HistoryStatistics {
    const history = this.getHistory();
    const validCount = history.filter(e => e.isValid).length;
    return {
      totalValidations: history.length,
      validMessages: validCount,
      invalidMessages: history.length - validCount,
      successRate: history.length > 0 ? ((validCount / history.length) * 100).toFixed(2) : '0.00'
    };
  }

  exportAsJson(): string {
    return JSON.stringify(this.getHistory(), null, 2);
  }

  importFromJson(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (!Array.isArray(data)) throw new Error('Invalid format');
      this.saveHistory(data.map(e => ({ ...e, timestamp: new Date(e.timestamp) })).slice(0, this.MAX_ENTRIES));
      return true;
    } catch {
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
