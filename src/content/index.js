import { checkContrast } from '../checks/contrast.js';
import { checkImages } from '../checks/images.js';
import { checkForms } from '../checks/forms.js';
import { checkNames } from '../checks/names.js';
import { checkHeadings } from '../checks/headings.js';
import { checkTargets } from '../checks/targets.js';
import { checkFocus } from '../checks/focus.js';
import { checkLanguage } from '../checks/language.js';
import { getElementSelector } from '../utils/selector.js';
import { renderOverlay } from './overlay.js';

if (!globalThis.__accessibilityHeatmapLoaded) {
  globalThis.__accessibilityHeatmapLoaded = true;
  let overlay = null;
  let observer = null;
  let scanTimer = null;
  let latestIssues = [];
  let options = { visible: true, filterTypes: [], tabOrder: false };

  function serializeIssues() {
    return latestIssues.map((item, index) => ({
      index,
      type: item.type,
      severity: item.severity,
      message: item.message,
      fix: item.fix,
      selector: getElementSelector(item.element),
    }));
  }

  function scan(notify = false) {
    latestIssues = [
      ...checkContrast(),
      ...checkImages(),
      ...checkForms(),
      ...checkNames(),
      ...checkHeadings(),
      ...checkTargets(),
      ...checkFocus(),
      ...checkLanguage(),
    ];
    overlay?.remove();
    overlay = renderOverlay(latestIssues, options);
    observer?.disconnect();
    observer = new MutationObserver((records) => {
      const pageChanged = records.some((record) => {
        const nodes = [...record.addedNodes, ...record.removedNodes];
        return record.type === 'attributes'
          || nodes.some((node) => !(node.nodeType === Node.ELEMENT_NODE && node.id === '__accessibility_heatmap_overlay__'));
      });
      if (!pageChanged) return;
      clearTimeout(scanTimer);
      scanTimer = setTimeout(() => scan(true), 300);
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden', 'alt', 'aria-label', 'aria-labelledby', 'tabindex', 'lang'],
    });

    const issues = serializeIssues();
    if (notify) {
      chrome.runtime.sendMessage({ type: 'SCAN_UPDATED', issues })
        .catch((error) => console.warn('Could not send updated scan results to the extension popup.', error));
    }
    return issues;
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === 'SCAN') {
      const issues = scan();
      sendResponse({ ok: true, issues, page: { url: location.href, title: document.title } });
      return false;
    }
    if (message?.type === 'GET_STATE') {
      sendResponse({
        ok: true,
        scanned: Boolean(observer),
        issues: serializeIssues(),
        options,
        page: { url: location.href, title: document.title },
      });
      return false;
    }
    if (message?.type === 'SET_OPTIONS') {
      options = { ...options, ...message.options };
      overlay?.setOptions(options);
      sendResponse({ ok: true, options });
      return false;
    }
    if (message?.type === 'FOCUS_ISSUE') {
      const focused = overlay?.focusIssue(message.index) || false;
      if (focused) options = { ...options, visible: true };
      sendResponse({ ok: true, focused });
      return false;
    }
    return false;
  });
}
