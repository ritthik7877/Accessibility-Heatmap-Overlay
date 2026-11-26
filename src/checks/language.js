import { issue } from './shared.js';

export function checkLanguage(root = document) {
  const html = root.documentElement;
  if (!html || html.getAttribute('lang')?.trim()) return [];
  return [issue(
    html,
    'missing-language',
    'serious',
    'The <html> element is missing a language attribute.',
    'Set the page language, for example <html lang="en">.',
  )];
}
