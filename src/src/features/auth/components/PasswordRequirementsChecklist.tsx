import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

interface PasswordRequirementsChecklistProps {
  password: string;
}

interface PasswordRule {
  id: string;
  label: string;
  met: boolean;
}

export const PasswordRequirementsChecklist: React.FC<PasswordRequirementsChecklistProps> = ({
  password,
}) => {
  const rules: PasswordRule[] = [
    {
      id: 'length',
      label: 'على الأقل 8 أحرف',
      met: password.length >= 8 && password.length <= 100,
    },
    {
      id: 'letter',
      label: 'يحتوي على حرف واحد على الأقل',
      met: /\p{L}/u.test(password),
    },
    {
      id: 'digit',
      label: 'يحتوي على رقم واحد على الأقل',
      met: /[0-9]/.test(password),
    },
  ];

  return (
    <div
      className="mt-2 rounded-xl border border-border bg-surface-subtle p-3 space-y-1.5"
      aria-live="polite"
    >
      <p className="text-xs font-bold text-text-main mb-1">متطلبات كلمة المرور:</p>
      <ul className="space-y-1">
        {rules.map((rule) => (
          <li
            key={rule.id}
            className={`flex items-center gap-2 text-xs transition-colors duration-200 ${
              rule.met ? 'text-emerald-700 font-semibold' : 'text-text-muted'
            }`}
          >
            {rule.met ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 transition-transform duration-200 scale-105" />
            ) : (
              <Circle className="w-4 h-4 text-text-subtle shrink-0" />
            )}
            <span>{rule.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
