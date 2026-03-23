
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Minus, ArrowUpDown } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/lib/AuthContext";
import { useAllCategories } from "@/hooks/useCategoryQueries";

export default function RecentTransactions({ transactions, onRefresh }) {
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

  return (
    <Card className="shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg text-gray-900 dark:text-gray-100">المعاملات الأخيرة</CardTitle>
        <Link to={createPageUrl("Transactions")}>
          <Button variant="ghost" size="sm" className="text-primary">
            عرض الكل
            <ArrowLeft className="w-4 h-4 mr-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">لا توجد معاملات بعد</p>
            <Link to={createPageUrl("Transactions")}>
              <Button className="mt-4 bg-primary">
                <Plus className="w-4 h-4 ml-2" />
                إضافة معاملة
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div 
                key={transaction.id} 
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-lg">{getCatEmoji(transaction.category)}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{transaction.title}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <span>{getCatLabel(transaction.category)}</span>
                      <span>•</span>
                      <span>{new Date(transaction.date).toLocaleDateString('en-GB')}</span>
                    </div>
                  </div>
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1">
                    {getTransactionIcon(transaction.type)}
                    <span className={`font-bold ${getAmountColor(transaction.type)}`}>
                      {transaction.type === 'expense' ? '-' : '+'}
                      {transaction.amount.toLocaleString()} ج.م
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
