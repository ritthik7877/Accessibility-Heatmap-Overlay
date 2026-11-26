const severityWeights = {
  critical: 15,
  serious: 8,
  minor: 3,
};

export function calculateScore(issues) {
  const deductions = issues.reduce((total, item) => total + (severityWeights[item.severity] || 0), 0);
  return Math.max(0, Math.min(100, 100 - deductions));
}
