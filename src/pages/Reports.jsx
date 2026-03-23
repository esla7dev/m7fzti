import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Tooltip, LineChart, Line, Legend, AreaChart, Area } from 'recharts';
import { TrendingUp, PieChart as PieChartIcon, Wallet as WalletIcon, BarChart3, ArrowUp, ArrowDown, Target, Calculator, Activity } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useTransactions } from "@/hooks/useTransactionQueries";
import { useWallets } from "@/hooks/useWalletQueries";
import { useBudgets } from "@/hooks/useBudgetQueries";
import { useAllCategories } from "@/hooks/useCategoryQueries";

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6b7280'];

export default function ReportsPage() {
  const { user } = useAuth();
  const [timeFilter, setTimeFilter] = useState('thisMonth');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');

  const { data: transactions = [], isLoading: txLoading } = useTransactions(user?.id);
  const { data: wallets = [], isLoading: walletsLoading } = useWallets(user?.id);
  const { data: budgets = [], isLoading: budgetsLoading } = useBudgets(user?.id);
  const allCategories = useAllCategories(user?.id);

  const getCategoryName = (key) => allCategories.find(c => c.key === key)?.label ?? key;

  const loading = txLoading || walletsLoading || budgetsLoading;

  useEffect(() => {
    // Set default custom dates to this month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setCustomDateFrom(firstDay.toISOString().split('T')[0]);
    setCustomDateTo(lastDay.toISOString().split('T')[0]);
  }, []);

  const getFilteredTransactions = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      
      switch (timeFilter) {
        case 'thisMonth':
          return transactionDate.getMonth() === currentMonth && 
                 transactionDate.getFullYear() === currentYear;
        case 'lastMonth':
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          return transactionDate.getMonth() === lastMonth && 
                 transactionDate.getFullYear() === lastMonthYear;
        case 'thisYear':
          return transactionDate.getFullYear() === currentYear;
        case 'last7days': {
          const d7 = new Date(); d7.setDate(d7.getDate() - 7);
          return transactionDate >= d7;
        }
        case 'last30days': {
          const d30 = new Date(); d30.setDate(d30.getDate() - 30);
          return transactionDate >= d30;
        }
        case 'last90days': {
          const d90 = new Date(); d90.setDate(d90.getDate() - 90);
          return transactionDate >= d90;
        }
        case 'thisQuarter': {
          const qStartMonth = Math.floor(currentMonth / 3) * 3;
          const qStart = new Date(currentYear, qStartMonth, 1);
          const qEnd = new Date(currentYear, qStartMonth + 3, 0);
          return transactionDate >= qStart && transactionDate <= qEnd;
        }
        case 'lastQuarter': {
          const curQ = Math.floor(currentMonth / 3);
          const lqQ = curQ === 0 ? 3 : curQ - 1;
          const lqYear = curQ === 0 ? currentYear - 1 : currentYear;
          const lqStart = new Date(lqYear, lqQ * 3, 1);
          const lqEnd = new Date(lqYear, lqQ * 3 + 3, 0);
          return transactionDate >= lqStart && transactionDate <= lqEnd;
        }
        case 'custom':
          if (!customDateFrom || !customDateTo) return false;
          const fromDate = new Date(customDateFrom);
          const toDate = new Date(customDateTo);
          return transactionDate >= fromDate && transactionDate <= toDate;
        case 'all':
          return true;
        default:
          return true;
      }
    });
  };

  // تحليل المصروفات حسب الفئة (مخطط دائري)
  const getCategoryExpensesData = () => {
    const filteredTransactions = getFilteredTransactions();
    const expensesByCategory = {};
    
    filteredTransactions
      .filter(t => t.type === 'expense')
      .forEach(transaction => {
        const category = transaction.category;
        if (!expensesByCategory[category]) {
          expensesByCategory[category] = 0;
        }
        expensesByCategory[category] += transaction.amount;
      });

    return Object.entries(expensesByCategory).map(([category, amount]) => ({
      name: getCategoryName(category),
      value: amount,
      percentage: 0 // سيتم حسابها
    })).sort((a, b) => b.value - a.value);
  };

  // أكبر المعاملات
  const getTopTransactions = () => {
    const filteredTransactions = getFilteredTransactions();
    return {
      expenses: filteredTransactions
        .filter(t => t.type === 'expense')
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5),
      income: filteredTransactions
        .filter(t => t.type === 'income')
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5)
    };
  };

  // تحليل أداء المحافظ - صافي التدفقات
  const getWalletFlows = () => {
    const filteredTransactions = getFilteredTransactions();
    const walletFlows = {};
    
    wallets.forEach(wallet => {
      walletFlows[wallet.id] = {
        name: wallet.name,
        color: wallet.color,
        inflow: 0,
        outflow: 0,
        netFlow: 0,
        transactionCount: 0
      };
    });

    filteredTransactions.forEach(transaction => {
      const walletId = transaction.wallet_id;
      if (walletFlows[walletId]) {
        walletFlows[walletId].transactionCount++;
        
        if (transaction.type === 'income') {
          walletFlows[walletId].inflow += transaction.amount;
        } else if (transaction.type === 'expense') {
          walletFlows[walletId].outflow += transaction.amount;
        } else if (transaction.type === 'transfer') {
          walletFlows[walletId].outflow += transaction.amount;
          if (transaction.to_wallet_id && walletFlows[transaction.to_wallet_id]) {
            walletFlows[transaction.to_wallet_id].inflow += transaction.amount;
          }
        }
      }
    });

    Object.keys(walletFlows).forEach(walletId => {
      walletFlows[walletId].netFlow = walletFlows[walletId].inflow - walletFlows[walletId].outflow;
    });

    return Object.values(walletFlows);
  };

  // الاتجاهات الشهرية للفئات
  const getCategoryTrends = () => {
    const monthlyData = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleDateString('ar-EG', { month: 'short' });
      
      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === date.getMonth() && 
               tDate.getFullYear() === date.getFullYear() &&
               t.type === 'expense';
      });
      
      const monthData = { month: monthName };
      
      allCategories.forEach(({ key }) => {
        const categoryAmount = monthTransactions
          .filter(t => t.category === key)
          .reduce((sum, t) => sum + t.amount, 0);
        monthData[getCategoryName(key)] = categoryAmount;
      });
      
      monthlyData.push(monthData);
    }
    
    return monthlyData;
  };

  // مقارنة بالفترات السابقة
  const getPeriodComparison = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const currentPeriod = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getMonth() === currentMonth && 
             tDate.getFullYear() === currentYear;
    });
    
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    const previousPeriod = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getMonth() === lastMonth && 
             tDate.getFullYear() === lastMonthYear;
    });
    
    const currentIncome = currentPeriod.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const currentExpenses = currentPeriod.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    
    const previousIncome = previousPeriod.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const previousExpenses = previousPeriod.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    
    const incomeChange = previousIncome !== 0 ? ((currentIncome - previousIncome) / previousIncome) * 100 : 0;
    const expenseChange = previousExpenses !== 0 ? ((currentExpenses - previousExpenses) / previousExpenses) * 100 : 0;
    
    return {
      current: { income: currentIncome, expenses: currentExpenses },
      previous: { income: previousIncome, expenses: previousExpenses },
      changes: { income: incomeChange, expenses: expenseChange }
    };
  };

  const getBudgetComparisonData = () => {
    const now = new Date();
    return budgets.map(budget => {
      const spent = transactions
        .filter(t => {
          if (t.type !== 'expense' || t.category !== budget.category) return false;
          const tDate = new Date(t.date);
          if (budget.period === 'yearly') return tDate.getFullYear() === now.getFullYear();
          return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
        })
        .reduce((sum, t) => sum + t.amount, 0);
      return {
        name: getCategoryName(budget.category),
        'الحد الأقصى': budget.limit_amount,
        'المُنفق': spent,
      };
    });
  };

  // الدخل مقابل المصروفات شهرياً
  const getMonthlyIncomeVsExpenses = () => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthName = d.toLocaleDateString('ar-EG', { month: 'short' });
      const monthTxns = transactions.filter(t => {
        const td = new Date(t.date);
        return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
      });
      data.push({
        month: monthName,
        'الدخل': monthTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        'المصروفات': monthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      });
    }
    return data;
  };

  // مؤشرات مالية
  const getFinancialMetrics = () => {
    const filtered = getFilteredTransactions();
    const expenses = filtered.filter(t => t.type === 'expense');
    const income = filtered.filter(t => t.type === 'income');
    const totalInc = income.reduce((s, t) => s + t.amount, 0);
    const totalExp = expenses.reduce((s, t) => s + t.amount, 0);
    const savingsRate = totalInc > 0 ? ((totalInc - totalExp) / totalInc * 100) : 0;
    const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const dayTotals = [0, 0, 0, 0, 0, 0, 0];
    expenses.forEach(t => { dayTotals[new Date(t.date).getDay()] += t.amount; });
    let busiestDay = 0;
    dayTotals.forEach((total, i) => { if (total > dayTotals[busiestDay]) busiestDay = i; });
    return {
      savingsRate,
      busiestDay: expenses.length > 0 ? dayNames[busiestDay] : '-',
      largestExpense: expenses.length > 0 ? expenses.reduce((max, t) => t.amount > max.amount ? t : max) : null,
      avgExpense: expenses.length > 0 ? totalExp / expenses.length : 0,
      categoryCount: new Set(expenses.map(t => t.category)).size,
      totalTransactions: filtered.length,
    };
  };

  // توقعات الإنفاق
  const getForecastData = () => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthName = d.toLocaleDateString('ar-EG', { month: 'short' });
      const total = transactions
        .filter(t => {
          const td = new Date(t.date);
          return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear() && t.type === 'expense';
        })
        .reduce((s, t) => s + t.amount, 0);
      data.push({ month: monthName, 'المصروفات': total, 'التوقع': null });
    }
    const values = data.map(d => d['المصروفات']);
    const lastThree = values.slice(-3);
    const avg = lastThree.length > 0 ? lastThree.reduce((s, v) => s + v, 0) / lastThree.length : 0;
    data[data.length - 1]['التوقع'] = data[data.length - 1]['المصروفات'];
    for (let i = 1; i <= 2; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() + i);
      const monthName = d.toLocaleDateString('ar-EG', { month: 'short' });
      data.push({ month: monthName, 'المصروفات': null, 'التوقع': Math.round(avg) });
    }
    return data;
  };

  const filteredTransactions = getFilteredTransactions();
  const categoryExpenses = getCategoryExpensesData();
  const topTransactions = getTopTransactions();
  const walletFlows = getWalletFlows();
  const categoryTrends = getCategoryTrends();
  const periodComparison = getPeriodComparison();
  const monthlyComparison = getMonthlyIncomeVsExpenses();
  const financialMetrics = getFinancialMetrics();
  const forecastData = getForecastData();
  
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const walletBalanceData = wallets.map(wallet => ({
    name: wallet.name,
    balance: wallet.balance,
    color: wallet.color
  }));

  // حساب النسب المئوية للمخطط الدائري
  const totalCategoryExpenses = categoryExpenses.reduce((sum, cat) => sum + cat.value, 0);
  categoryExpenses.forEach(cat => {
    cat.percentage = totalCategoryExpenses > 0 ? ((cat.value / totalCategoryExpenses) * 100).toFixed(1) : 0;
  });

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-32 bg-gray-200 rounded-xl animate-pulse dark:bg-gray-700"></div>
        <div className="h-64 bg-gray-200 rounded-xl animate-pulse dark:bg-gray-700"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-primary text-white px-4 pt-12 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">التقارير والتحليلات</h1>
            <p className="text-white/80 text-sm">رؤى مفصلة لوضعك المالي</p>
          </div>
        </div>

        {/* Time Filter */}
        <div className="mt-4 space-y-3">
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="bg-white/20 border-white/30 text-white dark:bg-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700">
              <SelectItem value="thisMonth">هذا الشهر</SelectItem>
              <SelectItem value="lastMonth">الشهر الماضي</SelectItem>
              <SelectItem value="last7days">آخر 7 أيام</SelectItem>
              <SelectItem value="last30days">آخر 30 يوم</SelectItem>
              <SelectItem value="last90days">آخر 90 يوم</SelectItem>
              <SelectItem value="thisQuarter">هذا الربع</SelectItem>
              <SelectItem value="lastQuarter">الربع الماضي</SelectItem>
              <SelectItem value="thisYear">هذا العام</SelectItem>
              <SelectItem value="custom">فترة مخصصة</SelectItem>
              <SelectItem value="all">جميع الفترات</SelectItem>
            </SelectContent>
          </Select>

          {/* Custom Date Range */}
          {timeFilter === 'custom' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="dateFrom" className="text-white text-sm">من</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={customDateFrom}
                  onChange={(e) => setCustomDateFrom(e.target.value)}
                  className="bg-white/20 border-white/30 text-white dark:bg-white/10"
                />
              </div>
              <div>
                <Label htmlFor="dateTo" className="text-white text-sm">إلى</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={customDateTo}
                  onChange={(e) => setCustomDateTo(e.target.value)}
                  className="bg-white/20 border-white/30 text-white dark:bg-white/10"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-6">
        {/* الميزانية مقابل الإنفاق الفعلي */}
        {budgets.length > 0 && (
          <Card className="shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                الميزانية مقابل الإنفاق الفعلي
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getBudgetComparisonData()} layout="vertical" margin={{ right: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                    <XAxis type="number" tick={{ fill: 'rgb(156 163 175)' }} />
                    <YAxis type="category" dataKey="name" tick={{ fill: 'rgb(156 163 175)' }} width={60} />
                    <Tooltip formatter={(value) => `${value.toLocaleString()} ج.م`} contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#f3f4f6' }} />
                    <Legend />
                    <Bar dataKey="الحد الأقصى" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="المُنفق" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* مقارنة بالفترات السابقة */}
        <Card className="shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              مقارنة بالشهر الماضي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">الدخل</span>
                  <div className="flex items-center gap-1">
                    {periodComparison.changes.income >= 0 ? (
                      <ArrowUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <ArrowDown className="w-4 h-4 text-red-600" />
                    )}
                    <span className={`text-xs ${periodComparison.changes.income >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {Math.abs(periodComparison.changes.income).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <p className="text-2xl font-bold text-green-800 dark:text-green-300">
                  {periodComparison.current.income.toLocaleString()} ج.م
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  الشهر الماضي: {periodComparison.previous.income.toLocaleString()} ج.م
                </p>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-red-700 dark:text-red-400">المصروفات</span>
                  <div className="flex items-center gap-1">
                    {periodComparison.changes.expenses >= 0 ? (
                      <ArrowUp className="w-4 h-4 text-red-600" />
                    ) : (
                      <ArrowDown className="w-4 h-4 text-green-600" />
                    )}
                    <span className={`text-xs ${periodComparison.changes.expenses >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {Math.abs(periodComparison.changes.expenses).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <p className="text-2xl font-bold text-red-800 dark:text-red-300">
                  {periodComparison.current.expenses.toLocaleString()} ج.م
                </p>
                <p className="text-xs text-red-600 dark:text-red-400">
                  الشهر الماضي: {periodComparison.previous.expenses.toLocaleString()} ج.م
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* مؤشرات مالية */}
        <Card className="shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              مؤشرات مالية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-center">
                <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">معدل الادخار</p>
                <p className="text-xl font-bold text-blue-800 dark:text-blue-300">
                  {financialMetrics.savingsRate.toFixed(1)}%
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg text-center">
                <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">أكثر يوم إنفاقاً</p>
                <p className="text-xl font-bold text-purple-800 dark:text-purple-300">
                  {financialMetrics.busiestDay}
                </p>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg text-center">
                <p className="text-xs text-orange-600 dark:text-orange-400 mb-1">متوسط المصروف</p>
                <p className="text-xl font-bold text-orange-800 dark:text-orange-300">
                  {financialMetrics.avgExpense.toLocaleString(undefined, {maximumFractionDigits: 0})} ج.م
                </p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg text-center">
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">أكبر مصروف</p>
                <p className="text-lg font-bold text-emerald-800 dark:text-emerald-300">
                  {financialMetrics.largestExpense ? `${financialMetrics.largestExpense.amount.toLocaleString()} ج.م` : '-'}
                </p>
              </div>
              <div className="bg-pink-50 dark:bg-pink-900/20 p-3 rounded-lg text-center">
                <p className="text-xs text-pink-600 dark:text-pink-400 mb-1">تنوع الفئات</p>
                <p className="text-xl font-bold text-pink-800 dark:text-pink-300">
                  {financialMetrics.categoryCount} فئات
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-center">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">إجمالي المعاملات</p>
                <p className="text-xl font-bold text-gray-800 dark:text-gray-200">
                  {financialMetrics.totalTransactions}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* الدخل مقابل المصروفات شهرياً */}
        <Card className="shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              الدخل مقابل المصروفات (آخر 6 أشهر)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyComparison}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis dataKey="month" tick={{ fill: 'rgb(156 163 175)' }} />
                  <YAxis tick={{ fill: 'rgb(156 163 175)' }} />
                  <Tooltip formatter={(value) => `${value.toLocaleString()} ج.م`} contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#f3f4f6' }} />
                  <Legend />
                  <Bar dataKey="الدخل" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="المصروفات" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* توزيع المصروفات حسب الفئة */}
        <Card className="shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-primary" />
              توزيع المصروفات حسب الفئة
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryExpenses.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryExpenses}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name} ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryExpenses.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value.toLocaleString()} ج.م`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {categoryExpenses.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {item.name}
                        </span>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                          {item.value.toLocaleString()} ج.م
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {item.percentage}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">لا توجد مصروفات في هذه الفترة</p>
            )}
          </CardContent>
        </Card>

        {/* أكبر المعاملات */}
        <Card className="shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              أكبر المعاملات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* أكبر المصروفات */}
              <div>
                <h4 className="font-semibold text-red-600 dark:text-red-400 mb-3">أكبر المصروفات</h4>
                <div className="space-y-3">
                  {topTransactions.expenses.length > 0 ? (
                    topTransactions.expenses.map((transaction, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{transaction.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {getCategoryName(transaction.category)} • {new Date(transaction.date).toLocaleDateString('en-GB')}
                          </p>
                        </div>
                        <p className="font-bold text-red-600 dark:text-red-400">
                          -{transaction.amount.toLocaleString()} ج.م
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-4">لا توجد مصروفات</p>
                  )}
                </div>
              </div>

              {/* أكبر الإيرادات */}
              <div>
                <h4 className="font-semibold text-green-600 dark:text-green-400 mb-3">أكبر الإيرادات</h4>
                <div className="space-y-3">
                  {topTransactions.income.length > 0 ? (
                    topTransactions.income.map((transaction, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{transaction.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {getCategoryName(transaction.category)} • {new Date(transaction.date).toLocaleDateString('en-GB')}
                          </p>
                        </div>
                        <p className="font-bold text-green-600 dark:text-green-400">
                          +{transaction.amount.toLocaleString()} ج.م
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-4">لا توجد إيرادات</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* صافي التدفقات للمحافظ */}
        <Card className="shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <WalletIcon className="w-5 h-5 text-primary" />
              أداء المحافظ - صافي التدفقات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {walletFlows.map((wallet, index) => (
                <div key={index} className="border dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: wallet.color }}
                      />
                      <span className="font-medium text-gray-900 dark:text-gray-100">{wallet.name}</span>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {wallet.transactionCount} معاملة
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-300">تدفق داخلي</p>
                      <p className="font-bold text-green-600 dark:text-green-400">
                        +{wallet.inflow.toLocaleString()} ج.م
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-300">تدفق خارجي</p>
                      <p className="font-bold text-red-600 dark:text-red-400">
                        -{wallet.outflow.toLocaleString()} ج.م
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-300">صافي التدفق</p>
                      <p className={`font-bold ${wallet.netFlow >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {wallet.netFlow >= 0 ? '+' : ''}{wallet.netFlow.toLocaleString()} ج.م
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* رصيد المحافظ الحالي */}
        <Card className="shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900 dark:text-gray-100">أرصدة المحافظ الحالية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={walletBalanceData}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis dataKey="name" tick={{ fill: 'rgb(156 163 175)' }} />
                  <YAxis tick={{ fill: 'rgb(156 163 175)' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none' }} />
                  <Bar dataKey="balance" fill="#10b981" name="الرصيد الحالي" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* الاتجاهات الشهرية للفئات */}
        <Card className="shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              اتجاهات الإنفاق حسب الفئات (آخر 6 أشهر)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={categoryTrends}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis dataKey="month" tick={{ fill: 'rgb(156 163 175)' }} />
                  <YAxis tick={{ fill: 'rgb(156 163 175)' }} />
                  <Tooltip formatter={(value) => `${value.toLocaleString()} ج.م`} contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#f3f4f6' }} />
                  <Legend />
                  <Line type="monotone" dataKey="طعام" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="مواصلات" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="ترفيه" stroke="#8b5cf6" strokeWidth={2} />
                  <Line type="monotone" dataKey="تسوق" stroke="#f59e0b" strokeWidth={2} />
                  <Line type="monotone" dataKey="فواتير" stroke="#ef4444" strokeWidth={2} />
                  <Line type="monotone" dataKey="صحة" stroke="#06b6d4" strokeWidth={2} />
                  <Line type="monotone" dataKey="تعليم" stroke="#84cc16" strokeWidth={2} />
                  <Line type="monotone" dataKey="استثمار" stroke="#f97316" strokeWidth={2} />
                  <Line type="monotone" dataKey="أخرى" stroke="#ec4899" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* توقعات الإنفاق */}
        <Card className="shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              توقعات الإنفاق
            </CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400">بناءً على متوسط آخر 3 أشهر</p>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis dataKey="month" tick={{ fill: 'rgb(156 163 175)' }} />
                  <YAxis tick={{ fill: 'rgb(156 163 175)' }} />
                  <Tooltip formatter={(value) => value != null ? `${value.toLocaleString()} ج.م` : '-'} contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#f3f4f6' }} />
                  <Legend />
                  <Area type="monotone" dataKey="المصروفات" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} connectNulls={false} />
                  <Area type="monotone" dataKey="التوقع" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} strokeWidth={2} strokeDasharray="8 4" connectNulls={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Spacing */}
        <div className="h-4"></div>
      </div>
    </div>
  );
}