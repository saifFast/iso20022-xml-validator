import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { ValidationResult } from '../../models/ValidationResult';

@Component({
  selector: 'app-validation-result',
  standalone: true,
  templateUrl: './validation-result.component.html',
  styleUrl: './validation-result.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ValidationResultComponent {
  @Input() result: ValidationResult | null = null;
  @Output() exportJson = new EventEmitter<void>();
  @Output() exportCsv = new EventEmitter<void>();
  @Output() exportHtml = new EventEmitter<void>();
  @Output() copyXml = new EventEmitter<void>();
}
