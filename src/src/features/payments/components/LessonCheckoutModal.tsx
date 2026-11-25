import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { getApiErrorMessage } from '@/lib/api';
import { paymentsApi } from '../api';
import { LessonPaymentSessionDto, MockPaymentProvider } from '../types';
import {
  CreditCard,
  Smartphone,
  Store,
  Copy,
  Check,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  PlayCircle,
  Lock,
} from 'lucide-react';

interface LessonCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: { id: string; title: string; price: number } | null;
  onPurchased: (lessonId: string) => void;
}

const PROVIDERS: {
  id: MockPaymentProvider;
  title: string;
  subtitle: string;
  badge: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'Fawry',
    title: 'فوري (Fawry Pay)',
    subtitle: 'ادفع بكود مرجعي من أي ماكينة فوري أو تطبيق MyFawry',
    badge: 'الأكثر استخداماً',
    icon: <Store className="w-5 h-5 text-amber-600" />,
  },
  {
    id: 'VodafoneCash',
    title: 'فودافون كاش / المحافظ الإلكترونية',
    subtitle: 'فودافون كاش • أورنج كاش • اتصالات كاش • إنستاباي',
    badge: 'فوري ومباشر',
    icon: <Smartphone className="w-5 h-5 text-rose-600" />,
  },
  {
    id: 'PaymobCard',
    title: 'بطاقة بنكية (Visa / Mastercard / Meeza)',
    subtitle: 'عبر بوابة Paymob للدفع بالبطاقات البنكية المصرية',
    badge: 'بوابة بطاقات',
    icon: <CreditCard className="w-5 h-5 text-indigo-600" />,
  },
];

