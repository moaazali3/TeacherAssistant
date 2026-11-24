export interface DemoAccount {
  label: string;
  email: string;
  password: string;
  groupCode?: string;
  roleHint?: string;
}

/**
 * Demo accounts for local development and testing only.
 * In production builds (import.meta.env.DEV === false), the ternaries evaluate to empty arrays
 * and bundler dead-code elimination strips all demo credentials.
 */
export const TEACHER_DEMO_ACCOUNTS: DemoAccount[] = import.meta.env.DEV
  ? [
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
    ]
  : [];

export const STUDENT_DEMO_ACCOUNTS: DemoAccount[] = import.meta.env.DEV
  ? [
      {
        label: 'طالب 1 (أحمد علي)',
        email: 'student1@demo.local',
        password: 'Demo@12345',
        groupCode: 'SAT5CHEM',
        roleHint: 'مجموعة السبت 5 م',
      },
      {
        label: 'طالب 2 (مريم حسن)',
        email: 'student2@demo.local',
        password: 'Demo@12345',
        groupCode: 'MND7CHEM',
        roleHint: 'مجموعة الإثنين 7 م',
      },
      {
        label: 'طالب 3 (عمر خالد)',
        email: 'student3@demo.local',
        password: 'Demo@12345',
        groupCode: 'SAT5CHEM',
        roleHint: 'مجموعة السبت 5 م',
      },
    ]
  : [];
