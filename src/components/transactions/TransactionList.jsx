
import React, { useState, useEffect } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Minus, ArrowUpDown, Edit, Trash2, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/AuthContext";
import { useAllCategories } from "@/hooks/useCategoryQueries";

const ITEMS_PER_PAGE = 20;

function SwipeableRow({ children, onSwipeLeft, onSwipeRight }) {
  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [0, -30, -80], [0, 0.3, 1]);
  const editOpacity = useTransform(x, [0, 30, 80], [0, 0.3, 1]);

  return (
    <div className="relative overflow-hidden">
      <motion.div
        className="absolute inset-0 flex items-center justify-start px-6 bg-red-50 dark:bg-red-950/30"
        style={{ opacity: deleteOpacity }}
      >
        <div className="flex items-center gap-2 text-red-500 dark:text-red-400">
          <Trash2 className="w-5 h-5" />
          <span className="text-sm font-medium">حذف</span>
        </div>
      </motion.div>
      <motion.div
        className="absolute inset-0 flex items-center justify-end px-6 bg-blue-50 dark:bg-blue-950/30"
        style={{ opacity: editOpacity }}
      >
        <div className="flex items-center gap-2 text-blue-500 dark:text-blue-400">
          <Edit className="w-5 h-5" />
          <span className="text-sm font-medium">تعديل</span>
        </div>
      </motion.div>
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.5}
        dragDirectionLock
        style={{ x }}
        onDragEnd={(_, info) => {
          if (info.offset.x < -80) onSwipeLeft?.();
          else if (info.offset.x > 80) onSwipeRight?.();
        }}
        className="relative bg-white dark:bg-gray-800"
      >
        {children}
      </motion.div>
    </div>
  );
}

export default function TransactionList({ transactions, wallets, onRefresh, onEdit, onDelete }) {
  const { user } = useAuth();
  const allCategories = useAllCategories(user?.id);

  const getCatEmoji = (key) => allCategories.find(c => c.key === key)?.emoji ?? '📁';
  const getCatLabel = (key) => allCategories.find(c => c.key === key)?.label ?? key;

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'income': return <Plus className="w-4 h-4 text-green-600" />;
      case 'expense': return <Minus className="w-4 h-4 text-red-600" />;
      case 'transfer': return <ArrowUpDown className="w-4 h-4 text-blue-600" />;
      default: return <Plus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getAmountColor = (type) => {
    switch (type) {
      case 'income': return 'text-green-600';
      case 'expense': return 'text-red-600';
      case 'transfer': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getWalletName = (walletId) => {
    const wallet = wallets.find(w => w.id === walletId);
    return wallet?.name || 'محفظة محذوفة';
  };

  const groupTransactionsByDate = (transactions) => {
    const grouped = {};
    transactions.forEach(transaction => {
      const date = new Date(transaction.date).toLocaleDateString('en-GB');
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(transaction);
    });
    return grouped;
  };

  const groupedTransactions = groupTransactionsByDate(transactions);

  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  useEffect(() => { setVisibleCount(ITEMS_PER_PAGE); }, [transactions.length]);

  const paginatedTransactions = transactions.slice(0, visibleCount);
  const paginatedGroups = groupTransactionsByDate(paginatedTransactions);

  if (transactions.length === 0) {
    return (
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">لا توجد معاملات</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(paginatedGroups).map(([date, dayTransactions]) => (
        <div key={date}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">{date}</h3>
            <Badge variant="outline" className="text-xs dark:border-gray-600 dark:text-gray-400">
              {dayTransactions.length} معاملة
            </Badge>
          </div>
          
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {dayTransactions.map((transaction) => (
                  <SwipeableRow
                    key={transaction.id}
                    onSwipeLeft={() => onDelete(transaction)}
                    onSwipeRight={() => onEdit(transaction)}
                  >
                  <div 
                    className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center dark:bg-gray-700">
                        <span className="text-lg">{getCatEmoji(transaction.category)}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{transaction.title}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <span>{getCatLabel(transaction.category)}</span>
                          <span>•</span>
                          <span>{getWalletName(transaction.wallet_id)}</span>
                        </div>
                        {transaction.notes && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{transaction.notes}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="text-left">
                        <div className="flex items-center gap-1">
                          {getTransactionIcon(transaction.type)}
                          <span className={`font-bold ${getAmountColor(transaction.type)}`}>
                            {transaction.type === 'expense' ? '-' : '+'}
                            {transaction.amount.toLocaleString()} ج.م
                          </span>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="dark:text-gray-400 dark:hover:bg-gray-700">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="dark:bg-gray-800 dark:border-gray-700">
                          <DropdownMenuItem className="dark:text-gray-200 dark:hover:bg-gray-700" onClick={() => onEdit(transaction)}>
                            <Edit className="w-4 h-4 ml-2" />
                            تعديل
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => onDelete(transaction)}
                            className="text-red-600 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4 ml-2" />
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  </SwipeableRow>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
      {visibleCount < transactions.length && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            onClick={() => setVisibleCount(prev => prev + ITEMS_PER_PAGE)}
            className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
          >
            عرض المزيد ({transactions.length - visibleCount} معاملة متبقية)
          </Button>
        </div>
      )}
    </div>
  );
}
