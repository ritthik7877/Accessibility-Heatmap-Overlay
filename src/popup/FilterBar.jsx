const types = [
  ['color-contrast', 'Color contrast'],
  ['missing-alt', 'Image alt text'],
  ['form-label', 'Form labels'],
  ['accessible-name', 'Accessible names'],
  ['heading-hierarchy', 'Heading structure'],
  ['small-target', 'Target size'],
  ['missing-language', 'Page language'],
  ['positive-tabindex', 'Positive tabindex'],
  ['missing-focus-style', 'Focus indicator'],
];

export default function FilterBar({ selected, onChange }) {
  function toggle(type) {
    onChange(selected.includes(type) ? selected.filter((item) => item !== type) : [...selected, type]);
  }

  return (
    <details className="filters">
      <summary>Filter issues{selected.length ? ` (${selected.length})` : ''}</summary>
      <div className="filter-options">
        {types.map(([value, label]) => (
          <label key={value}>
            <input type="checkbox" checked={selected.includes(value)} onChange={() => toggle(value)} />
            {label}
          </label>
        ))}
        {selected.length > 0 && <button className="text-button" onClick={() => onChange([])}>Clear filters</button>}
      </div>
    </details>
  );
}
