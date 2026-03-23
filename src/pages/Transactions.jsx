import React, { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Search, RefreshCw } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { transactionService } from "@/api/services/transactionService";
import { walletService } from "@/api/services/walletService";
import { budgetService } from "@/api/services/budgetService";
import { notificationService } from "@/api/services/notificationService";
import PageHeader from "../components/PageHeader";
import { usePullToRefresh } from "../hooks/usePullToRefresh";
import { useTransactions } from "@/hooks/useTransactionQueries";
import { useWallets } from "@/hooks/useWalletQueries";
import { useAllCategories } from "@/hooks/useCategoryQueries";


import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import TransactionList from "../components/transactions/TransactionList";
import AddTransactionModal from "../components/transactions/AddTransactionModal";
import EditTransactionModal from "../components/transactions/EditTransactionModal";
import TransactionFilters from "../components/transactions/TransactionFilters";

export default function TransactionsPage() {
  const { user, userSettings } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: transactions = [], isLoading, refetch: refetchTransactions } = useTransactions(user?.id);
  const { data: wallets = [], refetch: refetchWallets } = useWallets(user?.id);
  const allCategories = useAllCategories(user?.id);
  const getCatLabel = (key) => allCategories.find(c => c.key === key)?.label ?? key;
  const loading = isLoading;
  const refetchAll = useCallback(() => { refetchTransactions(); refetchWallets(); }, [refetchTransactions, refetchWallets]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalDefaultType, setAddModalDefaultType] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deletingTransaction, setDeletingTransaction] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState({
    category: 'all',
    wallet: 'all',
    dateRange: 'all',
    amountMin: '',
    amountMax: '',
    customDateFrom: '',
    customDateTo: ''
  });
  const containerRef = useRef(null);

  // Handle URL query params from QuickActions
  useEffect(() => {
    const action = searchParams.get('action');
    const type = searchParams.get('type');
    if (action === 'add') {
      setAddModalDefaultType(type || null);
      setShowAddModal(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { isPulling, pullDistance, threshold } = usePullToRefresh(refetchAll, containerRef);

  const calculateFee = (wallet, amount, isTransfer = false) => {
    const feeAmount = wallet ? (isTransfer ? wallet.transfer_fee : wallet.usage_fee) : 0;
    if (!feeAmount) return 0;
    
    return wallet.fee_type === 'percentage' 
      ? (amount * feeAmount) / 100
      : feeAmount;
  };

  const handleAddTransaction = async (transactionData) => {
    try {
      const transaction = await transactionService.create(user.id, transactionData);
      
      // Update wallet balance with fees
      const wallet = wallets.find(w => w.id === transactionData.wallet_id);
      if (wallet) {
        let newBalance = wallet.balance;
        const fee = calculateFee(wallet, transactionData.amount, transactionData.type === 'transfer');
        
        if (transactionData.type === 'income') {
          newBalance += transactionData.amount - fee;
        } else if (transactionData.type === 'expense') {
          newBalance -= (transactionData.amount + fee);
        } else if (transactionData.type === 'transfer') {
          newBalance -= (transactionData.amount + fee);
          
          // Update destination wallet
          if (transactionData.to_wallet_id) {
            const toWallet = wallets.find(w => w.id === transactionData.to_wallet_id);
            if (toWallet) {
              await walletService.update(toWallet.id, { 
                balance: toWallet.balance + transactionData.amount 
              });
            }
          }
        }
        
        await walletService.update(wallet.id, { balance: newBalance });
      }
      // Check budget alerts for expense transactions
      if (transactionData.type === 'expense' && userSettings?.notifications_enabled !== false) {
        const EXPENSE_CATS = Object.fromEntries(allCategories.map(c => [c.key, c.label]));
        // Budget alerts
        if (userSettings?.budget_alerts !== false) {
          try {
            const budget = await budgetService.getByCategory(user.id, transactionData.category);
            if (budget && budget.limit_amount > 0) {
              const now = new Date();
              const spent = [...transactions, transaction]
                .filter(t => {
                  if (t.type !== 'expense' || t.category !== budget.category) return false;
                  const tDate = new Date(t.date);
                  if (budget.period === 'yearly') return tDate.getFullYear() === now.getFullYear();
                  return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
                })
                .reduce((sum, t) => sum + t.amount, 0);
              const pct = (spent / budget.limit_amount) * 100;
              const catName = EXPENSE_CATS[budget.category] || budget.category;
              if (pct >= 100) {
                toast.error(`تجاوزت ميزانية "${catName}"! ${spent.toLocaleString()} / ${budget.limit_amount.toLocaleString()} ج.م`);
                notificationService.create(user.id, { type: 'budget_exceeded', title: `تجاوز ميزانية ${catName}`, message: `المنفق: ${spent.toLocaleString()} / ${budget.limit_amount.toLocaleString()} ج.م` }).catch(() => {});
              } else if (pct >= 80) {
                toast.warning(`اقتربت من حد ميزانية "${catName}" (${pct.toFixed(0)}%)`);
                notificationService.create(user.id, { type: 'budget_warning', title: `تحذير ميزانية ${catName}`, message: `وصلت إلى ${pct.toFixed(0)}% من الحد` }).catch(() => {});
              }
            }
          } catch (budgetErr) {
            console.error('Budget check error:', budgetErr);
          }
        }
        // Large transaction alert
        const threshold = userSettings?.large_transaction_threshold ?? 5000;
        if (threshold > 0 && transactionData.amount >= threshold) {
          toast.warning(`معاملة كبيرة: ${transactionData.amount.toLocaleString()} ج.م تجاوزت حد ${threshold.toLocaleString()} ج.م`);
          notificationService.create(user.id, { type: 'large_transaction', title: `معاملة كبيرة: ${transactionData.title}`, message: `${transactionData.amount.toLocaleString()} ج.م` }).catch(() => {});
        }
      }
      setShowAddModal(false);
      refetchAll();
      toast.success("Transaction added successfully");
    } catch (error) {
      console.error("Error adding transaction:", error);
      toast.error("Failed to add transaction");
    }
  };

  const handleEditTransaction = async (transactionData) => {
    try {
      if (!editingTransaction) return;

      const updatedTx = { ...transactionData, amount: parseFloat(transactionData.amount) };
      const originalTx = { ...editingTransaction };
      
      // Use a Map to track balance changes for all affected wallets to prevent race conditions or incorrect calculations
      // if multiple wallets are involved (e.g., transfers) or if the wallet itself changes.
      const walletUpdates = new Map();
      wallets.forEach(w => walletUpdates.set(w.id, w.balance));

      // 1. Revert original transaction from the calculated balances
      const fromWalletOriginal = wallets.find(w => w.id === originalTx.wallet_id);
      if (fromWalletOriginal) {
        let currentBalance = walletUpdates.get(fromWalletOriginal.id);
        const fee = calculateFee(fromWalletOriginal, originalTx.amount, originalTx.type === 'transfer');

        if (originalTx.type === 'income') currentBalance -= (originalTx.amount - fee);
        else if (originalTx.type === 'expense') currentBalance += (originalTx.amount + fee);
        else if (originalTx.type === 'transfer') {
            currentBalance += (originalTx.amount + fee);
            if (originalTx.to_wallet_id) {
                const toWalletOriginal = wallets.find(w => w.id === originalTx.to_wallet_id);
                if (toWalletOriginal && walletUpdates.has(toWalletOriginal.id)) {
                    let toBalance = walletUpdates.get(toWalletOriginal.id);
                    walletUpdates.set(toWalletOriginal.id, toBalance - originalTx.amount);
                }
            }
        }
        walletUpdates.set(fromWalletOriginal.id, currentBalance);
      }

      // 2. Apply new transaction to the calculated balances
      const fromWalletNew = wallets.find(w => w.id === updatedTx.wallet_id);
      if (fromWalletNew) {
        let currentBalance = walletUpdates.get(fromWalletNew.id);
        const fee = calculateFee(fromWalletNew, updatedTx.amount, updatedTx.type === 'transfer');

        if (updatedTx.type === 'income') currentBalance += (updatedTx.amount - fee);
        else if (updatedTx.type === 'expense') currentBalance -= (updatedTx.amount + fee);
        else if (updatedTx.type === 'transfer') {
            currentBalance -= (updatedTx.amount + fee);
            if (updatedTx.to_wallet_id) {
                const toWalletNew = wallets.find(w => w.id === updatedTx.to_wallet_id);
                if (toWalletNew && walletUpdates.has(toWalletNew.id)) {
                    let toBalance = walletUpdates.get(toWalletNew.id);
                    walletUpdates.set(toWalletNew.id, toBalance + updatedTx.amount);
                }
            }
        }
        walletUpdates.set(fromWalletNew.id, currentBalance);
      }
      
      // 3. Commit all updates to the database
      const updatePromises = [];
      for (const [walletId, newBalance] of walletUpdates.entries()) {
        const currentWalletState = wallets.find(w => w.id === walletId);
        // Only update if the balance has actually changed
        if (currentWalletState && currentWalletState.balance !== newBalance) {
          updatePromises.push(walletService.update(walletId, { balance: newBalance }));
        }
      }
      
      updatePromises.push(transactionService.update(originalTx.id, updatedTx));
      
      await Promise.all(updatePromises);
      
      setEditingTransaction(null);
      refetchAll();
      
      toast.success("Transaction updated successfully");

    } catch (error) {
      console.error("خطأ في تعديل المعاملة:", error);
      toast.error("فشل في تعديل المعاملة");
    }
  };

  const handleDeleteTransaction = async () => {
    try {
      if (!deletingTransaction) return;

      const { id, type, amount, wallet_id, to_wallet_id } = deletingTransaction;
      const fromWallet = wallets.find(w => w.id === wallet_id);
      
      // Reverse the transaction amount from the wallet(s)
      if (fromWallet) {
        let newFromBalance = fromWallet.balance;
        const fee = calculateFee(fromWallet, amount, type === 'transfer');

        if (type === 'income') {
          newFromBalance -= (amount - fee);
        } else if (type === 'expense') {
          newFromBalance += (amount + fee);
        } else if (type === 'transfer') {
          newFromBalance += (amount + fee);
          
          if (to_wallet_id) {
            const toWallet = wallets.find(w => w.id === to_wallet_id);
            if (toWallet) {
              await walletService.update(toWallet.id, { balance: toWallet.balance - amount });
            }
          }
        }
        await walletService.update(fromWallet.id, { balance: newFromBalance });
      }

      await transactionService.delete(id);
      setDeletingTransaction(null);
      refetchAll();
      
      toast.success("Transaction deleted successfully");
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast.error("Failed to delete transaction");
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = activeTab === 'all' || transaction.type === activeTab;
    const matchesCategory = filters.category === 'all' || transaction.category === filters.category;
    const matchesWallet = filters.wallet === 'all' || transaction.wallet_id === filters.wallet;

    // Date range filter
    let matchesDate = true;
    if (filters.dateRange !== 'all') {
      const tDate = new Date(transaction.date);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      switch (filters.dateRange) {
        case 'today':
          matchesDate = tDate >= today;
          break;
        case 'thisWeek': {
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          matchesDate = tDate >= weekStart;
          break;
        }
        case 'thisMonth':
          matchesDate = tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
          break;
        case 'lastMonth': {
          const lm = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
          const ly = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
          matchesDate = tDate.getMonth() === lm && tDate.getFullYear() === ly;
          break;
        }
        case 'thisYear':
          matchesDate = tDate.getFullYear() === now.getFullYear();
          break;
        case 'custom':
          if (filters.customDateFrom) matchesDate = tDate >= new Date(filters.customDateFrom);
          if (filters.customDateTo && matchesDate) {
            const endDate = new Date(filters.customDateTo);
            endDate.setHours(23, 59, 59, 999);
            matchesDate = tDate <= endDate;
          }
          break;
        default: break;
      }
    }

    // Amount range filter
    let matchesAmount = true;
    if (filters.amountMin) matchesAmount = transaction.amount >= parseFloat(filters.amountMin);
    if (filters.amountMax && matchesAmount) matchesAmount = transaction.amount <= parseFloat(filters.amountMax);
    
    return matchesSearch && matchesType && matchesCategory && matchesWallet && matchesDate && matchesAmount;
  });

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const thisMonthIncomeCount = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return t.type === 'income' &&
           transactionDate.getMonth() === currentMonth &&
           transactionDate.getFullYear() === currentYear;
  }).length;

  const thisMonthExpenseCount = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return t.type === 'expense' &&
           transactionDate.getMonth() === currentMonth &&
           transactionDate.getFullYear() === currentYear;
  }).length;

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-20 bg-gray-200 rounded-lg animate-pulse dark:bg-gray-700"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse dark:bg-gray-700"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-gray-50 dark:bg-gray-900" style={{ overscrollBehavior: 'none' }}>
      {/* Pull to refresh indicator */}
      {isPulling && (
        <div className="flex justify-center items-end bg-primary/10" style={{ height: `${Math.min(pullDistance, threshold)}px`, transition: 'height 0.1s' }}>
          <RefreshCw className={`w-5 h-5 text-primary mb-2 ${pullDistance >= threshold ? 'animate-spin' : ''}`} />
        </div>
      )}

      <PageHeader
        title="المعاملات"
        subtitle="تتبع دخلك ومصروفاتك"
        rightContent={
          <Button onClick={() => setShowAddModal(true)} className="bg-white text-primary hover:bg-gray-100">
            <Plus className="w-5 h-5 ml-2" />
            إضافة معاملة
          </Button>
        }
      />

      {/* Search */}
      <div className="bg-primary px-4 pb-4 -mt-1">
        <div className="relative">
          <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="البحث في المعاملات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10 bg-white/20 border-white/30 text-white placeholder:text-white/60 dark:bg-white/10"
          />
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {/* Quick Stats */}
        <Card className="bg-white shadow-lg border-0 dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">المجموع</p>
                <p className="font-bold text-lg text-gray-900 dark:text-gray-100">{transactions.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">دخل هذا الشهر</p>
                <p className="font-bold text-lg text-green-600 dark:text-green-400">
                  {thisMonthIncomeCount}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">مصروفات هذا الشهر</p>
                <p className="font-bold text-lg text-red-600 dark:text-red-400">
                  {thisMonthExpenseCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 bg-white dark:bg-gray-800">
            <TabsTrigger value="all" className="dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-gray-100 dark:text-gray-300">الكل</TabsTrigger>
            <TabsTrigger value="income" className="dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-gray-100 dark:text-gray-300">الدخل</TabsTrigger>
            <TabsTrigger value="expense" className="dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-gray-100 dark:text-gray-300">المصروفات</TabsTrigger>
            <TabsTrigger value="transfer" className="dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-gray-100 dark:text-gray-300">التحويلات</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filters */}
        <TransactionFilters 
          filters={filters}
          onFiltersChange={setFilters}
          wallets={wallets}
        />

        {/* Transactions List */}
        <TransactionList 
          transactions={filteredTransactions}
          wallets={wallets}
          onRefresh={refetchAll}
          onEdit={setEditingTransaction}
          onDelete={setDeletingTransaction}
        />

        {/* Bottom Spacing */}
        <div className="h-4"></div>
      </div>

      <AddTransactionModal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setAddModalDefaultType(null); }}
        onSubmit={handleAddTransaction}
        wallets={wallets}
        defaultType={addModalDefaultType}
      />

      <EditTransactionModal
        isOpen={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        onSubmit={handleEditTransaction}
        transaction={editingTransaction}
        wallets={wallets}
      />

      <AlertDialog open={!!deletingTransaction} onOpenChange={() => setDeletingTransaction(null)}>
        <AlertDialogContent className="dark:bg-gray-800 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-gray-100">تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-gray-400">
              هل أنت متأكد من حذف المعاملة "{deletingTransaction?.title}"؟ هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTransaction} className="bg-red-600">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}