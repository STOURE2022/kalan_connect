import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Button from "@/components/ui/Button";
import { teachersAPI } from "@/api/services";
import { colors, spacing, radius, fontSize, fontWeight } from "@/utils/theme";
import { DAYS_FR, formatTime } from "@/utils/helpers";
import Toast from "react-native-toast-message";
import type { Availability } from "@/types";

const TIME_SLOTS = [
  "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00",
  "19:00", "20:00", "21:00",
];

export default function ManageAvailabilityScreen() {
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  // New slot form
  const [selectedDay, setSelectedDay] = useState(1);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("10:00");
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    try {
      const profile = await teachersAPI.getMyProfile();
      setAvailabilities(profile.availabilities);
    } catch {
      Toast.show({ type: "error", text1: "Erreur de chargement" });
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleAdd = async () => {
    if (startTime >= endTime) {
      Toast.show({ type: "error", text1: "L'heure de fin doit être après l'heure de début" });
      return;
    }

    setAdding(true);
    try {
      await teachersAPI.addAvailability({
        day_of_week: selectedDay,
        start_time: startTime,
        end_time: endTime,
        is_recurring: true,
      });
      Toast.show({ type: "success", text1: "Disponibilité ajoutée" });
      setShowForm(false);
      await load();
    } catch {
      Toast.show({ type: "error", text1: "Erreur lors de l'ajout" });
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = (id: number) => {
    Alert.alert("Supprimer", "Retirer ce créneau ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            await teachersAPI.removeAvailability(id);
            setAvailabilities((prev) => prev.filter((a) => a.id !== id));
            Toast.show({ type: "success", text1: "Créneau supprimé" });
          } catch {
            Toast.show({ type: "error", text1: "Erreur" });
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  // Group by day
  const byDay: Record<number, Availability[]> = {};
  availabilities.forEach((a) => {
    if (!byDay[a.day_of_week]) byDay[a.day_of_week] = [];
    byDay[a.day_of_week].push(a);
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.subtitle}>
        Définissez vos créneaux de disponibilité pour les cours
      </Text>

      {/* Current availability by day */}
      {[1, 2, 3, 4, 5, 6, 7].map((day) => (
        <View key={day} style={styles.daySection}>
          <Text style={styles.dayLabel}>{DAYS_FR[day]}</Text>
          {byDay[day]?.length ? (
            <View style={styles.slotsRow}>
              {byDay[day].map((slot) => (
                <View key={slot.id} style={styles.slotChip}>
                  <Text style={styles.slotText}>
                    {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                  </Text>
                  <TouchableOpacity onPress={() => handleRemove(slot.id)}>
                    <Ionicons name="close-circle" size={18} color={colors.red[500]} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noSlot}>Aucun créneau</Text>
          )}
        </View>
      ))}

      {/* Add form */}
      {showForm ? (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Ajouter un créneau</Text>

          {/* Day picker */}
          <Text style={styles.formLabel}>Jour</Text>
          <View style={styles.dayPicker}>
            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.dayChip, selectedDay === d && styles.dayChipActive]}
                onPress={() => setSelectedDay(d)}
              >
                <Text
                  style={[
                    styles.dayChipText,
                    selectedDay === d && styles.dayChipTextActive,
                  ]}
                >
                  {DAYS_FR[d].slice(0, 3)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Time pickers */}
          <View style={styles.timeRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.formLabel}>Début</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.timeSlots}>
                  {TIME_SLOTS.map((t) => (
                    <TouchableOpacity
                      key={`start-${t}`}
                      style={[styles.timeChip, startTime === t && styles.timeChipActive]}
                      onPress={() => setStartTime(t)}
                    >
                      <Text
                        style={[
                          styles.timeChipText,
                          startTime === t && styles.timeChipTextActive,
                        ]}
                      >
                        {t}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>

          <View style={{ marginTop: spacing.md }}>
            <Text style={styles.formLabel}>Fin</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.timeSlots}>
                {TIME_SLOTS.filter((t) => t > startTime).map((t) => (
                  <TouchableOpacity
                    key={`end-${t}`}
                    style={[styles.timeChip, endTime === t && styles.timeChipActive]}
                    onPress={() => setEndTime(t)}
                  >
                    <Text
                      style={[
                        styles.timeChipText,
                        endTime === t && styles.timeChipTextActive,
                      ]}
                    >
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.formActions}>
            <Button
              title="Ajouter"
              onPress={handleAdd}
              loading={adding}
              size="md"
              style={{ flex: 1 }}
            />
            <Button
              title="Annuler"
              onPress={() => setShowForm(false)}
              variant="secondary"
              size="md"
              style={{ flex: 1 }}
            />
          </View>
        </View>
      ) : (
        <View style={styles.addBtnContainer}>
          <Button
            title="Ajouter un créneau"
            onPress={() => setShowForm(true)}
            variant="secondary"
            size="lg"
            icon={<Ionicons name="add-circle-outline" size={20} color={colors.primary[600]} />}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  center: { alignItems: "center", justifyContent: "center" },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    padding: spacing.lg,
    lineHeight: 20,
  },
  daySection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  dayLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.gray[800],
    marginBottom: spacing.xs,
  },
  slotsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  slotChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  slotText: {
    fontSize: fontSize.sm,
    color: colors.primary[700],
    fontWeight: fontWeight.medium,
  },
  noSlot: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    fontStyle: "italic",
  },
  addBtnContainer: {
    padding: spacing.lg,
  },
  formCard: {
    margin: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  formTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.lg,
  },
  formLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.gray[600],
    marginBottom: spacing.sm,
  },
  dayPicker: {
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  dayChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: "center",
    borderRadius: radius.md,
    backgroundColor: colors.gray[100],
  },
  dayChipActive: {
    backgroundColor: colors.primary[600],
  },
  dayChipText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.gray[600],
  },
  dayChipTextActive: {
    color: colors.white,
  },
  timeRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  timeSlots: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  timeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.gray[100],
  },
  timeChipActive: {
    backgroundColor: colors.primary[600],
  },
  timeChipText: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
  },
  timeChipTextActive: {
    color: colors.white,
    fontWeight: fontWeight.medium,
  },
  formActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.xl,
  },
});
