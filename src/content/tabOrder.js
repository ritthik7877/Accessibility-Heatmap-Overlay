const selector = [
  'a[href]', 'area[href]', 'button', 'input:not([type="hidden"])', 'select', 'textarea',
  'iframe', 'audio[controls]', 'video[controls]', 'summary',
  '[contenteditable]:not([contenteditable="false"])', '[tabindex]',
].join(',');

function isDisplayed(element) {
  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return !element.hasAttribute('disabled')
    && style.display !== 'none'
    && style.visibility !== 'hidden'
    && rect.width > 0
    && rect.height > 0
    && element.tabIndex >= 0;
}

export function getTabOrder(root = document) {
  const items = [...root.querySelectorAll(selector)]
    .filter(isDisplayed)
    .map((element, index) => ({ element, index, tabIndex: element.tabIndex }));
  const positive = items.filter((item) => item.tabIndex > 0)
    .sort((a, b) => a.tabIndex - b.tabIndex || a.index - b.index);
  return [...positive, ...items.filter((item) => item.tabIndex === 0)];
}
