"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, Check, ExternalLink, Info, AlertTriangle, XCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications");
      if (res.status === 401) return; // Silent on unauthorized
      
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } else {
        const error = await res.json().catch(() => ({}));
        console.warn("Notification fetch warning:", error.error || res.statusText);
      }
    } catch (e) {
      // Avoid spamming console in dev
      if (process.env.NODE_ENV === 'production') {
        console.error("Notification service unavailable");
      }
    }
  }

  async function handleMarkAllAsRead() {
    try {
      const res = await fetch("/api/notifications", { method: "PATCH" });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (e) {
      console.error("Failed to mark all as read");
    }
  }

  async function handleMarkAsRead(id: string) {
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: "PATCH" });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (e) {
      console.error("Failed to mark as read");
    }
  }

  const icons = {
    info: <Info className="h-4 w-4 text-blue-500" />,
    success: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    warning: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
    error: <XCircle className="h-4 w-4 text-red-500" />,
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative grid h-9 w-9 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition hover:bg-muted hover:text-primary"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {unreadCount > 9 ? "+9" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-80 overflow-hidden rounded-2xl border border-border bg-card shadow-xl animate-in fade-in zoom-in duration-200 z-50">
          <div className="flex items-center justify-between border-b border-border p-4 bg-muted/20">
            <h3 className="text-sm font-bold text-primary">الإشعارات</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[10px] font-medium text-muted-foreground hover:text-primary flex items-center gap-1"
              >
                <Check className="h-3 w-3" /> قراءة الكل
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-muted/30 text-muted-foreground mb-2">
                  <Bell className="h-6 w-6 opacity-20" />
                </div>
                <p className="text-xs text-muted-foreground">لا توجد إشعارات حالياً</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      "group relative p-4 transition-colors hover:bg-muted/30",
                      !n.isRead && "bg-primary/5"
                    )}
                  >
                    <div className="flex gap-3">
                      <div className="mt-0.5">{icons[n.type]}</div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn("text-xs font-bold leading-none", !n.isRead && "text-primary")}>
                            {n.title}
                          </p>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ar })}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          {n.message}
                        </p>
                        <div className="flex items-center gap-3 pt-1">
                          {n.link && (
                            <Link
                              href={n.link}
                              onClick={() => {
                                setIsOpen(false);
                                handleMarkAsRead(n.id);
                              }}
                              className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                            >
                              عرض <ExternalLink className="h-2.5 w-2.5" />
                            </Link>
                          )}
                          {!n.isRead && (
                            <button
                              onClick={() => handleMarkAsRead(n.id)}
                              className="text-[10px] font-medium text-muted-foreground hover:text-primary"
                            >
                              تمت القراءة
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
