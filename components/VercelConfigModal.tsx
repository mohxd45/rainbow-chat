"use client";

import { useEffect, useState } from "react";
import { X, Copy, Check, ShieldAlert, ExternalLink, HelpCircle } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { RainbowButton } from "./RainbowButton";

export function VercelConfigModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/vercel-guide")
      .then((res) => res.json())
      .then((data) => {
        setConfig(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load environment variables for guide:", err);
        setLoading(false);
      });
  }, [open]);

  if (!open) return null;

  const handleCopy = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(identifier);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 px-5 py-10 overflow-y-auto backdrop-blur-md">
      <GlassCard className="neon-border w-full max-w-2xl p-6 sm:p-8 my-auto relative shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl bg-white/10 p-2 text-white/70 hover:bg-white/15 hover:text-white transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-500/10 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <HelpCircle className="h-6 w-6" />
          </span>
          <div>
            <h2 className="text-2xl font-black text-white">Vercel Setup Guide</h2>
            <p className="text-xs text-white/50 mt-0.5">Connect your live website to Firebase</p>
          </div>
        </div>

        {/* Step-by-Step Instructions */}
        <div className="space-y-4 text-sm text-white/80 leading-relaxed border-b border-white/10 pb-6 mb-6">
          <p>
            To sync your rooms and messages between your phone and laptop, your deployed website on Vercel must be connected to Firebase. Follow these simple steps:
          </p>

          <ol className="list-decimal list-inside space-y-2 text-xs text-white/70 bg-white/5 p-4 rounded-2xl border border-white/5">
            <li>
              Open your{" "}
              <a
                href="https://vercel.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-300 font-semibold underline inline-flex items-center gap-0.5 hover:text-cyan-200"
              >
                Vercel Dashboard <ExternalLink className="h-3 w-3" />
              </a>{" "}
              and select your <strong>rainbow-chat</strong> project.
            </li>
            <li>
              Go to the <strong className="text-white">Settings</strong> tab, and click{" "}
              <strong className="text-white">Environment Variables</strong> on the left.
            </li>
            <li>
              Copy the <strong className="text-cyan-300">Key</strong> and{" "}
              <strong className="text-pink-300">Value</strong> for each variable listed below, paste them in Vercel, and click <strong className="text-white">Add</strong>.
            </li>
            <li>
              Once all 6 variables are added, go to the <strong className="text-white">Deployments</strong> tab in Vercel, click the three dots on your latest deployment, and choose <strong className="text-white">Redeploy</strong>.
            </li>
          </ol>
        </div>

        {/* Environment Variables Copy List */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-3">Copy-Paste Values</h3>
          {loading ? (
            <div className="flex h-36 items-center justify-center">
              <span className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-cyan-400" />
            </div>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
              {Object.entries(config).map(([key, value]) => (
                <div
                  key={key}
                  className="rounded-xl border border-white/5 bg-black/40 p-3 sm:p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-bold text-cyan-300 break-all select-all">{key}</code>
                      <button
                        onClick={() => handleCopy(key, `${key}-key`)}
                        className="rounded bg-white/5 p-1 text-white/50 hover:bg-white/10 hover:text-white transition"
                        title="Copy Key Name"
                      >
                        {copiedKey === `${key}-key` ? (
                          <Check className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <code className="text-[11px] text-pink-300 font-mono break-all select-all bg-black/35 px-1.5 py-0.5 rounded border border-white/5 block max-w-full truncate">
                        {value || "(Not configured in local server .env.local)"}
                      </code>
                    </div>
                  </div>

                  {value && (
                    <button
                      onClick={() => handleCopy(value, `${key}-val`)}
                      className="shrink-0 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white/95 hover:bg-white/15 transition flex items-center gap-1.5 self-end sm:self-center"
                    >
                      {copiedKey === `${key}-val` ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" /> Copied Value
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" /> Copy Value
                        </>
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-end">
          <RainbowButton onClick={onClose} className="px-6 py-2.5">
            Done / Close
          </RainbowButton>
        </div>
      </GlassCard>
    </div>
  );
}
