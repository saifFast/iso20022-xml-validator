import { Injectable } from '@angular/core';
import { ValidationError } from './ValidationError';
import { ValidationResult } from './ValidationResult';

@Injectable({
  providedIn: 'root'
})
export class Pacs008ValidatorService {
  private readonly REQUIRED_ELEMENTS = ['GrpHdr', 'PmtInf'];
  private readonly ISO_CURRENCY_CODES = new Set([
    'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD', 'CNY', 'INR', 'BRL', 'RUB', 'MXN', 'SGD', 'HKD', 'NOK', 'SEK', 'DKK'
  ]);
  private readonly IBAN_PATTERN = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/;
  private readonly BIC_PATTERN = /^[A-Z0-9]{8}([A-Z0-9]{3})?$/;
  private readonly ISO8601_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;
  private readonly CURRENCY_CODE_PATTERN = /^[A-Z]{3}$/;
  private readonly MAX_XML_SIZE_BYTES = 5 * 1024 * 1024; // align with upload limit
  private readonly MAX_XML_DEPTH = 50;

  validate(xmlContent: string): ValidationResult {
    const errors: ValidationError[] = [];

    if (!xmlContent.trim()) {
      this.addError(errors, 'error', 'XML content is empty');
      return { isValid: false, errors };
    }

    if (xmlContent.length > this.MAX_XML_SIZE_BYTES) {
      this.addError(errors, 'error', 'XML size exceeds allowed limit of 5MB');
      return { isValid: false, errors };
    }

    let xmlDoc: Document;
    try {
      const parser = new DOMParser();
      xmlDoc = parser.parseFromString(xmlContent, 'application/xml');

      if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
        this.addError(errors, 'error', 'XML Parsing Error: Invalid XML syntax', xmlDoc.documentElement.textContent || 'Unknown');
        return { isValid: false, errors };
      }
    } catch (e) {
      this.addError(errors, 'error', 'XML parsing error: ' + (e as Error).message);
      return { isValid: false, errors };
    }

    const root = xmlDoc.documentElement;
    if (this.getDepth(root) > this.MAX_XML_DEPTH) {
      this.addError(errors, 'error', `XML nesting depth exceeds safe limit (${this.MAX_XML_DEPTH})`);
      return { isValid: false, errors };
    }

    const structureErrors = this.validateStructure(xmlDoc);
    errors.push(...structureErrors);

    const grpHdr = this.getFirstElement(xmlDoc, 'GrpHdr');
    if (grpHdr) {
      errors.push(...this.validateGrpHdr(grpHdr));
    }

    const pmtInfs = this.getElements(xmlDoc, 'PmtInf');
    pmtInfs.forEach((pmtInf, idx) => errors.push(...this.validatePmtInf(pmtInf, idx)));

    const txnResult = this.validateTransactions(xmlDoc);
    errors.push(...txnResult.errors);

    const messageId = this.extractText(xmlDoc, 'MsgId');
    const creationDateTime = this.extractText(xmlDoc, 'CreDtTm');
    const transactionCount = this.extractNumber(xmlDoc, 'NbOfTxns');
    const totalAmount = this.extractNumber(xmlDoc, 'CtrlSum');

    if (transactionCount !== undefined && transactionCount !== txnResult.transactionCount) {
      this.addError(
        errors,
        'warning',
        `NbOfTxns declares ${transactionCount} but ${txnResult.transactionCount} transaction(s) found`,
        'NbOfTxns',
        'GrpHdr/NbOfTxns'
      );
    }

