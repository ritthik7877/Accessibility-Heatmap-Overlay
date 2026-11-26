import { isVisible, issue } from './shared.js';

const focusableSelector = [
  'a[href]', 'area[href]', 'button', 'input:not([type="hidden"])', 'select', 'textarea',
  'iframe', 'object', 'embed', 'audio[controls]', 'video[controls]', 'summary',
  '[contenteditable]:not([contenteditable="false"])', '[tabindex]',
].join(',');

function splitSelectors(selectorText) {
  const selectors = [];
  let depth = 0;
  let start = 0;
  for (let index = 0; index < selectorText.length; index += 1) {
    const character = selectorText[index];
    if (character === '(' || character === '[') depth += 1;
    if (character === ')' || character === ']') depth -= 1;
    if (character === ',' && depth === 0) {
      selectors.push(selectorText.slice(start, index).trim());
      start = index + 1;
    }
  }
  selectors.push(selectorText.slice(start).trim());
  return selectors;
}

function collectFocusSelectors() {
  const selectors = [];
  for (const sheet of document.styleSheets) {
    let rules;
    try {
      rules = sheet.cssRules;
    } catch (error) {
      if (error.name === 'SecurityError') continue;
      throw error;
    }
    const visitRules = (ruleList) => {
      for (const rule of ruleList) {
        if (rule.selectorText && /:(?:focus-visible|focus)(?![\w-])/.test(rule.selectorText)) {
          const style = rule.style;
          const outline = style?.getPropertyValue('outline').trim().toLowerCase();
          const outlineStyle = style?.getPropertyValue('outline-style').trim().toLowerCase();
          const outlineWidth = style?.getPropertyValue('outline-width').trim().toLowerCase();
          const outlineColor = style?.getPropertyValue('outline-color').trim().toLowerCase();
          const shadow = style?.getPropertyValue('box-shadow').trim().toLowerCase();
          const hasOutline = (outline && outline !== 'none' && !/^0(?:px)?(?:\s|$)/.test(outline))
            || (outlineStyle && outlineStyle !== 'none' && outlineWidth !== '0px'
              && outlineColor !== 'transparent');
          const shadowLengths = shadow?.match(/-?\d*\.?\d+px/g) || [];
          const hasShadow = shadow && shadow !== 'none' && shadowLengths.some((length) => Number.parseFloat(length) !== 0);
          selectors.push(...splitSelectors(rule.selectorText).map((selector) => ({
            selector,
            visible: Boolean(hasOutline || hasShadow),
          })));
        } else if (rule.cssRules) {
          visitRules(rule.cssRules);
        }
      }
    };
    visitRules(rules);
  }

  return selectors;
}

function hasFocusRule(element, selectors) {
  return selectors.some(({ selector, visible }) => {
    if (!visible) return false;
    const baseSelector = selector
      .replace(/::?[a-z-]+(?:\([^)]*\))?/gi, '')
      .trim();
    if (!baseSelector) return false;
    try {
      return element.matches(baseSelector);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'SyntaxError') return false;
      throw error;
    }
  });
}

function hasVisibleDefaultFocus(element) {
  const style = getComputedStyle(element);
  return style.outlineStyle !== 'none'
    && style.outlineWidth !== '0px'
    && Number.parseFloat(style.outlineWidth) > 0;
}

export function checkFocus(root = document) {
  const issues = [];
  const focusSelectors = collectFocusSelectors();
  for (const element of root.querySelectorAll(focusableSelector)) {
    if (!isVisible(element) || element.matches(':disabled')) continue;
    const tabindex = element.getAttribute('tabindex');
    if (tabindex !== null && Number(tabindex) > 0) {
      issues.push(issue(
        element,
        'positive-tabindex',
        'serious',
        `Positive tabindex="${tabindex}" changes the natural keyboard order.`,
        'Remove the positive tabindex and use DOM order or tabindex="0" instead.',
      ));
    }
    if (!hasVisibleDefaultFocus(element) && !hasFocusRule(element, focusSelectors)) {
      issues.push(issue(
        element,
        'missing-focus-style',
        'serious',
        'Focusable element has no apparent visible focus indicator.',
        'Add a clear :focus-visible outline or other high-contrast focus indicator.',
      ));
    }
  }
  return issues;
}
