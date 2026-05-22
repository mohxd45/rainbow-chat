import { motion } from "framer-motion";

export function TypingIndicator({ names }: { names: string[] }) {
  if (!names.length) return null;
  const label = names.length === 1 ? `${names[0]} is typing` : `${names.slice(0, 2).join(", ")} are typing`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="flex items-end gap-3 justify-start mb-2 pl-1"
    >
      {/* Typing avatar icon */}
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-cyan-500/10 text-lg border border-cyan-400/10 shadow-[0_0_10px_rgba(34,211,238,0.1)]">
        💬
      </div>
      
      <div>
        {/* Typing bubble */}
        <div className="rounded-3xl rounded-bl-lg border border-white/10 bg-white/[.07] px-5 py-3.5 flex items-center gap-1.5 w-max">
          <span className="flex gap-1.5 items-center">
            <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-300" style={{ animationDuration: "1s" }} />
            <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-300 [animation-delay:150ms]" style={{ animationDuration: "1s" }} />
            <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-300 [animation-delay:300ms]" style={{ animationDuration: "1s" }} />
          </span>
        </div>
        {/* Subtext label */}
        <span className="mt-1 block pl-2 text-[10px] font-medium tracking-wide text-white/40 uppercase">
          {label}
        </span>
      </div>
    </motion.div>
  );
}
