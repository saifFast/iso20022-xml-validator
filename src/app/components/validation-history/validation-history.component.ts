import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HistoryEntry, HistoryStatistics } from '../../models/history-entry';

@Component({
  selector: 'app-validation-history',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './validation-history.component.html',
  styleUrl: './validation-history.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ValidationHistoryComponent {
  @Input() history: HistoryEntry[] = [];
  @Input() stats: HistoryStatistics = { totalValidations: 0, validMessages: 0, invalidMessages: 0, successRate: '0.00' };
  @Output() loadEntry = new EventEmitter<string>();
  @Output() deleteEntry = new EventEmitter<string>();
  @Output() clearHistory = new EventEmitter<void>();
}
