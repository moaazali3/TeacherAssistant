import { useLocation, useParams } from 'react-router-dom';

export type TenantMode = 'subdomain' | 'path';

/**
 * Returns the configured tenant mode ('subdomain' or 'path').
 */
export function getTenantMode(): TenantMode {
  const mode = import.meta.env.VITE_TENANT_MODE;
  return mode === 'path' ? 'path' : 'subdomain';
}

/**
 * Extract tenant slug from hostname (subdomain mode).
 * e.g.:
 * - ahmed.localhost -> "ahmed"
 * - localhost -> null
 * - 127.0.0.1 -> null
 * - ahmed.platform.com -> "ahmed"
 * - www.platform.com -> null
 */
export function getSubdomainSlug(hostname: string = window.location.hostname): string | null {
  if (!hostname) return null;

  // IP addresses have no subdomains
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
    return null;
  }

  const parts = hostname.toLowerCase().split('.');

  // e.g. "localhost" -> no subdomain
  if (parts.length < 2) {
    return null;
  }

  // Handle "*.localhost" (e.g. ["ahmed", "localhost"])
  if (parts.length === 2 && parts[1] === 'localhost') {
    const sub = parts[0];
    return sub === 'www' ? null : sub;
  }

  // Handle production domain with 3+ parts e.g. ["ahmed", "domain", "com"]
  if (parts.length >= 3) {
    const sub = parts[0];
    return sub === 'www' ? null : sub;
  }

  return null;
}

/**
 * Extract tenant slug from pathname (path mode).
 * e.g. /t/ahmed/login -> "ahmed"
 */
export function getPathSlug(pathname: string = window.location.pathname): string | null {
  const match = pathname.match(/^\/t\/([a-zA-Z0-9_-]+)(?:\/|$)/);
  return match ? match[1].toLowerCase() : null;
}

/**
 * Synchronous non-hook helper to get the current tenant slug.
 * Used by axios interceptors and non-React modules.
 */
export function getTenantSlug(): string | null {
  const mode = getTenantMode();
  if (mode === 'path') {
    return getPathSlug(window.location.pathname);
  }
  return getSubdomainSlug(window.location.hostname);
}

/**
 * React hook to get the active tenant slug with reactive updates on route changes.
 */
export function useTenantSlug(): string | null {
  const mode = getTenantMode();
  const location = useLocation();
  const params = useParams<{ slug?: string }>();

  if (mode === 'path') {
    // Read from route params if available, else fallback to location.pathname
    if (params.slug) {
      return params.slug.toLowerCase();
    }
    return getPathSlug(location.pathname);
  }

  // In subdomain mode, slug depends on the hostname
  return getSubdomainSlug(window.location.hostname);
}

/**
 * Generates an internal link path tailored to the current tenant mode and slug.
 * Ensures components never hardcode "/t/:slug" or "/login".
 *
 * Examples:
 * tenantPath("/login")
 * - In subdomain mode (on ahmed.localhost:5173): -> "/login"
 * - In path mode (on localhost:5173/t/ahmed):    -> "/t/ahmed/login"
 *
 * @param path Relative or absolute path inside tenant site (e.g. "/login", "/dashboard/teacher")
 * @param slugOverride Optional slug override (e.g. when linking to a specific tenant from platform)
 */
export function tenantPath(path: string = '/', slugOverride?: string): string {
  const mode = getTenantMode();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (mode === 'subdomain') {
    return normalizedPath;
  }

  // Path mode
  const slug = (slugOverride || getTenantSlug() || '').toLowerCase();
  if (!slug) {
    return normalizedPath;
  }

  if (normalizedPath === '/' || normalizedPath === '') {
    return `/t/${slug}`;
  }

  return `/t/${slug}${normalizedPath}`;
}

/**
 * Builds an absolute or full URL to navigate to a newly created or target tenant.
 * Crucial when transitioning from platform registration to the teacher's new tenant site.
 */
export function buildTenantFullUrl(slug: string, path: string = '/'): string {
  const mode = getTenantMode();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (mode === 'path') {
    return normalizedPath === '/' ? `/t/${slug}` : `/t/${slug}${normalizedPath}`;
  }

  // Subdomain mode: construct full origin URL
  const { protocol, host } = window.location;
  // If host is "localhost:5173", target is "ahmed.localhost:5173"
  const hostParts = host.split(':');
  const hostname = hostParts[0];
  const port = hostParts[1] ? `:${hostParts[1]}` : '';

  // If already has subdomain, replace it; otherwise prepend slug
  const currentSubdomain = getSubdomainSlug(hostname);
  let newHostname = hostname;

  if (currentSubdomain) {
    newHostname = hostname.replace(new RegExp(`^${currentSubdomain}\\.`, 'i'), `${slug}.`);
  } else {
    newHostname = `${slug}.${hostname}`;
  }

  return `${protocol}//${newHostname}${port}${normalizedPath}`;
}

/**
 * Build URL back to main platform (no tenant).
 */
export function buildPlatformUrl(path: string = '/'): string {
  const mode = getTenantMode();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (mode === 'path') {
    return normalizedPath;
  }

  // Subdomain mode: strip subdomain
  const { protocol, host } = window.location;
  const hostParts = host.split(':');
  const hostname = hostParts[0];
  const port = hostParts[1] ? `:${hostParts[1]}` : '';

  const currentSub = getSubdomainSlug(hostname);
  if (!currentSub) {
    return normalizedPath;
  }

  const baseHostname = hostname.replace(new RegExp(`^${currentSub}\\.`, 'i'), '');
  return `${protocol}//${baseHostname}${port}${normalizedPath}`;
}

/**
 * Generates a path or URL for navigating to a platform page (e.g. /teacher/login, /dashboard/teacher).
 * If currently inside a tenant subdomain in subdomain mode, returns the full absolute URL
 * to the platform host (e.g. http://localhost:5173/dashboard/teacher).
 * Otherwise (on platform host or in path mode), returns the clean relative path.
 */
export function platformPath(path: string = '/'): string {
  const mode = getTenantMode();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (mode === 'subdomain') {
    const currentSub = getSubdomainSlug(window.location.hostname);
    if (currentSub) {
      return buildPlatformUrl(normalizedPath);
    }
    return normalizedPath;
  }

  // Path mode: platform routes are root-level (no /t/:slug)
  return normalizedPath;
}
