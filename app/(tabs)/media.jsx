import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  RefreshControl,
  ScrollView,
  Modal,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { AlertModal } from '../../components/ui/AlertModal';
import { NativeVideoPlayer } from '../../components/media/NativeVideoPlayer';
import { VideoThumbnailTile } from '../../components/media/VideoThumbnailTile';
import { CreateFolderModal } from '../../components/media/CreateFolderModal';
import { MediaUploadModal } from '../../components/media/MediaUploadModal';
import { mediaApi } from '../../services/api';
import { getDecryptedMediaUri, cleanInvalidCache, clearMediaMemoryCache } from '../../services/mediaCache';
import { downloadMediaFile } from '../../services/downloader';
import {
  Film,
  Image as ImageIcon,
  FileText,
  Lock,
  Plus,
  Trash2,
  X,
  Archive,
  Search,
  ChevronLeft,
  ChevronRight,
  Info,
  Shield,
  Folder,
  FolderPlus,
  Download,
  ArrowLeft,
  RefreshCw,
  SlidersHorizontal,
  ArrowUpDown,
  Calendar,
  CheckSquare,
  Square,
  Check,
  Layers,
  ChevronDown,
} from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GRID_GAP = 8;
const GRID_COLUMNS = 3;
const TILE_SIZE = Math.floor((SCREEN_WIDTH - 32 - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS);

const FILTER_TABS = [
  { id: 'all', label: 'All Files', icon: Layers, color: '#38bdf8' },
  { id: 'photos', label: 'Photos', icon: ImageIcon, color: '#2dd4bf' },
  { id: 'videos', label: 'Videos', icon: Film, color: '#f43f5e' },
  { id: 'pdfs', label: 'PDFs', icon: FileText, color: '#fbbf24' },
  { id: 'docs', label: 'Documents', icon: FileText, color: '#a78bfa' },
  { id: 'archives', label: 'Archives', icon: Archive, color: '#34d399' },
];

const MONTH_NAMES = [
  { id: 'all', label: 'All Months' },
  { id: '0', label: 'Jan' },
  { id: '1', label: 'Feb' },
  { id: '2', label: 'Mar' },
  { id: '3', label: 'Apr' },
  { id: '4', label: 'May' },
  { id: '5', label: 'Jun' },
  { id: '6', label: 'Jul' },
  { id: '7', label: 'Aug' },
  { id: '8', label: 'Sep' },
  { id: '9', label: 'Oct' },
  { id: '10', label: 'Nov' },
  { id: '11', label: 'Dec' },
];

const SORT_OPTIONS = [
  { id: 'date-desc', label: 'Date: Newest First' },
  { id: 'date-asc', label: 'Date: Oldest First' },
  { id: 'size-desc', label: 'Size: Largest First' },
  { id: 'size-asc', label: 'Size: Smallest First' },
  { id: 'name-asc', label: 'Name: A to Z' },
  { id: 'name-desc', label: 'Name: Z to A' },
];

const GROUP_OPTIONS = [
  { id: 'date', label: 'Timeline (Date)' },
  { id: 'month', label: 'Month' },
  { id: 'year', label: 'Year' },
  { id: 'size', label: 'File Size' },
  { id: 'none', label: 'Flat Grid (None)' },
];

const FOLDER_COLORS = {
  teal:    { hex: '#2dd4bf', bg: 'rgba(45, 212, 191, 0.12)', border: 'rgba(45, 212, 191, 0.3)' },
  violet:  { hex: '#a78bfa', bg: 'rgba(167, 139, 250, 0.12)', border: 'rgba(167, 139, 250, 0.3)' },
  amber:   { hex: '#fbbf24', bg: 'rgba(251, 191, 36, 0.12)', border: 'rgba(251, 191, 36, 0.3)' },
  rose:    { hex: '#f43f5e', bg: 'rgba(244, 63, 94, 0.12)', border: 'rgba(244, 63, 94, 0.3)' },
  sky:     { hex: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.3)' },
  emerald: { hex: '#34d399', bg: 'rgba(52, 211, 153, 0.12)', border: 'rgba(52, 211, 153, 0.3)' },
  orange:  { hex: '#fb923c', bg: 'rgba(251, 146, 60, 0.12)', border: 'rgba(251, 146, 60, 0.3)' },
  slate:   { hex: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.3)' },
};

export default function MediaScreen() {
  const [mediaList, setMediaList] = useState([]);
  const [folderList, setFolderList] = useState([]);
  const [openFolder, setOpenFolder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [mediaUris, setMediaUris] = useState({});
  const [loadingUris, setLoadingUris] = useState({});

  // Filters, Grouping & Sorting state
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [groupBy, setGroupBy] = useState('date'); // 'date' | 'month' | 'year' | 'size' | 'none'
  const [sortBy, setSortBy] = useState('date-desc');
  const [filterYear, setFilterYear] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showGroupMenu, setShowGroupMenu] = useState(false);

  // Multi-Select & Bulk Actions
  const [selectedIds, setSelectedIds] = useState(new Set());
  const isSelectionMode = selectedIds.size > 0;
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);

  // Modals state
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);

  // Dark Alert Modal State
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    buttons: [],
  });

  const showAlert = (title, message, type = 'info', buttons = [{ text: 'OK' }]) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      type,
      buttons,
    });
  };

  const closeAlert = () => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Helper to categorize media
  const getMediaMeta = (item) => {
    if (!item) return { isPhoto: false, isVideo: false, isPdf: false, isDoc: false, isArchive: false };
    const filename = (item.original_filename || item.filename || item.name || '').toLowerCase();
    const mime = (item.mime_type || item.content_type || '').toLowerCase();
    const type = (item.media_type || '').toLowerCase();

    const isVideo =
      type === 'video' ||
      mime.startsWith('video/') ||
      Boolean(filename.match(/\.(mp4|webm|mov|mkv|avi|m4v|3gp|flv|wmv)(\.enc)?$/i));

    const isPdf =
      type === 'pdf' ||
      mime.includes('pdf') ||
      Boolean(filename.match(/\.pdf(\.enc)?$/i));

    const isArchive =
      type === 'archive' ||
      mime.includes('zip') ||
      mime.includes('tar') ||
      mime.includes('compressed') ||
      Boolean(filename.match(/\.(zip|rar|7z|tar|gz|bz2|xz|iso)(\.enc)?$/i));

    const isDoc =
      !isPdf &&
      !isArchive &&
      (type === 'document' ||
        mime.includes('document') ||
        mime.includes('text') ||
        mime.includes('sheet') ||
        Boolean(filename.match(/\.(doc|docx|txt|xlsx|xls|csv|pptx|ppt|rtf|md|json)(\.enc)?$/i)));

    const isPhoto = !isVideo && !isPdf && !isDoc && !isArchive;

    return { isPhoto, isVideo, isPdf, isDoc, isArchive };
  };

  // Folder helper functions
  const isItemInSpecificFolder = (item, folder) => {
    if (!folder) return false;
    if (item.folder_id && item.folder_id === folder.id) return true;
    const key = item.object_key || item.storage_object_key || '';
    const cleanKey = key.replace(/^media\//, '');
    const parts = cleanKey.split('/');
    if (parts.length > 1 && parts[0].toLowerCase().trim() === folder.name?.toLowerCase().trim()) return true;
    return false;
  };

  const isItemInAnyFolder = (item, folders = []) => {
    if (item.folder_id) return true;
    const key = item.object_key || item.storage_object_key || '';
    const cleanKey = key.replace(/^media\//, '');
    const parts = cleanKey.split('/');
    if (parts.length > 1 && folders.some((f) => f.name && f.name.toLowerCase().trim() === parts[0].toLowerCase().trim())) {
      return true;
    }
    return false;
  };

  // Fetch Media and Folders
  const loadMediaUri = useCallback(async (item) => {
    if (!item || !item.id) return;
    try {
      const uri = await getDecryptedMediaUri(item);
      if (uri) {
        setMediaUris((prev) => {
          if (prev[item.id] === uri) return prev;
          return { ...prev, [item.id]: uri };
        });
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const [mediaRes, foldersRes] = await Promise.all([
        mediaApi.list().catch(() => ({ items: [] })),
        mediaApi.getFolders().catch(() => ({ folders: [] })),
      ]);

      const list = mediaRes?.items || mediaRes?.data || (Array.isArray(mediaRes) ? mediaRes : []);
      const folders = foldersRes?.folders || foldersRes?.data || (Array.isArray(foldersRes) ? foldersRes : []);

      setMediaList(list);
      setFolderList(folders);

      // Load media in parallel batches of 6 for fast, non-blocking rendering
      for (let i = 0; i < list.length; i += 6) {
        const batch = list.slice(i, i + 6);
        Promise.all(batch.map((item) => loadMediaUri(item))).catch(() => {});
      }
    } catch (err) {
      console.warn('Media fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchContent();
    setRefreshing(false);
  };

  // Cloud Sync Handler
  const handleCloudSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await mediaApi.sync().catch(() => {});
      clearMediaMemoryCache();
      await fetchContent();
      showAlert('Cloud Synchronized', 'All cloud storage buckets and media items synced successfully.', 'success');
    } catch (e) {
      showAlert('Sync Failed', e.message || 'Could not sync cloud storage.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Calculate live folder counts
  const folderCounts = useMemo(() => {
    const counts = {};
    for (const f of folderList) {
      counts[f.id] = mediaList.filter((item) => isItemInSpecificFolder(item, f)).length;
    }
    return counts;
  }, [mediaList, folderList]);

  // Calculate available unique years from loaded media
  const availableYears = useMemo(() => {
    const yearsSet = new Set();
    mediaList.forEach((item) => {
      const rawDate = item.uploaded_at || item.created_at || item.uploadedAt || item.createdAt;
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        yearsSet.add(d.getFullYear().toString());
      }
    });
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [mediaList]);

  // Calculate dynamic category counts for badges
  const categoryCounts = useMemo(() => {
    let baseList = mediaList;
    if (openFolder) {
      baseList = mediaList.filter((item) => isItemInSpecificFolder(item, openFolder));
    } else {
      baseList = mediaList.filter((item) => !isItemInAnyFolder(item, folderList));
    }

    const counts = { all: baseList.length, photos: 0, videos: 0, pdfs: 0, docs: 0, archives: 0 };
    baseList.forEach((item) => {
      const meta = getMediaMeta(item);
      if (meta.isPhoto) counts.photos++;
      else if (meta.isVideo) counts.videos++;
      else if (meta.isPdf) counts.pdfs++;
      else if (meta.isArchive) counts.archives++;
      else if (meta.isDoc) counts.docs++;
    });
    return counts;
  }, [mediaList, openFolder, folderList]);

  // Filtered media items
  const filteredMedia = useMemo(() => {
    let list = mediaList;

    if (openFolder) {
      list = list.filter((item) => isItemInSpecificFolder(item, openFolder));
    } else {
      list = list.filter((item) => !isItemInAnyFolder(item, folderList));
    }

    // Category filter
    if (activeFilter !== 'all') {
      list = list.filter((item) => {
        const meta = getMediaMeta(item);
        if (activeFilter === 'photos') return meta.isPhoto;
        if (activeFilter === 'videos') return meta.isVideo;
        if (activeFilter === 'pdfs') return meta.isPdf;
        if (activeFilter === 'docs') return meta.isDoc;
        if (activeFilter === 'archives') return meta.isArchive;
        return true;
      });
    }

    // Search query
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((item) => {
        const name = (item.original_filename || item.filename || item.name || '').toLowerCase();
        return name.includes(q);
      });
    }

    // Filter by year
    if (filterYear !== 'all') {
      list = list.filter((item) => {
        const rawDate = item.uploaded_at || item.created_at || item.uploadedAt || item.createdAt;
        const d = new Date(rawDate);
        if (isNaN(d.getTime())) return false;
        return d.getFullYear().toString() === filterYear;
      });
    }

    // Filter by month
    if (filterMonth !== 'all') {
      list = list.filter((item) => {
        const rawDate = item.uploaded_at || item.created_at || item.uploadedAt || item.createdAt;
        const d = new Date(rawDate);
        if (isNaN(d.getTime())) return false;
        return d.getMonth().toString() === filterMonth;
      });
    }

    return list;
  }, [mediaList, folderList, openFolder, activeFilter, search, filterYear, filterMonth]);

  // Sorted media
  const sortedAndFilteredMedia = useMemo(() => {
    const list = [...filteredMedia];

    list.sort((a, b) => {
      if (sortBy === 'date-desc') {
        const da = new Date(a.uploaded_at || a.created_at || 0).getTime();
        const db = new Date(b.uploaded_at || b.created_at || 0).getTime();
        return db - da;
      }
      if (sortBy === 'date-asc') {
        const da = new Date(a.uploaded_at || a.created_at || 0).getTime();
        const db = new Date(b.uploaded_at || b.created_at || 0).getTime();
        return da - db;
      }
      if (sortBy === 'size-desc') {
        const sa = Number(a.file_size || a.size_bytes || a.size || 0);
        const sb = Number(b.file_size || b.size_bytes || b.size || 0);
        return sb - sa;
      }
      if (sortBy === 'size-asc') {
        const sa = Number(a.file_size || a.size_bytes || a.size || 0);
        const sb = Number(b.file_size || b.size_bytes || b.size || 0);
        return sa - sb;
      }
      if (sortBy === 'name-asc') {
        const na = (a.original_filename || a.filename || a.name || '').toLowerCase();
        const nb = (b.original_filename || b.filename || b.name || '').toLowerCase();
        return na.localeCompare(nb);
      }
      if (sortBy === 'name-desc') {
        const na = (a.original_filename || a.filename || a.name || '').toLowerCase();
        const nb = (b.original_filename || b.filename || b.name || '').toLowerCase();
        return nb.localeCompare(na);
      }
      return 0;
    });

    return list;
  }, [filteredMedia, sortBy]);

  // Grouped media utility (Day/Date Timeline, Month, Year, Size, Flat)
  const groupedMedia = useMemo(() => {
    const groups = {};

    if (groupBy === 'none') {
      if (sortedAndFilteredMedia.length > 0) {
        groups['All Files'] = sortedAndFilteredMedia;
      }
      return groups;
    }

    if (groupBy === 'size') {
      const BRACKET_OVER_100M = '> 100 MB (Very Large)';
      const BRACKET_10_100M = '10 MB – 100 MB (Large)';
      const BRACKET_1_10M = '1 MB – 10 MB (Medium)';
      const BRACKET_UNDER_1M = '< 1 MB (Small)';

      sortedAndFilteredMedia.forEach((item) => {
        const size = Number(item.file_size || item.size_bytes || item.size || 0);
        let label = BRACKET_UNDER_1M;
        if (size >= 100 * 1024 * 1024) label = BRACKET_OVER_100M;
        else if (size >= 10 * 1024 * 1024) label = BRACKET_10_100M;
        else if (size >= 1 * 1024 * 1024) label = BRACKET_1_10M;

        if (!groups[label]) groups[label] = [];
        groups[label].push(item);
      });
      return groups;
    }

    if (groupBy === 'year') {
      sortedAndFilteredMedia.forEach((item) => {
        const rawDate = item.uploaded_at || item.created_at;
        const dateObj = new Date(rawDate);
        let label = 'Unknown Date';
        if (!isNaN(dateObj.getTime())) {
          label = `${dateObj.getFullYear()}`;
        }
        if (!groups[label]) groups[label] = [];
        groups[label].push(item);
      });
      return groups;
    }

    if (groupBy === 'month') {
      sortedAndFilteredMedia.forEach((item) => {
        const rawDate = item.uploaded_at || item.created_at;
        const dateObj = new Date(rawDate);
        let label = 'Unknown Date';
        if (!isNaN(dateObj.getTime())) {
          label = dateObj.toLocaleDateString(undefined, {
            month: 'long',
            year: 'numeric',
          });
        }
        if (!groups[label]) groups[label] = [];
        groups[label].push(item);
      });
      return groups;
    }

    // Default: 'date' (Timeline by Day)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfToday.getDate() - 1);

    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfToday.getDate() + 1);

    sortedAndFilteredMedia.forEach((item) => {
      const rawDate = item.uploaded_at || item.created_at;
      const dateObj = new Date(rawDate);
      if (isNaN(dateObj.getTime())) {
        if (!groups['Earlier']) groups['Earlier'] = [];
        groups['Earlier'].push(item);
        return;
      }

      let label = '';
      if (dateObj >= startOfToday && dateObj < startOfTomorrow) {
        label = 'Today';
      } else if (dateObj >= startOfYesterday && dateObj < startOfToday) {
        label = 'Yesterday';
      } else {
        label = dateObj.toLocaleDateString(undefined, {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });
      }

      if (!groups[label]) groups[label] = [];
      groups[label].push(item);
    });

    return groups;
  }, [sortedAndFilteredMedia, groupBy]);

  // Multi-select toggling
  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === sortedAndFilteredMedia.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedAndFilteredMedia.map((m) => m.id)));
    }
  };

  // Bulk Delete
  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    showAlert(
      `Delete ${count} ${count === 1 ? 'Item' : 'Items'}`,
      `Are you sure you want to permanently delete ${count} encrypted files from your vault?`,
      'warning',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            setIsBulkDeleting(true);
            try {
              await mediaApi.bulkDelete(Array.from(selectedIds));
              setSelectedIds(new Set());
              showAlert('Deleted', `Successfully removed ${count} files.`, 'success');
              fetchContent();
            } catch (err) {
              showAlert('Delete Failed', err.message || 'Could not delete all selected items.', 'error');
            } finally {
              setIsBulkDeleting(false);
            }
          },
        },
      ]
    );
  };

  // Bulk Download
  const handleBulkDownload = async () => {
    if (selectedIds.size === 0 || isBulkDownloading) return;
    setIsBulkDownloading(true);
    const selectedItems = sortedAndFilteredMedia.filter((m) => selectedIds.has(m.id));
    let downloadedCount = 0;

    for (const item of selectedItems) {
      try {
        await downloadMediaFile(item);
        downloadedCount++;
      } catch (err) {
        console.warn(`Failed to download item ${item.id}:`, err.message);
      }
    }

    setIsBulkDownloading(false);
    setSelectedIds(new Set());
    showAlert('Download Finished', `Successfully saved ${downloadedCount} of ${selectedItems.length} files to your phone.`, 'success');
  };

  // Lightbox helpers
  const currentItem = selectedIndex !== null ? sortedAndFilteredMedia[selectedIndex] : null;
  const currentMeta = getMediaMeta(currentItem);

  const openLightbox = (index) => {
    if (isSelectionMode) return;
    setSelectedIndex(index);
    setZoomLevel(1);
    setShowInfoPanel(false);
    const item = sortedAndFilteredMedia[index];
    if (item && !mediaUris[item.id]) {
      loadMediaUri(item);
    }
  };

  const closeLightbox = () => {
    setSelectedIndex(null);
    setZoomLevel(1);
    setShowInfoPanel(false);
  };

  const handlePrev = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      const nextIdx = selectedIndex - 1;
      setSelectedIndex(nextIdx);
      setZoomLevel(1);
      const item = sortedAndFilteredMedia[nextIdx];
      if (item && !mediaUris[item.id]) {
        loadMediaUri(item);
      }
    }
  };

  const handleNext = () => {
    if (selectedIndex !== null && selectedIndex < sortedAndFilteredMedia.length - 1) {
      const nextIdx = selectedIndex + 1;
      setSelectedIndex(nextIdx);
      setZoomLevel(1);
      const item = sortedAndFilteredMedia[nextIdx];
      if (item && !mediaUris[item.id]) {
        loadMediaUri(item);
      }
    }
  };

  // Single Item Download
  const handleDownload = async () => {
    if (!currentItem || isDownloading) return;
    setIsDownloading(true);

    try {
      const res = await downloadMediaFile(currentItem);
      if (res.savedToGallery) {
        showAlert('Downloaded', 'Decrypted media saved directly to your phone Gallery / Photos.', 'success');
      } else {
        showAlert('Downloaded', `File "${res.filename}" downloaded successfully.`, 'success');
      }
    } catch (err) {
      showAlert('Download Failed', err.message || 'Could not download media file.', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  // Delete Current Item
  const handleDeleteCurrent = () => {
    if (!currentItem) return;
    showAlert(
      'Delete Encrypted File',
      `Permanently delete "${currentItem.original_filename || currentItem.filename || 'this file'}" from your vault?`,
      'warning',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await mediaApi.delete(currentItem.id);
              closeLightbox();
              fetchContent();
            } catch (err) {
              showAlert('Error', err.message || 'Could not delete file', 'error');
            }
          },
        },
      ]
    );
  };

  // Delete Folder
  const handleDeleteFolder = (folder) => {
    showAlert(
      'Delete Folder',
      `Are you sure you want to delete folder "${folder.name}"? Files inside will remain safe in your vault.`,
      'warning',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Folder',
          style: 'destructive',
          onPress: async () => {
            try {
              await mediaApi.deleteFolder(folder.id);
              if (openFolder?.id === folder.id) {
                setOpenFolder(null);
              }
              fetchContent();
            } catch (err) {
              showAlert('Error', err.message || 'Failed to delete folder', 'error');
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenWrapper
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#38bdf8"
          colors={['#38bdf8']}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        {openFolder ? (
          <TouchableOpacity
            onPress={() => setOpenFolder(null)}
            style={styles.backBtn}
          >
            <ArrowLeft size={16} color="#2dd4bf" />
            <Text style={styles.backBtnText}>Library</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>Media Vault</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              AES-256-GCM • {sortedAndFilteredMedia.length} {sortedAndFilteredMedia.length === 1 ? 'file' : 'files'}
            </Text>
          </View>
        )}

        <View style={styles.headerRightBtns}>
          {/* Cloud Sync Button */}
          <TouchableOpacity
            onPress={handleCloudSync}
            disabled={isSyncing}
            style={styles.iconActionBtn}
            title="Sync Cloud"
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color="#38bdf8" />
            ) : (
              <RefreshCw size={15} color="#38bdf8" />
            )}
          </TouchableOpacity>

          {/* Multi-select Toggle Button */}
          <TouchableOpacity
            onPress={() => {
              if (isSelectionMode) setSelectedIds(new Set());
              else setSelectedIds(new Set(sortedAndFilteredMedia.slice(0, 1).map((m) => m.id)));
            }}
            style={[styles.iconActionBtn, isSelectionMode && styles.iconActionBtnActive]}
          >
            <CheckSquare size={15} color={isSelectionMode ? '#2dd4bf' : '#94a3b8'} />
          </TouchableOpacity>

          {!openFolder && (
            <TouchableOpacity
              onPress={() => setCreateFolderOpen(true)}
              style={styles.newFolderBtn}
            >
              <FolderPlus size={14} color="#2dd4bf" />
              <Text style={styles.newFolderBtnText}>Folder</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => setUploadModalOpen(true)}
            style={styles.uploadBtn}
          >
            <Plus size={15} color="#020617" />
            <Text style={styles.uploadBtnText}>Upload</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Multi-Select Floating Toolbar */}
      {isSelectionMode && (
        <View style={styles.selectionBar}>
          <View style={styles.selectionBarLeft}>
            <TouchableOpacity onPress={selectAll} style={styles.selectAllBtn}>
              <Text style={styles.selectAllText}>
                {selectedIds.size === sortedAndFilteredMedia.length ? 'Deselect All' : 'Select All'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.selectionCountText}>
              {selectedIds.size} Selected
            </Text>
          </View>

          <View style={styles.selectionBarRight}>
            <TouchableOpacity
              onPress={handleBulkDownload}
              disabled={isBulkDownloading}
              style={styles.selectionActionBtn}
            >
              {isBulkDownloading ? (
                <ActivityIndicator size="small" color="#2dd4bf" />
              ) : (
                <Download size={15} color="#2dd4bf" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleBulkDelete}
              disabled={isBulkDeleting}
              style={[styles.selectionActionBtn, styles.selectionDeleteBtn]}
            >
              {isBulkDeleting ? (
                <ActivityIndicator size="small" color="#f43f5e" />
              ) : (
                <Trash2 size={15} color="#f43f5e" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedIds(new Set())}
              style={styles.selectionCloseBtn}
            >
              <X size={15} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* If Inside a Folder: Folder Banner */}
      {openFolder && (
        <View style={styles.folderBanner}>
          <View style={styles.folderBannerLeft}>
            <View
              style={[
                styles.folderBannerIcon,
                {
                  backgroundColor: FOLDER_COLORS[openFolder.color]?.bg || FOLDER_COLORS.teal.bg,
                  borderColor: FOLDER_COLORS[openFolder.color]?.border || FOLDER_COLORS.teal.border,
                },
              ]}
            >
              <Folder
                size={18}
                color={FOLDER_COLORS[openFolder.color]?.hex || FOLDER_COLORS.teal.hex}
                fill={FOLDER_COLORS[openFolder.color]?.hex || FOLDER_COLORS.teal.hex}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.folderBannerTitle} numberOfLines={1}>{openFolder.name}</Text>
              <Text style={styles.folderBannerSubtitle}>
                {filteredMedia.length} {filteredMedia.length === 1 ? 'encrypted file' : 'encrypted files'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => handleDeleteFolder(openFolder)}
            style={styles.deleteFolderBtn}
          >
            <Trash2 size={15} color="#fda4af" />
          </TouchableOpacity>
        </View>
      )}

      {/* Search Input Bar */}
      <View style={styles.searchBar}>
        <Search size={16} color="#94a3b8" />
        <TextInput
          placeholder={openFolder ? `Search in ${openFolder.name}...` : 'Search encrypted media...'}
          placeholderTextColor="#64748b"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <X size={14} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filter Tabs with Live Dynamic Count Badges */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
      >
        {FILTER_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeFilter === tab.id;
          const count = categoryCounts[tab.id] ?? 0;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveFilter(tab.id)}
              style={[
                styles.tabPill,
                isActive && {
                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                  borderColor: tab.color,
                },
              ]}
            >
              <Icon size={14} color={isActive ? tab.color : '#64748b'} />
              <Text
                style={[
                  styles.tabPillText,
                  isActive && { color: tab.color, fontWeight: '700' },
                ]}
              >
                {tab.label}
              </Text>
              <View style={[styles.badgeTag, isActive && { backgroundColor: 'rgba(56, 189, 248, 0.25)' }]}>
                <Text style={[styles.badgeText, isActive && { color: tab.color }]}>{count}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Timeline Controls Bar: Group By & Sort Options */}
      <View style={styles.controlsBar}>
        {/* Group By Selector */}
        <TouchableOpacity
          onPress={() => setShowGroupMenu(true)}
          style={styles.controlPill}
        >
          <Calendar size={13} color="#2dd4bf" />
          <Text style={styles.controlPillText}>
            Group: <Text style={{ color: '#ffffff', fontWeight: '700' }}>{GROUP_OPTIONS.find((g) => g.id === groupBy)?.label || 'Timeline'}</Text>
          </Text>
          <ChevronDown size={12} color="#64748b" />
        </TouchableOpacity>

        {/* Sort Selector */}
        <TouchableOpacity
          onPress={() => setShowSortMenu(true)}
          style={styles.controlPill}
        >
          <ArrowUpDown size={13} color="#38bdf8" />
          <Text style={styles.controlPillText}>
            Sort: <Text style={{ color: '#ffffff', fontWeight: '700' }}>{SORT_OPTIONS.find((s) => s.id === sortBy)?.label.split(':')[0] || 'Date'}</Text>
          </Text>
          <ChevronDown size={12} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* Year & Month Dynamic Filter Chips */}
      {availableYears.length > 0 && (
        <View style={styles.dateFiltersContainer}>
          {/* Year Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateFilterScroll}
          >
            <TouchableOpacity
              onPress={() => setFilterYear('all')}
              style={[styles.dateChip, filterYear === 'all' && styles.dateChipActive]}
            >
              <Text style={[styles.dateChipText, filterYear === 'all' && styles.dateChipTextActive]}>All Years</Text>
            </TouchableOpacity>
            {availableYears.map((y) => (
              <TouchableOpacity
                key={y}
                onPress={() => setFilterYear(y)}
                style={[styles.dateChip, filterYear === y && styles.dateChipActive]}
              >
                <Text style={[styles.dateChipText, filterYear === y && styles.dateChipTextActive]}>{y}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Month Chips (Shown when specific year or all) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.dateFilterScroll, { marginTop: 6 }]}
          >
            {MONTH_NAMES.map((m) => (
              <TouchableOpacity
                key={m.id}
                onPress={() => setFilterMonth(m.id)}
                style={[styles.dateChipSmall, filterMonth === m.id && styles.dateChipActive]}
              >
                <Text style={[styles.dateChipSmallText, filterMonth === m.id && styles.dateChipTextActive]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ROOT LEVEL: Folders Section */}
      {!openFolder && folderList.length > 0 && (
        <View style={styles.foldersSection}>
          <View style={styles.foldersSectionHeader}>
            <View style={styles.foldersSectionTitleRow}>
              <Folder size={14} color="#2dd4bf" />
              <Text style={styles.foldersSectionTitle}>FOLDERS</Text>
            </View>
            <Text style={styles.foldersCountTag}>
              {folderList.length} {folderList.length === 1 ? 'folder' : 'folders'}
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.foldersScroll}
          >
            {folderList.map((f) => {
              const c = FOLDER_COLORS[f.color] || FOLDER_COLORS.teal;
              const count = folderCounts[f.id] ?? 0;

              return (
                <TouchableOpacity
                  key={f.id}
                  onPress={() => setOpenFolder(f)}
                  activeOpacity={0.8}
                  style={[styles.folderCard, { borderColor: c.border }]}
                >
                  <View style={styles.folderCardTop}>
                    <View style={[styles.folderIconBox, { backgroundColor: c.bg, borderColor: c.border }]}>
                      <Folder size={18} color={c.hex} fill={c.hex} />
                    </View>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteFolder(f);
                      }}
                      style={styles.folderTrashBtn}
                    >
                      <Trash2 size={13} color="#64748b" />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.folderCardName} numberOfLines={1}>
                    {f.name}
                  </Text>
                  <Text style={styles.folderCardCount}>
                    {count} {count === 1 ? 'file' : 'files'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Empty State */}
      {sortedAndFilteredMedia.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            {openFolder ? <Folder size={32} color="#2dd4bf" /> : <Film size={32} color="#38bdf8" />}
          </View>
          <Text style={styles.emptyTitle}>
            {openFolder ? 'This folder is empty' : 'No Encrypted Files Found'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {openFolder
              ? `Files saved to "${openFolder.name}" will appear here.`
              : 'Upload photos, videos, and documents to start encrypting in your vault.'}
          </Text>
        </View>
      ) : (
        /* Grouped Timeline Galleries */
        <View style={styles.timelineContainer}>
          {Object.entries(groupedMedia).map(([groupLabel, items]) => {
            const groupTotalBytes = items.reduce(
              (sum, item) => sum + Number(item.file_size || item.size_bytes || item.size || 0),
              0
            );

            return (
              <View key={groupLabel} style={styles.groupSection}>
                {/* Timeline Group Header */}
                <View style={styles.groupHeader}>
                  <View style={styles.groupHeaderLeft}>
                    <Text style={styles.groupTitle}>{groupLabel}</Text>
                    <Text style={styles.groupMeta}>
                      {items.length} {items.length === 1 ? 'file' : 'files'} • {formatBytes(groupTotalBytes)}
                    </Text>
                  </View>
                  <View style={styles.groupHeaderLine} />
                </View>

                {/* Media Tiles Grid */}
                <View style={styles.galleryGrid}>
                  {items.map((item) => {
                    const globalIdx = sortedAndFilteredMedia.findIndex((m) => m.id === item.id);
                    const meta = getMediaMeta(item);
                    const localUri = mediaUris[item.id];
                    const isItemLoading = loadingUris[item.id];
                    const isSelected = selectedIds.has(item.id);

                    return (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => {
                          if (isSelectionMode) toggleSelect(item.id);
                          else openLightbox(globalIdx);
                        }}
                        onLongPress={() => toggleSelect(item.id)}
                        activeOpacity={0.8}
                        style={[
                          styles.tile,
                          isSelected && styles.tileSelected,
                        ]}
                      >
                        {meta.isPhoto ? (
                          localUri ? (
                            <Image
                              source={{ uri: localUri }}
                              style={styles.tileImage}
                              resizeMode="cover"
                            />
                          ) : isItemLoading ? (
                            <View style={styles.tilePlaceholder}>
                              <ActivityIndicator size="small" color="#2dd4bf" />
                            </View>
                          ) : (
                            <View style={styles.tilePlaceholder}>
                              <ImageIcon size={24} color="#38bdf8" />
                            </View>
                          )
                        ) : meta.isVideo ? (
                          <VideoThumbnailTile
                            uri={localUri}
                            isLoading={isItemLoading}
                          />
                        ) : meta.isPdf ? (
                          <View style={[styles.tilePlaceholder, { backgroundColor: 'rgba(251, 191, 36, 0.12)' }]}>
                            <FileText size={24} color="#fbbf24" />
                            <Text style={styles.tileTag}>PDF</Text>
                          </View>
                        ) : meta.isArchive ? (
                          <View style={[styles.tilePlaceholder, { backgroundColor: 'rgba(52, 211, 153, 0.12)' }]}>
                            <Archive size={24} color="#34d399" />
                            <Text style={[styles.tileTag, { color: '#34d399' }]}>ZIP</Text>
                          </View>
                        ) : (
                          <View style={[styles.tilePlaceholder, { backgroundColor: 'rgba(167, 139, 250, 0.12)' }]}>
                            <FileText size={24} color="#a78bfa" />
                            <Text style={[styles.tileTag, { color: '#a78bfa' }]}>DOC</Text>
                          </View>
                        )}

                        {/* Multi-select check icon */}
                        {isSelectionMode ? (
                          <View style={[styles.selectBadge, isSelected && styles.selectBadgeActive]}>
                            {isSelected ? (
                              <Check size={12} color="#020617" />
                            ) : (
                              <Square size={12} color="#94a3b8" />
                            )}
                          </View>
                        ) : (
                          /* Subtle Encrypted Tag */
                          <View style={styles.lockCorner}>
                            <Lock size={9} color="#2dd4bf" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Fullscreen Lightbox Modal */}
      <Modal visible={selectedIndex !== null} animationType="fade" transparent>
        <View style={styles.lightboxContainer}>
          {/* Top Bar: Close (Left) | Title & Counter (Center) | Actions (Right) */}
          <View style={styles.lightboxTopBar}>
            <TouchableOpacity
              onPress={closeLightbox}
              style={styles.lightboxIconBtn}
            >
              <X size={20} color="#ffffff" />
            </TouchableOpacity>

            <View style={styles.lightboxTitleCenter}>
              <Text style={styles.lightboxTitle} numberOfLines={1}>
                {currentItem?.original_filename || currentItem?.filename || 'Media Item'}
              </Text>
              <Text style={styles.lightboxCounter}>
                {selectedIndex !== null ? selectedIndex + 1 : 1} / {sortedAndFilteredMedia.length}
              </Text>
            </View>

            <View style={styles.lightboxRightGroup}>
              <TouchableOpacity
                onPress={handleDownload}
                disabled={isDownloading}
                style={[styles.lightboxIconBtn, styles.downloadIconBtn]}
              >
                {isDownloading ? (
                  <ActivityIndicator size="small" color="#2dd4bf" />
                ) : (
                  <Download size={17} color="#2dd4bf" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowInfoPanel(!showInfoPanel)}
                style={[
                  styles.lightboxIconBtn,
                  showInfoPanel && styles.actionIconBtnActive,
                ]}
              >
                <Info size={17} color={showInfoPanel ? '#2dd4bf' : '#94a3b8'} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDeleteCurrent}
                style={[styles.lightboxIconBtn, styles.deleteIconBtn]}
              >
                <Trash2 size={17} color="#fda4af" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Main Viewer Area */}
          <View style={styles.lightboxMain}>
            {selectedIndex !== null && selectedIndex > 0 && (
              <TouchableOpacity
                onPress={handlePrev}
                style={[styles.navBtn, styles.navBtnLeft]}
              >
                <ChevronLeft size={26} color="#ffffff" />
              </TouchableOpacity>
            )}

            <View style={styles.viewerContent}>
              {currentMeta.isPhoto ? (
                mediaUris[currentItem?.id] ? (
                  <Image
                    source={{ uri: mediaUris[currentItem.id] }}
                    style={[
                      styles.fullImage,
                      { transform: [{ scale: zoomLevel }] },
                    ]}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.viewerLoadingBox}>
                    <ActivityIndicator size="large" color="#2dd4bf" />
                    <Text style={styles.viewerLoadingText}>Decrypting Image Stream...</Text>
                  </View>
                )
              ) : currentMeta.isVideo ? (
                mediaUris[currentItem?.id] ? (
                  <NativeVideoPlayer
                    source={{ uri: mediaUris[currentItem.id] }}
                    style={styles.fullVideo}
                    autoPlay={true}
                    loop={true}
                    showControls={true}
                  />
                ) : (
                  <View style={styles.viewerLoadingBox}>
                    <ActivityIndicator size="large" color="#f43f5e" />
                    <Text style={styles.viewerLoadingText}>Decrypting Video Stream...</Text>
                  </View>
                )
              ) : (
                <View style={styles.documentViewer}>
                  <View style={styles.documentIconCircle}>
                    <FileText size={48} color="#fbbf24" />
                  </View>
                  <Text style={styles.docTitle} numberOfLines={2}>
                    {currentItem?.original_filename || currentItem?.filename || 'Encrypted File'}
                  </Text>
                  <Text style={styles.docSize}>
                    {formatBytes(currentItem?.size_bytes || currentItem?.file_size || currentItem?.size)} • AES-256-GCM
                  </Text>
                  <TouchableOpacity
                    onPress={handleDownload}
                    style={styles.docDownloadBtn}
                  >
                    <Download size={16} color="#020617" />
                    <Text style={styles.docDownloadBtnText}>Save / Export to Phone</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {selectedIndex !== null && selectedIndex < sortedAndFilteredMedia.length - 1 && (
              <TouchableOpacity
                onPress={handleNext}
                style={[styles.navBtn, styles.navBtnRight]}
              >
                <ChevronRight size={26} color="#ffffff" />
              </TouchableOpacity>
            )}
          </View>

          {/* Details Drawer */}
          {showInfoPanel && currentItem && (
            <View style={styles.infoDrawer}>
              <View style={styles.infoHeader}>
                <Text style={styles.infoHeading}>File Details</Text>
                <TouchableOpacity onPress={() => setShowInfoPanel(false)}>
                  <X size={16} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.infoScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>FILE NAME</Text>
                  <Text style={styles.infoValueMono}>
                    {currentItem.original_filename || currentItem.filename || currentItem.name || 'Unnamed'}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>FILE SIZE</Text>
                  <Text style={styles.infoValue}>
                    {formatBytes(currentItem.size_bytes || currentItem.file_size || currentItem.size)}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>CONTENT TYPE</Text>
                  <Text style={styles.infoValueMono}>
                    {currentItem.mime_type || currentItem.content_type || 'Unknown'}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>UPLOADED DATE</Text>
                  <Text style={styles.infoValue}>
                    {currentItem.created_at || currentItem.uploaded_at
                      ? new Date(currentItem.created_at || currentItem.uploaded_at).toLocaleString()
                      : 'Recently'}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>CRYPTOGRAPHIC SECURITY</Text>
                  <View style={styles.cryptoItem}>
                    <Shield size={14} color="#2dd4bf" />
                    <Text style={styles.cryptoItemText}>AES-256-GCM Zero-Knowledge</Text>
                  </View>
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>

      {/* Group By Selection Modal */}
      <Modal visible={showGroupMenu} transparent animationType="fade">
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowGroupMenu(false)}
        >
          <View style={styles.menuCard}>
            <Text style={styles.menuTitle}>GROUP MEDIA BY</Text>
            {GROUP_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                onPress={() => {
                  setGroupBy(opt.id);
                  setShowGroupMenu(false);
                }}
                style={[styles.menuOption, groupBy === opt.id && styles.menuOptionActive]}
              >
                <Text style={[styles.menuOptionText, groupBy === opt.id && styles.menuOptionTextActive]}>
                  {opt.label}
                </Text>
                {groupBy === opt.id && <Check size={16} color="#2dd4bf" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Sort Selection Modal */}
      <Modal visible={showSortMenu} transparent animationType="fade">
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowSortMenu(false)}
        >
          <View style={styles.menuCard}>
            <Text style={styles.menuTitle}>SORT MEDIA BY</Text>
            {SORT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                onPress={() => {
                  setSortBy(opt.id);
                  setShowSortMenu(false);
                }}
                style={[styles.menuOption, sortBy === opt.id && styles.menuOptionActive]}
              >
                <Text style={[styles.menuOptionText, sortBy === opt.id && styles.menuOptionTextActive]}>
                  {opt.label}
                </Text>
                {sortBy === opt.id && <Check size={16} color="#38bdf8" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Create Folder Modal */}
      <CreateFolderModal
        visible={createFolderOpen}
        onClose={() => setCreateFolderOpen(false)}
        onFolderCreated={(folder) => {
          setFolderList((prev) => [folder, ...prev]);
          showAlert('Folder Created', `Folder "${folder.name}" created successfully.`, 'success');
          fetchContent();
        }}
      />

      {/* Media Upload Modal (Photos, Videos, Camera, Files) */}
      <MediaUploadModal
        visible={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        folders={folderList}
        currentFolder={openFolder}
        onUploadSuccess={(uploadedItem) => {
          showAlert(
            'Upload Complete',
            `File "${uploadedItem?.original_filename || uploadedItem?.filename || 'File'}" was encrypted with AES-256-GCM and saved to your vault.`,
            'success'
          );
          fetchContent();
        }}
      />

      {/* Dark Themed Alert Modal for All Popups and Errors */}
      <AlertModal
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={closeAlert}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#0f172a',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2dd4bf',
  },
  headerTitleContainer: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  headerRightBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconActionBtnActive: {
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
    borderColor: '#2dd4bf',
  },
  newFolderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 9,
    borderRadius: 10,
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.25)',
  },
  newFolderBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2dd4bf',
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 10,
    backgroundColor: '#2dd4bf',
  },
  uploadBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#020617',
  },
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  selectionBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#0f172a',
  },
  selectAllText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2dd4bf',
  },
  selectionCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  selectionBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectionActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionDeleteBtn: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
  },
  selectionCloseBtn: {
    padding: 6,
  },
  folderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 18,
    padding: 14,
    marginTop: 12,
    marginBottom: 4,
  },
  folderBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  folderBannerIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  folderBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  folderBannerSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 1,
  },
  deleteFolderBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.25)',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginVertical: 12,
  },
  searchInput: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 13,
    marginLeft: 10,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    paddingRight: 16,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  tabPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  badgeTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    fontFamily: 'monospace',
  },
  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  controlPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  controlPillText: {
    fontSize: 11,
    color: '#94a3b8',
    marginHorizontal: 4,
  },
  dateFiltersContainer: {
    marginBottom: 14,
  },
  dateFilterScroll: {
    flexDirection: 'row',
    gap: 6,
    paddingRight: 16,
  },
  dateChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  dateChipActive: {
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
    borderColor: '#2dd4bf',
  },
  dateChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
  dateChipTextActive: {
    color: '#2dd4bf',
    fontWeight: '700',
  },
  dateChipSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  dateChipSmallText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
  },
  foldersSection: {
    marginBottom: 16,
    gap: 10,
  },
  foldersSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  foldersSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  foldersSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#cbd5e1',
    letterSpacing: 0.8,
  },
  foldersCountTag: {
    fontSize: 10,
    color: '#64748b',
    fontFamily: 'monospace',
  },
  foldersScroll: {
    gap: 10,
    paddingRight: 10,
  },
  folderCard: {
    width: 128,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    gap: 4,
  },
  folderCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  folderIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  folderTrashBtn: {
    padding: 4,
  },
  folderCardName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f8fafc',
  },
  folderCardCount: {
    fontSize: 10,
    color: '#64748b',
    fontFamily: 'monospace',
  },
  emptyContainer: {
    paddingVertical: 64,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 18,
  },
  timelineContainer: {
    gap: 18,
    paddingBottom: 24,
  },
  groupSection: {
    gap: 10,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  groupHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  groupMeta: {
    fontSize: 10,
    color: '#64748b',
    fontFamily: 'monospace',
  },
  groupHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1e293b',
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileSelected: {
    borderColor: '#2dd4bf',
    borderWidth: 2,
  },
  tileImage: {
    width: '100%',
    height: '100%',
  },
  tilePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tileTag: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#fbbf24',
  },
  lockCorner: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    padding: 3,
    borderRadius: 4,
    backgroundColor: 'rgba(2, 6, 23, 0.8)',
  },
  selectBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(2, 6, 23, 0.8)',
    borderWidth: 1,
    borderColor: '#64748b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectBadgeActive: {
    backgroundColor: '#2dd4bf',
    borderColor: '#2dd4bf',
  },
  lightboxContainer: {
    flex: 1,
    backgroundColor: '#020617',
    justifyContent: 'space-between',
  },
  lightboxTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 44,
    paddingBottom: 12,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    zIndex: 30,
  },
  lightboxIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
  },
  lightboxTitleCenter: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  lightboxTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  lightboxCounter: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#2dd4bf',
    marginTop: 1,
  },
  lightboxRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionIconBtnActive: {
    backgroundColor: 'rgba(45, 212, 191, 0.25)',
    borderWidth: 1,
    borderColor: '#2dd4bf',
  },
  downloadIconBtn: {
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
  },
  deleteIconBtn: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
  },
  lightboxMain: {
    flex: 1,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerContent: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  viewerLoadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  viewerLoadingText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  fullVideo: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.75,
  },
  documentViewer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
    backgroundColor: '#0f172a',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
    maxWidth: 320,
  },
  documentIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  docTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  docSize: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#94a3b8',
  },
  docDownloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: '#2dd4bf',
    marginTop: 6,
  },
  docDownloadBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#020617',
  },
  navBtn: {
    position: 'absolute',
    top: '50%',
    marginTop: -24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 25,
  },
  navBtnLeft: {
    left: 14,
  },
  navBtnRight: {
    right: 14,
  },
  infoDrawer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: 280,
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    zIndex: 40,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    marginBottom: 12,
  },
  infoHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  infoScroll: {
    gap: 12,
  },
  infoRow: {
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 13,
    color: '#e2e8f0',
    fontWeight: '500',
  },
  infoValueMono: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#cbd5e1',
  },
  cryptoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  cryptoItemText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2dd4bf',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  menuCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#0f172a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 16,
    gap: 6,
  },
  menuTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#090d16',
  },
  menuOptionActive: {
    backgroundColor: 'rgba(45, 212, 191, 0.12)',
    borderWidth: 1,
    borderColor: '#2dd4bf',
  },
  menuOptionText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
  },
  menuOptionTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
