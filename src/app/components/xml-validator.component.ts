import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pacs008ValidatorService, ValidationResult } from '../services/pacs008-validator.service';

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

    constructor(private validatorService: Pacs008ValidatorService) {}

    onXmlContentChange(event: Event): void {
        const target = event.target as HTMLTextAreaElement;
        this.xmlContent.set(target.value);
        this.errorMessage.set(null);
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        
        if (!file) return;

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            this.errorMessage.set('File size exceeds 5MB limit');
            return;
        }

        // Validate file type
        if (!file.name.toLowerCase().endsWith('.xml')) {
            this.errorMessage.set('Please select a valid XML file');
            return;
        }

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
}