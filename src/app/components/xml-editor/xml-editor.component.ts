import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-xml-editor',
  standalone: true,
  templateUrl: './xml-editor.component.html',
  styleUrl: './xml-editor.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class XmlEditorComponent {
  @Input() xmlContent = '';
  @Input() isValidating = false;
  @Output() xmlContentChange = new EventEmitter<string>();
  @Output() fileError = new EventEmitter<string>();
  @Output() validate = new EventEmitter<void>();

  onXmlInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.xmlContentChange.emit(target.value);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      this.fileError.emit('File size exceeds 5MB limit');
      return;
    }
    if (!file.name.toLowerCase().endsWith('.xml')) {
      this.fileError.emit('Please select a valid XML file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      this.xmlContentChange.emit(e.target?.result as string);
    };
    reader.onerror = () => {
      this.fileError.emit('Error reading file');
    };
    reader.readAsText(file);
  }
}
