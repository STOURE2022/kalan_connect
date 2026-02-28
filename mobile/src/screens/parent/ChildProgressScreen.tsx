import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import StarRating from "@/components/ui/StarRating";
import { childrenAPI } from "@/api/services";
import { colors, spacing, radius, fontSize, fontWeight } from "@/utils/theme";
import { formatDate } from "@/utils/helpers";
import type { StudentProgress } from "@/types";

export default function ChildProgressScreen() {
  const route = useRoute<any>();
  const { childId, childName } = route.params;

  const [progress, setProgress] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await childrenAPI.getProgress(childId);
      setProgress(data);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [childId]);

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

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  const totalSessions = progress.reduce((sum, p) => sum + p.completed_sessions, 0);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Progression de {childName}</Text>
        <Text style={styles.headerSubtitle}>
          {totalSessions} cours suivis en {progress.length} matière(s)
        </Text>
      </View>

      {progress.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="bar-chart-outline" size={60} color={colors.gray[300]} />
          <Text style={styles.emptyTitle}>Pas encore de données</Text>
          <Text style={styles.emptySubtitle}>
            Les cours suivis par {childName} apparaîtront ici
          </Text>
        </View>
      ) : (
        progress.map((p, i) => {
          const rate =
            p.total_sessions > 0
              ? Math.round((p.completed_sessions / p.total_sessions) * 100)
              : 0;
          return (
            <View key={i} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.subjectIcon}>
                  <Text style={{ fontSize: 24 }}>{p.subject.icon || "📖"}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.subjectName}>{p.subject.name}</Text>
                  <Text style={styles.teacherName}>
                    Prof: {p.teacher.first_name} {p.teacher.last_name}
                  </Text>
                </View>
              </View>

              <View style={styles.progressRow}>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${rate}%` }]} />
                </View>
                <Text style={styles.progressPercent}>{rate}%</Text>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.primary[500]} />
                  <Text style={styles.statText}>
                    {p.completed_sessions}/{p.total_sessions} cours
                  </Text>
                </View>
                {p.avg_rating > 0 && (
                  <View style={styles.statItem}>
                    <StarRating rating={p.avg_rating} size={14} />
                  </View>
                )}
                <View style={styles.statItem}>
                  <Ionicons name="calendar-outline" size={16} color={colors.gray[400]} />
                  <Text style={styles.statText}>
                    {formatDate(p.last_session_date)}
                  </Text>
                </View>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  center: { alignItems: "center", justifyContent: "center" },
  header: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  headerTitle: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginTop: spacing.xs,
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: spacing["2xl"],
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.gray[700],
    marginTop: spacing.lg,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    textAlign: "center",
    marginTop: spacing.sm,
  },
  card: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  subjectIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.gray[50],
    alignItems: "center",
    justifyContent: "center",
  },
  subjectName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
  },
  teacherName: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginTop: 2,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: colors.gray[100],
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: colors.primary[500],
    borderRadius: 4,
  },
  progressPercent: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary[600],
    width: 40,
    textAlign: "right",
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  statText: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
  },
});
