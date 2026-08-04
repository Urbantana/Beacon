import React from 'react';
import {
  FlatList, RefreshControl, StyleSheet, Text, View, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { apiGet } from '@/constants/api';

interface WalletData {
  jawwalPoints: number;
  ecoPoints: number;
  driverLevel: string;
  levelProgress: number;
  nextLevelThreshold: number;
  rank: number;
}

interface Transaction {
  id: number;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
}

const LEVELS = [
  { name: 'Bronze',   min: 0,    max: 500,  color: '#b45309' },
  { name: 'Silver',   min: 500,  max: 1500, color: '#6b7280' },
  { name: 'Gold',     min: 1500, max: 3000, color: '#d97706' },
  { name: 'Platinum', min: 3000, max: 5000, color: '#0891b2' },
  { name: 'Legend',   min: 5000, max: 5001, color: '#7c3aed' },
];

function getLevel(points: number) {
  return LEVELS.slice().reverse().find((l) => points >= l.min) ?? LEVELS[0];
}

function getNextLevel(points: number) {
  return LEVELS.find((l) => l.min > points) ?? null;
}

export default function WalletScreen() {
  const colors = useColors();
  const styles = makeStyles(colors);

  const { data: wallet, isLoading: loadingWallet, refetch: refetchWallet } = useQuery<WalletData>({
    queryKey: ['wallet'],
    queryFn: () => apiGet('/api/points/wallet'),
  });

  const { data: txns, isLoading: loadingTxns, refetch: refetchTxns } = useQuery<Transaction[]>({
    queryKey: ['transactions'],
    queryFn: () => apiGet('/api/points/transactions'),
  });

  const isLoading = loadingWallet || loadingTxns;
  const handleRefresh = () => { refetchWallet(); refetchTxns(); };

  const points   = wallet?.jawwalPoints ?? 0;
  const curLevel = getLevel(points);
  const nxtLevel = getNextLevel(points);
  const progress = nxtLevel ? (points - curLevel.min) / (nxtLevel.min - curLevel.min) : 1;

  const HOW_TO_EARN = [
    { icon: 'trash-outline' as const,         text: 'Report waste',            pts: '+20–30' },
    { icon: 'accessibility-outline' as const, text: 'Report obstacle',         pts: '+15' },
    { icon: 'calendar-outline' as const,      text: 'Attend an event',         pts: '+50' },
    { icon: 'car-outline' as const,           text: 'Report traffic issue',    pts: '+10' },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <FlatList
        data={txns ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} tintColor={colors.mutedForeground} />
        }
        ListHeaderComponent={
          <>
            {/* Hero card */}
            <View style={[styles.hero, { backgroundColor: colors.primary }]}>
              <Text style={[styles.heroLabel, { color: colors.primaryForeground, opacity: 0.7 }]}>Jawwal Points</Text>
              <Text style={[styles.heroPoints, { color: colors.primaryForeground }]}>
                {isLoading ? '—' : points.toLocaleString()}
              </Text>
              <View style={styles.heroRow}>
                <View style={[styles.levelBadge, { backgroundColor: curLevel.color }]}>
                  <Text style={styles.levelBadgeText}>{curLevel.name}</Text>
                </View>
                {wallet?.rank && (
                  <Text style={[styles.rankText, { color: colors.primaryForeground, opacity: 0.8 }]}>
                    #{wallet.rank} city rank
                  </Text>
                )}
              </View>
            </View>

            {/* Level progress */}
            {nxtLevel && (
              <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.progressHeader}>
                  <Text style={[styles.progressLabel, { color: colors.text }]}>Level Progress</Text>
                  <Text style={[styles.progressPts, { color: colors.mutedForeground }]}>
                    {points} / {nxtLevel.min} pts → {nxtLevel.name}
                  </Text>
                </View>
                <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
                  <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%`, backgroundColor: curLevel.color }]} />
                </View>
              </View>
            )}

            {/* Eco points strip */}
            {wallet && (
              <View style={[styles.ecoStrip, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                <Ionicons name="leaf" size={16} color={colors.success} />
                <Text style={[styles.ecoText, { color: colors.text }]}>
                  Eco Points: <Text style={{ fontFamily: 'Inter_600SemiBold' }}>{wallet.ecoPoints}</Text>
                </Text>
              </View>
            )}

            {/* How to earn */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>How to Earn</Text>
            <View style={[styles.earnCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {HOW_TO_EARN.map((item, i) => (
                <View
                  key={item.text}
                  style={[styles.earnRow, i < HOW_TO_EARN.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
                >
                  <View style={[styles.earnIcon, { backgroundColor: colors.secondary }]}>
                    <Ionicons name={item.icon} size={16} color={colors.mutedForeground} />
                  </View>
                  <Text style={[styles.earnText, { color: colors.text }]}>{item.text}</Text>
                  <Text style={[styles.earnPts, { color: colors.success }]}>{item.pts} pts</Text>
                </View>
              ))}
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>Transaction History</Text>
            {loadingTxns && <ActivityIndicator color={colors.mutedForeground} style={{ marginBottom: 16 }} />}
          </>
        }
        ListEmptyComponent={
          !loadingTxns ? (
            <Text style={[styles.empty, { color: colors.mutedForeground }]}>No transactions yet.</Text>
          ) : null
        }
        renderItem={({ item: txn }) => (
          <View style={[styles.txn, { borderColor: colors.border }]}>
            <View style={[styles.txnIcon, { backgroundColor: txn.amount > 0 ? colors.success + '22' : colors.destructive + '22' }]}>
              <Ionicons
                name={txn.amount > 0 ? 'arrow-down-outline' : 'arrow-up-outline'}
                size={16}
                color={txn.amount > 0 ? colors.success : colors.destructive}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.txnDesc, { color: colors.text }]} numberOfLines={2}>{txn.description}</Text>
              <Text style={[styles.txnDate, { color: colors.mutedForeground }]}>
                {new Date(txn.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <Text style={[styles.txnAmount, { color: txn.amount > 0 ? colors.success : colors.destructive }]}>
              {txn.amount > 0 ? '+' : ''}{txn.amount}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe:           { flex: 1 },
    content:        { padding: 16, paddingBottom: 100, gap: 12 },
    hero:           { borderRadius: 20, padding: 24, marginBottom: 4 },
    heroLabel:      { fontSize: 14, fontFamily: 'Inter_500Medium', marginBottom: 4 },
    heroPoints:     { fontSize: 48, fontFamily: 'Inter_700Bold', marginBottom: 16 },
    heroRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    levelBadge:     { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
    levelBadgeText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#ffffff' },
    rankText:       { fontSize: 13, fontFamily: 'Inter_500Medium' },
    progressCard:   { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
    progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    progressLabel:  { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
    progressPts:    { fontSize: 12, fontFamily: 'Inter_400Regular' },
    progressTrack:  { height: 6, borderRadius: 3, overflow: 'hidden' },
    progressFill:   { height: '100%', borderRadius: 3 },
    ecoStrip:       { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1 },
    ecoText:        { fontSize: 14, fontFamily: 'Inter_400Regular' },
    sectionTitle:   { fontSize: 17, fontFamily: 'Inter_600SemiBold', marginTop: 4 },
    earnCard:       { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
    earnRow:        { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
    earnIcon:       { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    earnText:       { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular' },
    earnPts:        { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
    txn:            { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
    txnIcon:        { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    txnDesc:        { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 19 },
    txnDate:        { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
    txnAmount:      { fontSize: 15, fontFamily: 'Inter_700Bold', minWidth: 52, textAlign: 'right' },
    empty:          { textAlign: 'center', paddingTop: 20, fontSize: 14, fontFamily: 'Inter_400Regular' },
  });
}
