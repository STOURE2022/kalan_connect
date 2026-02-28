import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { teachersAPI, bookingsAPI, chatAPI } from "@/api/services";
import { useAuth } from "@/contexts/AuthContext";
import Avatar from "@/components/ui/Avatar";
import StarRating from "@/components/ui/StarRating";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { colors, spacing, radius, fontSize } from "@/utils/theme";
import { formatPrice, DAYS_FR } from "@/utils/helpers";
import type { TeacherProfile, Review } from "@/types";

export default function TeacherDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { isLoggedIn, hasSubscription } = useAuth();

  const [teacher, setTeacher] = useState<TeacherProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const teacherId = route.params.id;

  useEffect(() => {
    Promise.all([
      teachersAPI.getById(teacherId),
      bookingsAPI.getReviews(teacherId).catch(() => ({ results: [] })),
    ])
      .then(([t, r]) => {
        setTeacher(t);
        setReviews(r.results);
      })
      .finally(() => setLoading(false));
  }, [teacherId]);

  const handleBook = () => {
    if (!isLoggedIn) return navigation.navigate("Login");
    if (!hasSubscription) return navigation.navigate("Payment");
    navigation.navigate("Booking", { teacherId });
  };

  const handleContact = async () => {
    if (!isLoggedIn) return navigation.navigate("Login");
    if (!teacher) return;
    try {
      const conv = await chatAPI.startConversation(teacher.user.id);
      navigation.navigate("ChatRoom", {
        conversationId: conv.id,
        name: `${teacher.user.first_name} ${teacher.user.last_name}`,
      });
    } catch {}
  };

  if (loading || !teacher) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  const subjectNames = [
    ...new Set(teacher.teacher_subjects.map((ts) => ts.subject.name)),
  ];

  const availByDay = teacher.availabilities.reduce(
    (acc, a) => {
      if (!acc[a.day_of_week]) acc[a.day_of_week] = [];
      acc[a.day_of_week].push(
        `${a.start_time.slice(0, 5)}–${a.end_time.slice(0, 5)}`
      );
      return acc;
    },
    {} as Record<number, string[]>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Avatar
          src={teacher.photo}
          firstName={teacher.user.first_name}
          lastName={teacher.user.last_name}
          size={90}
        />
        <Text style={styles.name}>
          {teacher.user.first_name} {teacher.user.last_name}
        </Text>
        <View style={styles.ratingRow}>
          <StarRating rating={teacher.avg_rating} reviewCount={teacher.total_reviews} />
          {teacher.is_verified && (
            <Badge
              label="Vérifié"
              variant="green"
              icon={<Ionicons name="checkmark-circle" size={12} color={colors.primary[600]} />}
            />
          )}
        </View>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={14} color={colors.gray[400]} />
            <Text style={styles.metaText}>
              {teacher.neighborhood}, {teacher.city}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="school-outline" size={14} color={colors.gray[400]} />
            <Text style={styles.metaText}>{teacher.experience_years} ans</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color={colors.gray[400]} />
            <Text style={styles.metaText}>
              ~{Math.round(teacher.response_time_hours)}h
            </Text>
          </View>
        </View>
      </View>

      {/* ── Price + CTA ── */}
      <View style={styles.ctaBox}>
        <Text style={styles.ctaPrice}>
          {formatPrice(teacher.hourly_rate)}
          <Text style={styles.ctaPriceUnit}> / heure</Text>
        </Text>
        <View style={styles.ctaButtons}>
          <Button title="Réserver" onPress={handleBook} style={{ flex: 1 }} />
          <Button
            title="Contacter"
            onPress={handleContact}
            variant="secondary"
            style={{ flex: 1 }}
          />
        </View>
      </View>

      {/* ── Bio ── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>À propos</Text>
        <Text style={styles.bioText}>{teacher.bio}</Text>
      </View>

      {/* ── Subjects ── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Matières</Text>
        <View style={styles.subjectsWrap}>
          {subjectNames.map((s) => (
            <Badge key={s} label={s} variant="green" />
          ))}
        </View>
      </View>

      {/* ── Teaching modes ── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Type de cours</Text>
        <View style={styles.modesCol}>
          {teacher.teaches_at_student && (
            <View style={styles.modeItem}>
              <Ionicons name="home-outline" size={16} color={colors.blue[500]} />
              <Text style={styles.modeText}>
                À domicile (rayon {teacher.radius_km} km)
              </Text>
            </View>
          )}
          {teacher.teaches_at_home && (
            <View style={styles.modeItem}>
              <Ionicons name="business-outline" size={16} color={colors.gray[600]} />
              <Text style={styles.modeText}>Chez le professeur</Text>
            </View>
          )}
          {teacher.teaches_online && (
            <View style={styles.modeItem}>
              <Ionicons name="laptop-outline" size={16} color={colors.primary[500]} />
              <Text style={styles.modeText}>En ligne</Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Availability ── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Disponibilités</Text>
        {Object.entries(availByDay).map(([day, slots]) => (
          <View key={day} style={styles.availRow}>
            <Text style={styles.availDay}>{DAYS_FR[Number(day)]}</Text>
            <View style={styles.availSlots}>
              {slots.map((s) => (
                <Badge key={s} label={s} variant="green" />
              ))}
            </View>
          </View>
        ))}
        {Object.keys(availByDay).length === 0 && (
          <Text style={styles.emptyText}>Contactez le professeur</Text>
        )}
      </View>

      {/* ── Reviews ── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Avis ({teacher.total_reviews})</Text>
        {reviews.length > 0 ? (
          reviews.slice(0, 5).map((r) => (
            <View key={r.id} style={styles.reviewItem}>
              <View style={styles.reviewHeader}>
                <Avatar
                  src={r.parent.avatar}
                  firstName={r.parent.first_name}
                  lastName={r.parent.last_name}
                  size={28}
                />
                <Text style={styles.reviewerName}>
                  {r.parent.first_name} {r.parent.last_name.charAt(0)}.
                </Text>
                <StarRating rating={r.rating} size={12} showValue={false} />
              </View>
              {r.comment ? (
                <Text style={styles.reviewComment}>{r.comment}</Text>
              ) : null}
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>Pas encore d'avis</Text>
        )}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  // Header
  header: {
    backgroundColor: colors.white,
    alignItems: "center",
    paddingTop: spacing["2xl"],
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  name: { fontSize: fontSize.xl, fontWeight: "800", color: colors.gray[900], marginTop: spacing.md },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.xs },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.lg, marginTop: spacing.md },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, color: colors.gray[500] },
  // CTA
  ctaBox: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  ctaPrice: { fontSize: 22, fontWeight: "800", color: colors.gray[900] },
  ctaPriceUnit: { fontSize: 14, fontWeight: "400", color: colors.gray[500] },
  ctaButtons: { flexDirection: "row", gap: spacing.md, marginTop: spacing.lg },
  // Card
  card: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: colors.gray[900], marginBottom: spacing.md },
  bioText: { fontSize: 13, lineHeight: 20, color: colors.gray[600] },
  subjectsWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  modesCol: { gap: spacing.md },
  modeItem: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  modeText: { fontSize: 13, color: colors.gray[700] },
  // Availability
  availRow: { flexDirection: "row", alignItems: "center", marginBottom: spacing.sm },
  availDay: { width: 80, fontSize: 13, fontWeight: "600", color: colors.gray[700] },
  availSlots: { flexDirection: "row", gap: 4, flexWrap: "wrap" },
  emptyText: { fontSize: 13, color: colors.gray[400] },
  // Reviews
  reviewItem: { borderTopWidth: 1, borderTopColor: colors.gray[100], paddingTop: spacing.md, marginTop: spacing.md },
  reviewHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  reviewerName: { fontSize: 13, fontWeight: "600", color: colors.gray[700], flex: 1 },
  reviewComment: { fontSize: 13, color: colors.gray[600], marginTop: spacing.xs, lineHeight: 19 },
});
