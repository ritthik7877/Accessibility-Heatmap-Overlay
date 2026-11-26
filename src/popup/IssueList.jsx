export default function IssueList({ issues, onSelect }) {
  if (issues.length === 0) return <p className="hint">No issues match this filter.</p>;
  return (
    <ul className="issue-list">
      {issues.map((issue) => (
        <li key={`${issue.index}-${issue.type}`}>
          <button className="issue" onClick={() => onSelect(issue)} title="Scroll to this issue">
            <span className={`severity severity-${issue.severity}`} aria-hidden="true" />
            <span className="issue-copy">
              <strong>{issue.message}</strong>
              <span>{issue.type.replaceAll('-', ' ')}</span>
            </span>
            <span className="issue-arrow" aria-hidden="true">›</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
