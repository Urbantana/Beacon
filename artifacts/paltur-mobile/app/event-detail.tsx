import React, { useState } from 'react';
import {
  Alert, Pressable, RefreshControl, ScrollView,
  StyleSheet, Text, View, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { apiGet, apiPost } from '@/constants/api';

interface PalEvent {
  id: number;
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  category: string;
  location: string;
  locationAr?: string;
  startDate: string;
  endDate: string;
  price: number;
  pointsRequired: number;
  pointsReward: number;
  capacity: number;
  booked: number;
  spotsLeft: number | null;
  status: string;
  createdBy: string;
}

const CAT_COLOR: Record<string, string> = {
  cultural: '#d97706', entertainment: '#7c3aed', educational: '#2563eb', sports: '#16a34a',
};
const CAT_EMOJI: Record<string, string> = {
  cultural: '🎭', entertainment: '🎪', educational: '🎓', sports: '⚽',
};

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const styles = makeStyles(colors);
  const qc = useQueryClient();
  const [confirming, setConfirming] = useState(false);

  const { data: event, isLoading, isError, refetch } = useQuery<PalEvent>({
    queryKey: ['event', id],
    queryFn: () => apiGet(`/api/events/${id}`),
    enabled: !!id,
  });

  const { data: bookingsData } = useQuery<{ bookedEventIds: number[] }>({
    queryKey: ['my-bookings'],
    queryFn: () => apiGet('/api/events/my-bookings'),
  });

  const { data: walletData } = useQuery<{ jawwalPoints: number }>({
    queryKey: ['wallet'],
    queryFn: () => apiGet('/api/points/wallet'),
  });

  const bookMutation = useMutation({
    mutationFn: (eventId: number) => apiPost('/api/events/book', { eventId }),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ['my-bookings'] });
      qc.invalidateQueries({ queryKey: ['wallet'] });
      qc.invalidateQueries({ queryKey: ['event', id] });
      Alert.alert('Booked! 🎉', `You earned ${data.pointsEarned} Jawwal Points.`);
    },
    onError: (err: Error) => Alert.alert('Booking Failed', err.message),
  });

  if (isLoading) return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ActivityIndicator color={colors.mutedForeground} style={{ marginTop: 60 }} />
    </SafeAreaView>
  );

  if (isError || !event) return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.mutedForeground} />
        <Text style={[styles.errorText, { color: colors.mutedForeground }]}>Event not found.</Text>
        <Pressable style={[styles.backBtn, { borderColor: colors.border }]} onPress={() => router.back()}>
          <Text style={[styles.backBtnText, { color: colors.text }]}>Go Back</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );

  const bookedIds  = bookingsData?.bookedEventIds ?? [];
  const userPoints = walletData?.jawwalPoints ?? 0;
  const isBooked   = bookedIds.includes(event.id);
  const full       = event.capacity > 0 && event.booked >= event.capacity;
  const canAfford  = event.pointsRequired === 0 || userPoints >= event.pointsRequired;
  const capPct     = event.capacity > 0 ? Math.min(100, (event.booked / event.capacity)) : 0;
  const accent     = CAT_COLOR[event.category] ?? colors.primary;

  const startDate = new Date(event.startDate);
  const endDate   = new Date(event.endDate);

  const handleBook = () => {
    if (isBooked) return;
    Alert.alert(
      'Confirm Booking',
      `Book "${event.title}"?\n\nPoints earned: +${event.pointsReward}${event.pointsRequired > 0 ? `\nPoints required: ${event.pointsRequired}` : ''}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Book', style: 'default', onPress: () => bookMutation.mutate(event.id) },
      ],
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.mutedForeground} />}
      >
        {/* Hero banner */}
        <View style={[styles.hero, { backgroundColor: accent }]}>
          <Text style={styles.heroEmoji}>{CAT_EMOJI[event.category]}</Text>
          <View style={styles.heroBadgeRow}>
            <View style={[styles.heroBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Text style={styles.heroBadgeText}>{event.category}</Text>
            </View>
            <View style={[styles.heroBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Text style={styles.heroBadgeText}>{event.status}</Text>
            </View>
            {isBooked && (
              <View style={[styles.heroBadge, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
                <Ionicons name="checkmark-circle" size={12} color="#ffffff" />
                <Text style={styles.heroBadgeText}>Booked</Text>
              </View>
            )}
          </View>
          <Text style={styles.heroTitle}>{event.title}</Text>
          <Text style={styles.heroOrg}>{event.createdBy}</Text>
        </View>

        {/* Info rows */}
        <View style={styles.infoSection}>
          <InfoRow icon="calendar-outline" value={startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} colors={colors} />
          <InfoRow icon="time-outline" value={`${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`} colors={colors} />
          <InfoRow icon="location-outline" value={event.location} colors={colors} />
          {event.price > 0 && <InfoRow icon="pricetag-outline" value={`₪${event.price}`} colors={colors} />}
        </View>

        {/* Description */}
        <Text style={[styles.sectionLabel, { color: colors.text }]}>About</Text>
        <Text style={[styles.description, { color: colors.mutedForeground }]}>{event.description}</Text>

        {/* Capacity bar */}
        {event.capacity > 0 && (
          <View style={[styles.capacityCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.capacityTop}>
              <View style={styles.capacityLeft}>
                <Ionicons name="people-outline" size={16} color={colors.mutedForeground} />
                <Text style={[styles.capacityText, { color: colors.text }]}>
                  {event.booked} / {event.capacity} booked
                </Text>
              </View>
              <Text style={[styles.spotsLeft, { color: full ? colors.destructive : colors.success }]}>
                {full ? 'Full' : `${event.spotsLeft} spots left`}
              </Text>
            </View>
            <View style={[styles.capTrack, { backgroundColor: colors.muted }]}>
              <View style={[styles.capFill, { width: `${Math.round(capPct * 100)}%`, backgroundColor: full ? colors.destructive : colors.success }]} />
            </View>
          </View>
        )}

        {/* Points card */}
        <View style={[styles.pointsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {event.pointsRequired > 0 && (
            <View style={styles.pointsRow}>
              <Ionicons name="star-outline" size={16} color={colors.warning} />
              <Text style={[styles.pointsLabel, { color: colors.mutedForeground }]}>Required</Text>
              <Text style={[styles.pointsValue, { color: colors.warning }]}>{event.pointsRequired.toLocaleString()} pts</Text>
            </View>
          )}
          <View style={styles.pointsRow}>
            <Ionicons name="gift-outline" size={16} color={colors.success} />
            <Text style={[styles.pointsLabel, { color: colors.mutedForeground }]}>You earn</Text>
            <Text style={[styles.pointsValue, { color: colors.success }]}>+{event.pointsReward} pts</Text>
          </View>
          {event.pointsRequired > 0 && (
            <View style={[styles.balanceRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.balanceText, { color: colors.mutedForeground }]}>
                Your balance: {userPoints.toLocaleString()} pts
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky book button */}
      <View style={[styles.stickyBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <Pressable
          style={[
            styles.bookBtn,
            { backgroundColor: isBooked || full || !canAfford ? colors.muted : colors.primary },
          ]}
          onPress={handleBook}
          disabled={isBooked || full || !canAfford || bookMutation.isPending ||
            event.status === 'cancelled' || event.status === 'completed'}
          accessible
          accessibilityRole="button"
          accessibilityLabel={`Book ${event.title}`}
        >
          <Ionicons
            name={isBooked ? 'checkmark-circle' : 'calendar'}
            size={18}
            color={isBooked || full || !canAfford ? colors.mutedForeground : colors.primaryForeground}
          />
          <Text style={[styles.bookBtnText, {
            color: isBooked || full || !canAfford ? colors.mutedForeground : colors.primaryForeground,
          }]}>
            {bookMutation.isPending ? 'Booking…'
              : isBooked ? 'Already Booked'
              : full ? 'Fully Booked'
              : event.status === 'cancelled' ? 'Cancelled'
              : event.status === 'completed' ? 'Completed'
              : !canAfford ? `Need ${event.pointsRequired - userPoints} more pts`
              : 'Book Now'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function InfoRow({ icon, value, colors }: { icon: string; value: string; colors: any }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }}>
      <Ionicons name={icon as any} size={16} color={colors.mutedForeground} />
      <Text style={{ fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.text, flex: 1 }}>{value}</Text>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe:           { flex: 1 },
    content:        { paddingBottom: 100 },
    errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 40 },
    errorText:      { fontSize: 16, fontFamily: 'Inter_400Regular', textAlign: 'center' },
    backBtn:        { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
    backBtnText:    { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
    hero:           { padding: 24, paddingTop: 32 },
    heroEmoji:      { fontSize: 52, marginBottom: 12 },
    heroBadgeRow:   { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 10 },
    heroBadge:      { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    heroBadgeText:  { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#ffffff', textTransform: 'capitalize' },
    heroTitle:      { fontSize: 24, fontFamily: 'Inter_700Bold', color: '#ffffff', lineHeight: 30, marginBottom: 6 },
    heroOrg:        { fontSize: 14, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.75)' },
    infoSection:    { padding: 16, gap: 2 },
    sectionLabel:   { fontSize: 16, fontFamily: 'Inter_600SemiBold', paddingHorizontal: 16, marginBottom: 6 },
    description:    { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 22, paddingHorizontal: 16, marginBottom: 20 },
    capacityCard:   { marginHorizontal: 16, marginBottom: 12, borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
    capacityTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    capacityLeft:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
    capacityText:   { fontSize: 14, fontFamily: 'Inter_500Medium' },
    spotsLeft:      { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
    capTrack:       { height: 6, borderRadius: 3, overflow: 'hidden' },
    capFill:        { height: '100%', borderRadius: 3 },
    pointsCard:     { marginHorizontal: 16, marginBottom: 12, borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
    pointsRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
    pointsLabel:    { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular' },
    pointsValue:    { fontSize: 14, fontFamily: 'Inter_700Bold' },
    balanceRow:     { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10 },
    balanceText:    { fontSize: 13, fontFamily: 'Inter_400Regular' },
    stickyBar:      { borderTopWidth: StyleSheet.hairlineWidth, padding: 16, paddingBottom: 24 },
    bookBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 14 },
    bookBtnText:    { fontSize: 16, fontFamily: 'Inter_700Bold' },
  });
}
