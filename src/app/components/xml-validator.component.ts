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

    constructor(private validatorService: Pacs008ValidatorService) { }

    onXmlContentChange(event: Event): void {
        const target = event.target as HTMLTextAreaElement;
        this.xmlContent.set(target.value);
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];

        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.xmlContent.set(e.target?.result as string);
            };
            reader.readAsText(file);
        }
    }

    validate(): void {
        const result = this.validatorService.validate(this.xmlContent());
        this.validationResult.set(result);
    }
}