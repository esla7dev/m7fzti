
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const walletTypeNames = {
  cash: "نقدي",
  bank: "بنكي",
  credit_card: "بطاقة ائتمان",
  savings: "ادخار",
  investment: "استثمار"
};

export default function WalletCard({ wallet, icon: Icon, onUpdate }) {
  const currencySymbols = {
    EGP: 'ج.م',
    SAR: 'ر.س',
    USD: '$',
    EUR: '€',
    GBP: '£'
  };

  return (
    <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 dark:bg-gray-800 dark:border-gray-700">
      <CardContent className="p-0">
        <div 
          className="p-6 text-white"
          style={{ backgroundColor: wallet.color || '#10b981' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">{wallet.name}</h3>
                <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs">
                  {walletTypeNames[wallet.type]}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="text-left">
            <p className="text-white/80 text-sm mb-1">الرصيد الحالي</p>
            <h2 className="text-2xl font-bold">
              {wallet.balance?.toLocaleString() || 0} {currencySymbols[wallet.currency] || wallet.currency}
            </h2>
          </div>
        </div>
        
        <div className="p-4 bg-white dark:bg-gray-800">
          <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
            <span>آخر تحديث</span>
            <span>{new Date(wallet.updated_date).toLocaleDateString('en-GB')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
