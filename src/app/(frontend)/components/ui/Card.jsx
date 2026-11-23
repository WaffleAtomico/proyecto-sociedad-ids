// R-05 / H-05: Before — repeated card containers used duplicated Tailwind classes.
// After — reusable Card component centralizes dark, deep, and lavender variants.
export default function Card({
  children,
  variant = "dark",
  className = "",
  ...props
}) {
  const variants = {
    dark: "bg-[#070E4A] border border-[#9FA1FF]/25 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.55)]",
    deep: "bg-[#010736]/80 border border-[#9747FF]/60 rounded-2xl",
    lavender:
      "bg-[#9FA1FF] text-[#010736] rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.3)]",
  };

  return (
    <div
      className={`${variants[variant] || variants.dark} ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
}