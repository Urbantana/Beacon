import React, { useState } from 'react';
import {
  Alert, FlatList, Modal, Pressable, RefreshControl,
  ScrollView, StyleSheet, Text, TextInput, View, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useColors } from '@/hooks/useColors';
import { apiGet, apiPost } from '@/constants/api';

interface WasteReport {
  id: number;
  lat: number;
  lng: number;
  type: string;
  status: string;
  description?: string;
  createdAt: string;
  ecoPointsAwarded: number;
  reporterUsername?: string;
}

const WASTE_TYPES = [
  { value: 'overflowing_bin', label: 'Overflowing Bin', emoji: '🗑️', pts: 30 },
  { value: 'mixed_waste',     label: 'Mixed Waste',     emoji: '♻️', pts: 25 },
  { value: 'litter',          label: 'Litter',          emoji: '🚯', pts: 20 },
  { value: 'other',           label: 'Other',           emoji: '⚠️', pts: 15 },
];

const STATUS_COLORS: Record<string, string> = {
  pending:     '#d97706',
  in_progress: '#2563eb',
  resolved:    '#16a34a',
};

export default function EcoScreen() {
  const colors = useColors();
  const styles = makeStyles(colors);
  const qc = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [selectedType, setSelectedType] = useState('overflowing_bin');
  const [description, setDescription] = useState('');
  const [locating, setLocating] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const { data: reports, isLoading, refetch } = useQuery<WasteReport[]>({
    queryKey: ['waste-reports'],
    queryFn: () => apiGet('/api/waste/reports'),
  });

  const reportMutation = useMutation({
    mutationFn: (body: { lat: number; lng: number; type: string; description?: string }) =>
      apiPost('/api/waste/reports', body),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ['waste-reports'] });
      qc.invalidateQueries({ queryKey: ['wallet'] });
      setShowForm(false);
      setDescription('');
      setCoords(null);
      Alert.alert('Report Submitted! 🌱', `You earned ${data.ecoPointsAwarded} Eco Points.`);
    },
    onError: (err: Error) => Alert.alert('Submission Failed', err.message),
  });

  const getLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is needed to pinpoint the waste location.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    } catch {
      Alert.alert('Location Error', 'Could not get your current location.');
    } finally {
      setLocating(false);
    }
  };

  const handleSubmit = () => {
    if (!coords) return Alert.alert('Location Required', 'Tap "Use My Location" to pin the waste location.');
    reportMutation.mutate({ ...coords, type: selectedType, description: description.trim() || undefined });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <FlatList
        data={reports ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.mutedForeground} />}
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={[styles.pageTitle, { color: colors.text }]}>Eco Report</Text>
                <Text style={[styles.pageSubtitle, { color: colors.mutedForeground }]}>Help keep Ramallah clean</Text>
              </View>
              <Pressable
                style={[styles.newBtn, { backgroundColor: colors.primary }]}
                onPress={() => setShowForm(true)}
                accessible
                accessibilityRole="button"
                accessibilityLabel="New waste report"
              >
                <Ionicons name="add" size={18} color={colors.primaryForeground} />
                <Text style={[styles.newBtnText, { color: colors.primaryForeground }]}>Report</Text>
              </Pressable>
            </View>

            {/* How it works */}
            <View style={[styles.infoCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Ionicons name="information-circle-outline" size={18} color={colors.info} />
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                Report waste to earn Eco Points. Municipality teams will respond within 24 hours.
              </Text>
            </View>

            {/* Stats strip */}
            {reports && (
              <View style={styles.statsRow}>
                {(['pending', 'in_progress', 'resolved'] as const).map((s) => {
                  const count = reports.filter((r) => r.status === s).length;
                  return (
                    <View key={s} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <Text style={[styles.statVal, { color: colors.text }]}>{count}</Text>
                      <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>
                        {s.replace('_', ' ')}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}

            {isLoading && <ActivityIndicator color={colors.mutedForeground} style={{ marginBottom: 16 }} />}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Reports</Text>
          </>
        }
        ListEmptyComponent={
          !isLoading ? (
            <Text style={[styles.empty, { color: colors.mutedForeground }]}>No reports yet. Be the first!</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={[styles.reportItem, { borderColor: colors.border }]}>
            <View style={[styles.reportIcon, { backgroundColor: STATUS_COLORS[item.status] + '22' }]}>
              <Text style={styles.reportEmoji}>
                {WASTE_TYPES.find((t) => t.value === item.type)?.emoji ?? '⚠️'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.reportTop}>
                <Text style={[styles.reportType, { color: colors.text }]}>
                  {WASTE_TYPES.find((t) => t.value === item.type)?.label ?? item.type}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] + '22' }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>
                    {item.status.replace('_', ' ')}
                  </Text>
                </View>
              </View>
              {item.description && (
                <Text style={[styles.reportDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                  {item.description}
                </Text>
              )}
              <Text style={[styles.reportMeta, { color: colors.mutedForeground }]}>
                {item.reporterUsername ? `${item.reporterUsername} · ` : ''}
                {new Date(item.createdAt).toLocaleDateString()} · +{item.ecoPointsAwarded} pts
              </Text>
            </View>
          </View>
        )}
      />

      {/* Report form modal */}
      <Modal visible={showForm} transparent animationType="slide" onRequestClose={() => setShowForm(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>New Waste Report</Text>
              <Pressable onPress={() => setShowForm(false)}>
                <Ionicons name="close" size={22} color={colors.mutedForeground} />
              </Pressable>
            </View>

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Waste Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {WASTE_TYPES.map((t) => (
                <Pressable
                  key={t.value}
                  style={[
                    styles.typeChip,
                    { backgroundColor: selectedType === t.value ? colors.primary : colors.secondary, borderColor: colors.border },
                  ]}
                  onPress={() => setSelectedType(t.value)}
                >
                  <Text style={styles.typeEmoji}>{t.emoji}</Text>
                  <Text style={[styles.typeLabel, { color: selectedType === t.value ? colors.primaryForeground : colors.mutedForeground }]}>
                    {t.label}
                  </Text>
                  <Text style={[styles.typePts, { color: selectedType === t.value ? colors.primaryForeground : colors.success, opacity: selectedType === t.value ? 0.8 : 1 }]}>
                    +{t.pts}pts
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Description (optional)</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.text }]}
              placeholder="Describe the waste situation…"
              placeholderTextColor={colors.mutedForeground}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Location</Text>
            <Pressable
              style={[styles.locBtn, { backgroundColor: coords ? colors.success + '22' : colors.secondary, borderColor: coords ? colors.success : colors.border }]}
              onPress={getLocation}
              disabled={locating}
            >
              {locating ? (
                <ActivityIndicator size="small" color={colors.mutedForeground} />
              ) : (
                <Ionicons name={coords ? 'location' : 'location-outline'} size={18} color={coords ? colors.success : colors.mutedForeground} />
              )}
              <Text style={[styles.locBtnText, { color: coords ? colors.success : colors.mutedForeground }]}>
                {locating ? 'Getting location…' : coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : 'Use My Location'}
              </Text>
            </Pressable>

            <Pressable
              style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: reportMutation.isPending ? 0.7 : 1 }]}
              onPress={handleSubmit}
              disabled={reportMutation.isPending}
            >
              <Ionicons name="leaf" size={18} color={colors.primaryForeground} />
              <Text style={[styles.submitBtnText, { color: colors.primaryForeground }]}>
                {reportMutation.isPending ? 'Submitting…' : 'Submit Report'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe:           { flex: 1 },
    content:        { padding: 16, paddingBottom: 100 },
    header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    pageTitle:      { fontSize: 22, fontFamily: 'Inter_700Bold' },
    pageSubtitle:   { fontSize: 14, fontFamily: 'Inter_400Regular', marginTop: 2 },
    newBtn:         { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
    newBtnText:     { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
    infoCard:       { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
    infoText:       { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19 },
    statsRow:       { flexDirection: 'row', gap: 10, marginBottom: 20 },
    statCard:       { flex: 1, borderRadius: 12, borderWidth: 1, padding: 12, alignItems: 'center' },
    statVal:        { fontSize: 22, fontFamily: 'Inter_700Bold' },
    statLbl:        { fontSize: 11, fontFamily: 'Inter_400Regular', textTransform: 'capitalize', marginTop: 2, textAlign: 'center' },
    sectionTitle:   { fontSize: 17, fontFamily: 'Inter_600SemiBold', marginBottom: 12 },
    reportItem:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
    reportIcon:     { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    reportEmoji:    { fontSize: 20 },
    reportTop:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
    reportType:     { fontSize: 14, fontFamily: 'Inter_600SemiBold', flex: 1 },
    statusBadge:    { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    statusText:     { fontSize: 11, fontFamily: 'Inter_600SemiBold', textTransform: 'capitalize' },
    reportDesc:     { fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 3 },
    reportMeta:     { fontSize: 12, fontFamily: 'Inter_400Regular' },
    empty:          { textAlign: 'center', paddingTop: 60, fontSize: 14, fontFamily: 'Inter_400Regular' },
    // Modal
    modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalSheet:     { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 14 },
    modalHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    modalTitle:     { fontSize: 20, fontFamily: 'Inter_700Bold' },
    fieldLabel:     { fontSize: 12, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5, textTransform: 'uppercase' },
    typeChip:       { alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1, minWidth: 90, gap: 2 },
    typeEmoji:      { fontSize: 20 },
    typeLabel:      { fontSize: 12, fontFamily: 'Inter_500Medium', textAlign: 'center' },
    typePts:        { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
    textArea:       { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 14, fontFamily: 'Inter_400Regular', minHeight: 80, textAlignVertical: 'top' },
    locBtn:         { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1 },
    locBtnText:     { fontSize: 14, fontFamily: 'Inter_500Medium', flex: 1 },
    submitBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 14 },
    submitBtnText:  { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  });
}
