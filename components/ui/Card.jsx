import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function Card({ children, title, subtitle, icon: Icon, style, className = '' }) {
  return (
    <View style={[styles.card, style]} className={className}>
      {(title || Icon) && (
        <View style={styles.header}>
          <View style={styles.headerContent}>
            {Icon && (
              <View style={styles.iconBadge}>
                <Icon size={16} color="#2dd4bf" />
              </View>
            )}
            <View>
              {title && <Text style={styles.title}>{title}</Text>}
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
          </View>
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 24,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 1,
  },
});
