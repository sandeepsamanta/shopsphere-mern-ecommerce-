export const Spinner = ({ label = 'Loading…' }) => (
  <div className="center-box" role="status">
    <div className="spinner" />
    <span className="muted">{label}</span>
  </div>
);

export const ErrorBox = ({ error, onRetry }) => (
  <div className="alert alert-error" role="alert">
    <span>{error?.message || 'Something went wrong.'}</span>
    {onRetry && <button className="btn btn-outline btn-sm" onClick={onRetry}>Retry</button>}
  </div>
);

export const Empty = ({ title, children }) => (
  <div className="center-box empty">
    <h3>{title}</h3>
    {children}
  </div>
);

export const StatusBadge = ({ status }) => <span className={`status status-${status}`}>{status}</span>;
