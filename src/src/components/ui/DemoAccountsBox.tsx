import React, { useState } from 'react';
import { DemoAccount } from '@/lib/demoAccounts';
import { FlaskConical, ChevronDown, ChevronUp, UserCheck, ArrowLeft } from 'lucide-react';

interface DemoAccountsBoxProps {
  accounts: DemoAccount[];
  onSelectAccount: (account: DemoAccount) => void;
  className?: string;
}

export const DemoAccountsBox: React.FC<DemoAccountsBoxProps> = ({
  accounts,
  onSelectAccount,
  className = '',
}) => {
  // Only render in development mode
  if (!import.meta.env.DEV || accounts.length === 0) {
    return null;
  }

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={`border border-border/80 rounded-xl bg-surface-subtle overflow-hidden transition-all text-start ${className}`}
      dir="rtl"
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-text-muted hover:text-text-main hover:bg-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <FlaskConical className="w-3.5 h-3.5 text-primary shrink-0" />
          <span>حسابات تجريبية (بيئة التطوير)</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            {accounts.length}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px]">
          <span>{isOpen ? 'إخفاء' : 'عرض الحسابات'}</span>
          {isOpen ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="p-2 pt-0 space-y-1.5 border-t border-border/50">
          <p className="text-[11px] text-text-muted px-2 py-1">
            اضغط على أي حساب لتعبئة البريد وكلمة المرور تلقائياً:
          </p>

          <div className="space-y-1">
            {accounts.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => onSelectAccount(acc)}
                className="w-full flex items-center justify-between p-2 rounded-lg bg-surface border border-border hover:border-primary/50 hover:bg-surface-hover text-start transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <UserCheck className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-text-main truncate">
                        {acc.label}
                      </span>
                      {acc.roleHint && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-subtle text-text-muted border border-border font-medium">
                          {acc.roleHint}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-text-muted font-mono block truncate">
                      {acc.email}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] font-medium text-primary flex items-center gap-1 shrink-0 ms-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>تعبئة</span>
                  <ArrowLeft className="w-3 h-3" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
