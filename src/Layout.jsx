import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, Wallet, ArrowLeftRight, TrendingUp, Settings } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

const navigationItems = [
  {
    title: "الرئيسية",
    url: createPageUrl("Dashboard"),
    icon: Home,
  },
  {
    title: "المحافظ",
    url: createPageUrl("Wallets"),
    icon: Wallet,
  },
  {
    title: "المعاملات",
    url: createPageUrl("Transactions"),
    icon: ArrowLeftRight,
  },
  {
    title: "التقارير",
    url: createPageUrl("Reports"),
    icon: TrendingUp,
  },
  {
    title: "الإعدادات",
    url: createPageUrl("Settings"),
    icon: Settings,
  }
];

export default function Layout({ children, currentPageName: _currentPageName }) {
  const location = useLocation();
  const { userSettings } = useAuth();

  const theme = userSettings?.theme || 'light';
  const currentColors = {
    primary: userSettings?.primary_color || '#10b981',
    secondary: userSettings?.secondary_color || '#065f46',
    accent: userSettings?.accent_color || '#34d399',
  };

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', currentColors.primary);
    root.style.setProperty('--color-secondary', currentColors.secondary);
    root.style.setProperty('--color-accent', currentColors.accent);
    root.style.setProperty('--color-primary-rgb', hexToRgb(currentColors.primary));
    root.style.setProperty('--color-secondary-rgb', hexToRgb(currentColors.secondary));
    root.style.setProperty('--color-accent-rgb', hexToRgb(currentColors.accent));
  }, [currentColors.primary, currentColors.secondary, currentColors.accent]);

  return (
    <div className={`${theme} min-h-screen bg-gray-50 dark:bg-gray-900`} dir="rtl" style={{ overscrollBehavior: 'none' }}>

      {/* Main Content */}
      <main className="pb-20" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 5rem)', overscrollBehavior: 'none' }}>
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 pt-2 dark:bg-gray-800 dark:border-gray-700" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.5rem)' }}>
        <div className="flex justify-around items-center">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.url;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.title}
                to={item.url}
                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-gray-500 hover:text-primary hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-primary'
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{item.title}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result 
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : "16, 185, 129";
}