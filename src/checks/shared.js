export function isVisible(element) {
  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return style.display !== 'none'
    && style.visibility !== 'hidden'
    && Number.parseFloat(style.opacity) !== 0
    && rect.width > 0
    && rect.height > 0;
}

export function hasAccessibleName(element) {
  if (element.getAttribute('aria-label')?.trim()) return true;
  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy && labelledBy.split(/\s+/).some((id) => document.getElementById(id)?.textContent.trim())) {
    return true;
  }
  if (element.getAttribute('title')?.trim()) return true;
  if (element.textContent.trim()) return true;
  return Boolean(element.querySelector('img[alt]:not([alt=""])'));
}

export function issue(element, type, severity, message, fix) {
  return { element, type, severity, message, fix };
}
