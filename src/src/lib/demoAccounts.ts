export interface DemoAccount {
  label: string;
  email: string;
  password: string;
  groupCode?: string;
  roleHint?: string;
}

/**
 * Quick demo accounts for testing teacher and student portals on localhost and live demo tenants.
 */
export const TEACHER_DEMO_ACCOUNTS: DemoAccount[] = [
  {
    label: 'أ. طارق المنشاوي — كيمياء (demo)',
    email: 'teacher@demo.local',
    password: 'Demo@12345',
    roleHint: 'كيمياء ثانوية عامة',
  },
  {
    label: 'أ. محمود الشافعي — رياضيات (maths)',
    email: 'teacher@maths.local',
    password: 'Demo@12345',
    roleHint: 'رياضيات بحتة وتطبيقية',
  },
  {
    label: 'أ. حسام الدين رأفت — فيزياء (physics)',
    email: 'teacher@physics.local',
    password: 'Demo@12345',
    roleHint: 'فيزياء ثانوية عامة',
  },
  {
    label: 'أ. عبدالرحمن السوهاجي — لغة عربية (arabic)',
    email: 'teacher@arabic.local',
    password: 'Demo@12345',
    roleHint: 'لغة عربية 80/80',
  },
  {
    label: 'أ. سلمى عبدالحميد — أحياء (bio)',
    email: 'teacher@bio.local',
    password: 'Demo@12345',
    roleHint: 'أحياء وجيولوجيا',
  },
];

export const STUDENT_DEMO_ACCOUNTS_BY_TENANT: Record<string, DemoAccount[]> = {
  demo: [
    {
      label: 'أحمد علي',
      email: 'student1@demo.local',
      password: 'Demo@12345',
      groupCode: 'SAT5CHEM',
      roleHint: 'مجموعة السبت 5 م',
    },
    {
      label: 'مريم حسن',
      email: 'student2@demo.local',
      password: 'Demo@12345',
      groupCode: 'MND7CHEM',
      roleHint: 'مجموعة الإثنين 7 م',
    },
    {
      label: 'عمر خالد',
      email: 'student3@demo.local',
      password: 'Demo@12345',
      groupCode: 'SAT5CHEM',
      roleHint: 'مجموعة السبت 5 م',
    },
  ],
  maths: [
    {
      label: 'أحمد محمد',
      email: 'student1@maths.local',
      password: 'Demo@12345',
      groupCode: 'SUN8MATH',
      roleHint: 'جروب الأحد 8 ص',
    },
    {
      label: 'محمد أحمد',
      email: 'student2@maths.local',
      password: 'Demo@12345',
      groupCode: 'TUE6MATH',
      roleHint: 'جروب الثلاثاء 6 م',
    },
    {
      label: 'علي حسن',
      email: 'student3@maths.local',
      password: 'Demo@12345',
      groupCode: 'SUN8MATH',
      roleHint: 'جروب الأحد 8 ص',
    },
  ],
  physics: [
    {
      label: 'أحمد محمد',
      email: 'student1@physics.local',
      password: 'Demo@12345',
      groupCode: 'FRI10PHY',
      roleHint: 'جروب الجمعة 10 ص',
    },
    {
      label: 'محمد أحمد',
      email: 'student2@physics.local',
      password: 'Demo@12345',
      groupCode: 'SAT3PHY',
      roleHint: 'جروب السبت 3 م',
    },
    {
      label: 'علي حسن',
      email: 'student3@physics.local',
      password: 'Demo@12345',
      groupCode: 'FRI10PHY',
      roleHint: 'جروب الجمعة 10 ص',
    },
  ],
  arabic: [
    {
      label: 'أحمد محمد',
      email: 'student1@arabic.local',
      password: 'Demo@12345',
      groupCode: 'MON5ARB',
      roleHint: 'جروب الاثنين 5 م',
    },
    {
      label: 'محمد أحمد',
      email: 'student2@arabic.local',
      password: 'Demo@12345',
      groupCode: 'WED8ARB',
      roleHint: 'جروب الأربعاء 8 ص',
    },
    {
      label: 'علي حسن',
      email: 'student3@arabic.local',
      password: 'Demo@12345',
      groupCode: 'MON5ARB',
      roleHint: 'جروب الاثنين 5 م',
    },
  ],
  bio: [
    {
      label: 'أحمد محمد',
      email: 'student1@bio.local',
      password: 'Demo@12345',
      groupCode: 'MON8BIO',
      roleHint: 'جروب الاثنين 8 ص',
    },
    {
      label: 'محمد أحمد',
      email: 'student2@bio.local',
      password: 'Demo@12345',
      groupCode: 'WED5BIO',
      roleHint: 'جروب الأربعاء 5 م',
    },
    {
      label: 'علي حسن',
      email: 'student3@bio.local',
      password: 'Demo@12345',
      groupCode: 'MON8BIO',
      roleHint: 'جروب الاثنين 8 ص',
    },
  ],
};

export const STUDENT_DEMO_ACCOUNTS: DemoAccount[] = STUDENT_DEMO_ACCOUNTS_BY_TENANT.demo;

export function getStudentDemoAccounts(subdomain?: string | null): DemoAccount[] {
  const key = (subdomain || '').trim().toLowerCase();
  if (!key) return [];
  return STUDENT_DEMO_ACCOUNTS_BY_TENANT[key] ?? [];
}
