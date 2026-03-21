import { Injectable } from '@angular/core';
import { ValidationResult } from '../models/ValidationResult';
import { ValidationReport } from '../models/validation-report';

export type { ValidationReport } from '../models/validation-report';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  exportAsJson(xmlContent: string, result: ValidationResult): string {
    const report = this.generateReport(xmlContent, result);
    return JSON.stringify(report, null, 2);
  }

  downloadJson(xmlContent: string, result: ValidationResult, filename: string = 'validation-report.json'): void {
    this.downloadFile(this.exportAsJson(xmlContent, result), filename, 'application/json');
  }

  exportAsCSV(result: ValidationResult): string {
    let csv = 'Level,Message,Element,Path\n';
    result.errors.forEach(error => {
      csv += `${this.escapeCSVValue(error.level)},${this.escapeCSVValue(error.message)},${this.escapeCSVValue(error.element || '')},${this.escapeCSVValue(error.path || '')}\n`;
    });
    return csv;
  }

  downloadCSV(result: ValidationResult, filename: string = 'validation-errors.csv'): void {
    this.downloadFile(this.exportAsCSV(result), filename, 'text/csv');
  }

  generateHtmlReport(xmlContent: string, result: ValidationResult): string {
    const report = this.generateReport(xmlContent, result);
    const timestamp = new Date(report.timestamp).toLocaleString();

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PACS.008 Validation Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; color: #333; }
        .container { max-width: 900px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        h1 { color: #2563eb; margin-top: 0; }
        .summary { background: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .status { font-size: 18px; font-weight: 600; padding: 10px 15px; border-radius: 4px; display: inline-block; margin-bottom: 15px; }
        .status.valid { background: #d1fae5; color: #065f46; }
        .status.invalid { background: #fee2e2; color: #7f1d1d; }
        .stat { display: inline-block; margin-right: 30px; margin-bottom: 10px; }
        .stat-value { font-size: 24px; font-weight: 700; color: #2563eb; }
        .stat-label { font-size: 12px; color: #666; text-transform: uppercase; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #2563eb; color: white; padding: 12px; text-align: left; font-weight: 600; }
        td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; }
        tr:hover { background: #f9fafb; }
        .level-error { color: #ef4444; font-weight: 600; }
        .level-warning { color: #f59e0b; font-weight: 600; }
        .level-info { color: #3b82f6; font-weight: 600; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <h1>PACS.008 Validation Report</h1>
        <div class="summary">
            <div class="status ${report.summary.status}">${report.summary.status.toUpperCase()}</div>
            <div>
                <div class="stat"><div class="stat-value">${report.summary.totalErrors}</div><div class="stat-label">Errors</div></div>
                <div class="stat"><div class="stat-value">${report.summary.totalWarnings}</div><div class="stat-label">Warnings</div></div>
                <div class="stat"><div class="stat-value">${report.summary.totalInfo}</div><div class="stat-label">Info</div></div>
            </div>
        </div>
        <h2>Message Information</h2>
        <div class="summary">
            <p><strong>Validation Time:</strong> ${timestamp}</p>
            ${report.message.id ? `<p><strong>Message ID:</strong> ${report.message.id}</p>` : ''}
            ${report.message.createdAt ? `<p><strong>Message Created:</strong> ${report.message.createdAt}</p>` : ''}
            ${report.message.transactionCount ? `<p><strong>Number of Transactions:</strong> ${report.message.transactionCount}</p>` : ''}
            ${report.message.totalAmount ? `<p><strong>Total Amount:</strong> ${report.message.totalAmount}</p>` : ''}
        </div>
        ${report.details.length > 0 ? `
            <h2>Validation Details</h2>
            <table>
                <thead><tr><th>Level</th><th>Message</th><th>Element</th><th>Path</th></tr></thead>
                <tbody>
                    ${report.details.map(d => `
                        <tr>
                            <td><span class="level-${d.level}">${d.level.toUpperCase()}</span></td>
                            <td>${d.message}</td>
                            <td>${d.element || '-'}</td>
                            <td>${d.path || '-'}</td>
                        </tr>`).join('')}
                </tbody>
            </table>` : '<p>No issues found.</p>'}
        <div class="footer"><p>Generated on ${timestamp} | PACS.008 XML Validator</p></div>
    </div>
</body>
</html>`;
  }

  downloadHtmlReport(xmlContent: string, result: ValidationResult, filename: string = 'validation-report.html'): void {
    this.downloadFile(this.generateHtmlReport(xmlContent, result), filename, 'text/html');
  }

  async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  private generateReport(xmlContent: string, result: ValidationResult): ValidationReport {
    return {
      timestamp: new Date().toISOString(),
      summary: {
        status: result.isValid ? 'valid' : 'invalid',
        totalErrors: result.errors.filter(e => e.level === 'error').length,
        totalWarnings: result.errors.filter(e => e.level === 'warning').length,
        totalInfo: result.errors.filter(e => e.level === 'info').length
      },
      message: {
        id: result.messageId,
        createdAt: result.creationDateTime,
        transactionCount: result.transactionCount,
        totalAmount: result.totalAmount
      },
      details: result.errors.map(e => ({ level: e.level, message: e.message, element: e.element, path: e.path }))
    };
  }

  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  private escapeCSVValue(value: string): string {
    if (!value) return '""';
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return '"' + value.replace(/"/g, '""') + '"';
    }
    return value;
  }
}
