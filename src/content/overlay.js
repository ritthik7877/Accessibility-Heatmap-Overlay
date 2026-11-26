import { showTooltip } from './tooltip.js';
import { getTabOrder } from './tabOrder.js';

const HOST_ID = '__accessibility_heatmap_overlay__';
const colors = { critical: '#e53935', serious: '#f28c28', minor: '#e4b400' };

export function renderOverlay(issues, options = {}) {
  document.getElementById(HOST_ID)?.remove();
  const host = document.createElement('div');
  host.id = HOST_ID;
  host.setAttribute('aria-hidden', 'true');
  host.style.cssText = 'all:initial;position:fixed;inset:0;z-index:2147483647;pointer-events:none;';
  const shadow = host.attachShadow({ mode: 'closed' });
  const style = document.createElement('style');
  style.textContent = `
    :host { all: initial; }
    .heatmap-box { position: fixed; box-sizing: border-box; border: 2px solid var(--issue-color);
      background: color-mix(in srgb, var(--issue-color) 20%, transparent); pointer-events: none; }
    .heatmap-box.pulse { animation: heatmap-pulse 1.2s ease-out 2; }
    .heatmap-tooltip { position: fixed; z-index: 2; width: min(320px, calc(100vw - 16px)); padding: 12px;
      border: 1px solid #d5d9e2; border-radius: 8px; background: #fff; color: #172033;
      box-shadow: 0 8px 28px #17203333; font: 12px/1.45 system-ui,sans-serif; }
    .heatmap-tooltip strong { display: block; font-size: 13px; }
    .heatmap-tooltip p { margin: 7px 0; }
    .heatmap-tooltip code { display: block; padding: 7px; border-radius: 4px; background: #f0f2f6;
      white-space: pre-wrap; overflow-wrap: anywhere; }
    .tab-line { position: fixed; height: 2px; transform-origin: 0 0; background: #315eea; }
    .tab-badge { position: fixed; display: grid; place-items: center; width: 22px; height: 22px;
      border: 2px solid #fff; border-radius: 50%; background: #315eea; color: #fff;
      box-shadow: 0 1px 5px #0006; font: 700 11px/1 system-ui,sans-serif; }
    @keyframes heatmap-pulse { 50% { outline: 5px solid color-mix(in srgb, var(--issue-color) 30%, transparent); } }
  `;
  const layer = document.createElement('div');
  layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;';
  const tooltipLayer = document.createElement('div');
  const tabLayer = document.createElement('div');
  shadow.append(style, layer, tooltipLayer, tabLayer);
  document.documentElement.append(host);

  const boxes = issues.map((issue, index) => {
    const box = document.createElement('div');
    box.className = 'heatmap-box';
    box.style.setProperty('--issue-color', colors[issue.severity] || colors.minor);
    box.dataset.issueIndex = String(index);
    layer.append(box);
    return { element: issue.element, box, issue, index };
  });

  let visible = options.visible !== false;
  let filterTypes = options.filterTypes || [];
  let tabOrderVisible = Boolean(options.tabOrder);

  function drawTabOrder() {
    tabLayer.replaceChildren();
    if (!tabOrderVisible || !visible) return;
    const order = getTabOrder();
    order.forEach((item, index) => {
      const rect = item.element.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      if (index > 0) {
        const previous = order[index - 1].element.getBoundingClientRect();
        const x1 = previous.left + previous.width / 2;
        const y1 = previous.top + previous.height / 2;
        const dx = x - x1;
        const dy = y - y1;
        const line = document.createElement('div');
        line.className = 'tab-line';
        line.style.left = `${x1}px`;
        line.style.top = `${y1}px`;
        line.style.width = `${Math.hypot(dx, dy)}px`;
        line.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
        tabLayer.append(line);
      }
      const badge = document.createElement('div');
      badge.className = 'tab-badge';
      badge.textContent = String(index + 1);
      badge.style.left = `${x - 11}px`;
      badge.style.top = `${y - 11}px`;
      tabLayer.append(badge);
    });
  }

  function positionBoxes() {
    for (const { element, box, issue } of boxes) {
      const rect = element.isConnected ? element.getBoundingClientRect() : null;
      const isFiltered = filterTypes.length > 0 && !filterTypes.includes(issue.type);
      box.hidden = !visible || isFiltered || !rect || rect.width <= 0 || rect.height <= 0;
      if (rect) {
        box.style.left = `${rect.left}px`;
        box.style.top = `${rect.top}px`;
        box.style.width = `${rect.width}px`;
        box.style.height = `${rect.height}px`;
      }
    }
    drawTabOrder();
  }

  function handlePointerMove(event) {
    if (!visible) return;
    let target = event.target;
    if (!(target instanceof Element)) return;
    while (target && target !== document.documentElement) {
      const found = boxes.find(({ element, issue }) => element === target
        && (filterTypes.length === 0 || filterTypes.includes(issue.type)));
      if (found) {
        showTooltip(tooltipLayer, found.issue, found.element.getBoundingClientRect());
        return;
      }
      target = target.parentElement;
    }
    tooltipLayer.replaceChildren();
  }

  function focusIssue(index) {
    const item = boxes.find((entry) => entry.index === index);
    if (!item || !item.element.isConnected) return false;
    visible = true;
    positionBoxes();
    item.element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    item.box.classList.remove('pulse');
    void item.box.offsetWidth;
    item.box.classList.add('pulse');
    return true;
  }

  document.addEventListener('pointermove', handlePointerMove, true);
  window.addEventListener('resize', positionBoxes, { passive: true });
  window.addEventListener('scroll', positionBoxes, { passive: true, capture: true });
  positionBoxes();

  return {
    update: positionBoxes,
    setOptions(nextOptions) {
      if (typeof nextOptions.visible === 'boolean') visible = nextOptions.visible;
      if (Array.isArray(nextOptions.filterTypes)) filterTypes = nextOptions.filterTypes;
      if (typeof nextOptions.tabOrder === 'boolean') tabOrderVisible = nextOptions.tabOrder;
      positionBoxes();
    },
    focusIssue,
    remove() {
      document.removeEventListener('pointermove', handlePointerMove, true);
      window.removeEventListener('resize', positionBoxes);
      window.removeEventListener('scroll', positionBoxes, true);
      host.remove();
    },
  };
}
