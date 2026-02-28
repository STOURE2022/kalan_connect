import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { teachersAPI, bookingsAPI } from "@/api/services";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import { colors, spacing, radius, fontSize } from "@/utils/theme";
import { formatPrice } from "@/utils/helpers";
import Toast from "react-native-toast-message";
import type { TeacherProfile } from "@/types";

export default function BookingCreateScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const teacherId = route.params.teacherId;

  const [teacher, setTeacher] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);
  const [locationType, setLocationType] = useState("at_student");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    teachersAPI.getById(teacherId).then((t) => {
      setTeacher(t);
      if (t.teacher_subjects.length > 0) setSelectedSubject(t.teacher_subjects[0].subject.id);
    }).finally(() => setLoading(false));
  }, [teacherId]);

  if (loading || !teacher) {
    return <View style={styles.loader}><ActivityIndicator size="large" color={colors.primary[500]} /></View>;
  }

  if (success) {
    return (
      <View style={styles.successContainer}>
        <Ionicons name="checkmark-circle" size={64} color={colors.primary[500]} />
        <Text style={styles.successTitle}>Réservation envoyée !</Text>
        <Text style={styles.successDesc}>
          {teacher.user.first_name} recevra votre demande et vous confirmera le cours.
        </Text>
        <Button title="Mes réservations" onPress={() => navigation.goBack()} style={{ marginTop: 24 }} />
      </View>
    );
  }

  const uniqueSubjects = [...new Map(
    teacher.teacher_subjects.map((ts) => [ts.subject.id, ts.subject])
  ).values()];

  const nextDays = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return d;
  });

  const selectedDayOfWeek = selectedDate ? (new Date(selectedDate).getDay() || 7) : null;
  const availableSlots = teacher.availabilities.filter((a) => a.day_of_week === selectedDayOfWeek);

  const handleSubmit = async () => {
    if (!selectedSubject || !selectedDate || !selectedSlot) {
      Toast.show({ type: "error", text1: "Remplissez tous les champs" });
      return;
    }
    setSubmitting(true);
    try {
      await bookingsAPI.create({
        teacher: teacher.id,
        subject: selectedSubject,
        date: selectedDate,
        start_time: selectedSlot.start + ":00",
        end_time: selectedSlot.end + ":00",
        location_type: locationType,
        notes,
      });
      setSuccess(true);
    } catch {
      Toast.show({ type: "error", text1: "Erreur lors de la réservation" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Teacher mini card */}
      <View style={styles.teacherMini}>
        <Avatar src={teacher.photo} firstName={teacher.user.first_name} lastName={teacher.user.last_name} size={48} />
        <View>
          <Text style={styles.teacherName}>{teacher.user.first_name} {teacher.user.last_name}</Text>
          <Text style={styles.teacherRate}>{formatPrice(teacher.hourly_rate)}/h</Text>
        </View>
      </View>

      {/* Subject */}
      <Text style={styles.sectionLabel}>Matière</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        {uniqueSubjects.map((s) => (
          <TouchableOpacity
            key={s.id}
            onPress={() => setSelectedSubject(s.id)}
            style={[styles.chip, selectedSubject === s.id && styles.chipActive]}
          >
            <Text style={[styles.chipText, selectedSubject === s.id && styles.chipTextActive]}>{s.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Date */}
      <Text style={styles.sectionLabel}>Date</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        {nextDays.map((d) => {
          const iso = d.toISOString().split("T")[0];
          const dayName = d.toLocaleDateString("fr-FR", { weekday: "short" });
          const dayNum = d.getDate();
          return (
            <TouchableOpacity
              key={iso}
              onPress={() => { setSelectedDate(iso); setSelectedSlot(null); }}
              style={[styles.dateChip, selectedDate === iso && styles.chipActive]}
            >
              <Text style={[styles.dateDay, selectedDate === iso && styles.chipTextActive]}>{dayName}</Text>
              <Text style={[styles.dateNum, selectedDate === iso && styles.chipTextActive]}>{dayNum}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Time slots */}
      {selectedDate && (
        <>
          <Text style={styles.sectionLabel}>Créneau</Text>
          <View style={styles.slotsRow}>
            {availableSlots.length > 0 ? availableSlots.map((slot) => {
              const start = slot.start_time.slice(0, 5);
              const end = slot.end_time.slice(0, 5);
              const isActive = selectedSlot?.start === start;
              return (
                <TouchableOpacity
                  key={slot.id}
                  onPress={() => setSelectedSlot({ start, end })}
                  style={[styles.chip, isActive && styles.chipActive]}
                >
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                    {start}–{end}
                  </Text>
                </TouchableOpacity>
              );
            }) : (
              <Text style={styles.emptySlots}>Pas de disponibilité ce jour</Text>
            )}
          </View>
        </>
      )}

      {/* Location type */}
      <Text style={styles.sectionLabel}>Lieu</Text>
      {[
        { key: "at_student", icon: "home-outline" as const, label: "À domicile", show: teacher.teaches_at_student },
        { key: "at_teacher", icon: "business-outline" as const, label: "Chez le prof", show: teacher.teaches_at_home },
        { key: "online", icon: "laptop-outline" as const, label: "En ligne", show: teacher.teaches_online },
      ].filter((l) => l.show).map((loc) => (
        <TouchableOpacity
          key={loc.key}
          onPress={() => setLocationType(loc.key)}
          style={[styles.locationItem, locationType === loc.key && styles.locationItemActive]}
        >
          <Ionicons name={loc.icon} size={18} color={locationType === loc.key ? colors.primary[600] : colors.gray[500]} />
          <Text style={[styles.locationText, locationType === loc.key && { color: colors.primary[700] }]}>{loc.label}</Text>
        </TouchableOpacity>
      ))}

      {/* Notes */}
      <Text style={styles.sectionLabel}>Notes (optionnel)</Text>
      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="Niveau, difficultés, objectifs..."
        placeholderTextColor={colors.gray[400]}
        multiline
        numberOfLines={3}
        style={styles.textarea}
      />

      {/* Submit */}
      <Button
        title={submitting ? "Envoi..." : "Confirmer la réservation"}
        onPress={handleSubmit}
        loading={submitting}
        disabled={!selectedSubject || !selectedDate || !selectedSlot}
        size="lg"
        icon={<Ionicons name="calendar" size={18} color={colors.white} />}
        style={{ marginTop: spacing.xl, marginBottom: 100 }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50], paddingHorizontal: spacing.lg },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  successContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.xl },
  successTitle: { fontSize: fontSize.xl, fontWeight: "800", color: colors.gray[900], marginTop: spacing.lg },
  successDesc: { fontSize: fontSize.sm, color: colors.gray[500], textAlign: "center", marginTop: spacing.sm },
  teacherMini: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.lg, marginTop: spacing.lg, borderWidth: 1, borderColor: colors.gray[100] },
  teacherName: { fontSize: 15, fontWeight: "700", color: colors.gray[900] },
  teacherRate: { fontSize: 13, color: colors.gray[500] },
  sectionLabel: { fontSize: 13, fontWeight: "700", color: colors.gray[700], marginTop: spacing.xl, marginBottom: spacing.sm },
  chipScroll: { flexDirection: "row" },
  chip: { borderWidth: 1, borderColor: colors.gray[200], borderRadius: radius.lg, paddingHorizontal: 16, paddingVertical: 10, marginRight: 8, backgroundColor: colors.white },
  chipActive: { borderColor: colors.primary[500], backgroundColor: colors.primary[50] },
  chipText: { fontSize: 13, fontWeight: "600", color: colors.gray[600] },
  chipTextActive: { color: colors.primary[700] },
  dateChip: { borderWidth: 1, borderColor: colors.gray[200], borderRadius: radius.lg, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, alignItems: "center", backgroundColor: colors.white },
  dateDay: { fontSize: 11, color: colors.gray[500], textTransform: "capitalize" },
  dateNum: { fontSize: 18, fontWeight: "800", color: colors.gray[900] },
  slotsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  emptySlots: { fontSize: 13, color: colors.gray[400] },
  locationItem: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.gray[200] },
  locationItemActive: { borderColor: colors.primary[500], backgroundColor: colors.primary[50] },
  locationText: { fontSize: 14, color: colors.gray[700] },
  textarea: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray[200], borderRadius: radius.lg, padding: spacing.lg, fontSize: 14, color: colors.gray[900], textAlignVertical: "top", minHeight: 80 },
});
