export function getElements(node: Document | Element, localName: string): Element[] {
  const list = (node as any).getElementsByTagNameNS
    ? (node as any).getElementsByTagNameNS('*', localName)
    : (node as any).getElementsByTagName(localName);
  return Array.from(list as NodeListOf<Element>);
}

export function getFirstElement(node: Document | Element, localName: string): Element | undefined {
  return getElements(node, localName)[0];
}
