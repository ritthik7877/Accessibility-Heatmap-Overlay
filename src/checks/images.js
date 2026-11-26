import { isVisible, issue } from './shared.js';

export function checkImages(root = document) {
  return [...root.querySelectorAll('img')]
    .filter((image) => isVisible(image) && (!image.hasAttribute('alt') || image.alt.trim() === ''))
    .map((element) => issue(
      element,
      'missing-alt',
      'serious',
      'Image has missing or empty alternative text.',
      'Add concise alt text describing the image, or alt="" when it is purely decorative.',
    ));
}
