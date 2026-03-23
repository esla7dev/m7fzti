
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Minus, Heart, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function QuickActions() {
  const actions = [
    {
      title: "إضافة دخل",
      icon: Plus,
      color: "green",
      href: createPageUrl("Transactions") + "?action=add&type=income"
    },
    {
      title: "إضافة مصروف",
      icon: Minus,
      color: "red",
      href: createPageUrl("Transactions") + "?action=add&type=expense"
    },
    {
      title: "قائمة الأماني",
      icon: Heart,
      color: "pink",
      href: createPageUrl("Wishlist")
    },
    {
      title: "عرض التقارير",
      icon: BarChart3,
      color: "blue",
      href: createPageUrl("Reports")
    }
  ];

  const colorClasses = {
    green: {
      bg: "bg-green-100/60 dark:bg-green-900/40",
      text: "text-green-600 dark:text-green-400",
      border: "border-green-200 dark:border-green-800"
    },
    red: {
      bg: "bg-red-100/60 dark:bg-red-900/40",
      text: "text-red-600 dark:text-red-400",
      border: "border-red-200 dark:border-red-800"
    },
    pink: {
      bg: "bg-pink-100/60 dark:bg-pink-900/40",
      text: "text-pink-600 dark:text-pink-400",
      border: "border-pink-200 dark:border-pink-800"
    },
    blue: {
      bg: "bg-blue-100/60 dark:bg-blue-900/40",
      text: "text-blue-600 dark:text-blue-400",
      border: "border-blue-200 dark:border-blue-800"
    }
  };

  return (
    <Card className="shadow-sm bg-white border-0 dark:bg-gray-800 dark:border-gray-700">
      <CardContent className="p-4">
        <div className="grid grid-cols-4 gap-3 text-center">
          {actions.map((action, index) => {
            const Icon = action.icon;
            const colors = colorClasses[action.color];
            return (
              <Link key={index} to={action.href} className="flex flex-col items-center justify-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${colors.bg} ${colors.border}`}>
                  <Icon className={`w-6 h-6 ${colors.text}`} />
                </div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{action.title}</span>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
