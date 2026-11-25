import React, { useEffect, useState } from 'react';
import { PageLayout } from '@/components/ui/PageLayout';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { PasswordRequirementsChecklist } from '@/features/auth/components/PasswordRequirementsChecklist';
import { platformPath } from '@/lib/tenant';
import { getApiErrorMessage } from '@/lib/api';
import { formatDateArabic } from '@/lib/date';
import { assistantsApi } from '../api';
import { AssistantDto, PERMISSION_OPTIONS } from '../types';
import {
  UserCog,
  Plus,
  Shield,
  Trash2,
  Phone,
  Mail,
  Lock,
  User,
  Check,
} from 'lucide-react';

export const AssistantsPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [assistants, setAssistants] = useState<AssistantDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Permissions Modal State
  const [editingAssistant, setEditingAssistant] = useState<AssistantDto | null>(null);
  const [editPermissions, setEditPermissions] = useState<number>(0);

  // Delete State
  const [assistantToDelete, setAssistantToDelete] = useState<AssistantDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadAssistants = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const list = await assistantsApi.getAll();
      setAssistants(list);
    } catch (err) {
      setError(getApiErrorMessage(err, 'تعذر تحميل قائمة المساعدين'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadAssistants();
  }, []);

  const toggleBit = (current: number, bit: number) =>
    (current & bit) === bit ? current & ~bit : current | bit;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const created = await assistantsApi.create({
        name,
        email,
        password,
        phoneNumber: phoneNumber.trim() || undefined,
        permissions: selectedPermissions,
      });
      setAssistants((prev) => [created, ...prev]);
      success(`تمت إضافة المساعد «${created.name}» بنجاح.`);
      setIsCreateOpen(false);
      setName('');
      setEmail('');
      setPassword('');
      setPhoneNumber('');
      setSelectedPermissions(1);
    } catch (err) {
      toastError(getApiErrorMessage(err, 'فشل إضافة المساعد'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSavePermissions = async () => {
    if (!editingAssistant) return;
    try {
      setIsSubmitting(true);
      const updated = await assistantsApi.updatePermissions(editingAssistant.id, {
        permissions: editPermissions,
      });
      setAssistants((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      success('تم تحديث صلاحيات المساعد بنجاح.');
      setEditingAssistant(null);
    } catch (err) {
      toastError(getApiErrorMessage(err, 'فشل تحديث الصلاحيات'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!assistantToDelete) return;
    try {
      setIsDeleting(true);
      await assistantsApi.delete(assistantToDelete.id);
      setAssistants((prev) => prev.filter((a) => a.id !== assistantToDelete.id));
      success(`تمت إزالة المساعد «${assistantToDelete.name}».`);
      setAssistantToDelete(null);
    } catch (err) {
      toastError(getApiErrorMessage(err, 'فشل حذف المساعد'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <PageLayout
      title="فريق المساعدين (Assistants)"
      description="أضف مساعداً أو أكثر لمنصتك وحدد صلاحيات كل مساعد بدقة لمتابعة الطلاب وإدارة المجموعات."
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: 'لوحة التحكم', href: platformPath('/dashboard/teacher') },
            { label: 'المساعدين' },
          ]}
        />
      }
      actions={
        <Button
          variant="primary"
          size="sm"
          className="font-bold"
          startIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsCreateOpen(true)}
        >
          إضافة مساعد جديد
        </Button>
      }
      isLoading={isLoading}
      skeleton={
        <div className="space-y-3">
          <SkeletonRow />
          <SkeletonRow />
        </div>
      }
      error={error}
      onRetry={loadAssistants}
    >
      <div className="space-y-4 text-start">
        {assistants.length === 0 ? (
          <EmptyState
            icon={<UserCog className="w-10 h-10 text-text-muted" />}
            title="لم تضف أي مساعد بعد"
            description="أضف مساعديك ليتمكنوا من متابعة درجات الطلاب وواجباتهم والتواصل مع أولياء الأمور."
            action={
              <Button
                variant="primary"
                startIcon={<Plus className="w-4 h-4" />}
                onClick={() => setIsCreateOpen(true)}
              >
                إضافة أول مساعد
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assistants.map((assistant) => (
              <Card key={assistant.id} className="border-border">
                <CardContent className="pt-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-light text-primary font-bold text-sm flex items-center justify-center shrink-0">
                        {assistant.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-text-main">{assistant.name}</h3>
                        <p className="text-xs font-mono text-text-muted">{assistant.email}</p>
                        {assistant.phoneNumber && (
                          <p dir="ltr" className="text-xs font-mono text-text-subtle mt-0.5 text-end">
                            {assistant.phoneNumber}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant="primary" size="sm">
                      مساعد
                    </Badge>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-text-muted mb-2">الصلاحيات الممنوحة:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {PERMISSION_OPTIONS.filter(
                        (opt) => (assistant.permissions & opt.value) === opt.value
                      ).map((opt) => (
                        <Badge key={opt.value} variant="neutral" size="sm">
                          {opt.label}
                        </Badge>
                      ))}
                      {assistant.permissions === 0 && (
                        <span className="text-xs text-text-subtle">بدون صلاحيات مفعّلة</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border-subtle flex items-center justify-between">
                    <span className="text-xs text-text-subtle">
                      أُضيف {formatDateArabic(assistant.createdAt)}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        startIcon={<Shield className="w-3.5 h-3.5" />}
                        onClick={() => {
                          setEditingAssistant(assistant);
                          setEditPermissions(assistant.permissions);
                        }}
                      >
                        تعديل الصلاحيات
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs text-danger hover:bg-danger-bg"
                        startIcon={<Trash2 className="w-3.5 h-3.5" />}
                        onClick={() => setAssistantToDelete(assistant)}
                      >
                        حذف
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Assistant Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="إضافة مساعد جديد"
        description="يسجل المساعد دخوله من نفس صفحة دخول المعلم للوصول إلى الصلاحيات المحددة له."
      >
        <form onSubmit={handleCreate} className="space-y-4 text-start">
          <Input
            label="الاسم الكامل"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="أحمد محمود"
            startAdornment={<User className="w-4 h-4 text-text-subtle" />}
          />

          <Input
            label="البريد الإلكتروني للدخول"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="assistant@platform.local"
            startAdornment={<Mail className="w-4 h-4 text-text-subtle" />}
          />

          <div>
            <Input
              label="كلمة المرور"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="اكتب كلمة مرور قوية"
              startAdornment={<Lock className="w-4 h-4 text-text-subtle" />}
            />
            <PasswordRequirementsChecklist password={password} />
          </div>

          <Input
            label="رقم الهاتف (اختياري)"
            type="tel"
            dir="ltr"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="01012345678"
            startAdornment={<Phone className="w-4 h-4 text-text-subtle" />}
          />

          <div>
            <p className="text-sm font-medium text-text-main mb-2">صلاحيات المساعد</p>
            <div className="space-y-2">
              {PERMISSION_OPTIONS.map((opt) => {
                const checked = (selectedPermissions & opt.value) === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSelectedPermissions((prev) => toggleBit(prev, opt.value))}
                    className={`w-full text-start p-3 rounded-xl border transition-colors flex items-start justify-between gap-3 ${
                      checked
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-surface hover:bg-surface-hover'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-text-main">{opt.label}</p>
                      <p className="text-[11px] text-text-muted mt-0.5">{opt.description}</p>
                    </div>
                    <span
                      className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 mt-0.5 ${
                        checked
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-border bg-surface'
                      }`}
                    >
                      {checked && <Check className="w-3.5 h-3.5" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
              إلغاء
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              حفظ وإضافة المساعد
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Permissions Modal */}
      <Modal
        isOpen={!!editingAssistant}
        onClose={() => setEditingAssistant(null)}
        title={`تعديل صلاحيات: ${editingAssistant?.name || ''}`}
      >
        <div className="space-y-4 text-start">
          <div className="space-y-2">
            {PERMISSION_OPTIONS.map((opt) => {
              const checked = (editPermissions & opt.value) === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setEditPermissions((prev) => toggleBit(prev, opt.value))}
                  className={`w-full text-start p-3 rounded-xl border transition-colors flex items-start justify-between gap-3 ${
                    checked
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-surface hover:bg-surface-hover'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold text-text-main">{opt.label}</p>
                    <p className="text-[11px] text-text-muted mt-0.5">{opt.description}</p>
                  </div>
                  <span
                    className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 mt-0.5 ${
                      checked
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-border bg-surface'
                    }`}
                  >
                    {checked && <Check className="w-3.5 h-3.5" />}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setEditingAssistant(null)}>
              إلغاء
            </Button>
            <Button
              type="button"
              variant="primary"
              isLoading={isSubmitting}
              onClick={handleSavePermissions}
            >
              حفظ الصلاحيات
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!assistantToDelete}
        onClose={() => setAssistantToDelete(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="حذف المساعد"
        description={`هل أنت متأكد من إزالة المساعد «${assistantToDelete?.name}»؟ لن يتمكن من الدخول إلى لوحة الإدارة بعد الآن.`}
        confirmText="نعم، حذف"
        variant="danger"
      />
    </PageLayout>
  );
};
