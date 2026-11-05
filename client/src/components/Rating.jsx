export default function Rating({ value = 0, count }) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <span className="rating" aria-label={`Rated ${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= rounded ? 'star on' : n - 0.5 === rounded ? 'star half' : 'star'}>★</span>
      ))}
      {count !== undefined && <span className="muted small"> ({count})</span>}
    </span>
  );
}
