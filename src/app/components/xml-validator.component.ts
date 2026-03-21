import { Component, signal, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { Pacs008ValidatorService } from '../services/pacs008-validator.service';
import { ValidationResult } from '../models/ValidationResult';
import { ValidationHistoryService } from '../services/validation-history.service';
import { SampleMessagesService } from '../services/sample-messages.service';
import { ExportService } from '../services/export.service';
import { XmlEditorComponent } from './xml-editor/xml-editor.component';
import { ValidationResultComponent } from './validation-result/validation-result.component';
import { SampleMessagesComponent } from './sample-messages/sample-messages.component';
import { XmlFormatterComponent } from './xml-formatter/xml-formatter.component';
import { ValidationHistoryComponent } from './validation-history/validation-history.component';

type TabType = 'validate' | 'samples' | 'history' | 'format';

@Component({
  selector: 'app-xml-validator',
  standalone: true,
  imports: [
    XmlEditorComponent,
    ValidationResultComponent,
    SampleMessagesComponent,
    XmlFormatterComponent,
    ValidationHistoryComponent
  ],
  templateUrl: './xml-validator.component.html',
  styleUrl: './xml-validator.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class XmlValidatorComponent {
  xmlContent = signal('');
  validationResult = signal<ValidationResult | null>(null);
  isValidating = signal(false);
  errorMessage = signal<string | null>(null);
  activeTab = signal<TabType>('validate');

  private validatorService = inject(Pacs008ValidatorService);
  private historyService = inject(ValidationHistoryService);
  private samplesService = inject(SampleMessagesService);
  private exportService = inject(ExportService);

  samples = this.samplesService.getAllSamples();
  history = signal(this.historyService.getHistory());
  historyStats = computed(() => this.historyService.getStatistics());

  onXmlContentChange(value: string): void {
    this.xmlContent.set(value);
    this.errorMessage.set(null);
    this.validationResult.set(null);
  }

  onFileError(message: string): void {
    this.errorMessage.set(message);
  }

  onValidate(): void {
    if (!this.xmlContent()) {
      this.errorMessage.set('Please provide XML content');
      return;
    }
    this.isValidating.set(true);
    this.errorMessage.set(null);
    try {
      const result = this.validatorService.validate(this.xmlContent());
      this.validationResult.set(result);
      this.historyService.addEntry(this.xmlContent(), result);
      this.history.set(this.historyService.getHistory());
    } catch (error) {
      this.errorMessage.set('Validation error: ' + (error as Error).message);
      this.validationResult.set({ isValid: false, errors: [{ level: 'error', message: (error as Error).message }] });
    } finally {
      this.isValidating.set(false);
    }
  }

  loadSample(sampleId: string): void {
    const sample = this.samplesService.getSampleById(sampleId);
    if (sample) {
      this.xmlContent.set(sample.content);
      this.errorMessage.set(null);
      this.validationResult.set(null);
      this.activeTab.set('validate');
    }
  }

  loadFromHistory(entryId: string): void {
    const entry = this.historyService.getEntryById(entryId);
    if (entry) {
      this.xmlContent.set(entry.xmlContent);
      this.validationResult.set(entry.result);
      this.activeTab.set('validate');
    }
  }

  deleteHistoryEntry(entryId: string): void {
    this.historyService.deleteEntry(entryId);
    this.history.set(this.historyService.getHistory());
  }

  clearHistory(): void {
    if (confirm('Are you sure you want to clear all history?')) {
      this.historyService.clearHistory();
      this.history.set([]);
    }
  }

  exportJson(): void {
    if (this.validationResult()) {
      this.exportService.downloadJson(this.xmlContent(), this.validationResult()!, `validation-report-${Date.now()}.json`);
    }
  }

  exportCsv(): void {
    if (this.validationResult()) {
      this.exportService.downloadCSV(this.validationResult()!, `validation-errors-${Date.now()}.csv`);
    }
  }

  exportHtml(): void {
    if (this.validationResult()) {
      this.exportService.downloadHtmlReport(this.xmlContent(), this.validationResult()!, `validation-report-${Date.now()}.html`);
    }
  }

  async copyXmlToClipboard(): Promise<void> {
    await this.exportService.copyToClipboard(this.xmlContent());
  }

  switchTab(tab: TabType): void {
    this.activeTab.set(tab);
    this.errorMessage.set(null);
  }
}
