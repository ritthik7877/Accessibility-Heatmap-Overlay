export function getElementSelector(element) {
  const parts = [];
  let current = element;

  while (current && current.nodeType === Node.ELEMENT_NODE && current !== document.documentElement) {
    let part = current.localName;
    if (current.id) {
      part += `#${CSS.escape(current.id)}`;
      parts.unshift(part);
      break;
    }

    const parent = current.parentElement;
    if (parent) {
      const sameTagSiblings = [...parent.children].filter((child) => child.localName === current.localName);
      if (sameTagSiblings.length > 1) {
        part += `:nth-of-type(${sameTagSiblings.indexOf(current) + 1})`;
      }
    }
    parts.unshift(part);
    current = parent;
  }

  return parts.join(' > ');
}
