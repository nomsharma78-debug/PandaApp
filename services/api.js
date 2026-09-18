import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { getSessionToken, getSessionCookie, saveSessionCookie } from './secureStore';

// Permanent live backend URL for production and testing APKs
export const DEFAULT_API_URL = 'https://pandaus.vercel.app';

export async function getBaseApiUrl() {
  return DEFAULT_API_URL;
}

export async function apiClient(endpoint, options = {}) {
  const baseUrl = await getBaseApiUrl();
  const token = await getSessionToken();
  const cookie = await getSessionCookie();

  const headers = {
    'Content-Type': 'application/json',
    ...(cookie ? { Cookie: cookie } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
  const url = `${baseUrl}${cleanEndpoint}`;

  try {
    const response = await fetch(url, {
      credentials: 'include',
      ...options,
      headers,
    });

    // Capture and persist Set-Cookie header if present
    const setCookie = response.headers.get('set-cookie') || response.headers.get('Set-Cookie');
    if (setCookie) {
      const match = setCookie.match(/(panda_session=[^;]+)/);
      if (match) {
        await saveSessionCookie(match[1]);
      } else if (setCookie.includes('=')) {
        await saveSessionCookie(setCookie.split(';')[0]);
      }
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`[API Error] ${endpoint}:`, error.message);
    throw error;
  }
}

// Authentication Endpoints
export const authApi = {
  login: (email, password) =>
    apiClient('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (email, password, name) =>
    apiClient('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),

  getMe: () => apiClient('/api/auth/me'),

  logout: () =>
    apiClient('/api/auth/logout', {
      method: 'POST',
    }),
};

// Vault Endpoints
export const vaultApi = {
  list: (type) => apiClient(`/api/vault${type ? `?type=${type}` : ''}`),
  create: (item) => {
    const payload = item.encryptedPayload
      ? item
      : {
          type: item.type || 'login',
          encryptedPayload: JSON.stringify({
            data: {
              title: item.title,
              username: item.username,
              password: item.password,
              notes: item.notes,
            },
            clientEncrypted: false,
          }),
        };
    return apiClient('/api/vault', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  getById: (id) => apiClient(`/api/vault/${id}`),
  update: (id, item) => {
    const payload = item.encryptedPayload
      ? item
      : {
          type: item.type || 'login',
          encryptedPayload: JSON.stringify({
            data: {
              title: item.title,
              username: item.username,
              password: item.password,
              notes: item.notes,
              url: item.url,
              cardholder: item.cardholder,
              cardNumber: item.cardNumber,
              cardExpiry: item.cardExpiry,
              cardCvv: item.cardCvv,
              content: item.content,
              fullName: item.fullName,
              idNumber: item.idNumber,
            },
            clientEncrypted: false,
          }),
        };
    return apiClient(`/api/vault/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
  delete: (id) =>
    apiClient(`/api/vault/${id}`, {
      method: 'DELETE',
    }),
};

// Media Endpoints
export const mediaApi = {
  list: (folderId) => apiClient(`/api/media${folderId ? `?folderId=${folderId}` : ''}`),
  getFolders: () => apiClient('/api/media/folders'),
  createFolder: (name, color = 'teal') =>
    apiClient('/api/media/folders', {
      method: 'POST',
      body: JSON.stringify({ name, color }),
    }),
  deleteFolder: (id) =>
    apiClient(`/api/media/folders/${id}`, {
      method: 'DELETE',
    }),
  delete: (id) =>
    apiClient(`/api/media/${id}`, {
      method: 'DELETE',
    }),
  upload: async ({ uri, name, type, file, folderId = null, storageId = null, enableEncryption = true }) => {
    const baseUrl = await getBaseApiUrl();
    const token = await getSessionToken();
    const cookie = await getSessionCookie();
    const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';

    // 1. Native Mobile (Android & iOS) via FileSystem.uploadAsync
    if (Platform.OS !== 'web' && uri) {
      const uploadUrl = `${baseUrl}/api/media/upload${tokenParam}`;

      // If user provided or changed custom filename, stage it with exact name
      let fileUriToUpload = uri;
      let tempFilePath = null;

      if (name) {
        let safeName = name.trim().replace(/[^a-zA-Z0-9._-]/g, '_');
        if (!safeName.includes('.')) {
          const extMatch = uri.match(/\.[a-zA-Z0-9]+$/);
          if (extMatch) {
            safeName += extMatch[0];
          } else {
            safeName += type?.includes('video') ? '.mp4' : '.jpg';
          }
        }
        tempFilePath = `${FileSystem.cacheDirectory}upload_${Date.now()}_${safeName}`;
        try {
          await FileSystem.copyAsync({ from: uri, to: tempFilePath });
          fileUriToUpload = tempFilePath;
        } catch (copyErr) {
          console.warn('[upload] Could not copy file with custom name, using original URI:', copyErr.message);
          fileUriToUpload = uri;
          tempFilePath = null;
        }
      }

      const parameters = {
        encrypt: enableEncryption ? 'true' : 'false',
      };
      if (folderId) parameters.folderId = String(folderId);
      if (storageId) parameters.storageId = String(storageId);

      const headers = {
        ...(cookie ? { Cookie: cookie } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      try {
        const uploadResult = await FileSystem.uploadAsync(uploadUrl, fileUriToUpload, {
          httpMethod: 'POST',
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          fieldName: 'file',
          mimeType: type || 'application/octet-stream',
          parameters,
          headers,
        });

        let data = {};
        try {
          data = JSON.parse(uploadResult.body);
        } catch (e) {
          data = { message: uploadResult.body };
        }

        if (uploadResult.status < 200 || uploadResult.status >= 300) {
          throw new Error(data.error || data.message || `Upload failed with status ${uploadResult.status}`);
        }

        return data;
      } finally {
        if (tempFilePath) {
          try {
            await FileSystem.deleteAsync(tempFilePath, { idempotent: true });
          } catch (delErr) {}
        }
      }
    }

    // 2. Web Browser via fetch + FormData
    const formData = new FormData();
    if (file) {
      formData.append('file', file, name || file.name || 'upload.bin');
    } else if (uri && uri.startsWith('blob:')) {
      const blobRes = await fetch(uri);
      const blob = await blobRes.blob();
      formData.append('file', blob, name || 'upload.bin');
    } else {
      try {
        const blobRes = await fetch(uri);
        const blob = await blobRes.blob();
        formData.append('file', blob, name || 'upload.bin');
      } catch (e) {
        formData.append('file', {
          uri,
          name: name || 'upload.jpg',
          type: type || 'image/jpeg',
        });
      }
    }

    if (folderId) formData.append('folderId', String(folderId));
    if (storageId) formData.append('storageId', String(storageId));
    formData.append('encrypt', enableEncryption ? 'true' : 'false');

    const headers = {
      ...(cookie ? { Cookie: cookie } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const response = await fetch(`${baseUrl}/api/media/upload${tokenParam}`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
      headers,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || data.message || `Upload failed with status ${response.status}`);
    }

    return data;
  },
  getAccessUrl: async (mediaId) => {
    const baseUrl = await getBaseApiUrl();
    const token = await getSessionToken();
    const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';
    return `${baseUrl}/api/media/${mediaId}/access${tokenParam}`;
  },
  getDownloadUrl: async (mediaId) => {
    const baseUrl = await getBaseApiUrl();
    const token = await getSessionToken();
    const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';
    return `${baseUrl}/api/media/${mediaId}/download${tokenParam}`;
  },
  getMediaSource: async (mediaId) => {
    const baseUrl = await getBaseApiUrl();
    const token = await getSessionToken();
    const cookie = await getSessionCookie();
    const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';
    return {
      uri: `${baseUrl}/api/media/${mediaId}/access${tokenParam}`,
      headers: cookie ? { Cookie: cookie } : {},
    };
  },
  sync: () => apiClient('/api/media?sync=true'),
  bulkDelete: async (ids = []) => {
    return Promise.all(ids.map((id) => apiClient(`/api/media/${id}`, { method: 'DELETE' })));
  },
};

// Storage Endpoints
export const storageApi = {
  list: () => apiClient('/api/storage'),
  getUsage: () => apiClient('/api/storage/usage'),
  connect: (config) =>
    apiClient('/api/storage', {
      method: 'POST',
      body: JSON.stringify(config),
    }),
  test: (configOrId) =>
    apiClient('/api/storage/test', {
      method: 'POST',
      body: JSON.stringify(
        typeof configOrId === 'string'
          ? { storageId: configOrId }
          : configOrId.id
          ? { storageId: configOrId.id }
          : configOrId
      ),
    }),
  refreshUsage: (id) => apiClient(`/api/storage/${id}/usage`, { method: 'POST' }),
  delete: (id) =>
    apiClient(`/api/storage/${id}`, {
      method: 'DELETE',
    }),
  syncAll: () => apiClient('/api/storage?sync=true'),
};

// Dashboard Endpoints
export const dashboardApi = {
  getOverview: () => apiClient('/api/dashboard'),
};

// Settings & Security Endpoints
export const settingsApi = {
  updateProfile: (name) =>
    apiClient('/api/settings/profile', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  changePassword: (currentPassword, newPassword) =>
    apiClient('/api/settings/password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
  getSessions: () => apiClient('/api/settings/sessions'),
  revokeSession: (id) =>
    apiClient(`/api/settings/sessions/${id}`, {
      method: 'DELETE',
    }),
  revokeAllOtherSessions: () =>
    apiClient('/api/settings/sessions', {
      method: 'DELETE',
    }),
};
