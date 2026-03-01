import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import StarRating from "@/components/ui/StarRating";
import { adminAPI } from "@/api/services";
import { colors, spacing, radius, fontSize, fontWeight } from "@/utils/theme";
import { formatDate, formatPrice } from "@/utils/helpers";
import Toast from "react-native-toast-message";
import type { TeacherProfile } from "@/types";

export default function TeacherVerificationScreen() {
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await adminAPI.getPendingTeachers();
      setTeachers(res.results);
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

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleVerify = (teacher: TeacherProfile, approved: boolean) => {
    Alert.alert(
      approved ? "Approuver le professeur" : "Rejeter le professeur",
      `${teacher.user.first_name} ${teacher.user.last_name}`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: approved ? "Approuver" : "Rejeter",
          style: approved ? "default" : "destructive",
          onPress: async () => {
            try {
              await adminAPI.verifyTeacher(teacher.id, approved);
              setTeachers((prev) => prev.filter((t) => t.id !== teacher.id));
            } catch {
              Toast.show({ type: "error", text1: "Erreur lors de la vérification" });
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerInfo}>
        {teachers.length} professeur(s) en attente de vérification
      </Text>

      <FlatList
        data={teachers}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* Header */}
            <View style={styles.cardHeader}>
              <Avatar
                src={item.photo}
                firstName={item.user.first_name}
                lastName={item.user.last_name}
                size={56}
              />
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>
                  {item.user.first_name} {item.user.last_name}
                </Text>
                <Text style={styles.cardLocation}>
                  <Ionicons name="location" size={12} color={colors.gray[400]} />{" "}
                  {item.neighborhood ? `${item.neighborhood}, ` : ""}
                  {item.city}
                </Text>
                <Text style={styles.cardDate}>
                  Inscrit le {formatDate(item.created_at)}
                </Text>
              </View>
            </View>

            {/* Bio */}
            {item.bio ? (
              <Text style={styles.bio} numberOfLines={3}>
                {item.bio}
              </Text>
            ) : null}

            {/* Details */}
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Tarif</Text>
                <Text style={styles.detailValue}>{formatPrice(item.hourly_rate)}/h</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Expérience</Text>
                <Text style={styles.detailValue}>{item.experience_years} ans</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Rayon</Text>
                <Text style={styles.detailValue}>{item.radius_km} km</Text>
              </View>
            </View>

            {/* Subjects */}
            <View style={styles.subjectsRow}>
              {item.teacher_subjects.map((ts, i) => (
                <Badge key={i} label={ts.subject.name} variant="blue" />
              ))}
            </View>

            {/* Modes */}
            <View style={styles.modesRow}>
              {item.teaches_online && (
                <Badge label="En ligne" variant="green" icon={<Ionicons name="globe" size={10} color={colors.primary[700]} />} />
              )}
              {item.teaches_at_home && (
                <Badge label="A domicile" variant="yellow" />
              )}
              {item.teaches_at_student && (
                <Badge label="Chez l'élève" variant="blue" />
              )}
            </View>

            {/* Diplomas */}
            {item.diplomas.length > 0 && (
              <View style={styles.diplomasSection}>
                <Text style={styles.diplomasTitle}>Diplômes</Text>
                {item.diplomas.map((d) => (
                  <View key={d.id} style={styles.diplomaItem}>
                    <Ionicons name="school" size={14} color={colors.gray[500]} />
                    <Text style={styles.diplomaText}>
                      {d.title} — {d.institution} ({d.year})
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Actions */}
            <View style={styles.actions}>
              <Button
                title="Approuver"
                onPress={() => handleVerify(item, true)}
                size="md"
                style={{ flex: 1 }}
              />
              <Button
                title="Rejeter"
                onPress={() => handleVerify(item, false)}
                variant="danger"
                size="md"
                style={{ flex: 1 }}
              />
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="checkmark-done-circle-outline" size={60} color={colors.primary[300]} />
            <Text style={styles.emptyTitle}>Tout est à jour !</Text>
            <Text style={styles.emptySubtitle}>
              Aucun professeur en attente de vérification
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  center: { alignItems: "center", justifyContent: "center" },
  headerInfo: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    padding: spacing.lg,
    fontWeight: fontWeight.medium,
  },
  card: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  cardHeader: {
    flexDirection: "row",
    gap: spacing.md,
  },
  cardInfo: { flex: 1 },
  cardName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
  },
  cardLocation: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginTop: 2,
  },
  cardDate: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    marginTop: 2,
  },
  bio: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    lineHeight: 20,
    marginTop: spacing.md,
  },
  detailsGrid: {
    flexDirection: "row",
    marginTop: spacing.md,
    gap: spacing.md,
  },
  detailItem: {
    flex: 1,
    backgroundColor: colors.gray[50],
    padding: spacing.sm,
    borderRadius: radius.md,
    alignItems: "center",
  },
  detailLabel: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
  },
  detailValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
    marginTop: 2,
  },
  subjectsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  modesRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  diplomasSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  diplomasTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.gray[700],
    marginBottom: spacing.sm,
  },
  diplomaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 4,
  },
  diplomaText: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  empty: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: spacing["2xl"],
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.gray[700],
    marginTop: spacing.lg,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    textAlign: "center",
    marginTop: spacing.sm,
  },
});
