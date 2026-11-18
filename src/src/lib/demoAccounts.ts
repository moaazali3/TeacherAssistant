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
        label: 'معلم تجريبي (أ. أحمد محمد)',
        email: 'teacher@demo.local',
        password: 'Demo@12345',
        roleHint: 'معلم - مالك المنصة',
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
        roleHint: 'جروب السبت',
      },
      {
        label: 'طالب 2 (مريم حسن)',
        email: 'student2@demo.local',
        password: 'Demo@12345',
        groupCode: 'MND7CHEM',
        roleHint: 'جروب الإثنين',
      },
      {
        label: 'طالب 3 (عمر خالد)',
        email: 'student3@demo.local',
        password: 'Demo@12345',
        groupCode: 'SAT5CHEM',
        roleHint: 'جروب السبت',
      },
    ]
  : [];
