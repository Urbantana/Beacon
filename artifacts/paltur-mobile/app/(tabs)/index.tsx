import React from 'react';
import {
  FlatList, RefreshControl, ScrollView, StyleSheet,
  Text, View, ActivityIndicator, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { apiGet } from '@/constants/api';

interface DashboardSummary {
  activeTrafficIssues: number;
  pendingWasteReports: number;
  openAccessibilityIssues: number;
  eventsThisWeek: number;
  userEcoPoints: number;
  userJawwalPoints: number;
}

interface ActivityItem {
  id: number;
  type: string;
  description: string;
  user: string;
  createdAt: string;
}

const STAT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  traffic: 'car-outline',
  waste: 'trash-outline',
  accessibility: 'accessibility-outline',
  events: 'calendar-outline',
};

const ACTIVITY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  waste_report: 'trash-outline',
  accessibility_report: 'accessibility-outline',
  traffic_report: 'car-outline',
  event_booked: 'calendar-outline',
  points_earned: 'star-outline',
};

export default function DashboardScreen() {
  const colors = useColors();
  const styles = makeStyles(colors);

  const {
    data: summary, isLoading: loadingSummary, refetch: refetchSummary,
  } = useQuery<DashboardSummary>({
    queryKey: ['dashboard-summary'],
    queryFn: () => apiGet('/api/dashboard/summary'),
  });

  const {
    data: feed, isLoading: loadingFeed, refetch: refetchFeed,
  } = useQuery<ActivityItem[]>({
    queryKey: ['activity-feed'],
    queryFn: () => apiGet('/api/dashboard/activity-feed'),
  });

  const isLoading = loadingSummary || loadingFeed;
  const handleRefresh = () => { refetchSummary(); refetchFeed(); };

  const stats = summary ? [
    { key: 'traffic',       label: 'Traffic Issues',  value: summary.activeTrafficIssues,    icon: STAT_ICONS.traffic },
    { key: 'waste',         label: 'Waste Reports',   value: summary.pendingWasteReports,    icon: STAT_ICONS.waste },
    { key: 'accessibility', label: 'Accessibility',   value: summary.openAccessibilityIssues, icon: STAT_ICONS.accessibility },
    { key: 'events',        label: 'Events This Week',value: summary.eventsThisWeek,          icon: STAT_ICONS.events },
  ] : [];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} tintColor={colors.mutedForeground} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.city, { color: colors.text }]}>Ramallah</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>City Dashboard</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
            <Ionicons name="star" size={13} color={colors.warning} />
            <Text style={[styles.badgeText, { color: colors.text }]}>
              {summary?.userJawwalPoints ?? '—'} pts
            </Text>
          </View>
        </View>

        {/* Stat cards */}
        {isLoading ? (
          <ActivityIndicator color={colors.mutedForeground} style={{ marginVertical: 24 }} />
        ) : (
          <View style={styles.grid}>
            {stats.map((s) => (
              <View key={s.key} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name={s.icon} size={22} color={colors.mutedForeground} />
                <Text style={[styles.statValue, { color: colors.text }]}>{s.value}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Eco score strip */}
        {summary && (
          <View style={[styles.ecoStrip, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Ionicons name="leaf" size={16} color={colors.success} />
            <Text style={[styles.ecoText, { color: colors.text }]}>
              Eco Score: <Text style={{ fontFamily: 'Inter_600SemiBold' }}>{summary.userEcoPoints} pts</Text>
            </Text>
          </View>
        )}

        {/* Activity feed */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
        {!feed || feed.length === 0 ? (
          <Text style={[styles.empty, { color: colors.mutedForeground }]}>No recent activity.</Text>
        ) : (
          feed.slice(0, 12).map((item) => (
            <View key={item.id} style={[styles.feedItem, { borderColor: colors.border }]}>
              <View style={[styles.feedIcon, { backgroundColor: colors.secondary }]}>
                <Ionicons
                  name={ACTIVITY_ICONS[item.type] ?? 'ellipse-outline'}
                  size={16}
                  color={colors.mutedForeground}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.feedDesc, { color: colors.text }]} numberOfLines={2}>
                  {item.description}
                </Text>
                <Text style={[styles.feedMeta, { color: colors.mutedForeground }]}>
                  {item.user} · {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe:        { flex: 1 },
    scroll:      { flex: 1 },
    content:     { padding: 20, paddingBottom: 100 },
    header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
    city:        { fontSize: 26, fontFamily: 'Inter_700Bold', lineHeight: 32 },
    subtitle:    { fontSize: 14, fontFamily: 'Inter_400Regular', marginTop: 2 },
    badge:       { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    badgeText:   { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
    grid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
    card:        { width: '47%', borderRadius: 14, borderWidth: 1, padding: 16, gap: 6 },
    statValue:   { fontSize: 28, fontFamily: 'Inter_700Bold' },
    statLabel:   { fontSize: 12, fontFamily: 'Inter_400Regular' },
    ecoStrip:    { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 24 },
    ecoText:     { fontSize: 14, fontFamily: 'Inter_400Regular' },
    sectionTitle:{ fontSize: 17, fontFamily: 'Inter_600SemiBold', marginBottom: 14 },
    feedItem:    { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
    feedIcon:    { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    feedDesc:    { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
    feedMeta:    { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
    empty:       { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingVertical: 32 },
  });
}
