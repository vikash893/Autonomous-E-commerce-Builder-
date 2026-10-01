export default function ModuleCard({
  module,
  isSelected,
  isAutoAdded,
  requiredBy = [],
  onToggle,
  optionsConfigured = false,
  onConfigureOptions,
}) {
  const hasOptions = module.options && Object.keys(module.options).length > 0;

  return (
    <div
      className={`module-card ${isSelected ? 'module-selected' : ''} ${
        isAutoAdded ? 'module-auto-added' : ''
      }`}
      onClick={() => onToggle(module.key)}
    >
      <div className="module-card-header">
        <div className="module-icon-wrap">
          <span className="module-icon">{module.icon || '📦'}</span>
          <div>
            <h3 className="module-title">{module.name}</h3>
            <span className="module-category">{module.category || 'Module'}</span>
          </div>
        </div>

        <div className="module-toggle-wrap">
          {isAutoAdded && (
            <span className="badge badge-teal" title={`Auto-included because: ${requiredBy.join(', ')}`}>
              Required by {requiredBy.join(', ')}
            </span>
          )}

          <div
            className={`toggle-switch ${isSelected ? 'toggle-on' : ''} ${
              isAutoAdded ? 'toggle-locked' : ''
            }`}
          >
            <div className="toggle-thumb" />
          </div>
        </div>
      </div>

      <p className="module-desc">{module.description}</p>

      <div className="module-card-footer">
        {module.dependsOn && module.dependsOn.length > 0 ? (
          <div className="module-deps">
            <span className="deps-label">Needs:</span>
            {module.dependsOn.map((dep) => (
              <span key={dep} className="dep-chip">
                {dep}
              </span>
            ))}
          </div>
        ) : (
          <span className="dep-chip standalone-chip">Zero dependencies</span>
        )}

        {hasOptions && isSelected && onConfigureOptions && (
          <button
            type="button"
            className="button-options"
            onClick={(e) => {
              e.stopPropagation();
              onConfigureOptions(module.key);
            }}
          >
            ⚙️ Configure options
          </button>
        )}
      </div>
    </div>
  );
}