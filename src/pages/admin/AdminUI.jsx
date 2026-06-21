export const PageHeader = ({ eyebrow, title, description, actions }) => (
  <header className="admin-page-header">
    <div>
      {eyebrow && <p className="admin-eyebrow">{eyebrow}</p>}
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </div>
    {actions && <div className="admin-actions">{actions}</div>}
  </header>
);

export const Card = ({ children, className = '', pad = true, title, description, tone = '' }) => (
  <section className={`admin-card ${pad ? 'pad' : ''} ${tone ? `tone-${tone}` : ''} ${className}`.trim()}>
    {(title || description) && (
      <div className="admin-card-header">
        {title && <h2>{title}</h2>}
        {description && <p>{description}</p>}
      </div>
    )}
    {children}
  </section>
);

export const StatCard = ({ label, value, subtext, hint, tone = '' }) => (
  <Card className={`admin-stat ${tone}`.trim()}>
    <p className="admin-stat-label">{label}</p>
    <p className="admin-stat-value">{value}</p>
    {(subtext || hint) && <div className="admin-stat-subtext">{subtext || hint}</div>}
  </Card>
);

export const Button = ({ children, variant = '', className = '', ...props }) => (
  <button className={`admin-btn ${variant} ${className}`.trim()} {...props}>
    {children}
  </button>
);

export const LinkButton = ({ children, variant = '', className = '', ...props }) => (
  <a className={`admin-btn ${variant} ${className}`.trim()} {...props}>
    {children}
  </a>
);

export const Badge = ({ children, tone = '' }) => (
  <span className={`admin-badge ${tone}`.trim()}>{children}</span>
);

export const ToggleRow = ({ label, description, checked, onChange, loading }) => (
  <div className="admin-toggle-row">
    <div>
      <div className="admin-toggle-title">{label}</div>
      {description && <div className="admin-toggle-desc">{description}</div>}
    </div>
    <div className="admin-actions">
      {loading && <Badge tone="accent">Saving</Badge>}
      <button
        type="button"
        className={`admin-switch ${checked ? 'is-on' : ''}`}
        aria-pressed={Boolean(checked)}
        aria-label={label}
        onClick={onChange}
        disabled={loading}
      />
    </div>
  </div>
);

export const LoadingState = ({ label = 'Loading...' }) => (
  <Card>
    <div className="admin-loading">{label}</div>
  </Card>
);

export const EmptyState = ({ title = 'Nothing here yet', description }) => (
  <Card>
    <div className="admin-empty">
      <strong>{title}</strong>
      {description && <div style={{ marginTop: '0.35rem' }}>{description}</div>}
    </div>
  </Card>
);

export const TableCard = ({ children, title, description, actions }) => (
  <Card pad={false}>
    {(title || description || actions) && (
      <div className="admin-table-card-header">
        <div>
          {title && <h2>{title}</h2>}
          {description && <p>{description}</p>}
        </div>
        {actions && <div className="admin-actions">{actions}</div>}
      </div>
    )}
    <div className="admin-table-wrap">{children}</div>
  </Card>
);

export const Pagination = ({ page, pageSize, total, onPageChange, loading }) => {
  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize));
  const canPrev = page > 0 && !loading;
  const canNext = page + 1 < totalPages && !loading;

  return (
    <div className="admin-pagination">
      <div className="admin-row-muted">
        Page {page + 1} of {totalPages} / {total || 0} total
      </div>
      <div className="admin-actions">
        <Button disabled={!canPrev} onClick={() => onPageChange(page - 1)}>
          Previous
        </Button>
        <Button disabled={!canNext} onClick={() => onPageChange(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
};
