import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { PandaLogo } from '../../components/ui/PandaLogo';
import { Card } from '../../components/ui/Card';
import { Progress } from '../../components/ui/Progress';
import { useAuth } from '../../context/AuthContext';
import { dashboardApi, storageApi, mediaApi, vaultApi } from '../../services/api';
import {
  KeyRound,
  Film,
  HardDrive,
  ShieldCheck,
  Plus,
  ArrowRight,
  Server,
  Cloud,
} from 'lucide-react-native';
import { router } from 'expo-router';

export default function DashboardScreen() {
  const { user } = useAuth();
  const [data, setData] = useState({
    vaultCount: 0,
    mediaCount: 0,
    storageCount: 0,
    usedBytes: 0,
    totalBytes: 10737418240, // 10GB default
    availableBytes: 10737418240,
  });
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      const [overviewRes, storageRes, usageRes, mediaRes, vaultRes] = await Promise.all([
        dashboardApi.getOverview().catch(() => null),
        storageApi.list().catch(() => null),
        storageApi.getUsage().catch(() => null),
        mediaApi.list().catch(() => null),
        vaultApi.list().catch(() => null),
      ]);

      const connections = storageRes?.connections || storageRes?.data || [];
      const mediaList = mediaRes?.items || mediaRes?.data || (Array.isArray(mediaRes) ? mediaRes : []);
      const vaultList = vaultRes?.items || vaultRes?.data || (Array.isArray(vaultRes) ? vaultRes : []);

      // Calculate total used bytes across all storage connections and media items
      let totalUsed = 0;
      let totalQuota = 0;

      connections.forEach((c) => {
        totalUsed += Number(c.used_bytes || 0);
        totalQuota += Number(c.total_bytes || 10737418240);
      });

      // Also compute from media items
      const mediaBytes = mediaList.reduce(
        (sum, item) => sum + Number(item.file_size || item.size_bytes || item.size || 0),
        0
      );

      const usedBytes = Math.max(
        totalUsed,
        mediaBytes,
        overviewRes?.storage?.usedBytes || 0,
        usageRes?.combined?.usedBytes || 0,
        usageRes?.usedBytes || 0
      );

      const totalBytes = Math.max(
        totalQuota,
        overviewRes?.storage?.totalBytes || 0,
        usageRes?.combined?.totalBytes || 0,
        usageRes?.totalBytes || 10737418240
      );

      const availableBytes = Math.max(0, totalBytes - usedBytes);

      setData({
        vaultCount: vaultList.length || overviewRes?.vault?.total || overviewRes?.vaultCount || 0,
        mediaCount: mediaList.length || overviewRes?.media?.total || overviewRes?.mediaCount || 0,
        storageCount: connections.length || overviewRes?.storage?.connections?.length || overviewRes?.storage?.providerCount || 0,
        usedBytes,
        totalBytes,
        availableBytes,
      });
    } catch (e) {
      console.warn('Dashboard fetch warning:', e.message);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  };

  return (
    <ScreenWrapper
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#2dd4bf"
          colors={['#2dd4bf']}
        />
      }
    >
      {/* Top Header */}
      <View style={styles.topBar}>
        <PandaLogo size="sm" />
        <View style={styles.userBadge}>
          <Text style={styles.userBadgeText}>
            {user?.email?.charAt(0).toUpperCase() || 'P'}
          </Text>
        </View>
      </View>

      {/* Greeting */}
      <View style={styles.greetingSection}>
        <Text style={styles.greetingLabel}>Encrypted Vault Active</Text>
        <Text style={styles.greetingTitle}>
          Welcome, {user?.name || user?.email?.split('@')[0] || 'Vault Master'}
        </Text>
      </View>

      {/* Storage Usage Card */}
      <Card
        title="Universal Storage Quota"
        subtitle="Multi-Cloud Aggregated BYOC Capacity"
        icon={HardDrive}
      >
        <View style={styles.storageContent}>
          <View style={styles.storageHeader}>
            <Text style={styles.storageLabel}>Encrypted Allocation</Text>
            <Text style={styles.storageValue}>
              {formatBytes(data.usedBytes)} / {formatBytes(data.totalBytes)}
            </Text>
          </View>

          <Progress value={data.usedBytes} max={data.totalBytes} variant="teal" />

          {/* 3-Column Quota Breakdown */}
          <View style={styles.quotaBreakdownRow}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>USED SPACE</Text>
              <Text style={styles.breakdownValue}>{formatBytes(data.usedBytes)}</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>REMAINING</Text>
              <Text style={[styles.breakdownValue, { color: '#34d399' }]}>
                {formatBytes(data.availableBytes)}
              </Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>CLOUD TARGETS</Text>
              <Text style={styles.breakdownValue}>{data.storageCount}</Text>
            </View>
          </View>

          <View style={styles.cryptoBadge}>
            <View style={styles.cryptoBadgeLeft}>
              <ShieldCheck size={14} color="#2dd4bf" />
              <Text style={styles.cryptoBadgeText}>AES-256-GCM Hardware Encrypted</Text>
            </View>
            <Text style={styles.cryptoBadgeRight}>Zero-Knowledge</Text>
          </View>
        </View>
      </Card>

      {/* Statistics 3-Column Grid */}
      <View style={styles.statsGrid}>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/vault')}
          style={styles.statBox}
        >
          <KeyRound size={22} color="#2dd4bf" />
          <Text style={styles.statNumber}>{data.vaultCount}</Text>
          <Text style={styles.statLabel}>Passwords</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(tabs)/media')}
          style={styles.statBox}
        >
          <Film size={22} color="#38bdf8" />
          <Text style={styles.statNumber}>{data.mediaCount}</Text>
          <Text style={styles.statLabel}>Media Files</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(tabs)/storage')}
          style={styles.statBox}
        >
          <HardDrive size={22} color="#fbbf24" />
          <Text style={styles.statNumber}>{data.storageCount}</Text>
          <Text style={styles.statLabel}>Cloud Buckets</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions Card */}
      <Card title="Quick Actions" subtitle="One-tap secure operations">
        <View style={styles.actionList}>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/vault')}
            style={styles.actionItem}
          >
            <View style={styles.actionItemLeft}>
              <View style={[styles.actionIconBadge, { backgroundColor: 'rgba(45, 212, 191, 0.15)' }]}>
                <Plus size={16} color="#2dd4bf" />
              </View>
              <Text style={styles.actionText}>Add New Password / Card</Text>
            </View>
            <ArrowRight size={16} color="#64748b" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(tabs)/media')}
            style={styles.actionItem}
          >
            <View style={styles.actionItemLeft}>
              <View style={[styles.actionIconBadge, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                <Film size={16} color="#38bdf8" />
              </View>
              <Text style={styles.actionText}>Upload Encrypted Media</Text>
            </View>
            <ArrowRight size={16} color="#64748b" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(tabs)/storage')}
            style={styles.actionItem}
          >
            <View style={styles.actionItemLeft}>
              <View style={[styles.actionIconBadge, { backgroundColor: 'rgba(251, 191, 36, 0.15)' }]}>
                <HardDrive size={16} color="#fbbf24" />
              </View>
              <Text style={styles.actionText}>Connect Cloud Storage</Text>
            </View>
            <ArrowRight size={16} color="#64748b" />
          </TouchableOpacity>
        </View>
      </Card>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#0f172a',
  },
  userBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2dd4bf',
  },
  greetingSection: {
    marginVertical: 18,
    gap: 4,
  },
  greetingLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2dd4bf',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
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
    fontWeight: '600',
    color: '#cbd5e1',
  },
  storageValue: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#2dd4bf',
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
  cryptoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 4,
  },
  cryptoBadgeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cryptoBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3b8',
  },
  cryptoBadgeRight: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2dd4bf',
    fontFamily: 'monospace',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 14,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: 'monospace',
  },
  statLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  actionList: {
    gap: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  actionItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
});
