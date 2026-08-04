import React, { useState } from 'react';
import {
  Alert, FlatList, Image, Modal, Pressable,
  RefreshControl, ScrollView, StyleSheet, Text, View, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { apiGet, apiPost } from '@/constants/api';

interface HeritageItem {
  id: number;
  name: string;
  nameAr?: string;
  description: string;
  descriptionAr?: string;
  category: string;
  pointsCost: number;
  imageUrl: string;
  inStock: boolean;
  origin?: string;
}

interface WalletData {
  jawwalPoints: number;
}

export default function StoreScreen() {
  const colors = useColors();
  const styles = makeStyles(colors);
  const qc = useQueryClient();

  const [selectedItem, setSelectedItem] = useState<HeritageItem | null>(null);

  const { data: items, isLoading: loadingItems, refetch } = useQuery<HeritageItem[]>({
    queryKey: ['heritage-items'],
    queryFn: () => apiGet('/api/store/heritage'),
  });

  const { data: wallet } = useQuery<WalletData>({
    queryKey: ['wallet'],
    queryFn: () => apiGet('/api/points/wallet'),
  });

  const redeemMutation = useMutation({
    mutationFn: (itemId: number) => apiPost('/api/store/redeem', { itemId }),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ['wallet'] });
      setSelectedItem(null);
      Alert.alert(
        '🎊 Redeemed!',
        `${selectedItem?.name ?? 'Item'} redeemed successfully!\nRemaining points: ${data.remainingPoints}`,
      );
    },
    onError: (err: Error) => Alert.alert('Redemption Failed', err.message),
  });

  const userPoints = wallet?.jawwalPoints ?? 0;

  const featured = items?.find((i) => i.category === 'heritage') ?? items?.[0];
  const rest = items?.filter((i) => i.id !== featured?.id) ?? [];

  const handleRedeem = (item: HeritageItem) => {
    if (!item.inStock) return Alert.alert('Out of Stock', 'This item is currently unavailable.');
    if (userPoints < item.pointsCost) {
      return Alert.alert(
        'Not Enough Points',
        `You need ${item.pointsCost - userPoints} more Jawwal Points.`,
      );
    }
    setSelectedItem(item);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <FlatList
        data={rest}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loadingItems} onRefresh={refetch} tintColor={colors.mutedForeground} />}
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.pageTitle, { color: colors.text }]}>Heritage Store</Text>
              <View style={[styles.pointsBadge, { backgroundColor: colors.secondary }]}>
                <Ionicons name="star" size={13} color={colors.warning} />
                <Text style={[styles.pointsBadgeText, { color: colors.text }]}>{userPoints.toLocaleString()} pts</Text>
              </View>
            </View>

            {/* Featured Palestine Monopoly card */}
            {featured && (
              <Pressable
                style={[styles.featured, { backgroundColor: colors.primary }]}
                onPress={() => handleRedeem(featured)}
                accessible
                accessibilityRole="button"
                accessibilityLabel={`Featured item: ${featured.name}`}
              >
                <View style={styles.featuredContent}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.featuredBadge, { color: colors.primaryForeground, opacity: 0.7 }]}>✨ FEATURED</Text>
                    <Text style={[styles.featuredName, { color: colors.primaryForeground }]}>{featured.name}</Text>
                    <Text style={[styles.featuredDesc, { color: colors.primaryForeground, opacity: 0.8 }]} numberOfLines={2}>
                      {featured.description}
                    </Text>
                    <View style={[styles.featuredCost, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                      <Text style={[styles.featuredCostText, { color: colors.primaryForeground }]}>
                        {featured.pointsCost.toLocaleString()} pts
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.featuredEmoji}>🎲</Text>
                </View>
              </Pressable>
            )}

            {loadingItems && <ActivityIndicator color={colors.mutedForeground} style={{ marginVertical: 16 }} />}
            {!loadingItems && rest.length > 0 && (
              <Text style={[styles.sectionTitle, { color: colors.text }]}>All Items</Text>
            )}
          </>
        }
        ListEmptyComponent={
          !loadingItems && !featured ? (
            <Text style={[styles.empty, { color: colors.mutedForeground }]}>No items available.</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => handleRedeem(item)}
            accessible
            accessibilityRole="button"
            accessibilityLabel={`${item.name}, ${item.pointsCost} points`}
          >
            <View style={[styles.cardEmoji, { backgroundColor: colors.secondary }]}>
              <Text style={styles.cardEmojiText}>
                {item.category === 'ceramic' ? '🏺' : item.category === 'embroidery' ? '🧵' : item.category === 'olive' ? '🫒' : '🎁'}
              </Text>
            </View>
            <Text style={[styles.cardName, { color: colors.text }]} numberOfLines={2}>{item.name}</Text>
            {item.origin && (
              <Text style={[styles.cardOrigin, { color: colors.mutedForeground }]} numberOfLines={1}>
                📍 {item.origin}
              </Text>
            )}
            <View style={styles.cardFooter}>
              <Text style={[styles.cardCost, { color: colors.warning }]}>{item.pointsCost.toLocaleString()}</Text>
              <Text style={[styles.cardCostLabel, { color: colors.mutedForeground }]}>pts</Text>
            </View>
            {!item.inStock && (
              <View style={[styles.outOfStock, { backgroundColor: colors.muted }]}>
                <Text style={[styles.outOfStockText, { color: colors.mutedForeground }]}>Out of stock</Text>
              </View>
            )}
          </Pressable>
        )}
      />

      {/* Confirm redeem modal */}
      <Modal visible={!!selectedItem} transparent animationType="slide" onRequestClose={() => setSelectedItem(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Confirm Redemption</Text>
            <Text style={[styles.modalItemName, { color: colors.text }]}>{selectedItem?.name}</Text>
            <Text style={[styles.modalDesc, { color: colors.mutedForeground }]} numberOfLines={3}>
              {selectedItem?.description}
            </Text>
            <View style={styles.modalRows}>
              <View style={styles.modalRow}>
                <Text style={[styles.modalLabel, { color: colors.mutedForeground }]}>Cost</Text>
                <Text style={[styles.modalValue, { color: colors.warning }]}>{selectedItem?.pointsCost.toLocaleString()} pts</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={[styles.modalLabel, { color: colors.mutedForeground }]}>Your balance</Text>
                <Text style={[styles.modalValue, { color: colors.text }]}>{userPoints.toLocaleString()} pts</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={[styles.modalLabel, { color: colors.mutedForeground }]}>After redemption</Text>
                <Text style={[styles.modalValue, { color: colors.text }]}>
                  {(userPoints - (selectedItem?.pointsCost ?? 0)).toLocaleString()} pts
                </Text>
              </View>
            </View>
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalCancel, { borderColor: colors.border }]} onPress={() => setSelectedItem(null)}>
                <Text style={[{ fontFamily: 'Inter_500Medium', fontSize: 15 }, { color: colors.text }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalConfirm, { backgroundColor: colors.primary }]}
                onPress={() => selectedItem && redeemMutation.mutate(selectedItem.id)}
                disabled={redeemMutation.isPending}
              >
                <Text style={[{ fontFamily: 'Inter_600SemiBold', fontSize: 15 }, { color: colors.primaryForeground }]}>
                  {redeemMutation.isPending ? 'Redeeming…' : 'Redeem'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe:             { flex: 1 },
    content:          { padding: 16, paddingBottom: 100, gap: 8 },
    header:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    pageTitle:        { fontSize: 22, fontFamily: 'Inter_700Bold' },
    pointsBadge:      { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    pointsBadgeText:  { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
    featured:         { borderRadius: 20, padding: 22, marginBottom: 20 },
    featuredContent:  { flexDirection: 'row', alignItems: 'center', gap: 16 },
    featuredBadge:    { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1, marginBottom: 6 },
    featuredName:     { fontSize: 20, fontFamily: 'Inter_700Bold', marginBottom: 6, lineHeight: 26 },
    featuredDesc:     { fontSize: 14, fontFamily: 'Inter_400Regular', marginBottom: 14, lineHeight: 20 },
    featuredCost:     { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
    featuredCostText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
    featuredEmoji:    { fontSize: 52 },
    sectionTitle:     { fontSize: 17, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
    row:              { gap: 12 },
    card:             { flex: 1, borderRadius: 16, borderWidth: 1, padding: 14, gap: 6, overflow: 'hidden' },
    cardEmoji:        { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    cardEmojiText:    { fontSize: 24 },
    cardName:         { fontSize: 14, fontFamily: 'Inter_600SemiBold', lineHeight: 19 },
    cardOrigin:       { fontSize: 11, fontFamily: 'Inter_400Regular' },
    cardFooter:       { flexDirection: 'row', alignItems: 'baseline', gap: 2, marginTop: 4 },
    cardCost:         { fontSize: 16, fontFamily: 'Inter_700Bold' },
    cardCostLabel:    { fontSize: 12, fontFamily: 'Inter_400Regular' },
    outOfStock:       { ...StyleSheet.absoluteFillObject, borderRadius: 16, alignItems: 'center', justifyContent: 'center', opacity: 0.85 },
    outOfStockText:   { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
    empty:            { textAlign: 'center', paddingTop: 60, fontSize: 14, fontFamily: 'Inter_400Regular' },
    modalOverlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalSheet:       { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 14 },
    modalTitle:       { fontSize: 20, fontFamily: 'Inter_700Bold' },
    modalItemName:    { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
    modalDesc:        { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
    modalRows:        { gap: 10 },
    modalRow:         { flexDirection: 'row', justifyContent: 'space-between' },
    modalLabel:       { fontSize: 14, fontFamily: 'Inter_400Regular' },
    modalValue:       { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
    modalActions:     { flexDirection: 'row', gap: 12, marginTop: 8 },
    modalCancel:      { flex: 1, borderWidth: 1, borderRadius: 12, alignItems: 'center', paddingVertical: 14 },
    modalConfirm:     { flex: 1, borderRadius: 12, alignItems: 'center', paddingVertical: 14 },
  });
}
