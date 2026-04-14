/**
 * Reusable ad placeholder with a clean, theme-aware design.
 * Used for slots where the user can paste Adsterra codes later.
 */
const AdPlaceholder = ({ id = 'ad-slot', label = 'Ad Placement', className = '' }) => {
  return (
    <div
      id={id}
      className={`ad-placeholder ${className}`}
      aria-label={label}
    >
      <span className="ad-placeholder-label">{label}</span>
    </div>
  );
};

export default AdPlaceholder;
