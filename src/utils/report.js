export function createReport(issues, score, pageUrl, pageTitle) {
  return {
    generatedAt: new Date().toISOString(),
    page: { url: pageUrl, title: pageTitle },
    score,
    issueCount: issues.length,
    issues: issues.map(({ type, severity, message, fix, selector }) => ({
      type, severity, message, fix, selector,
    })),
  };
}

export function printableReportHtml(report) {
  const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
  const rows = report.issues.map((item) => `
    <article class="issue ${escape(item.severity)}">
      <h2>${escape(item.message)}</h2>
      <p><strong>Type:</strong> ${escape(item.type)} · <strong>Severity:</strong> ${escape(item.severity)}</p>
      <p>${escape(item.fix)}</p><code>${escape(item.selector)}</code>
    </article>`).join('');
  return `<!doctype html><html lang="en"><meta charset="utf-8"><title>Accessibility report</title>
  <style>body{font:16px/1.5 system-ui,sans-serif;max-width:900px;margin:40px auto;padding:0 20px;color:#172033}
  .issue{padding:14px 18px;margin:14px 0;border-left:5px solid #e4b400;background:#f7f8fb}
  .critical{border-color:#e53935}.serious{border-color:#f28c28}code{overflow-wrap:anywhere}
  @media print{body{margin:0 auto}}</style><body><h1>Accessibility report</h1>
  <p>${escape(report.page.title)} — <a href="${escape(report.page.url)}">${escape(report.page.url)}</a></p>
  <p><strong>Score:</strong> ${report.score}/100 · <strong>Issues:</strong> ${report.issueCount}</p>
  <p>Generated ${escape(report.generatedAt)}</p>${rows}<script>window.print()</script></body></html>`;
}
