import { isVisible, issue } from './shared.js';

export function checkTargets(root = document) {
  return [...root.querySelectorAll('a[href], button, input:not([type="hidden"]), select, textarea, [role="button"], [tabindex]')]
    .filter((element) => {
      if (!isVisible(element)) return false;
      const rect = element.getBoundingClientRect();
      return rect.width < 24 || rect.height < 24;
    })
    .map((element) => {
      const rect = element.getBoundingClientRect();
      return issue(
        element,
        'small-target',
        'minor',
        `Interactive target is ${Math.round(rect.width)}×${Math.round(rect.height)} px; minimum is 24×24 px.`,
        'Increase the target’s clickable area to at least 24 by 24 CSS pixels.',
      );
    });
}
