import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";

const ROOT_PAGES = ["/Dashboard", "/Wallets", "/Transactions", "/Reports", "/Settings", "/"];

export default function PageHeader({ title, subtitle, rightContent }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isRoot = ROOT_PAGES.includes(location.pathname);

  return (
    <div className="bg-primary text-white px-4 pb-6" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 3rem)' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!isRoot && (
            <button
              onClick={() => navigate(-1)}
              className="p-1 rounded-full hover:bg-white/20 transition-colors -mr-1"
              aria-label="رجوع"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            {subtitle && <p className="text-white/80 text-sm">{subtitle}</p>}
          </div>
        </div>
        {rightContent && <div>{rightContent}</div>}
      </div>
    </div>
  );
}