    if (totalAmount !== undefined && txnResult.totalAmount !== undefined) {
      const amountsMatch = Math.abs(totalAmount - txnResult.totalAmount) < 0.01;
      if (!amountsMatch) {
        this.addError(
          errors,
          'warning',
          `CtrlSum declares ${totalAmount} but transaction sum is ${txnResult.totalAmount}`,
          'CtrlSum',
          'GrpHdr/CtrlSum'
        );
      }
    }

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
      this.addError(errors, 'error', 'No root element found');
      return errors;
    }

    const isFIToFI = root.tagName.includes('FIToFICstmrCdtTrfInitn');
    const isDocument = root.tagName === 'Document';

    if (!isFIToFI && !isDocument) {
      this.addError(errors, 'warning', `Expected PACS.008 FIToFICstmrCdtTrfInitn, found: ${root.tagName}`, root.tagName);
    }

    this.REQUIRED_ELEMENTS.forEach(elem => {
      if (!this.getElements(xmlDoc, elem).length) {
        this.addError(errors, 'error', `Required element missing: <${elem}>`, elem);
      }
    });

    return errors;
  }

  private validateGrpHdr(grpHdr: Element): ValidationError[] {
    const errors: ValidationError[] = [];

    const msgId = this.extractText(grpHdr, 'MsgId');
    if (!msgId) {
      this.addError(errors, 'error', 'GrpHdr/MsgId is mandatory', 'MsgId', 'GrpHdr/MsgId');
    } else if (msgId.length > 35) {
      this.addError(errors, 'error', `MsgId exceeds maximum length of 35 characters (found: ${msgId.length})`, 'MsgId', 'GrpHdr/MsgId');
    }

    const creDtTm = this.extractText(grpHdr, 'CreDtTm');
    if (!creDtTm) {
      this.addError(errors, 'error', 'GrpHdr/CreDtTm is mandatory', 'CreDtTm', 'GrpHdr/CreDtTm');
    } else if (!this.ISO8601_PATTERN.test(creDtTm) || isNaN(Date.parse(creDtTm))) {
      this.addError(errors, 'error', `Invalid date format. Expected ISO8601 with timezone, got: ${creDtTm}`, 'CreDtTm', 'GrpHdr/CreDtTm');
    }

    const nbOfTxns = this.extractText(grpHdr, 'NbOfTxns');
    if (!nbOfTxns) {
      this.addError(errors, 'error', 'GrpHdr/NbOfTxns is mandatory', 'NbOfTxns', 'GrpHdr/NbOfTxns');
    } else if (isNaN(Number(nbOfTxns)) || Number(nbOfTxns) <= 0) {
      this.addError(errors, 'error', `NbOfTxns must be a positive number, got: ${nbOfTxns}`, 'NbOfTxns', 'GrpHdr/NbOfTxns');
    }

    const ctrlSum = this.extractText(grpHdr, 'CtrlSum');
    if (!ctrlSum) {
      this.addError(errors, 'error', 'GrpHdr/CtrlSum is mandatory', 'CtrlSum', 'GrpHdr/CtrlSum');
    } else if (isNaN(Number(ctrlSum)) || Number(ctrlSum) < 0) {
      this.addError(errors, 'error', `CtrlSum must be a non-negative number, got: ${ctrlSum}`, 'CtrlSum', 'GrpHdr/CtrlSum');
    }

    return errors;
  }

  private validatePmtInf(pmtInf: Element, index: number): ValidationError[] {
    const errors: ValidationError[] = [];
    const path = `PmtInf[${index + 1}]`;

    const pmtInfId = this.extractText(pmtInf, 'PmtInfId');
    if (!pmtInfId) {
      this.addError(errors, 'error', `${path}: PmtInfId is mandatory`, 'PmtInfId', path);
    }

    const pmtMtd = this.extractText(pmtInf, 'PmtMtd');
    if (!pmtMtd) {
      this.addError(errors, 'error', `${path}: PmtMtd is mandatory`, 'PmtMtd', path);
    } else if (!['TRF', 'CH', 'TRA'].includes(pmtMtd)) {
      this.addError(errors, 'warning', `${path}: Unusual PmtMtd value: ${pmtMtd}`, 'PmtMtd', path);
    }

    const nbOfTxns = this.extractText(pmtInf, 'NbOfTxns');
    if (nbOfTxns && (isNaN(Number(nbOfTxns)) || Number(nbOfTxns) < 0)) {
      this.addError(errors, 'warning', `${path}: Invalid NbOfTxns: ${nbOfTxns}`, 'NbOfTxns', path);
    }

    return errors;
  }

  private validateTransactions(xmlDoc: Document): { errors: ValidationError[]; totalAmount?: number; transactionCount: number } {
    const errors: ValidationError[] = [];
    const transactions = this.getElements(xmlDoc, 'CdtTrfTxInf');
    let totalAmount = 0;

    for (let i = 0; i < transactions.length; i++) {
      const txn = transactions[i];
      const path = `CdtTrfTxInf[${i + 1}]`;

      const endToEndId = this.extractText(txn, 'EndToEndId');
      if (!endToEndId) {
        this.addError(errors, 'warning', `${path}: EndToEndId should be provided`, 'EndToEndId', path);
      }

      const instdAmt = this.getFirstElement(txn, 'InstdAmt');
      if (instdAmt) {
        const amount = instdAmt.textContent;
        const currency = instdAmt.getAttribute('Ccy');

        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
          this.addError(errors, 'error', `${path}: Invalid amount: ${amount}`, 'InstdAmt', path);
        } else {
          totalAmount += Number(amount);
        }

        if (!currency) {
          this.addError(errors, 'error', `${path}: Currency (Ccy) attribute is mandatory`, 'InstdAmt', path);
        } else if (!this.CURRENCY_CODE_PATTERN.test(currency)) {
          this.addError(errors, 'error', `${path}: Invalid currency code format: ${currency}`, 'InstdAmt', path);
        } else if (!this.ISO_CURRENCY_CODES.has(currency)) {
          this.addError(errors, 'warning', `${path}: Non-standard currency code: ${currency}`, 'InstdAmt', path);
        }
      }

      const dbtrIban = this.getNestedText(txn, ['DbtrAcct', 'Id', 'IBAN']);
      if (dbtrIban) {
        const ibanIssue = this.validateIban(dbtrIban);
        if (ibanIssue === 'format') {
          this.addError(errors, 'error', `${path}: Invalid Debtor IBAN format: ${dbtrIban}`, 'IBAN', `${path}/DbtrAcct/IBAN`);
        } else if (ibanIssue === 'checksum') {
          this.addError(errors, 'warning', `${path}: Debtor IBAN checksum failed: ${dbtrIban}`, 'IBAN', `${path}/DbtrAcct/IBAN`);
        }
      }

      const cdtrIban = this.getNestedText(txn, ['CdtrAcct', 'Id', 'IBAN']);
      if (cdtrIban) {
        const ibanIssue = this.validateIban(cdtrIban);
        if (ibanIssue === 'format') {
          this.addError(errors, 'error', `${path}: Invalid Creditor IBAN format: ${cdtrIban}`, 'IBAN', `${path}/CdtrAcct/IBAN`);
        } else if (ibanIssue === 'checksum') {
          this.addError(errors, 'warning', `${path}: Creditor IBAN checksum failed: ${cdtrIban}`, 'IBAN', `${path}/CdtrAcct/IBAN`);
        }
      }

      const dbtrBic = this.getNestedText(txn, ['DbtrAgt', 'FinInstnId', 'BICOrBEI']);
      if (dbtrBic && !this.BIC_PATTERN.test(dbtrBic)) {
        this.addError(errors, 'warning', `${path}: Invalid Debtor BIC format: ${dbtrBic}`, 'BICOrBEI', `${path}/DbtrAgt/FinInstnId/BICOrBEI`);
      }

      const cdtrBic = this.getNestedText(txn, ['CdtrAgt', 'FinInstnId', 'BICOrBEI']);
      if (cdtrBic && !this.BIC_PATTERN.test(cdtrBic)) {
        this.addError(errors, 'warning', `${path}: Invalid Creditor BIC format: ${cdtrBic}`, 'BICOrBEI', `${path}/CdtrAgt/FinInstnId/BICOrBEI`);
      }
    }

    return { errors, totalAmount: transactions.length ? totalAmount : undefined, transactionCount: transactions.length };
  }

  private extractText(node: Document | Element, tagName: string): string | undefined {
    return this.getFirstElement(node, tagName)?.textContent?.trim() || undefined;
  }

  private extractNumber(node: Document | Element, tagName: string): number | undefined {
    const value = this.extractText(node, tagName);
    return value !== undefined && value !== null ? Number(value) : undefined;
  }

  private addError(
    list: ValidationError[],
    level: 'error' | 'warning' | 'info',
    message: string,
    element?: string,
    path?: string
  ): void {
    list.push({ level, message, element, path });
  }

  private getElements(node: Document | Element, localName: string): Element[] {
    const list = (node as any).getElementsByTagNameNS
      ? (node as any).getElementsByTagNameNS('*', localName)
      : (node as any).getElementsByTagName(localName);
    return Array.from(list as NodeListOf<Element>);
  }

  private getFirstElement(node: Document | Element, localName: string): Element | undefined {
    return this.getElements(node, localName)[0];
  }

  private getNestedText(node: Document | Element, path: string[]): string | undefined {
    let current: Document | Element | undefined = node;
    for (const segment of path) {
      current = current ? this.getFirstElement(current, segment) : undefined;
      if (!current) return undefined;
    }
    return (current as Element).textContent?.trim() || undefined;
  }

  private validateIban(iban: string): 'ok' | 'format' | 'checksum' {
    const normalized = iban.replace(/\s+/g, '').toUpperCase();
    if (!this.IBAN_PATTERN.test(normalized)) return 'format';

    const rearranged = normalized.slice(4) + normalized.slice(0, 4);
    const expanded = rearranged.replace(/[A-Z]/g, (c) => (c.charCodeAt(0) - 55).toString());

    let remainder = 0n;
    for (let i = 0; i < expanded.length; i += 9) {
      const block = `${remainder}${expanded.slice(i, i + 9)}`;
      remainder = BigInt(block) % 97n;
    }

    return remainder === 1n ? 'ok' : 'checksum';
  }

  private getDepth(node: Element, currentDepth: number = 1): number {
    let maxDepth = currentDepth;
    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes[i];
      if (child.nodeType === Node.ELEMENT_NODE) {
        const childDepth = this.getDepth(child as Element, currentDepth + 1);
        maxDepth = Math.max(maxDepth, childDepth);
      }
    }
    return maxDepth;
  }
}
