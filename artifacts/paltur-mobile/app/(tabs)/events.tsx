import React, { useState } from 'react';
import {
  Alert, FlatList, Modal, Pressable, RefreshControl,
  ScrollView, StyleSheet, Text, TextInput, View, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { apiGet, apiPost } from '@/constants/api';

interface PalEvent {
  id: number;
  title: string;
  description: string;
  category: string;
  location: string;
  startDate: string;
  price: number;
  pointsRequired: number;
  pointsReward: number;
  capacity: number;
  booked: number;
  spotsLeft: number | null;
  status: string;
}

const CATEGORIES = ['all', 'cultural', 'entertainment', 'educational', 'sports'];
const STATUSES   = ['all', 'upcoming', 'ongoing', 'completed', 'cancelled'];

const CAT_COLOR: Record<string, string> = {
  cultural: '#d97706', entertainment: '#7c3aed', educational: '#2563eb', sports: '#16a34a',
};

const CAT_EMOJI: Record<string, string> = {
  cultural: '🎭', entertainment: '🎪', educational: '🎓', sports: '⚽',
};

export default function EventsScreen() {
  const colors  = useColors();
  const styles  = makeStyles(colors);
  const qc      = useQueryClient();

  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState('all');
  const [status,   setStatus]   = useState('all');
  const [selected, setSelected] = useState<PalEvent | null>(null);

  const { data: events, isLoading, refetch } = useQuery<PalEvent[]>({
    queryKey: ['events'],
    queryFn: () => apiGet('/api/events'),
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
      setSelected(null);
      Alert.alert('Booked! 🎉', `You earned ${data.pointsEarned} Jawwal Points.`);
    },
    onError: (err: Error) => Alert.alert('Booking failed', err.message),
  });

  const bookedIds    = bookingsData?.bookedEventIds ?? [];
  const userPoints   = walletData?.jawwalPoints ?? 0;

  const filtered = (events ?? []).filter((e) => {
    const matchSearch   = !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.location.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === 'all' || e.category === category;
    const matchStatus   = status   === 'all' || e.status   === status;
    return matchSearch && matchCategory && matchStatus;
  });

  const handleBook = (e: PalEvent) => {
    if (bookedIds.includes(e.id)) return Alert.alert('Already Booked', 'You already have a spot!');
    setSelected(e);
  };

  const confirmBook = () => {
    if (!selected) return;
    bookMutation.mutate(selected.id);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Search bar */}
      <View style={[styles.searchRow, { borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={18} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search events…"
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Category chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips} contentContainerStyle={styles.chipsContent}>
        {CATEGORIES.map((c) => (
          <Pressable
            key={c}
            style={[styles.chip, { backgroundColor: category === c ? colors.primary : colors.secondary, borderColor: colors.border }]}
            onPress={() => setCategory(c)}
          >
            <Text style={[styles.chipText, { color: category === c ? colors.primaryForeground : colors.mutedForeground }]}>
              {c === 'all' ? 'All' : `${CAT_EMOJI[c] ?? ''} ${c.charAt(0).toUpperCase() + c.slice(1)}`}
            </Text>
          </Pressable>
        ))}
        <View style={styles.divider} />
        {STATUSES.filter(s => s !== 'all').map((s) => (
          <Pressable
            key={s}
            style={[styles.chip, { backgroundColor: status === s ? colors.primary : colors.secondary, borderColor: colors.border }]}
            onPress={() => setStatus(prev => prev === s ? 'all' : s)}
          >
            <Text style={[styles.chipText, { color: status === s ? colors.primaryForeground : colors.mutedForeground }]}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {isLoading ? (
        <ActivityIndicator color={colors.mutedForeground} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.mutedForeground} />}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.mutedForeground }]}>No events found.</Text>
          }
          renderItem={({ item: e }) => {
            const isBooked = bookedIds.includes(e.id);
            const full     = e.capacity > 0 && e.booked >= e.capacity;
            const accent   = CAT_COLOR[e.category] ?? colors.primary;
            return (
              <Pressable
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push({ pathname: '/event-detail', params: { id: String(e.id) } })}
                accessible
                accessibilityRole="button"
                accessibilityLabel={`Event: ${e.title}`}
              >
                {/* Color bar */}
                <View style={[styles.colorBar, { backgroundColor: accent }]} />
                <View style={styles.cardBody}>
                  <View style={styles.cardTop}>
                    <Text style={{ fontSize: 22 }}>{CAT_EMOJI[e.category]}</Text>
                    {isBooked && (
                      <View style={[styles.bookedBadge, { backgroundColor: colors.success + '22' }]}>
                        <Ionicons name="checkmark-circle" size={13} color={colors.success} />
                        <Text style={[styles.bookedText, { color: colors.success }]}>Booked</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.eventTitle, { color: colors.text }]} numberOfLines={2}>{e.title}</Text>
                  <Text style={[styles.eventLoc, { color: colors.mutedForeground }]} numberOfLines={1}>
                    📍 {e.location}
                  </Text>
                  <Text style={[styles.eventDate, { color: colors.mutedForeground }]}>
                    🗓 {new Date(e.startDate).toLocaleDateString()}
                  </Text>

                  <View style={styles.cardFooter}>
                    <Text style={[styles.points, { color: colors.warning }]}>+{e.pointsReward} pts</Text>
                    <Pressable
                      style={[
                        styles.bookBtn,
                        { backgroundColor: isBooked || full ? colors.secondary : accent },
                      ]}
                      onPress={() => handleBook(e)}
                      disabled={isBooked || full || e.status === 'cancelled' || e.status === 'completed'}
                    >
                      <Text style={[styles.bookBtnText, { color: isBooked || full ? colors.mutedForeground : '#ffffff' }]}>
                        {isBooked ? 'Booked' : full ? 'Full' : e.status === 'cancelled' ? 'Cancelled' : 'Book'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      )}

      {/* Confirm booking modal */}
      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Confirm Booking</Text>
            <Text style={[styles.modalSubtitle, { color: colors.mutedForeground }]}>
              {selected?.title}
            </Text>
            <View style={styles.modalRows}>
              {(selected?.pointsRequired ?? 0) > 0 && (
                <View style={styles.modalRow}>
                  <Text style={[styles.modalLabel, { color: colors.mutedForeground }]}>Points required</Text>
                  <Text style={[styles.modalValue, { color: colors.warning }]}>{selected?.pointsRequired} pts</Text>
                </View>
              )}
              <View style={styles.modalRow}>
                <Text style={[styles.modalLabel, { color: colors.mutedForeground }]}>Points earned</Text>
                <Text style={[styles.modalValue, { color: colors.success }]}>+{selected?.pointsReward} pts</Text>
              </View>
              {(selected?.price ?? 0) > 0 && (
                <View style={styles.modalRow}>
                  <Text style={[styles.modalLabel, { color: colors.mutedForeground }]}>Ticket price</Text>
                  <Text style={[styles.modalValue, { color: colors.text }]}>₪{selected?.price}</Text>
                </View>
              )}
              <View style={styles.modalRow}>
                <Text style={[styles.modalLabel, { color: colors.mutedForeground }]}>Your balance</Text>
                <Text style={[styles.modalValue, { color: colors.text }]}>{userPoints} pts</Text>
              </View>
            </View>
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalCancel, { borderColor: colors.border }]} onPress={() => setSelected(null)}>
                <Text style={[{ fontFamily: 'Inter_500Medium', fontSize: 15 }, { color: colors.text }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalConfirm, { backgroundColor: colors.primary }]}
                onPress={confirmBook}
                disabled={bookMutation.isPending}
              >
                <Text style={[{ fontFamily: 'Inter_600SemiBold', fontSize: 15 }, { color: colors.primaryForeground }]}>
                  {bookMutation.isPending ? 'Booking…' : 'Confirm'}
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
    safe:          { flex: 1 },
    searchRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginTop: 12, marginBottom: 4, borderBottomWidth: StyleSheet.hairlineWidth, paddingBottom: 10 },
    searchInput:   { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular' },
    chips:         { flexGrow: 0 },
    chipsContent:  { paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: 'row' },
    chip:          { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
    chipText:      { fontSize: 13, fontFamily: 'Inter_500Medium' },
    divider:       { width: 1, backgroundColor: '#e3e3e3', marginHorizontal: 4 },
    list:          { padding: 16, paddingBottom: 100, gap: 14 },
    card:          { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
    colorBar:      { height: 4 },
    cardBody:      { padding: 14 },
    cardTop:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    bookedBadge:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
    bookedText:    { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
    eventTitle:    { fontSize: 16, fontFamily: 'Inter_600SemiBold', marginBottom: 4, lineHeight: 22 },
    eventLoc:      { fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 2 },
    eventDate:     { fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 12 },
    cardFooter:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    points:        { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
    bookBtn:       { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 },
    bookBtnText:   { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
    empty:         { textAlign: 'center', paddingTop: 60, fontSize: 15, fontFamily: 'Inter_400Regular' },
    modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalSheet:    { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 16 },
    modalTitle:    { fontSize: 20, fontFamily: 'Inter_700Bold' },
    modalSubtitle: { fontSize: 15, fontFamily: 'Inter_400Regular' },
    modalRows:     { gap: 10 },
    modalRow:      { flexDirection: 'row', justifyContent: 'space-between' },
    modalLabel:    { fontSize: 14, fontFamily: 'Inter_400Regular' },
    modalValue:    { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
    modalActions:  { flexDirection: 'row', gap: 12, marginTop: 8 },
    modalCancel:   { flex: 1, borderWidth: 1, borderRadius: 12, alignItems: 'center', paddingVertical: 14 },
    modalConfirm:  { flex: 1, borderRadius: 12, alignItems: 'center', paddingVertical: 14 },
  });
}
