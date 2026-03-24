import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Eye, EyeOff, RefreshCw, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { useWallets } from "@/hooks/useWalletQueries";
import { useMonthlyTransactions, useRecentTransactions } from "@/hooks/useTransactionQueries";
import PageHeader from "../components/PageHeader";
import { usePullToRefresh } from "../hooks/usePullToRefresh";

import BalanceCard from "../components/dashboard/BalanceCard";
import QuickStats from "../components/dashboard/QuickStats";
import RecentTransactions from "../components/dashboard/RecentTransactions";
import QuickActions from "../components/dashboard/QuickActions";
import BudgetList from "../components/budget/BudgetList";
import { toast } from "sonner";
import NotificationBell from "@/components/NotificationBell";

export default function Dashboard() {
  const { user } = useAuth();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const containerRef = useRef(null);
  const [widgetOrder, setWidgetOrder] = useState(() => {
    try {
      const saved = localStorage.getItem('dashboard_widget_order');
      if (saved) {
        const parsed = JSON.parse(saved);
        const defaults = ['balance', 'stats', 'actions', 'budget', 'recent'];
        if (parsed.length === defaults.length && defaults.every(w => parsed.includes(w))) return parsed;
      }
    } catch {}
    return ['balance', 'stats', 'actions', 'budget', 'recent'];
  });

  const {
    data: wallets = [],
    refetch: refetchWallets,
    isError: walletsError,
    error: walletQueryError,
  } = useWallets(user?.id);
  const {
    data: recentTransactions = [],
    refetch: refetchRecent,
    isError: recentTxError,
    error: recentTxQueryError,
  } = useRecentTransactions(user?.id, 10);
  const {
    data: monthlyTransactions = [],
    refetch: refetchMonthly,
    isError: monthlyTxError,
    error: monthlyTxQueryError,
  } = useMonthlyTransactions(user?.id);

  const refetchAll_ = useCallback(() => {
    refetchWallets();
    refetchRecent();
    refetchMonthly();
  }, [refetchWallets, refetchRecent, refetchMonthly]);

  useEffect(() => {
    if (user?.id) {
      // Process recurring transactions once per session
      const sessionKey = `recurring_processed_${user.id}`;
      if (!sessionStorage.getItem(sessionKey)) {
        sessionStorage.setItem(sessionKey, '1');
        import('@/utils/recurringProcessor').then(({ processRecurringTransactions }) => {
          processRecurringTransactions(user.id).then((count) => {
            if (count > 0) {
              toast.info(`تم إنشاء ${count} معاملة متكررة تلقائياً`);
              refetchAll_();
            }
          });
        });
      }
      // Check for upcoming recurring reminders
      import('@/utils/recurringReminders').then(({ checkRecurringReminders }) => {
        checkRecurringReminders(user.id).catch(() => {});
      });
    }
  }, [user?.id]);

  useEffect(() => {
    const queryError = walletQueryError || recentTxQueryError || monthlyTxQueryError;
    if (walletsError || recentTxError || monthlyTxError) {
      toast.error(queryError?.message || 'فشل تحميل البيانات من Supabase');
      console.error('Dashboard data query error:', queryError);
    }
  }, [
    walletsError,
    recentTxError,
    monthlyTxError,
    walletQueryError,
    recentTxQueryError,
    monthlyTxQueryError,
  ]);

  const { isPulling, pullDistance, threshold } = usePullToRefresh(refetchAll_, containerRef);

  const onDragEnd = useCallback((result) => {
    if (!result.destination) return;
    const newOrder = Array.from(widgetOrder);
    const [moved] = newOrder.splice(result.source.index, 1);
    newOrder.splice(result.destination.index, 0, moved);
    setWidgetOrder(newOrder);
    localStorage.setItem('dashboard_widget_order', JSON.stringify(newOrder));
  }, [widgetOrder]);

  const totalBalance = useMemo(() =>
    wallets.reduce((sum, wallet) => sum + (wallet.balance || 0), 0),
    [wallets]
  );

  const thisMonthIncome = useMemo(() =>
    monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0),
    [monthlyTransactions]
  );

  const thisMonthExpenses = useMemo(() =>
    monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0),
    [monthlyTransactions]
  );

  const renderWidget = (id) => {
    switch (id) {
      case 'balance': return <BalanceCard balance={totalBalance} visible={balanceVisible} walletCount={wallets.length} />;
      case 'stats': return <QuickStats income={thisMonthIncome} expenses={thisMonthExpenses} visible={balanceVisible} />;
      case 'actions': return <QuickActions />;
      case 'budget': return <BudgetList userId={user?.id} transactions={monthlyTransactions} />;
      case 'recent': return <RecentTransactions transactions={recentTransactions} onRefresh={refetchAll_} />;
      default: return null;
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800" style={{ overscrollBehavior: 'none' }}>
      {/* Pull to refresh indicator */}
      {isPulling && (
        <div className="flex justify-center py-2 bg-primary/10" style={{ height: `${Math.min(pullDistance, threshold)}px`, transition: 'height 0.1s' }}>
          <RefreshCw className={`w-5 h-5 text-primary ${pullDistance >= threshold ? 'animate-spin' : ''}`} />
        </div>
      )}

      <PageHeader
        title="الرئيسية"
        subtitle="تتبع أموالك بسهولة"
        rightContent={
          <div className="flex items-center gap-1">
            <NotificationBell />
            <Button variant="ghost" size="icon" onClick={() => setBalanceVisible(!balanceVisible)} className="text-white hover:bg-white/20">
              {balanceVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </Button>
          </div>
        }
      />

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="dashboard-widgets">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="px-4 -mt-4 space-y-6">
              {widgetOrder.map((widgetId, index) => (
                <Draggable key={widgetId} draggableId={widgetId} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={snapshot.isDragging ? 'z-50 opacity-90 shadow-2xl rounded-xl' : ''}
                    >
                      <div className="relative group">
                        <div
                          {...provided.dragHandleProps}
                          className="absolute -top-1 left-1/2 -translate-x-1/2 z-10 p-0.5 rounded-b-md bg-gray-300/50 dark:bg-gray-600/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                        >
                          <GripVertical className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        </div>
                        {renderWidget(widgetId)}
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              <div className="h-4"></div>
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}