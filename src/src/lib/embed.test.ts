import {
  extractYouTubeVideoId,
  getYouTubeEmbedUrl,
  getGoogleDriveEmbedUrl,
  isPdfUrl,
  parseEmbedType,
  getEmbedInfo,
} from './embed';

// YouTube tests
const yt1 = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
const yt2 = 'https://youtu.be/dQw4w9WgXcQ';
const yt3 = 'https://www.youtube.com/shorts/dQw4w9WgXcQ';
console.assert(extractYouTubeVideoId(yt1) === 'dQw4w9WgXcQ', 'YT1 failed');
console.assert(extractYouTubeVideoId(yt2) === 'dQw4w9WgXcQ', 'YT2 failed');
console.assert(extractYouTubeVideoId(yt3) === 'dQw4w9WgXcQ', 'YT3 failed');
console.assert(getYouTubeEmbedUrl(yt1) === 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0', 'YT embed URL failed');

// Drive tests
const gdrive1 = 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs/view?usp=sharing';
const gdrive2 = 'https://drive.google.com/open?id=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs';
console.assert(getGoogleDriveEmbedUrl(gdrive1) === 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs/preview', 'GDrive1 failed');
console.assert(getGoogleDriveEmbedUrl(gdrive2) === 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs/preview', 'GDrive2 failed');

// PDF tests
const pdf1 = 'https://example.com/handout.pdf';
const pdf2 = 'https://example.com/handout.pdf?token=123';
console.assert(isPdfUrl(pdf1) === true, 'PDF1 failed');
console.assert(isPdfUrl(pdf2) === true, 'PDF2 failed');
console.assert(isPdfUrl('https://example.com/article', 'Pdf') === true, 'PDF by contentType failed');

// Type detection tests
console.assert(parseEmbedType(yt1) === 'youtube', 'parse YT failed');
console.assert(parseEmbedType(gdrive1) === 'drive', 'parse Drive failed');
console.assert(parseEmbedType(pdf1) === 'pdf', 'parse PDF failed');
console.assert(parseEmbedType('https://wikipedia.org') === 'generic', 'parse Generic failed');

// Embed Info tests
const infoYt = getEmbedInfo(yt1);
console.assert(infoYt.type === 'youtube' && infoYt.isValidUrl, 'infoYt failed');

