import Link from "next/link";
// R-05 / H-05: Before — several components repeated complete <button> markup and Tailwind styles.
// After — reusable Button component centralizes base styles, variants, sizes, loading, and links.
const BASE_STYLES =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-wide transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-50 disabled:pointer-events-none select-none";

const VARIANTS = {
  primary:
    "bg-[#9747FF] text-[#FFFAEA] hover:bg-[#a966ff] shadow-[0_4px_20px_rgba(151,71,255,0.35)]",
  secondary:
    "bg-[#9FA1FF] text-[#010736] hover:bg-[#FFFAEA] shadow-[0_4px_20px_rgba(159,161,255,0.25)]",
  outline:
    "border-2 border-[#FFFAEA] bg-transparent text-[#FFFAEA] uppercase text-xs tracking-widest hover:bg-[#FFFAEA] hover:text-[#010736]",
  cream:
    "bg-[#FFFAEA] text-[#8183E6] hover:bg-[#9FA1FF] hover:text-[#010736]",
  ghost:
    "bg-white/10 text-[#FFFAEA] hover:bg-white/20",
  danger:
    "bg-red-500/20 border border-red-400/50 text-red-200 hover:bg-red-500/30",
};

const SIZES = {
  sm: "px-4 py-2 text-xs md:text-sm",
  md: "px-6 py-3 text-sm md:text-base",
  lg: "px-10 py-3.5 text-sm md:text-base",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  href,
  loading = false,
  className = "",
  disabled,
  ...props
}) {
  const classes = `${BASE_STYLES} ${VARIANTS[variant] || VARIANTS.primary} ${
    SIZES[size] || SIZES.md
  } ${className}`.trim();

  if (href) {
    return (
      <Link href={href} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button disabled={disabled || loading} className={classes} {...props}>
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}