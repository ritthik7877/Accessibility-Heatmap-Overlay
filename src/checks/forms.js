import { isVisible, issue } from './shared.js';

function hasFormLabel(control) {
  const id = control.id;
  const hasLabelElement = id && [...document.querySelectorAll('label[for]')]
    .some((label) => label.htmlFor === id);
  const wrappingLabel = control.closest('label');
  const ariaLabel = control.getAttribute('aria-label')?.trim();
  const labelledBy = control.getAttribute('aria-labelledby')?.trim()
    ?.split(/\s+/)
    .some((labelId) => document.getElementById(labelId)?.textContent.trim());
  return Boolean(hasLabelElement || wrappingLabel || ariaLabel || labelledBy);
}

export function checkForms(root = document) {
  return [...root.querySelectorAll('input:not([type="hidden"]), select, textarea')]
    .filter((element) => isVisible(element) && !hasFormLabel(element))
    .map((element) => issue(
      element,
      'form-label',
      'serious',
      'Form control has no associated label.',
      'Add a <label for="control-id"> or an accessible aria-label.',
    ));
}
