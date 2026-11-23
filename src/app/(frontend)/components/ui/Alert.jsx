// R-05 / H-05: Before — repeated alert components used duplicated Tailwind classes.
// After — reusable Alert component centralizes base styles, variants, and sizes.

export default function Alert({ type = "error", children, className = "" }) {
  if (!children) return null;

  const styles = {
    error: "bg-red-500/20 border-red-400/50 text-red-200",
    success: "bg-emerald-500/20 border-emerald-400/50 text-emerald-200",
    info: "bg-[#9FA1FF]/15 border-[#9FA1FF]/40 text-[#FFFAEA]",
  };

  return (
    <div
      role="alert"
      className={`p-3 rounded-xl border text-sm ${
        styles[type] || styles.info
      } ${className}`.trim()}
    >
      {children}
    </div>
  );
}