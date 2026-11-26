const explanations = {
  'color-contrast': 'Low contrast makes text difficult to read for people with low vision or in bright conditions.',
  'missing-alt': 'Alternative text gives screen-reader users the image’s meaning and is shown when images cannot load.',
  'form-label': 'Labels let assistive technology identify what information a form control requires.',
  'accessible-name': 'An accessible name tells screen-reader users what a button does or where a link goes.',
  'heading-hierarchy': 'A logical heading outline helps people navigate and understand page sections.',
  'small-target': 'Small targets are difficult to activate for people with motor or touch limitations.',
  'missing-language': 'The document language helps assistive technology pronounce content correctly.',
  'positive-tabindex': 'Positive tabindex values create a confusing keyboard order that differs from the page structure.',
  'missing-focus-style': 'A visible focus indicator shows keyboard users which control is currently active.',
};

function snippetFor(issue) {
  switch (issue.type) {
    case 'missing-alt': return '<img src="photo.jpg" alt="Describe the image">';
    case 'form-label': return '<label for="email">Email</label><input id="email">';
    case 'accessible-name': return '<button aria-label="Close dialog">×</button>';
    case 'missing-language': return '<html lang="en">';
    case 'positive-tabindex': return '<button>Continue</button> <!-- remove positive tabindex -->';
    case 'missing-focus-style': return ':focus-visible { outline: 3px solid #155eef; }';
    case 'small-target': return 'button { min-width: 24px; min-height: 24px; }';
    case 'heading-hierarchy': return '<h2>Section heading</h2>';
    default: return 'color: #1a1a1a;\nbackground-color: #fff;';
  }
}

export function showTooltip(container, issue, rect) {
  container.replaceChildren();
  const tooltip = document.createElement('div');
  tooltip.className = 'heatmap-tooltip';
  const title = document.createElement('strong');
  title.textContent = issue.message;
  const why = document.createElement('p');
  why.textContent = explanations[issue.type] || 'This issue can make page content harder to access.';
  const fix = document.createElement('p');
  fix.textContent = `Suggested fix: ${issue.fix}`;
  const code = document.createElement('code');
  code.textContent = snippetFor(issue);
  tooltip.append(title, why, fix, code);
  tooltip.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - 340))}px`;
  tooltip.style.top = `${Math.max(8, Math.min(rect.bottom + 8, window.innerHeight - 190))}px`;
  container.append(tooltip);
}
