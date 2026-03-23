import React, { useState } from "react";
import { Bell, Check, CheckCheck, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { notificationService } from "@/api/services/notificationService";
import { useAuth } from "@/lib/AuthContext";
import { useNotifications, useNotificationCount, useMarkNotificationRead, useMarkAllNotificationsRead, useDeleteAllNotifications } from "@/hooks/useNotificationQueries";

const TYPE_STYLES = {
  budget_warning: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', icon: '⚠️' },
  budget_exceeded: { bg: 'bg-red-100 dark:bg-red-900/30', icon: '🚨' },
  large_transaction: { bg: 'bg-orange-100 dark:bg-orange-900/30', icon: '💰' },
  recurring_reminder: { bg: 'bg-blue-100 dark:bg-blue-900/30', icon: '🔄' },
};

export default function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [extraNotifications, setExtraNotifications] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 20;

  const { data: baseNotifications = [] } = useNotifications(user?.id, 0);
  const { data: unreadCount = 0 } = useNotificationCount(user?.id);
  const markRead = useMarkNotificationRead(user?.id);
  const markAllRead = useMarkAllNotificationsRead(user?.id);
  const deleteAll = useDeleteAllNotifications(user?.id);

  const notifications = [...baseNotifications, ...extraNotifications];

  const loadMore = async () => {
    if (!user?.id) return;
    try {
      const items = await notificationService.getAll(user.id, { limit: PAGE_SIZE, offset: notifications.length });
      setExtraNotifications(prev => [...prev, ...items]);
      setHasMore(items.length >= PAGE_SIZE);
    } catch { /* ignore */ }
  };

  const handleMarkRead = async (id) => {
    await markRead.mutateAsync(id);
  };

  const handleMarkAllRead = async () => {
    await markAllRead.mutateAsync();
    setExtraNotifications([]);
  };

  const handleDeleteAll = async () => {
    await deleteAll.mutateAsync();
    setExtraNotifications([]);
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'الآن';
    if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `منذ ${diffHr} ساعة`;
    const diffDay = Math.floor(diffHr / 24);
    return `منذ ${diffDay} يوم`;
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative p-2 rounded-full hover:bg-white/20 transition-colors"
        aria-label="الإشعارات"
      >
        <Bell className="w-5 h-5 text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center min-w-[18px] min-h-[18px] leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Backdrop + Drawer */}
      {open && (
        <div className="fixed inset-0 z-50" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute top-0 right-0 w-full max-w-sm h-full bg-white dark:bg-gray-800 shadow-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <h2 className="font-bold text-lg text-gray-900 dark:text-gray-100">الإشعارات</h2>
              <div className="flex items-center gap-1">
                {notifications.length > 0 && (
                  <>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleMarkAllRead} title="تحديد الكل كمقروء">
                      <CheckCheck className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDeleteAll} title="حذف الكل">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
                  <Bell className="w-12 h-12 mb-3 opacity-30" />
                  <p>لا توجد إشعارات</p>
                </div>
              ) : (
                <>
                  {notifications.map((n) => {
                    const style = TYPE_STYLES[n.type] || { bg: 'bg-gray-100 dark:bg-gray-700', icon: '📌' };
                    return (
                      <div
                        key={n.id}
                        className={`p-4 border-b dark:border-gray-700 transition-colors ${
                          n.is_read ? 'opacity-60' : style.bg
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-xl mt-0.5">{style.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{n.title}</p>
                            {n.message && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{n.message}</p>
                            )}
                            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">{formatTime(n.created_at)}</p>
                          </div>
                          {!n.is_read && (
                            <button
                              onClick={() => handleMarkRead(n.id)}
                              className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                              title="تحديد كمقروء"
                            >
                              <Check className="w-3.5 h-3.5 text-gray-500" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {hasMore && (
                    <div className="p-3 text-center">
                      <Button variant="ghost" size="sm" onClick={loadMore} className="text-primary dark:text-primary">
                        تحميل المزيد
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
