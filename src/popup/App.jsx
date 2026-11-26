import { useEffect, useMemo, useState } from 'react';
import { calculateScore } from '../utils/score.js';
import { createReport, printableReportHtml } from '../utils/report.js';
import ScoreGauge from './ScoreGauge.jsx';
import IssueList from './IssueList.jsx';
import FilterBar from './FilterBar.jsx';

async function sendPageCommand(command) {
  const response = await chrome.runtime.sendMessage({ type: 'PAGE_COMMAND', command });
  if (!response?.ok) throw new Error(response?.error || 'The command could not be sent to this page.');
  return response;
}

function downloadText(filename, content, type) {
  const link = document.createElement('a');
  const url = URL.createObjectURL(new Blob([content], { type }));
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function App() {
  const [issues, setIssues] = useState([]);
  const [page, setPage] = useState({ url: '', title: '' });
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [filterTypes, setFilterTypes] = useState([]);
  const [overlayVisible, setOverlayVisible] = useState(true);
  const [tabOrderVisible, setTabOrderVisible] = useState(false);
  const [theme, setTheme] = useState('light');
  const [themeLoaded, setThemeLoaded] = useState(false);
  const score = useMemo(() => calculateScore(issues), [issues]);
  const visibleIssues = useMemo(
    () => issues.filter((issue) => filterTypes.length === 0 || filterTypes.includes(issue.type)),
    [issues, filterTypes],
  );

  useEffect(() => {
    chrome.storage.local.get({ theme: 'light' })
      .then(({ theme: savedTheme }) => setTheme(savedTheme))
      .catch((storageError) => setError(`Could not load the saved theme: ${storageError.message}`))
      .finally(() => setThemeLoaded(true));
    chrome.runtime.sendMessage({ type: 'GET_ACTIVE_STATE' })
      .then((response) => {
        if (response?.ok && response.scanned) {
          setIssues(response.issues);
          setPage(response.page);
          setOverlayVisible(response.options?.visible !== false);
          setTabOrderVisible(Boolean(response.options?.tabOrder));
          setFilterTypes(response.options?.filterTypes || []);
        } else if (response?.ok === false) {
          setError(response.error || 'Could not read the active page state.');
        }
      })
      .catch((stateError) => setError(`Could not read the active page state: ${stateError.message}`));
    const handleUpdate = (message) => {
      if (message?.type === 'SCAN_UPDATED') setIssues(message.issues);
    };
    chrome.runtime.onMessage.addListener(handleUpdate);
    return () => chrome.runtime.onMessage.removeListener(handleUpdate);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    if (themeLoaded) {
      chrome.storage.local.set({ theme })
        .catch((storageError) => setError(`Could not save the selected theme: ${storageError.message}`));
    }
  }, [theme, themeLoaded]);

  async function scanPage() {
    setIsScanning(true);
    setError('');
    try {
      const response = await chrome.runtime.sendMessage({ type: 'SCAN_ACTIVE_TAB' });
      if (!response?.ok) throw new Error(response?.error || 'The page could not be scanned.');
      setIssues(response.issues);
      setPage(response.page || { url: '', title: '' });
    } catch (scanError) {
      setError(scanError.message || 'The page could not be scanned.');
    } finally {
      setIsScanning(false);
    }
  }

  async function changeOptions(next) {
    setError('');
    try {
      await sendPageCommand({ type: 'SET_OPTIONS', options: next });
      if (typeof next.visible === 'boolean') setOverlayVisible(next.visible);
      if (typeof next.tabOrder === 'boolean') setTabOrderVisible(next.tabOrder);
    } catch (commandError) {
      setError(commandError.message);
    }
  }

  async function focusIssue(issue) {
    setError('');
    try {
      const response = await sendPageCommand({ type: 'FOCUS_ISSUE', index: issue.index });
      if (!response.focused) setError('That element is no longer on the page. Scan again to refresh results.');
      else setOverlayVisible(true);
    } catch (commandError) {
      setError(commandError.message);
    }
  }

  function exportReport(format) {
    const report = createReport(issues, score, page.url, page.title);
    const slug = (page.title || 'accessibility-report').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'accessibility-report';
    if (format === 'json') {
      downloadText(`${slug}.json`, JSON.stringify(report, null, 2), 'application/json');
    } else {
      downloadText(`${slug}.html`, printableReportHtml(report), 'text/html');
    }
  }

  return (
    <main className="popup">
      <header className="topbar">
        <div>
          <div className="eyebrow">ACCESSIBILITY CHECK</div>
          <h1>Page heatmap</h1>
        </div>
        <button className="theme-button" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}>
          {theme === 'light' ? '◐' : '☼'}
        </button>
      </header>

      <button className="scan-button" onClick={scanPage} disabled={isScanning}>
        {isScanning ? 'Scanning…' : 'Scan Page'}
      </button>
      {error && <p className="error" role="alert">{error}</p>}

      {issues.length > 0 ? (
        <>
          <ScoreGauge score={score} />
          <div className="result-heading">
            <h2>{issues.length} {issues.length === 1 ? 'issue' : 'issues'} found</h2>
            <span>{visibleIssues.length} shown</span>
          </div>
          <FilterBar selected={filterTypes} onChange={(selected) => {
            setFilterTypes(selected);
            changeOptions({ filterTypes: selected });
          }} />
          <div className="toolbar">
            <button className="small-button" onClick={() => changeOptions({ visible: !overlayVisible })}>
              {overlayVisible ? 'Hide heatmap' : 'Show heatmap'}
            </button>
            <button className={`small-button ${tabOrderVisible ? 'active' : ''}`}
              onClick={() => changeOptions({ tabOrder: !tabOrderVisible })}>
              {tabOrderVisible ? 'Hide tab order' : 'Show tab order'}
            </button>
          </div>
          <IssueList issues={visibleIssues} onSelect={focusIssue} />
          <div className="export-row">
            <button className="text-button" onClick={() => exportReport('json')}>Export JSON</button>
            <button className="text-button" onClick={() => exportReport('html')}>Printable HTML</button>
          </div>
        </>
      ) : (
        !error && <p className="hint">Scan the current page to check its accessibility and show a heatmap.</p>
      )}
    </main>
  );
}
