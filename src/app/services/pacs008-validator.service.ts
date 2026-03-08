import { Injectable } from '@angular/core';

export interface ValidationError {
  level: 'error' | 'warning' | 'info';
  message: string;
  element?: string;
  path?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  messageId?: string;
  creationDateTime?: string;
  transactionCount?: number;
  totalAmount?: number;
}

interface GrpHdrData {
  msgId?: string;
  creDtTm?: string;
  nbOfTxns?: number;
  ctrlSum?: number;
}

@Injectable({
  providedIn: 'root'
})
export class Pacs008ValidatorService {
  
  private readonly REQUIRED_ELEMENTS = ['GrpHdr', 'PmtInf'];
  private readonly ISO_CURRENCY_CODES = new Set([
    'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD', 'CNY', 'INR', 'BRL', 'RUB', 'MXN', 'SGD', 'HKD', 'NOK', 'SEK', 'DKK'
  ]);
  private readonly IBAN_PATTERN = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/;
  private readonly BIC_PATTERN = /^[A-Z0-9]{6,9}$/;
  private readonly ISO8601_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;

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
          message: 'XML Parsing Error: Invalid XML syntax',
          element: xmlDoc.documentElement.textContent || 'Unknown'
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

    // Validate structure and get metadata
    const structureErrors = this.validateStructure(xmlDoc);
    errors.push(...structureErrors);

    // Extract and validate GrpHdr
    const grpHdr = xmlDoc.getElementsByTagName('GrpHdr')[0];
    if (grpHdr) {
      const grpHdrErrors = this.validateGrpHdr(grpHdr);
      errors.push(...grpHdrErrors);
    }

    // Validate PmtInf records
    const pmtInfs = xmlDoc.getElementsByTagName('PmtInf');
    if (pmtInfs.length > 0) {
      for (let i = 0; i < pmtInfs.length; i++) {
        const pmtErrors = this.validatePmtInf(pmtInfs[i], i);
        errors.push(...pmtErrors);
      }
    }

    // Validate CdtTrfTxInf records
    const txnErrors = this.validateTransactions(xmlDoc);
    errors.push(...txnErrors);

    // Extract message metadata
    const messageId = this.extractText(xmlDoc, 'MsgId');
    const creationDateTime = this.extractText(xmlDoc, 'CreDtTm');
    const transactionCount = this.extractNumber(xmlDoc, 'NbOfTxns');
    const totalAmount = this.extractNumber(xmlDoc, 'CtrlSum');

