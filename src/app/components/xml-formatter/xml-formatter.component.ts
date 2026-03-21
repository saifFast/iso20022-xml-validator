import { Component, Input, Output, EventEmitter, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { XmlFormatterService } from '../../services/xml-formatter.service';
import { XmlStatistics } from '../../models/xml-statistics';

@Component({
  selector: 'app-xml-formatter',
  standalone: true,
  templateUrl: './xml-formatter.component.html',
  styleUrl: './xml-formatter.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class XmlFormatterComponent {
  @Input() xmlContent = '';
  @Output() xmlContentChange = new EventEmitter<string>();
  @Output() formatterError = new EventEmitter<string>();

  private formatterService = inject(XmlFormatterService);

  formattedXml = signal('');
  xmlStats = signal<XmlStatistics | null>(null);

  onFormat(): void {
    try {
      this.formattedXml.set(this.formatterService.formatXml(this.xmlContent));
      this.xmlStats.set(this.formatterService.getStatistics(this.xmlContent));
    } catch (error) {
      this.formatterError.emit((error as Error).message);
    }
  }

  onMinify(): void {
    try {
      this.xmlContentChange.emit(this.formatterService.minifyXml(this.xmlContent));
      this.formattedXml.set('');
    } catch (error) {
      this.formatterError.emit((error as Error).message);
    }
  }

  onUseFormatted(): void {
    if (this.formattedXml()) {
      this.xmlContentChange.emit(this.formattedXml());
      this.formattedXml.set('');
    }
  }
}
