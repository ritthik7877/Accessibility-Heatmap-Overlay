import test from 'node:test';
import assert from 'node:assert/strict';
import { contrastRatio, parseColor } from './color.js';
import { calculateScore } from './score.js';
import { createReport, printableReportHtml } from './report.js';

test('parses rgb and rgba channels including percentages', () => {
  assert.deepEqual(parseColor('rgb(0, 0, 0)'), { r: 0, g: 0, b: 0, a: 1 });
  assert.deepEqual(parseColor('rgba(100%, 0%, 50%, 25%)'), { r: 255, g: 0, b: 127.5, a: 0.25 });
  assert.equal(parseColor('transparent'), null);
});

test('computes WCAG relative-luminance contrast ratio', () => {
  assert.equal(contrastRatio(parseColor('rgb(0, 0, 0)'), parseColor('rgb(255, 255, 255)')), 21);
});

test('deducts score by severity without dropping below zero', () => {
  assert.equal(calculateScore([]), 100);
  assert.equal(calculateScore([{ severity: 'critical' }, { severity: 'minor' }]), 82);
  assert.equal(calculateScore(Array(10).fill({ severity: 'critical' })), 0);
});

test('creates a printable report and escapes untrusted page and issue text', () => {
  const report = createReport([{
    type: 'accessible-name',
    severity: 'serious',
    message: '<script>alert(1)</script>',
    fix: 'Add a label',
    selector: 'button',
  }], 92, 'https://example.test/?q="x"', 'Page <name>');
  const html = printableReportHtml(report);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(html, /Page &lt;name&gt;/);
  assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/);
});
