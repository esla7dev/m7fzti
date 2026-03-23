import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function QuickStats({ income, expenses, visible }) {
  const netAmount = income - expenses;
  
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Income */}
      <Card className="bg-green-50 border-green-100 dark:bg-green-900/50 dark:border-green-800/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-800/50 rounded-full flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-green-700 text-sm font-medium dark:text-green-300">الدخل</span>
          </div>
          <p className="text-lg font-bold text-green-800 dark:text-green-200">
            {visible ? `+${income.toLocaleString()} ج.م` : "••••••"}
          </p>
          <p className="text-xs text-green-600 dark:text-green-500">هذا الشهر</p>
        </CardContent>
      </Card>

      {/* Expenses */}
      <Card className="bg-red-50 border-red-100 dark:bg-red-900/50 dark:border-red-800/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-red-100 dark:bg-red-800/50 rounded-full flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <span className="text-red-700 text-sm font-medium dark:text-red-300">المصروفات</span>
          </div>
          <p className="text-lg font-bold text-red-800 dark:text-red-200">
            {visible ? `-${expenses.toLocaleString()} ج.م` : "••••••"}
          </p>
          <p className="text-xs text-red-600 dark:text-red-500">هذا الشهر</p>
        </CardContent>
      </Card>
    </div>
  );
}