import { issue } from './shared.js';

export function checkHeadings(root = document) {
  const headings = [...root.querySelectorAll('h1, h2, h3, h4, h5, h6')]
    .filter((heading) => heading.getClientRects().length > 0);
  const issues = [];
  const h1s = headings.filter((heading) => heading.localName === 'h1');

  if (h1s.length > 1) {
    h1s.slice(1).forEach((heading) => issues.push(issue(
      heading,
      'heading-hierarchy',
      'minor',
      'Page has more than one level-one heading.',
      'Use one h1 for the page’s main heading and organize sections with h2–h6.',
    )));
  }

  let previousLevel = 0;
  for (const heading of headings) {
    const level = Number(heading.localName.slice(1));
    if (previousLevel && level > previousLevel + 1) {
      issues.push(issue(
        heading,
        'heading-hierarchy',
        'minor',
        `Heading level skipped from h${previousLevel} to h${level}.`,
        `Use h${previousLevel + 1} here, or add the missing heading level.`,
      ));
    }
    previousLevel = level;
  }

  return issues;
}