export const LessonCheckoutModal: React.FC<LessonCheckoutModalProps> = ({
  isOpen,
  onClose,
  lesson,
  onPurchased,
}) => {
  const { success, error: toastError } = useToast();
  const [selectedProvider, setSelectedProvider] = useState<MockPaymentProvider>('Fawry');
  const [session, setSession] = useState<LessonPaymentSessionDto | null>(null);
  const [isDone, setIsDone] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Mock provider fields
  const [walletPhone, setWalletPhone] = useState('01012345678');
  const [walletOtp, setWalletOtp] = useState('123456');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('123');

  useEffect(() => {
    if (isOpen) {
      setSelectedProvider('Fawry');
      setSession(null);
      setIsDone(false);
      setCopiedCode(false);
    }
  }, [isOpen, lesson?.id]);

  if (!lesson) return null;

  const handleInitiate = async () => {
    try {
      setIsBusy(true);
      const res = await paymentsApi.initiateLessonPayment(lesson.id, {
        provider: selectedProvider,
        walletPhone: selectedProvider === 'VodafoneCash' ? walletPhone : undefined,
      });
      setSession(res);
    } catch (err) {
      toastError(getApiErrorMessage(err, 'تعذر بدء عملية الدفع'));
    } finally {
      setIsBusy(false);
    }
  };

  const handleConfirmMock = async () => {
    if (!session) return;
    try {
      setIsBusy(true);
      const confirmed = await paymentsApi.confirmMockPurchase(session.purchaseId);
      setSession(confirmed);
      setIsDone(true);
      success('تم تأكيد الدفع التجريبي وفتح المحاضرة لك بنجاح!');
      onPurchased(lesson.id);
    } catch (err) {
      toastError(getApiErrorMessage(err, 'تعذر تأكيد الدفع'));
    } finally {
      setIsBusy(false);
    }
  };

  const handleCopyCode = async () => {
    if (!session?.referenceCode) return;
    try {
      await navigator.clipboard.writeText(session.referenceCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-primary" />
          <span>شراء وفتح المحاضرة</span>
        </div>
      }
      description={lesson.title}
    >
      <div className="space-y-4 text-start">
        {/* Honest Mock Banner + Price Summary */}
        <div className="p-3.5 rounded-xl border border-amber-300/70 bg-amber-50/70 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <Badge variant="warning" size="sm" className="gap-1">
              <Sparkles className="w-3 h-3" />
              <span>محاكاة دفع تجريبية (Mock)</span>
            </Badge>
            <p className="text-xs text-text-muted pt-1">
              هذا التدفق يحاكي بوابات الدفع المصرية للتجربة بدون خصم مالي فعلي.
            </p>
          </div>
          <div className="text-end shrink-0">
            <span className="text-xs text-text-muted block">الإجمالي</span>
            <span className="text-xl font-black text-primary font-heading">
              {lesson.price} ج.م
            </span>
          </div>
        </div>

        {/* STEP 1: Choose Payment Provider */}
        {!session && !isDone && (
          <div className="space-y-3">
            <p className="text-sm font-bold text-text-main">اختر وسيلة الدفع المناسبة:</p>
            <div className="space-y-2.5">
              {PROVIDERS.map((p) => {
                const active = selectedProvider === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedProvider(p.id)}
                    className={`w-full text-start p-3.5 rounded-xl border-2 transition-all flex items-center justify-between gap-3 ${
                      active
                        ? 'border-primary bg-primary/5 shadow-xs'
                        : 'border-border bg-surface hover:border-border-strong'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-surface-subtle border border-border flex items-center justify-center shrink-0">
                        {p.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-text-main">{p.title}</span>
                          <Badge variant="neutral" size="sm">
                            {p.badge}
                          </Badge>
                        </div>
                        <p className="text-xs text-text-muted mt-0.5">{p.subtitle}</p>
                      </div>
                    </div>
                    <span
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                        active
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-border'
                      }`}
                    >
                      {active && <Check className="w-3 h-3" />}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                إلغاء
              </Button>
              <Button
                type="button"
                variant="primary"
                isLoading={isBusy}
                onClick={handleInitiate}
                className="font-bold"
              >
                متابعة الدفع ({lesson.price} ج.م)
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Provider Mock Checkout Screen */}
        {session && !isDone && (
          <div className="space-y-4">
            {session.provider === 'Fawry' && (
              <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/40 space-y-3 text-center">
                <p className="text-xs font-semibold text-text-muted">كود الدفع المرجعي في فوري</p>
                <div className="flex items-center justify-center gap-2">
                  <span
                    dir="ltr"
                    className="font-mono text-2xl font-black tracking-widest text-text-main bg-surface px-4 py-2 rounded-xl border border-border"
                  >
                    {session.referenceCode}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyCode}
                    startIcon={copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  >
                    {copiedCode ? 'تم النسخ' : 'نسخ'}
                  </Button>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">{session.instructions}</p>
              </div>
            )}

            {session.provider === 'VodafoneCash' && (
              <div className="space-y-3 p-4 rounded-xl border border-border bg-surface-subtle">
                <p className="text-xs text-text-muted">{session.instructions}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="رقم المحفظة الإلكترونية"
                    dir="ltr"
                    value={walletPhone}
                    onChange={(e) => setWalletPhone(e.target.value)}
                  />
                  <Input
                    label="رمز التأكيد التجريبي (OTP)"
                    dir="ltr"
                    value={walletOtp}
                    onChange={(e) => setWalletOtp(e.target.value)}
                  />
                </div>
              </div>
            )}

            {session.provider === 'PaymobCard' && (
              <div className="space-y-3 p-4 rounded-xl border border-border bg-surface-subtle">
                <p className="text-xs text-text-muted">{session.instructions}</p>
                <Input
                  label="رقم البطاقة (بيانات اختبار)"
                  dir="ltr"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="تاريخ الانتهاء"
                    dir="ltr"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                  />
                  <Input
                    label="CVV"
                    dir="ltr"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSession(null)}
                disabled={isBusy}
              >
                تغيير وسيلة الدفع
              </Button>
              <Button
                type="button"
                variant="primary"
                isLoading={isBusy}
                onClick={handleConfirmMock}
                startIcon={<ShieldCheck className="w-4 h-4" />}
                className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {session.provider === 'Fawry'
                  ? 'محاكاة إتمام الدفع من فوري'
                  : 'تأكيد الدفع التجريبي الآن'}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Payment Success Receipt */}
        {session && isDone && (
          <div className="p-5 rounded-xl border border-emerald-300 bg-emerald-50/60 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-text-main font-heading">
              تم الدفع بنجاح وفتح المحاضرة!
            </h3>
            <p className="text-xs text-text-muted">
              المرجع: <span dir="ltr" className="font-mono font-bold text-text-main">{session.referenceCode}</span> • المبلغ: {session.amount} ج.م
            </p>
            <div className="pt-2">
              <Button
                type="button"
                variant="primary"
                onClick={onClose}
                startIcon={<PlayCircle className="w-4 h-4" />}
                className="font-bold"
              >
                إغلاق ومشاهدة المحاضرة
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
