import React from "react";
import { Card } from "@/components/ui/card";
import { Wallet } from "lucide-react";

export default function BalanceCard({ balance, visible, walletCount }) {
  return (
    <Card className="bg-white shadow-lg border-0 overflow-hidden dark:bg-gray-800 dark:border-gray-700">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-gray-600 text-sm dark:text-gray-300">إجمالي الرصيد</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{walletCount} محفظة</p>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            {visible ? `${balance.toLocaleString()} ج.م` : "••••••"}
          </h2>
          <div className="w-16 h-1 bg-primary rounded-full mx-auto"></div>
        </div>
      </div>
    </Card>
  );
}