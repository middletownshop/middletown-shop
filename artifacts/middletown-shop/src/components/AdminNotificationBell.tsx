import { useState, useEffect, useRef } from "react";
import { Bell, Check, CheckCheck, Package, Signal, Wallet, ArrowUpRight, Users } from "lucide-react";
import {
  subscribeToAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
} from "@/lib/firestore";
import type { AdminNotification, AdminNotificationType } from "@/lib/types";

function playNotificationSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
    setTimeout(() => ctx.close(), 600);
  } catch {}
}

function timeAgo(ts: any): string {
  if (!ts) return "";
  const date: Date = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const TYPE_ICON: Record<AdminNotificationType, React.ReactNode> = {
  product_order: <Package className="w-4 h-4 text-blue-500" />,
  bundle_order: <Signal className="w-4 h-4 text-emerald-500" />,
  wallet_deposit: <Wallet className="w-4 h-4 text-violet-500" />,
  withdrawal_request: <ArrowUpRight className="w-4 h-4 text-orange-500" />,
  agent_application: <Users className="w-4 h-4 text-pink-500" />,
};

export default function AdminNotificationBell() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const initialLoadRef = useRef(true);
  const prevIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const unsub = subscribeToAdminNotifications((items) => {
      if (initialLoadRef.current) {
        initialLoadRef.current = false;
        prevIdsRef.current = new Set(items.map((n) => n.id));
        setNotifications(items);
        return;
      }

      const newItems = items.filter((n) => !prevIdsRef.current.has(n.id));
      if (newItems.length > 0) {
        playNotificationSound();
      }
      prevIdsRef.current = new Set(items.map((n) => n.id));
      setNotifications(items);
    });

    return unsub;
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);

  async function handleClickNotification(n: AdminNotification) {
    if (!n.read) {
      await markAdminNotificationRead(n.id).catch(() => {});
    }
  }

  async function handleMarkAllRead() {
    if (unreadIds.length === 0) return;
    await markAllAdminNotificationsRead(unreadIds).catch(() => {});
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((p) => !p)}
        className="relative flex items-center justify-center w-9 h-9 rounded-xl hover:bg-muted border border-transparent hover:border-border/60 transition-all duration-200"
        aria-label="Admin notifications"
      >
        <Bell className="w-4.5 h-4.5 text-foreground/80" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 ring-2 ring-white animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-border/80 rounded-2xl shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-gradient-to-r from-primary/5 to-transparent">
            <div>
              <p className="text-xs font-black text-foreground uppercase tracking-widest">Notifications</p>
              {unreadCount > 0 && (
                <p className="text-[10px] text-muted-foreground">{unreadCount} unread</p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-[10px] font-bold text-primary hover:text-primary/80 transition-colors"
              >
                <CheckCheck className="w-3 h-3" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto divide-y divide-border/40">
            {notifications.length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No notifications yet
              </div>
            )}

            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClickNotification(n)}
                className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-muted/50 transition-colors ${!n.read ? "bg-blue-50/60" : ""}`}
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-white border border-border/60 flex items-center justify-center shadow-sm mt-0.5">
                  {TYPE_ICON[n.type] ?? <Bell className="w-4 h-4 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <p className={`text-xs font-bold truncate ${!n.read ? "text-foreground" : "text-foreground/70"}`}>
                      {n.title}
                    </p>
                    {!n.read && (
                      <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-1" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 line-clamp-2">
                    {n.message}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[10px] text-muted-foreground/70">{timeAgo(n.createdAt)}</p>
                    {n.amount !== undefined && (
                      <p className="text-[10px] font-bold text-emerald-600">
                        ₵{n.amount.toLocaleString("en-GH", { minimumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-border/40 bg-muted/20 flex items-center justify-center">
              <p className="text-[10px] text-muted-foreground">
                Showing latest {notifications.length} notifications
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
