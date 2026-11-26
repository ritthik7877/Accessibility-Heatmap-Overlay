import { contrastRatio, getEffectiveBackground, parseColor } from '../utils/color.js';
import { isVisible, issue } from './shared.js';

function hasDirectText(element) {
  return [...element.childNodes].some(
    (node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0,
  );
}

export function checkContrast(root = document) {
  const issues = [];

  for (const element of root.querySelectorAll('body, body *')) {
    if (!isVisible(element) || !hasDirectText(element)) continue;

    const style = getComputedStyle(element);
    const foreground = parseColor(style.color);
    if (!foreground || foreground.a === 0) continue;

    const background = getEffectiveBackground(element);
    const renderedForeground = foreground.a < 1
      ? {
          r: foreground.r * foreground.a + background.r * (1 - foreground.a),
          g: foreground.g * foreground.a + background.g * (1 - foreground.a),
          b: foreground.b * foreground.a + background.b * (1 - foreground.a),
          a: 1,
        }
      : foreground;
    const ratio = contrastRatio(renderedForeground, background);
    const fontSize = Number.parseFloat(style.fontSize);
    const isBold = Number.parseInt(style.fontWeight, 10) >= 700;
    const isLargeText = fontSize >= 24 || (fontSize >= 18.66 && isBold);
    const minimumRatio = isLargeText ? 3 : 4.5;

    // WCAG 2.1 SC 1.4.3 requires 4.5:1 for normal text and 3:1 for large text.
    if (ratio < minimumRatio) {
      issues.push(issue(
        element,
        'color-contrast',
        ratio < 2 ? 'critical' : 'serious',
        `Text contrast is ${ratio.toFixed(2)}:1 (minimum ${minimumRatio}:1).`,
        `Choose foreground/background colors with at least ${minimumRatio}:1 contrast.`,
      ));
    }
  }

  return issues;
}
