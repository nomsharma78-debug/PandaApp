import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { getDecryptedMediaUri } from './mediaCache';

export async function downloadMediaFile(mediaItem) {
  if (!mediaItem || !mediaItem.id) {
    throw new Error('Invalid media item.');
  }

  const rawFilename =
    mediaItem.original_filename ||
    mediaItem.filename ||
    mediaItem.name ||
    `panda_vault_${mediaItem.id}`;

  try {
    // 1. Get decrypted local file URI (from cache or fetched via authenticated session)
    const localUri = await getDecryptedMediaUri(mediaItem);
    if (!localUri) {
      throw new Error('Could not decrypt and download file from server.');
    }

    // 2. Open native Android/iOS system Save / Export / Share dialog
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(localUri, {
        mimeType: mediaItem.mime_type || mediaItem.content_type || undefined,
        dialogTitle: `Save ${rawFilename}`,
      });
    }

    return {
      success: true,
      localUri,
      filename: rawFilename,
    };
  } catch (err) {
    console.error('[Downloader Error]:', err.message);
    throw err;
  }
}
