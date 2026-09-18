import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Card } from '../../components/ui/Card';
import { Progress } from '../../components/ui/Progress';
import { AlertModal } from '../../components/ui/AlertModal';
import { AddStorageModal } from '../../components/storage/AddStorageModal';
import { storageApi } from '../../services/api';
import {
  HardDrive,
  Cloud,
  Server,
  Plus,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Zap,
  Shield,
  Star,
  ExternalLink,
  Layers,
} from 'lucide-react-native';

const PROVIDER_COLORS = {
  r2: '#fb923c',
  s3: '#fbbf24',
  b2: '#f43f5e',
  wasabi: '#34d399',
  minio: '#38bdf8',
  custom: '#a78bfa',
};

export default function StorageScreen() {
  const [connections, setConnections] = useState([]);
  const [usage, setUsage] = useState({ usedBytes: 0, totalBytes: 10737418240 });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [testingId, setTestingId] = useState(null);
  const [refreshingId, setRefreshingId] = useState(null);

  // Add Storage Modal State
  const [addStorageOpen, setAddStorageOpen] = useState(false);

  // Alert State
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
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const fetchStorage = async () => {
    setLoading(true);
    try {
      const res = await storageApi.list().catch(() => null);
      const list = res?.connections || res?.data || (Array.isArray(res) ? res : []);
      setConnections(list);
      if (res?.combined) {
        setUsage(res.combined);
      } else {
        const usageRes = await storageApi.getUsage().catch(() => null);
        if (usageRes) {
          setUsage(usageRes.combined || usageRes.data || usageRes);
        }
      }
    } catch (e) {
      console.warn('Storage fetch warning:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStorage();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStorage();
    setRefreshing(false);
  };

  // Sync all storage connections live
  const handleSyncAll = async () => {
    if (isSyncingAll) return;
    setIsSyncingAll(true);
    try {
      await storageApi.syncAll();
      await fetchStorage();
      showAlert('Sync Complete', 'All cloud storage buckets and storage quotas synced successfully.', 'success');
    } catch (err) {
      showAlert('Sync Failed', err.message || 'Failed to sync storage targets.', 'error');
    } finally {
      setIsSyncingAll(false);
    }
  };

  // Test individual storage target live
  const handleTestTarget = async (conn) => {
    setTestingId(conn.id);
    try {
      const res = await storageApi.test(conn.id);
      if (res.success) {
        showAlert('Target Verified', `✓ ${conn.name}: S3 API connection is active and bucket is writable.`, 'success');
      } else {
        showAlert('Check Failed', `✕ ${conn.name}: ${res.error || 'Check access keys and CORS permissions.'}`, 'error');
      }
    } catch (err) {
      showAlert('Test Error', err.message || 'Could not reach storage provider.', 'error');
    } finally {
      setTestingId(null);
    }
  };

  // Refresh single bucket usage
  const handleRefreshTargetUsage = async (conn) => {
    setRefreshingId(conn.id);
    try {
      await storageApi.refreshUsage(conn.id);
      await fetchStorage();
      showAlert('Usage Refreshed', `Live bucket metrics updated for "${conn.name}".`, 'success');
    } catch (err) {
      showAlert('Refresh Failed', err.message || 'Could not fetch bucket size.', 'error');
    } finally {
      setRefreshingId(null);
    }
  };

  // Disconnect / Delete Target
  const handleDeleteTarget = (conn) => {
    showAlert(
      'Disconnect Storage Target',
      `Disconnect "${conn.name}" (${conn.provider?.toUpperCase()})? Any files in this bucket remain safe in your cloud.`,
      'warning',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect Target',
          style: 'destructive',
          onPress: async () => {
            try {
              await storageApi.delete(conn.id);
              setConnections((prev) => prev.filter((c) => c.id !== conn.id));
              fetchStorage();
              showAlert('Disconnected', `Target "${conn.name}" removed from vault.`, 'success');
            } catch (err) {
              showAlert('Error', err.message || 'Failed to disconnect target', 'error');
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
          tintColor="#fbbf24"
          colors={['#fbbf24']}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Storage Hub</Text>
          <Text style={styles.headerSubtitle}>
            Bring Your Own Cloud (BYOC) • {connections.length} {connections.length === 1 ? 'Provider' : 'Providers'}
          </Text>
        </View>

        <View style={styles.headerRightBtns}>
          {/* Sync All Button */}
          <TouchableOpacity
            onPress={handleSyncAll}
            disabled={isSyncingAll}
            style={styles.iconBtn}
          >
            {isSyncingAll ? (
              <ActivityIndicator size="small" color="#fbbf24" />
            ) : (
              <RefreshCw size={15} color="#fbbf24" />
            )}
          </TouchableOpacity>

          {/* Connect Cloud Storage Button */}
          <TouchableOpacity
            onPress={() => setAddStorageOpen(true)}
            style={styles.connectBtn}
          >
            <Plus size={15} color="#020617" />
            <Text style={styles.connectBtnText}>Connect</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Aggregate Storage Meter Card */}
      <Card title="Total Storage Capacity" subtitle="Aggregated BYOC Cloud Quota" icon={HardDrive}>
        <View style={styles.storageContent}>
          <View style={styles.storageHeader}>
            <Text style={styles.storageLabel}>Encrypted Allocation</Text>
            <Text style={styles.storageValue}>
              {formatBytes(usage.usedBytes)} / {formatBytes(usage.totalBytes)}
            </Text>
          </View>
          <Progress value={usage.usedBytes} max={usage.totalBytes} variant="amber" />

          <View style={styles.quotaBreakdownRow}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>USED SPACE</Text>
              <Text style={styles.breakdownValue}>{formatBytes(usage.usedBytes)}</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>AVAILABLE</Text>
              <Text style={[styles.breakdownValue, { color: '#34d399' }]}>
                {formatBytes(Math.max(0, (usage.totalBytes || 0) - (usage.usedBytes || 0)))}
              </Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>ACTIVE TARGETS</Text>
              <Text style={styles.breakdownValue}>{connections.length}</Text>
            </View>
          </View>
        </View>
      </Card>

      {/* Zero-Knowledge Security Notice */}
      <View style={styles.securityNotice}>
        <Shield size={16} color="#2dd4bf" />
        <View style={{ flex: 1 }}>
          <Text style={styles.securityNoticeTitle}>Zero-Knowledge Client Storage</Text>
          <Text style={styles.securityNoticeDesc}>
            All files sent to your cloud buckets are client-side encrypted with AES-256-GCM. Cloud providers never see your plaintext data.
          </Text>
        </View>
      </View>

      {/* Connected Storage Targets List */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeader}>Connected Cloud Targets</Text>
        <Text style={styles.sectionCountTag}>
          {connections.length} {connections.length === 1 ? 'target' : 'targets'}
        </Text>
      </View>

      <View style={styles.list}>
        {connections.length === 0 ? (
          <Card>
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconBadge}>
                <Cloud size={28} color="#64748b" />
              </View>
              <Text style={styles.emptyTitle}>No Cloud Buckets Connected</Text>
              <Text style={styles.emptySubtitle}>
                Connect Cloudflare R2, Amazon S3, Backblaze B2, or Wasabi to store unlimited encrypted files.
              </Text>
              <TouchableOpacity
                onPress={() => setAddStorageOpen(true)}
                style={styles.emptyActionBtn}
              >
                <Plus size={14} color="#020617" />
                <Text style={styles.emptyActionBtnText}>Connect Cloud Storage</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ) : (
          connections.map((conn) => {
            const pColor = PROVIDER_COLORS[conn.provider?.toLowerCase()] || '#fbbf24';
            const isConnTesting = testingId === conn.id;
            const isConnRefreshing = refreshingId === conn.id;

            return (
              <Card key={conn.id}>
                <View style={styles.connCard}>
                  {/* Top Row: Icon + Title + Actions */}
                  <View style={styles.connTopRow}>
                    <View style={styles.connLeft}>
                      <View style={[styles.connIconBadge, { borderColor: pColor }]}>
                        <Server size={18} color={pColor} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.connTitleRow}>
                          <Text style={styles.connTitle} numberOfLines={1}>{conn.name}</Text>
                          {conn.is_default && (
                            <View style={styles.defaultBadge}>
                              <Star size={10} color="#fbbf24" fill="#fbbf24" />
                              <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.connSubtitle}>
                          {conn.provider?.toUpperCase()} • {conn.bucket || 'Default Bucket'}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleDeleteTarget(conn)}
                      style={styles.deleteTargetBtn}
                      title="Disconnect"
                    >
                      <Trash2 size={15} color="#fda4af" />
                    </TouchableOpacity>
                  </View>

                  {/* Quota Progress for this target */}
                  <View style={styles.targetProgressSection}>
                    <View style={styles.targetProgressHeader}>
                      <Text style={styles.targetProgressLabel}>Usage</Text>
                      <Text style={styles.targetProgressValue}>
                        {formatBytes(conn.used_bytes || 0)} / {formatBytes(conn.total_bytes || 10737418240)}
                      </Text>
                    </View>
                    <Progress
                      value={conn.used_bytes || 0}
                      max={conn.total_bytes || 10737418240}
                      variant="amber"
                    />
                  </View>

                  {/* Bottom Action Buttons: Test Connection & Refresh Usage */}
                  <View style={styles.connBottomActions}>
                    <TouchableOpacity
                      onPress={() => handleTestTarget(conn)}
                      disabled={isConnTesting}
                      style={styles.connActionBtn}
                    >
                      {isConnTesting ? (
                        <ActivityIndicator size="small" color="#38bdf8" />
                      ) : (
                        <>
                          <Zap size={13} color="#38bdf8" />
                          <Text style={styles.connActionText}>Test Live</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleRefreshTargetUsage(conn)}
                      disabled={isConnRefreshing}
                      style={styles.connActionBtn}
                    >
                      {isConnRefreshing ? (
                        <ActivityIndicator size="small" color="#2dd4bf" />
                      ) : (
                        <>
                          <RefreshCw size={13} color="#2dd4bf" />
                          <Text style={[styles.connActionText, { color: '#2dd4bf' }]}>Sync Usage</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            );
          })
        )}
      </View>

      {/* Add Storage Modal */}
      <AddStorageModal
        visible={addStorageOpen}
        onClose={() => setAddStorageOpen(false)}
        onStorageAdded={(newConn) => {
          setConnections((prev) => [newConn, ...prev]);
          showAlert('Target Connected', `Successfully connected "${newConn.name}" to your vault.`, 'success');
          fetchStorage();
        }}
      />

      {/* Alert Modal */}
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
    marginBottom: 16,
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
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#fbbf24',
  },
  connectBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#020617',
  },
  storageContent: {
    gap: 12,
  },
  storageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storageLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  storageValue: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#fbbf24',
  },
  quotaBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 10,
    marginTop: 4,
  },
  breakdownItem: {
    gap: 2,
  },
  breakdownLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
  },
  breakdownValue: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#f8fafc',
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(45, 212, 191, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.2)',
    borderRadius: 14,
    padding: 12,
    marginVertical: 14,
  },
  securityNoticeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2dd4bf',
  },
  securityNoticeDesc: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
    lineHeight: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 4,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#cbd5e1',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  sectionCountTag: {
    fontSize: 11,
    color: '#64748b',
    fontFamily: 'monospace',
  },
  list: {
    gap: 12,
    paddingBottom: 24,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 20,
    gap: 8,
  },
  emptyIconBadge: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: 280,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#fbbf24',
    marginTop: 8,
  },
  emptyActionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#020617',
  },
  connCard: {
    gap: 12,
  },
  connTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  connLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  connIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#090d16',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  connTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  defaultBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#fbbf24',
    fontFamily: 'monospace',
  },
  connSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 1,
    fontFamily: 'monospace',
  },
  deleteTargetBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.25)',
  },
  targetProgressSection: {
    gap: 6,
    backgroundColor: '#090d16',
    borderRadius: 12,
    padding: 10,
  },
  targetProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  targetProgressLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  targetProgressValue: {
    fontSize: 10,
    color: '#cbd5e1',
    fontFamily: 'monospace',
  },
  connBottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  connActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  connActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38bdf8',
  },
});
