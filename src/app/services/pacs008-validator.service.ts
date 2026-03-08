import { Injectable } from '@angular/core';

export interface ValidationError {
  level: 'error' | 'warning' | 'info';
  message: string;
  element?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  messageId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class Pacs008ValidatorService {
  validate(xmlContent: string): ValidationResult {
    const errors: ValidationError[] = [];

    // Check if XML is empty
    if (!xmlContent.trim()) {
      errors.push({
        level: 'error',
        message: 'XML content is empty'
      });
      return { isValid: false, errors };
    }

    // Parse XML
    let xmlDoc: Document;
    try {
      const parser = new DOMParser();
      xmlDoc = parser.parseFromString(xmlContent, 'application/xml');
      
      if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
        errors.push({
          level: 'error',
          message: 'Invalid XML: ' + xmlDoc.documentElement.textContent
        });
        return { isValid: false, errors };
      }
    } catch (e) {
      errors.push({
        level: 'error',
        message: 'XML parsing error: ' + (e as Error).message
      });
      return { isValid: false, errors };
    }

    // Validate PACS.008 structure
    const errors_structural = this.validateStructure(xmlDoc);
    errors.push(...errors_structural);

    // Extract message ID if present
    const messageId = this.extractMessageId(xmlDoc);

    return {
      isValid: errors.filter(e => e.level === 'error').length === 0,
      errors,
      messageId
    };
  }

  private validateStructure(xmlDoc: Document): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check for root element (should be Document or FIToFICstmrCdtTrfInitn)
    const root = xmlDoc.documentElement;
    if (!root) {
      errors.push({
        level: 'error',
        message: 'No root element found'
      });
      return errors;
    }

    // Check if it's a PACS.008 message
    const isFIToFI = root.tagName.includes('FIToFICstmrCdtTrfInitn');
    const isDocument = root.tagName === 'Document';

    if (!isFIToFI && !isDocument) {
      errors.push({
        level: 'warning',
        message: `Expected PACS.008 structure, found: ${root.tagName}`
      });
    }

    // Validate required elements
    const requiredElements = ['GrpHdr', 'PmtInf'];
    requiredElements.forEach(elem => {
      if (!xmlDoc.getElementsByTagName(elem).length) {
        errors.push({
          level: 'error',
          message: `Required element missing: ${elem}`,
          element: elem
        });
      }
    });

    return errors;
  }

  private extractMessageId(xmlDoc: Document): string | undefined {
    // Look for MsgId in GrpHdr
    const msgIdElement = xmlDoc.getElementsByTagName('MsgId')[0];
    return msgIdElement?.textContent || undefined;
  }
}