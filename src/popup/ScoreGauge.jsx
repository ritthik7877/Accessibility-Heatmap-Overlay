export default function ScoreGauge({ score }) {
  return (
    <div className="score-card" aria-label={`Accessibility score ${score} out of 100`}>
      <div className="score-ring" style={{ '--score': `${score * 3.6}deg` }}>
        <div className="score-center">
          <strong>{score}</strong>
          <span>/ 100</span>
        </div>
      </div>
      <div>
        <strong>Accessibility score</strong>
        <p>{score >= 90 ? 'Looking good' : score >= 70 ? 'Some improvements needed' : 'Needs attention'}</p>
      </div>
    </div>
  );
}
