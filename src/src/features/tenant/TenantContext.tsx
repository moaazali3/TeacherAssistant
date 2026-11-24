import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiResponse, getApiErrorMessage } from '@/lib/api';
import { useTenantSlug } from '@/lib/tenant';
import { TenantBrandingDto, UpdateTenantBrandingDto } from './types';

interface TenantContextValue {
  tenant: TenantBrandingDto | null;
  slug: string | null;
  isLoading: boolean;
  isNotFound: boolean;
  error: string | null;
  refetchTenant: () => void;
  updateBranding: (dto: UpdateTenantBrandingDto) => Promise<TenantBrandingDto>;
  applyThemeColor: (color: string) => void;
  resetThemeColor: () => void;
}

export const TenantContext = createContext<TenantContextValue | undefined>(undefined);

/**
 * Injects a hex color into the primary CSS variables for live theming.
 */
function applyThemeColorToDOM(color: string) {
  if (!color || !/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color)) return;
  const root = document.documentElement;
  root.style.setProperty('--color-primary', color);
  root.style.setProperty('--color-primary-hover', `color-mix(in srgb, ${color} 86%, #1C1917)`);
  root.style.setProperty('--color-primary-active', `color-mix(in srgb, ${color} 72%, #1C1917)`);
  root.style.setProperty('--color-primary-light', `color-mix(in srgb, ${color} 14%, #FFFDF9)`);
  root.style.setProperty('--color-primary-subtle', `color-mix(in srgb, ${color} 6%, #FAF7F2)`);
  root.style.setProperty('--color-bg', `color-mix(in srgb, ${color} 2.5%, #FAF7F2)`);
  root.style.setProperty('--color-surface', '#FFFDF9');
  root.style.setProperty('--color-surface-subtle', `color-mix(in srgb, ${color} 4%, #F4EFE6)`);
  root.style.setProperty('--color-border', `color-mix(in srgb, ${color} 10%, #E6DFD3)`);
}

/**
 * Resets CSS variables to the original design tokens in tokens.css.
 */
function resetThemeColorInDOM() {
  const root = document.documentElement;
  root.style.removeProperty('--color-primary');
  root.style.removeProperty('--color-primary-hover');
  root.style.removeProperty('--color-primary-active');
  root.style.removeProperty('--color-primary-light');
  root.style.removeProperty('--color-primary-subtle');
  root.style.removeProperty('--color-bg');
  root.style.removeProperty('--color-surface');
  root.style.removeProperty('--color-surface-subtle');
  root.style.removeProperty('--color-border');
}

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const slug = useTenantSlug();
  const queryClient = useQueryClient();
  const [isNotFound, setIsNotFound] = useState(false);

  const {
    data: tenantData,
    isLoading,
    error: queryError,
    refetch: refetchTenant,
  } = useQuery({
    queryKey: ['tenant', slug],
    queryFn: async () => {
      if (!slug) return null;
      try {
        setIsNotFound(false);
        const res = await apiClient.get<ApiResponse<TenantBrandingDto>>('/tenants/current');
        return res.data.data ?? null;
      } catch (err: unknown) {
        // If 404, mark tenant as not found
        if (typeof err === 'object' && err !== null && 'response' in err) {
          const resp = (err as { response?: { status?: number } }).response;
          if (resp?.status === 404) {
            setIsNotFound(true);
            return null;
          }
        }
        throw err;
      }
    },
    enabled: !!slug,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  // Apply tenant theme whenever tenant data changes
  useEffect(() => {
    if (tenantData?.primaryColor) {
      applyThemeColorToDOM(tenantData.primaryColor);
    } else {
      resetThemeColorInDOM();
    }

    // Set document title and favicon dynamically per tenant
    const favicon = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (tenantData?.name) {
      document.title = `${tenantData.name} | المنصة التعليمية`;
      if (favicon && tenantData.logoUrl) {
        favicon.href = tenantData.logoUrl;
      }
    } else if (!slug) {
      document.title = 'طرابيزة | Tarabeza — منصتك التعليمية المستقلة في دقيقة';
      if (favicon) {
        favicon.href = '/logo.svg';
      }
    }

    return () => {
      resetThemeColorInDOM();
      if (favicon) {
        favicon.href = '/logo.svg';
      }
    };
  }, [tenantData, slug]);

  // Mutation to update tenant branding
  const updateMutation = useMutation({
    mutationFn: async (dto: UpdateTenantBrandingDto) => {
      const res = await apiClient.put<ApiResponse<TenantBrandingDto>>('/tenants/current', dto);
      if (!res.data.success || !res.data.data) {
        throw new Error(res.data.message || 'فشل تحديث بيانات المنصة');
      }
      return res.data.data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['tenant', slug], updated);
      if (updated.primaryColor) {
        applyThemeColorToDOM(updated.primaryColor);
      }
    },
  });

  const updateBranding = useCallback(
    async (dto: UpdateTenantBrandingDto) => {
      return await updateMutation.mutateAsync(dto);
    },
    [updateMutation]
  );

  const applyThemeColor = useCallback((color: string) => {
    applyThemeColorToDOM(color);
  }, []);

  const resetThemeColor = useCallback(() => {
    if (tenantData?.primaryColor) {
      applyThemeColorToDOM(tenantData.primaryColor);
    } else {
      resetThemeColorInDOM();
    }
  }, [tenantData]);

  const error = queryError ? getApiErrorMessage(queryError) : null;

  return (
    <TenantContext.Provider
      value={{
        tenant: tenantData ?? null,
        slug,
        isLoading: !!slug && isLoading,
        isNotFound,
        error,
        refetchTenant,
        updateBranding,
        applyThemeColor,
        resetThemeColor,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};