    return {
      isValid: errors.filter(e => e.level === 'error').length === 0,
      errors,
      messageId,
      creationDateTime,
      transactionCount,
      totalAmount
    };
  }

  private validateStructure(xmlDoc: Document): ValidationError[] {
    const errors: ValidationError[] = [];
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
        message: `Expected PACS.008 FIToFICstmrCdtTrfInitn, found: ${root.tagName}`,
        element: root.tagName
      });
    }

    // Validate required root elements
    this.REQUIRED_ELEMENTS.forEach(elem => {
      if (!xmlDoc.getElementsByTagName(elem).length) {
        errors.push({
          level: 'error',
          message: `Required element missing: <${elem}>`,
          element: elem
        });
      }
    });

    return errors;
  }

  private validateGrpHdr(grpHdr: Element): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate MsgId (mandatory, max 35 chars)
    const msgId = grpHdr.getElementsByTagName('MsgId')[0]?.textContent;
    if (!msgId) {
      errors.push({
        level: 'error',
        message: 'GrpHdr/MsgId is mandatory',
        element: 'MsgId',
        path: 'GrpHdr/MsgId'
      });
    } else if (msgId.length > 35) {
      errors.push({
        level: 'error',
        message: `MsgId exceeds maximum length of 35 characters (found: ${msgId.length})`,
        element: 'MsgId'
      });
    }

    // Validate CreDtTm (mandatory, ISO8601 format)
    const creDtTm = grpHdr.getElementsByTagName('CreDtTm')[0]?.textContent;
    if (!creDtTm) {
      errors.push({
        level: 'error',
        message: 'GrpHdr/CreDtTm is mandatory',
        element: 'CreDtTm'
      });
    } else if (!this.ISO8601_PATTERN.test(creDtTm)) {
      errors.push({
        level: 'error',
        message: `Invalid date format. Expected ISO8601 (YYYY-MM-DDTHH:MM:SSZ), got: ${creDtTm}`,
        element: 'CreDtTm'
      });
    }

    // Validate NbOfTxns (mandatory, must be positive)
    const nbOfTxns = grpHdr.getElementsByTagName('NbOfTxns')[0]?.textContent;
    if (!nbOfTxns) {
      errors.push({
        level: 'error',
        message: 'GrpHdr/NbOfTxns is mandatory',
        element: 'NbOfTxns'
      });
    } else if (isNaN(Number(nbOfTxns)) || Number(nbOfTxns) <= 0) {
      errors.push({
        level: 'error',
        message: `NbOfTxns must be a positive number, got: ${nbOfTxns}`,
        element: 'NbOfTxns'
      });
    }

    // Validate CtrlSum (mandatory, must be non-negative)
    const ctrlSum = grpHdr.getElementsByTagName('CtrlSum')[0]?.textContent;
    if (!ctrlSum) {
      errors.push({
        level: 'error',
        message: 'GrpHdr/CtrlSum is mandatory',
        element: 'CtrlSum'
      });
    } else if (isNaN(Number(ctrlSum)) || Number(ctrlSum) < 0) {
      errors.push({
        level: 'error',
        message: `CtrlSum must be a non-negative number, got: ${ctrlSum}`,
        element: 'CtrlSum'
      });
    }

    return errors;
  }

  private validatePmtInf(pmtInf: Element, index: number): ValidationError[] {
    const errors: ValidationError[] = [];
    const path = `PmtInf[${index + 1}]`;

    // Validate PmtInfId (mandatory)
    const pmtInfId = pmtInf.getElementsByTagName('PmtInfId')[0]?.textContent;
    if (!pmtInfId) {
      errors.push({
        level: 'error',
        message: `${path}: PmtInfId is mandatory`,
        element: 'PmtInfId',
        path
      });
    }

    // Validate PmtMtd (mandatory)
    const pmtMtd = pmtInf.getElementsByTagName('PmtMtd')[0]?.textContent;
    if (!pmtMtd) {
      errors.push({
        level: 'error',
        message: `${path}: PmtMtd is mandatory`,
        element: 'PmtMtd',
        path
      });
    } else if (!['TRF', 'CH', 'TRA'].includes(pmtMtd)) {
      errors.push({
        level: 'warning',
        message: `${path}: Unusual PmtMtd value: ${pmtMtd}`,
        element: 'PmtMtd',
        path
      });
    }

    // Validate NbOfTxns
    const nbOfTxns = pmtInf.getElementsByTagName('NbOfTxns')[0]?.textContent;
    if (nbOfTxns && (isNaN(Number(nbOfTxns)) || Number(nbOfTxns) < 0)) {
      errors.push({
        level: 'warning',
        message: `${path}: Invalid NbOfTxns: ${nbOfTxns}`,
        element: 'NbOfTxns'
      });
    }

    return errors;
  }

  private validateTransactions(xmlDoc: Document): ValidationError[] {
    const errors: ValidationError[] = [];
    const transactions = xmlDoc.getElementsByTagName('CdtTrfTxInf');

    for (let i = 0; i < transactions.length; i++) {
      const txn = transactions[i];
      const path = `CdtTrfTxInf[${i + 1}]`;

      // Validate EndToEndId
      const endToEndId = txn.getElementsByTagName('EndToEndId')[0]?.textContent;
      if (!endToEndId) {
        errors.push({
          level: 'warning',
          message: `${path}: EndToEndId should be provided`,
          element: 'EndToEndId',
          path
        });
      }

      // Validate Amount and Currency
      const instdAmt = txn.getElementsByTagName('InstdAmt')[0];
      if (instdAmt) {
        const amount = instdAmt.textContent;
        const currency = instdAmt.getAttribute('Ccy');

        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
          errors.push({
            level: 'error',
            message: `${path}: Invalid amount: ${amount}`,
            element: 'InstdAmt',
            path
          });
        }

        if (!currency) {
          errors.push({
            level: 'error',
            message: `${path}: Currency (Ccy) attribute is mandatory`,
            element: 'InstdAmt',
            path
          });
        } else if (!this.ISO_CURRENCY_CODES.has(currency)) {
          errors.push({
            level: 'warning',
            message: `${path}: Non-standard currency code: ${currency}`,
            element: 'InstdAmt',
            path
          });
        }
      }

      // Validate Debtor IBAN
      const dbtrIban = txn.querySelector('DbtrAcct Id IBAN')?.textContent;
      if (dbtrIban && !this.IBAN_PATTERN.test(dbtrIban)) {
        errors.push({
          level: 'error',
          message: `${path}: Invalid Debtor IBAN format: ${dbtrIban}`,
          element: 'IBAN',
          path: `${path}/DbtrAcct/IBAN`
        });
      }

      // Validate Creditor IBAN
      const cdtrIban = txn.querySelector('CdtrAcct Id IBAN')?.textContent;
      if (cdtrIban && !this.IBAN_PATTERN.test(cdtrIban)) {
        errors.push({
          level: 'error',
          message: `${path}: Invalid Creditor IBAN format: ${cdtrIban}`,
          element: 'IBAN',
          path: `${path}/CdtrAcct/IBAN`
        });
      }

      // Validate BIC codes
      const dbtrBic = txn.querySelector('DbtrAgt FinInstnId BICOrBEI')?.textContent;
      if (dbtrBic && !this.BIC_PATTERN.test(dbtrBic)) {
        errors.push({
          level: 'warning',
          message: `${path}: Invalid Debtor BIC format: ${dbtrBic}`,
          element: 'BICOrBEI'
        });
      }

      const cdtrBic = txn.querySelector('CdtrAgt FinInstnId BICOrBEI')?.textContent;
      if (cdtrBic && !this.BIC_PATTERN.test(cdtrBic)) {
        errors.push({
          level: 'warning',
          message: `${path}: Invalid Creditor BIC format: ${cdtrBic}`,
          element: 'BICOrBEI'
        });
      }
    }

    return errors;
  }

  private extractText(xmlDoc: Document, tagName: string): string | undefined {
    return xmlDoc.getElementsByTagName(tagName)[0]?.textContent || undefined;
  }

  private extractNumber(xmlDoc: Document, tagName: string): number | undefined {
    const value = this.extractText(xmlDoc, tagName);
    return value ? Number(value) : undefined;
  }
}