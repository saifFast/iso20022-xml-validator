import { Injectable } from '@angular/core';
import { XmlStatistics } from '../models/xml-statistics';

export type { XmlStatistics } from '../models/xml-statistics';

@Injectable({
  providedIn: 'root'
})
export class XmlFormatterService {

  formatXml(xmlString: string, indentSize: number = 2): string {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, 'application/xml');
      if (xmlDoc.getElementsByTagName('parsererror').length > 0) throw new Error('Invalid XML');
      return this.serializeNode(xmlDoc.documentElement, 0, indentSize);
    } catch (error) {
      throw new Error('Unable to format XML: ' + (error as Error).message);
    }
  }

  minifyXml(xmlString: string): string {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, 'application/xml');
      if (xmlDoc.getElementsByTagName('parsererror').length > 0) throw new Error('Invalid XML');
      return new XMLSerializer().serializeToString(xmlDoc);
    } catch (error) {
      throw new Error('Unable to minify XML: ' + (error as Error).message);
    }
  }

  getStatistics(xmlString: string): XmlStatistics {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, 'application/xml');
      if (xmlDoc.getElementsByTagName('parsererror').length > 0) throw new Error('Invalid XML');
      return {
        elementCount: xmlDoc.getElementsByTagName('*').length,
        attributeCount: this.countAttributes(xmlDoc.documentElement),
        textNodes: this.countTextNodes(xmlDoc.documentElement),
        depth: this.getDepth(xmlDoc.documentElement),
        size: xmlString.length,
        sizeKB: (xmlString.length / 1024).toFixed(2)
      };
    } catch (error) {
      throw new Error('Unable to calculate statistics: ' + (error as Error).message);
    }
  }

  isValidXml(xmlString: string): boolean {
    try {
      const xmlDoc = new DOMParser().parseFromString(xmlString, 'application/xml');
      return xmlDoc.getElementsByTagName('parsererror').length === 0;
    } catch {
      return false;
    }
  }

  extractTextContent(xmlString: string): string {
    try {
      const xmlDoc = new DOMParser().parseFromString(xmlString, 'application/xml');
      return (xmlDoc.documentElement.textContent || '').trim();
    } catch (error) {
      throw new Error('Unable to extract text: ' + (error as Error).message);
    }
  }

  private serializeNode(node: Element, depth: number, indentSize: number): string {
    const indent = ' '.repeat(depth * indentSize);
    const nextIndent = ' '.repeat((depth + 1) * indentSize);
    let result = indent + '<' + node.tagName;

    for (let i = 0; i < node.attributes.length; i++) {
      const attr = node.attributes[i];
      result += ` ${attr.name}="${this.escapeXml(attr.value)}"`;
    }

    const hasElementChildren = Array.from(node.childNodes).some(c => c.nodeType === Node.ELEMENT_NODE);
    const textContent = this.getDirectTextContent(node).trim();

    if (hasElementChildren) {
      result += '>\n';
      for (let i = 0; i < node.childNodes.length; i++) {
        const child = node.childNodes[i];
        if (child.nodeType === Node.ELEMENT_NODE) {
          result += this.serializeNode(child as Element, depth + 1, indentSize) + '\n';
        }
      }
      result += indent + '</' + node.tagName + '>';
    } else if (textContent) {
      result += '>' + this.escapeXml(textContent) + '</' + node.tagName + '>';
    } else {
      result += ' />';
    }

    return result;
  }

  private getDirectTextContent(node: Element): string {
    let text = '';
    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes[i];
      if (child.nodeType === Node.TEXT_NODE) text += child.textContent || '';
    }
    return text;
  }

  private escapeXml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  }

  private countAttributes(node: Element): number {
    let count = node.attributes.length;
    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes[i];
      if (child.nodeType === Node.ELEMENT_NODE) count += this.countAttributes(child as Element);
    }
    return count;
  }

  private countTextNodes(node: Element): number {
    let count = 0;
    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes[i];
      if (child.nodeType === Node.TEXT_NODE && (child.textContent || '').trim()) count++;
      else if (child.nodeType === Node.ELEMENT_NODE) count += this.countTextNodes(child as Element);
    }
    return count;
  }

  private getDepth(node: Element, currentDepth: number = 0): number {
    let maxDepth = currentDepth;
    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes[i];
      if (child.nodeType === Node.ELEMENT_NODE) {
        maxDepth = Math.max(maxDepth, this.getDepth(child as Element, currentDepth + 1));
      }
    }
    return maxDepth;
  }
}
