"use client";

import { useEffect, useState, useCallback } from "react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps, toast, useSonner } from "sonner";
import { Bell, Maximize2, Minus, X } from "lucide-react";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();
  const { toasts } = useSonner();
  const [isMinimized, setIsMinimized] = useState(false);

  const activeToasts = toasts.filter((t) => !t.delete);
  const activeCount = activeToasts.length;

  useEffect(() => {
    if (activeCount === 0 && isMinimized) {
      setIsMinimized(false);
    }
  }, [activeCount, isMinimized]);

  const handleMinimizeAll = useCallback(() => {
    setIsMinimized(true);
  }, []);

  // Inject a matching circular "−" minimize button right beside the "×" close button on every toast card
  useEffect(() => {
    if (typeof document === "undefined") return;

    const attachMinimizeButtons = () => {
      const toastEls = document.querySelectorAll("[data-sonner-toast]");
      toastEls.forEach((toastEl) => {
        if (toastEl.querySelector("[data-minimize-toast-btn]")) return;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.setAttribute("data-minimize-toast-btn", "true");
        btn.setAttribute("aria-label", "Minimize all notifications");
        btn.setAttribute("title", "Minimize all notifications");
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;
        btn.onclick = (e) => {
          e.stopPropagation();
          e.preventDefault();
          setIsMinimized(true);
        };
        toastEl.appendChild(btn);
      });
    };

    attachMinimizeButtons();
    const observer = new MutationObserver(() => attachMinimizeButtons());
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [activeCount]);

  return (
    <>
      <style>{`
        [data-sonner-toast][data-styled='true'] [data-minimize-toast-btn] {
          position: absolute;
          left: 24px;
          top: 0;
          height: 20px;
          width: 20px;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 0;
          color: inherit;
          background: inherit;
          border: 1px solid currentColor;
          border-color: rgba(0, 0, 0, 0.18);
          transform: translate(-35%, -35%);
          border-radius: 50%;
          cursor: pointer;
          z-index: 2;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
          transition: opacity 150ms ease, transform 150ms ease;
        }
        [data-sonner-toast][data-styled='true'] [data-minimize-toast-btn]:hover {
          opacity: 0.85;
          transform: translate(-35%, -35%) scale(1.06);
        }
        .cura-toaster-minimized [data-sonner-toaster] {
          display: none !important;
        }
      `}</style>

      {isMinimized && activeCount > 0 && (
        <div
          className="fixed top-4 right-4 z-[999999999] flex items-center gap-2 px-3 py-2 rounded-full bg-amber-50 dark:bg-slate-800 border border-amber-300 dark:border-slate-700 text-amber-900 dark:text-slate-100 shadow-lg text-xs font-bold animate-in fade-in zoom-in-95 duration-150"
          role="status"
        >
          <Bell size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            {activeCount} {activeCount === 1 ? "Notification" : "Notifications"} Minimized
          </span>
          <button
            type="button"
            onClick={() => setIsMinimized(false)}
            title="Restore notifications"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-200/70 dark:bg-slate-700 hover:bg-amber-300/80 dark:hover:bg-slate-600 text-amber-950 dark:text-white text-[11px] font-bold transition-colors cursor-pointer"
          >
            <Maximize2 size={11} />
            Show
          </button>
          <button
            type="button"
            onClick={() => {
              toast.dismiss();
              setIsMinimized(false);
            }}
            title="Dismiss all notifications"
            className="p-0.5 rounded-full hover:bg-amber-200/70 dark:hover:bg-slate-700 text-amber-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {!isMinimized && activeCount > 1 && (
        <div className="fixed top-2 right-6 z-[1000000000] flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleMinimizeAll}
            title="Minimize all pop-up notifications"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-slate-800 hover:bg-amber-200 dark:hover:bg-slate-700 border border-amber-300 dark:border-slate-600 text-amber-900 dark:text-slate-100 shadow-md text-[11px] font-bold transition-all cursor-pointer"
          >
            <Minus size={12} strokeWidth={2.5} />
            Minimize All ({activeCount})
          </button>
        </div>
      )}

      <div className={isMinimized ? "cura-toaster-minimized" : undefined}>
        <Sonner
          theme={theme as ToasterProps["theme"]}
          className="toaster group"
          closeButton
          style={
            {
              "--normal-bg": "var(--popover)",
              "--normal-text": "var(--popover-foreground)",
              "--normal-border": "var(--border)",
            } as React.CSSProperties
          }
          {...props}
        />
      </div>
    </>
  );
};

export { Toaster };
