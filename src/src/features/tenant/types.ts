export interface TenantBrandingDto {
  id: string;
  name: string;
  subdomain: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
  bio?: string | null;
}

export interface SubdomainAvailabilityDto {
  subdomain: string;
  available: boolean;
  reason?: string | null;
}

export interface UpdateTenantBrandingDto {
  name?: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
  bio?: string | null;
}
