import { Component, signal, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pacs008ValidatorService } from '../services/pacs008-validator.service';
import { ValidationResult } from '../models/ValidationResult';
import { ValidationHistoryService } from '../services/validation-history.service';
import { SampleMessagesService } from '../services/sample-messages.service';
import { ExportService } from '../services/export.service';
import { XmlFormatterService } from '../services/xml-formatter.service';

type TabType = 'validate' | 'samples' | 'history' | 'format';

@Component({
    selector: 'app-xml-validator',
    standalone: true,
    imports: [CommonModule],
    templateUrl: 'xml-validator.component.html',
    styleUrl: 'xml-validator.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class XmlValidatorComponent {
    xmlContent = signal('');
    validationResult = signal<ValidationResult | null>(null);
    isValidating = signal(false);
    errorMessage = signal<string | null>(null);
    activeTab = signal<TabType>('validate');
    selectedFile = signal<File | null>(null);
    formattedXml = signal<string>('');
    xmlStats = signal<any>(null);

    private validatorService = inject(Pacs008ValidatorService);
    private historyService = inject(ValidationHistoryService);
    private samplesService = inject(SampleMessagesService);
    private exportService = inject(ExportService);
    private formatterService = inject(XmlFormatterService);

    samples = this.samplesService.getAllSamples();
    history = signal(this.historyService.getHistory());
    historyStats = computed(() => this.historyService.getStatistics());

    onXmlContentChange(event: Event): void {
        const target = event.target as HTMLTextAreaElement;
        this.xmlContent.set(target.value);
        this.errorMessage.set(null);
        this.validationResult.set(null);
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        
        if (!file) return;

        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            this.errorMessage.set('File size exceeds 5MB limit');
            return;
        }

        if (!file.name.toLowerCase().endsWith('.xml')) {
            this.errorMessage.set('Please select a valid XML file');
            return;
        }

        this.selectedFile.set(file);
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                this.xmlContent.set(content);
                this.errorMessage.set(null);
                this.validationResult.set(null);
            } catch (error) {
                this.errorMessage.set('Failed to read file: ' + (error as Error).message);
            }
        };
        
        reader.onerror = () => {
            this.errorMessage.set('Error reading file');
        };

        reader.readAsText(file);
    }

    validate(): void {
        if (!this.xmlContent()) {
            this.errorMessage.set('Please provide XML content');
            return;
        }

        this.isValidating.set(true);
        this.errorMessage.set(null);

        try {
            const result = this.validatorService.validate(this.xmlContent());
            this.validationResult.set(result);

            // Add to history
            this.historyService.addEntry(this.xmlContent(), result);
            this.history.set(this.historyService.getHistory());
        } catch (error) {
            this.errorMessage.set('Validation error: ' + (error as Error).message);
            this.validationResult.set({
                isValid: false,
                errors: [{
                    level: 'error',
                    message: (error as Error).message
                }]
            });
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

    formatXml(): void {
        try {
            const formatted = this.formatterService.formatXml(this.xmlContent());
            this.formattedXml.set(formatted);
            this.xmlStats.set(this.formatterService.getStatistics(this.xmlContent()));
            this.errorMessage.set(null);
        } catch (error) {
            this.errorMessage.set((error as Error).message);
        }
    }

    minifyXml(): void {
        try {
            const minified = this.formatterService.minifyXml(this.xmlContent());
            this.xmlContent.set(minified);
            this.formattedXml.set('');
            this.errorMessage.set(null);
        } catch (error) {
            this.errorMessage.set((error as Error).message);
        }
    }

    useFormattedXml(): void {
        if (this.formattedXml()) {
            this.xmlContent.set(this.formattedXml());
            this.formattedXml.set('');
        }
    }

    exportJson(): void {
        if (this.validationResult()) {
            this.exportService.downloadJson(
                this.xmlContent(), 
                this.validationResult()!,
                `validation-report-${Date.now()}.json`
            );
        }
    }

    exportCsv(): void {
        if (this.validationResult()) {
            this.exportService.downloadCSV(
                this.validationResult()!,
                `validation-errors-${Date.now()}.csv`
            );
        }
    }

    exportHtml(): void {
        if (this.validationResult()) {
            this.exportService.downloadHtmlReport(
                this.xmlContent(),
                this.validationResult()!,
                `validation-report-${Date.now()}.html`
            );
        }
    }

    async copyXmlToClipboard(): Promise<void> {
        const success = await this.exportService.copyToClipboard(this.xmlContent());
        if (success) {
            this.errorMessage.set(null);
        }
    }

    switchTab(tab: TabType): void {
        this.activeTab.set(tab);
    }
}
