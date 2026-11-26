import { hasAccessibleName, isVisible, issue } from './shared.js';

export function checkNames(root = document) {
  return [...root.querySelectorAll('button, a[href], [role="button"], [role="link"]')]
    .filter((element) => isVisible(element) && !hasAccessibleName(element))
    .map((element) => issue(
      element,
      'accessible-name',
      'serious',
      `${element.localName === 'a' ? 'Link' : 'Button'} has no accessible name.`,
      'Add visible text or an aria-label that describes the action or destination.',
    ));
}
