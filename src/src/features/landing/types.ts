export type FontFamily = 'Cairo' | 'Tajawal' | 'Almarai' | 'IBM Plex Sans Arabic';
export type BorderRadius = 'none' | 'md' | 'xl' | 'full';
export type ButtonStyle = 'solid' | 'outline' | 'soft';

export interface LandingTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: FontFamily;
  borderRadius: BorderRadius;
  buttonStyle: ButtonStyle;
  heroImageUrl?: string;
}

export type SectionType =
  | 'hero'
  | 'about'
  | 'stats'
  | 'subjects'
  | 'testimonials'
  | 'faq'
  | 'contact'
  | 'footer';

export interface HeroContent {
  title: string;
  subtitle: string;
  primaryButtonText: string;
  primaryButtonLink: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  imageUrl?: string;
}

export interface AboutContent {
  title: string;
  bio: string;
  features: string[];
  imageUrl?: string;
}

export interface StatItem {
  label: string;
  value: string;
  icon?: string;
}

export interface StatsContent {
  title?: string;
  items: StatItem[];
}

export interface SubjectsContent {
  title: string;
  subtitle?: string;
  showCount: number;
}

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  text: string;
  avatarUrl?: string;
  rating?: number;
}

export interface TestimonialsContent {
  title: string;
  subtitle?: string;
  items: TestimonialItem[];
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface FaqContent {
  title: string;
  subtitle?: string;
  items: FaqItem[];
}

export interface ContactContent {
  title: string;
  subtitle?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
}

export interface SocialLink {
  platform: string;
  url: string;
}

export interface NavLink {
  label: string;
  url: string;
}

export interface FooterContent {
  copyrightText: string;
  socialLinks?: SocialLink[];
  links?: NavLink[];
}

export interface LandingSection {
  id: string;
  type: SectionType;
  enabled: boolean;
  variant: string;
  content: Record<string, unknown>;
}

export interface LandingPageConfig {
  version: number;
  theme: LandingTheme;
  sections: LandingSection[];
}
