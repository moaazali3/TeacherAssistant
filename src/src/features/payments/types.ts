export type MockPaymentProvider = 'Fawry' | 'VodafoneCash' | 'PaymobCard';

export interface InitiateLessonPaymentDto {
  provider: MockPaymentProvider;
  walletPhone?: string;
}

export interface LessonPaymentSessionDto {
  purchaseId: string;
  lessonId: string;
  lessonTitle: string;
  amount: number;
  provider: string;
  referenceCode: string;
  status: 'Pending' | 'Completed' | 'Failed' | 'Refunded' | number;
  expiresAt?: string | null;
  instructions: string;
  paidAt?: string | null;
  isMockMode: boolean;
}
