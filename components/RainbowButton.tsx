import { cn } from "@/lib/utils";

export function RainbowButton({
  children,
  className,
  disabled,
  type = "button",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-2xl bg-gradient-to-r from-pink-500 via-violet-500 via-cyan-400 to-emerald-400 px-5 py-3 font-semibold text-white shadow-neon transition hover:scale-[1.02] active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-55",
        className,
      )}
    >
      {children}
    </button>
  );
}
