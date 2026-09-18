import * as FileSystem from 'expo-file-system/legacy';
import { DEFAULT_API_URL } from './api';
import { getSessionToken, getSessionCookie } from './secureStore';

// In-memory URI cache map for fast sub-millisecond lookup
const memoryUriCache = new Map();

/**
 * Validates and retrieves the local decrypted file URI for an image/video/document
 * Streams directly to native file cache without JS heap memory spikes.
 */
export async function getDecryptedMediaUri(mediaItem) {
  if (!mediaItem || !mediaItem.id) return null;

  const id = mediaItem.id;
  if (memoryUriCache.has(id)) {
    return memoryUriCache.get(id);
  }

  const rawFilename =
    mediaItem.original_filename ||
    mediaItem.filename ||
    mediaItem.name ||
    `file_${id}`;

  const cleanFilename = rawFilename.replace(/[^\w.-]/g, '_');
  const cachePath = `${FileSystem.cacheDirectory}panda_${id}_${cleanFilename}`;

  try {
    // 1. Check if a valid decrypted file (>100 bytes) already exists on disk
    const fileInfo = await FileSystem.getInfoAsync(cachePath).catch(() => ({ exists: false }));
    if (fileInfo.exists && fileInfo.size > 100) {
      memoryUriCache.set(id, cachePath);
      return cachePath;
    }

    const token = await getSessionToken();
    const cookie = await getSessionCookie();

    const headers = {
      ...(cookie ? { Cookie: cookie } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      Accept: '*/*',
    };

    const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';
    const accessUrl = `${DEFAULT_API_URL}/api/media/${id}/access${tokenParam}`;

    // 2. Direct native stream download into cache directory
    const downloadRes = await FileSystem.downloadAsync(accessUrl, cachePath, { headers });

    if (downloadRes.status >= 200 && downloadRes.status < 300) {
      const downloadedInfo = await FileSystem.getInfoAsync(cachePath).catch(() => ({ exists: false }));
      if (downloadedInfo.exists && downloadedInfo.size > 100) {
        memoryUriCache.set(id, cachePath);
        return cachePath;
      }
    }

    // Clean up if download failed or returned error status
    await FileSystem.deleteAsync(cachePath, { idempotent: true }).catch(() => {});
    return null;
  } catch (err) {
    console.warn(`[MediaCache] Error loading media ${id}:`, err.message);
    return null;
  }
}

/**
 * Clean up corrupt / empty cache files (<100 bytes)
 */
export async function cleanInvalidCache() {
  try {
    const dir = FileSystem.cacheDirectory;
    const files = await FileSystem.readDirectoryAsync(dir);
    for (const file of files) {
      if (file.startsWith('panda_')) {
        const filePath = `${dir}${file}`;
        const info = await FileSystem.getInfoAsync(filePath);
        if (info.exists && info.size < 100) {
          await FileSystem.deleteAsync(filePath, { idempotent: true });
        }
      }
    }
  } catch (e) {
    // ignore
  }
}

export function clearMediaMemoryCache() {
  memoryUriCache.clear();
}
