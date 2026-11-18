/**
 * ==============================================================================
 * EMBED HELPER UTILITIES
 * ==============================================================================
 * Pure, unit-friendly functions for parsing and transforming lesson content URLs:
 * - YouTube: extract video ID -> embed player URL
 * - Google Drive: extract file ID / convert /view to /preview
 * - PDF: detect PDF URLs for embedded iframe / object viewing
 * - Generic: fallback for external educational links
 * ==============================================================================
 */

export type EmbedType = 'youtube' | 'drive' | 'pdf' | 'generic';

export interface EmbedInfo {
  type: EmbedType;
  originalUrl: string;
  embedUrl: string | null;
  isValidUrl: boolean;
}

/**
 * Validates whether a string is a valid HTTP/HTTPS URL.
 */
export function isValidHttpUrl(urlString: string): boolean {
  if (!urlString || typeof urlString !== 'string') return false;
  try {
    const url = new URL(urlString.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Extracts a YouTube Video ID from standard YouTube URL patterns:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!isValidHttpUrl(url)) return null;

  const patterns = [
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([\w-]{11})/,
    /^([\w-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = url.trim().match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Generates a YouTube embed URL from an input URL or video ID.
 */
export function getYouTubeEmbedUrl(url: string): string | null {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`;
}

/**
 * Checks if a URL is a Google Drive file link and converts /view to /preview.
 * Handles:
 * - https://drive.google.com/file/d/FILE_ID/view... -> /preview
 * - https://drive.google.com/open?id=FILE_ID -> /preview
 */
export function getGoogleDriveEmbedUrl(url: string): string | null {
  if (!isValidHttpUrl(url)) return null;

  const trimmed = url.trim();
  if (!trimmed.includes('drive.google.com')) return null;

  // Pattern 1: /file/d/FILE_ID/...
  const fileIdMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileIdMatch && fileIdMatch[1]) {
    return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
  }

  // Pattern 2: id=FILE_ID query parameter
  try {
    const parsed = new URL(trimmed);
    const idParam = parsed.searchParams.get('id');
    if (idParam) {
      return `https://drive.google.com/file/d/${idParam}/preview`;
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Determines whether a URL or content type represents a PDF document.
 */
export function isPdfUrl(url: string, explicitContentType?: string): boolean {
  if (explicitContentType?.toLowerCase() === 'pdf' || explicitContentType === '2') {
    return true;
  }
  if (!isValidHttpUrl(url)) return false;

  try {
    const parsed = new URL(url.trim());
    return parsed.pathname.toLowerCase().endsWith('.pdf');
  } catch {
    return false;
  }
}

/**
 * Detects the embed type for a given URL and content type.
 */
export function parseEmbedType(url: string, explicitContentType?: string): EmbedType {
  if (!isValidHttpUrl(url)) return 'generic';

  // 1. YouTube check
  if (extractYouTubeVideoId(url)) {
    return 'youtube';
  }

  // 2. Google Drive check
  if (getGoogleDriveEmbedUrl(url)) {
    return 'drive';
  }

  // 3. PDF check
  if (isPdfUrl(url, explicitContentType)) {
    return 'pdf';
  }

  return 'generic';
}

/**
 * Comprehensive parser returning structured embed info.
 */
export function getEmbedInfo(url: string, explicitContentType?: string): EmbedInfo {
  const isValid = isValidHttpUrl(url);
  if (!isValid) {
    return {
      type: 'generic',
      originalUrl: url,
      embedUrl: null,
      isValidUrl: false,
    };
  }

  const type = parseEmbedType(url, explicitContentType);

  let embedUrl: string | null = null;
  if (type === 'youtube') {
    embedUrl = getYouTubeEmbedUrl(url);
  } else if (type === 'drive') {
    embedUrl = getGoogleDriveEmbedUrl(url);
  } else if (type === 'pdf') {
    embedUrl = url.trim();
  }

  return {
    type,
    originalUrl: url.trim(),
    embedUrl,
    isValidUrl: true,
  };
}
