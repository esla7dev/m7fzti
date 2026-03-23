
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/AuthContext";
import { useAllCategories } from "@/hooks/useCategoryQueries";

const dateRangeOptions = [
  { value: 'all', label: 'جميع الفترات' },
  { value: 'today', label: 'اليوم' },
  { value: 'thisWeek', label: 'هذا الأسبوع' },
  { value: 'thisMonth', label: 'هذا الشهر' },
  { value: 'lastMonth', label: 'الشهر الماضي' },
  { value: 'thisYear', label: 'هذا العام' },
  { value: 'custom', label: 'فترة مخصصة' },
];

export default function TransactionFilters({ filters, onFiltersChange, wallets }) {
  const { user } = useAuth();
  const categories = useAllCategories(user?.id);

  const handleFilterChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardContent className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {/* Category Filter */}
          <div>
            <Select 
              value={filters.category} 
              onValueChange={(value) => handleFilterChange('category', value)}
            >
              <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                <SelectValue placeholder="الفئة" />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                <SelectItem value="all">جميع الفئات</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.key} value={category.key}>
                    {category.emoji} {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Wallet Filter */}
          <div>
            <Select 
              value={filters.wallet} 
              onValueChange={(value) => handleFilterChange('wallet', value)}
            >
              <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                <SelectValue placeholder="المحفظة" />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                <SelectItem value="all">جميع المحافظ</SelectItem>
                {wallets.map((wallet) => (
                  <SelectItem key={wallet.id} value={wallet.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: wallet.color }}
                      />
                      {wallet.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Filter */}
          <div>
            <Select
              value={filters.dateRange}
              onValueChange={(value) => handleFilterChange('dateRange', value)}
            >
              <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                <SelectValue placeholder="الفترة" />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                {dateRangeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount Range */}
          <div className="flex gap-2 items-center">
            <Input
              type="number"
              min="0"
              placeholder="من"
              value={filters.amountMin || ''}
              onChange={(e) => handleFilterChange('amountMin', e.target.value)}
              className="h-9 text-xs dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            />
            <span className="text-gray-400 text-xs">-</span>
            <Input
              type="number"
              min="0"
              placeholder="إلى"
              value={filters.amountMax || ''}
              onChange={(e) => handleFilterChange('amountMax', e.target.value)}
              className="h-9 text-xs dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            />
          </div>
        </div>

        {/* Custom date range inputs */}
        {filters.dateRange === 'custom' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-500 dark:text-gray-400">من</Label>
              <Input
                type="date"
                value={filters.customDateFrom || ''}
                onChange={(e) => handleFilterChange('customDateFrom', e.target.value)}
                className="h-9 text-xs dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500 dark:text-gray-400">إلى</Label>
              <Input
                type="date"
                value={filters.customDateTo || ''}
                onChange={(e) => handleFilterChange('customDateTo', e.target.value)}
                className="h-9 text-xs dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
