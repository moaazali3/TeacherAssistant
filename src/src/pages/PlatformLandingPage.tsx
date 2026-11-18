import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { platformPath } from '@/lib/tenant';
import {
  Sparkles,
  Palette,
  Globe,
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';

export const PlatformLandingPage: React.FC = () => {
  return (
    <div className="space-y-16 py-10 sm:py-16 text-start">
      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 mb-6 flex-wrap justify-center">
          <Badge variant="primary" size="md" className="gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>الجيل الجديد من منصات التعليم الذكي</span>
          </Badge>
          <Badge variant="neutral" size="md">
            نظام متعدد المستأجرين (Multi-Tenant)
          </Badge>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-text-main font-heading tracking-tight leading-tight mb-6">
          امتلك منصتك التعليمية المستقلة{' '}
          <span className="text-primary block sm:inline">بهويتك وعلامتك التجارية</span>
        </h1>

        <p className="text-lg sm:text-xl text-text-muted max-w-3xl mx-auto leading-relaxed mb-10">
          منصة سحابية متكاملة على غرار «شوبيفاي» مخصصة للمعلمين. يحصل كل معلم على موقع ونطاق مستقل، بألوانه وشعاره الخاص، لتدريس ومتابعة طلابه بأعلى درجات الخصوصية والاحترافية.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to={platformPath('/register')} className="w-full sm:w-auto">
            <Button
              variant="primary"
              size="lg"
              className="w-full sm:w-auto font-bold shadow-md"
              startIcon={<Sparkles className="w-5 h-5" />}
              endIcon={<ArrowLeft className="w-5 h-5 rtl:rotate-0" />}
            >
              ابدأ بإنشاء منصتك الآن مجاناً
            </Button>
          </Link>
          <Link to={platformPath('/teacher/login')} className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto font-bold">
              تسجيل دخول المعلم
            </Button>
          </Link>
        </div>
      </section>

      {/* Visual Product Showcase Card */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-br from-primary/10 via-surface to-surface-subtle p-6 sm:p-10 border border-border shadow-md overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2 text-start space-y-4">
              <h3 className="text-2xl sm:text-3xl font-extrabold font-heading text-text-main">
                نطاق فرعي فوري لكل معلم مع عزل بيانات مشدد
              </h3>
              <p className="text-text-muted leading-relaxed text-sm sm:text-base">
                بمجرد التسجيل، يتم حجز نطاقك مثل <code className="bg-surface px-2.5 py-1 rounded-lg border border-border text-primary font-mono font-bold dir-ltr inline-block">ahmed.localhost:5173</code> مع إمكانية العمل بنمط المسارات <code className="bg-surface px-2.5 py-1 rounded-lg border border-border text-primary font-mono font-bold dir-ltr inline-block">localhost:5173/t/ahmed</code> بسلاسة مطلقة.
              </p>
              <div className="flex flex-wrap gap-2.5 pt-2">
                <span className="text-xs bg-surface px-3 py-1.5 rounded-full border border-border text-text-muted font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                  <span>عزل كامل لبيانات الطلاب</span>
                </span>
                <span className="text-xs bg-surface px-3 py-1.5 rounded-full border border-border text-text-muted font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                  <span>تطبيق هوية لونية فورية</span>
                </span>
                <span className="text-xs bg-surface px-3 py-1.5 rounded-full border border-border text-text-muted font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                  <span>دعم كامل للغة العربية RTL</span>
                </span>
              </div>
            </div>

            <div className="bg-surface rounded-2xl p-6 border border-border shadow-xs text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-primary-light text-primary flex items-center justify-center font-bold text-2xl mx-auto font-heading">
                أ
              </div>
              <h4 className="font-bold text-text-main text-base">أكاديمية الفيزياء الحديثة</h4>
              <p className="text-xs text-text-muted leading-relaxed">نطاق مخصص + لوحة تحكم معلمين + بوابة تسجيل طلاب</p>
              <div className="pt-2">
                <Badge variant="success" size="sm">مفعل ومتصل بالـ API</Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-text-main font-heading">
            صُممت لتمنح المعلم كامل السيادة على محتواه وطلابه
          </h2>
          <p className="mt-2 text-text-muted text-sm sm:text-base">
            كل الأدوات التي يحتاجها المدرس المعاصر لبناء علامته التعليمية الناجحة
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-border">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-primary-light text-primary flex items-center justify-center mb-3">
                <Palette className="w-6 h-6" />
              </div>
              <CardTitle>هوية بصرية متكاملة</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-text-muted leading-relaxed">
                تحكم بالاسم، والشعار، واللون الأساسي لمنصتك مع معاينة حية لحظية تعيد تشكيل كامل واجهة المنصة بألوانك الخاصة.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-primary-light text-primary flex items-center justify-center mb-3">
                <Globe className="w-6 h-6" />
              </div>
              <CardTitle>اكتشاف ذكي للنطاقات (Subdomain/Path)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-text-muted leading-relaxed">
                دعم أصيل للنطاقات الفرعية (ahmed.domain.com) ونمط المسارات (/t/ahmed) لمرونة قصوى في بيئات التطوير والإنتاج.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-primary-light text-primary flex items-center justify-center mb-3">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <CardTitle>أمان وعزل متعدد المستأجرين</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-text-muted leading-relaxed">
                ترويس X-Tenant التلقائي، وتوكنات JWT المشفرة المحمية، وضمان عدم تداخل أي بيانات بين منصات المعلمين المختلفة.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Bottom CTA */}
      <section id="how-it-works" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-8">
        <div className="bg-surface border border-border rounded-3xl p-8 sm:p-12 shadow-sm">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-text-main font-heading mb-4">
            جاهز لإطلاق منصتك التعليمية في دقيقة واحدة؟
          </h3>
          <p className="text-text-muted mb-8 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
            اختر اسم النطاق الفرعي الخاص بك، وأنشئ حسابك مجاناً وابدأ في تخصيص منصتك فوراً.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to={platformPath('/register')} className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto font-bold"
                startIcon={<Sparkles className="w-4 h-4" />}
              >
                إنشاء المنصة الآن
              </Button>
            </Link>
            <Link to={platformPath('/teacher/login')} className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                تسجيل دخول المعلم
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
