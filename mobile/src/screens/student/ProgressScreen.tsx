import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import StarRating from "@/components/ui/StarRating";
import { studentAPI } from "@/api/services";
import { colors, spacing, radius, fontSize, fontWeight } from "@/utils/theme";
import { formatDate } from "@/utils/helpers";
import type { StudentProgress } from "@/types";

export default function ProgressScreen() {
  const [progress, setProgress] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await studentAPI.getMyProgress();
      setProgress(data);
    } catch {
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

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  // Summary
  const totalSessions = progress.reduce((sum, p) => sum + p.completed_sessions, 0);
  const totalSubjects = progress.length;
  const avgRating =
    progress.length > 0
      ? progress.reduce((sum, p) => sum + (p.avg_rating || 0), 0) / progress.length
      : 0;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Summary cards */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Ionicons name="book" size={24} color={colors.primary[500]} />
          <Text style={styles.summaryValue}>{totalSessions}</Text>
          <Text style={styles.summaryLabel}>Cours suivis</Text>
        </View>
        <View style={styles.summaryCard}>
          <Ionicons name="library" size={24} color={colors.blue[500]} />
          <Text style={styles.summaryValue}>{totalSubjects}</Text>
          <Text style={styles.summaryLabel}>Matières</Text>
        </View>
        <View style={styles.summaryCard}>
          <Ionicons name="star" size={24} color={colors.accent[500]} />
          <Text style={styles.summaryValue}>{avgRating.toFixed(1)}</Text>
          <Text style={styles.summaryLabel}>Moyenne</Text>
        </View>
      </View>

      {/* Per-subject progress */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Détail par matière</Text>

        {progress.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="bar-chart-outline" size={50} color={colors.gray[300]} />
            <Text style={styles.emptyTitle}>Aucune donnée</Text>
            <Text style={styles.emptySubtitle}>
              Suivez des cours pour voir votre progression
            </Text>
          </View>
        ) : (
          progress.map((p, i) => {
            const completionRate =
              p.total_sessions > 0
                ? Math.round((p.completed_sessions / p.total_sessions) * 100)
                : 0;

            return (
              <View key={i} style={styles.progressCard}>
                <View style={styles.progressHeader}>
                  <View style={styles.progressIcon}>
                    <Text style={{ fontSize: 28 }}>{p.subject.icon || "📖"}</Text>
                  </View>
                  <View style={styles.progressTitleCol}>
                    <Text style={styles.progressSubject}>{p.subject.name}</Text>
                    <Text style={styles.progressTeacher}>
                      avec {p.teacher.first_name} {p.teacher.last_name}
                    </Text>
                  </View>
                </View>

                {/* Progress bar */}
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBarBg}>
                    <View
                      style={[styles.progressBarFill, { width: `${completionRate}%` }]}
                    />
                  </View>
                  <Text style={styles.progressPercent}>{completionRate}%</Text>
                </View>

                {/* Stats */}
                <View style={styles.progressStats}>
                  <View style={styles.progressStatItem}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.primary[500]} />
                    <Text style={styles.progressStatText}>
                      {p.completed_sessions}/{p.total_sessions} cours
                    </Text>
                  </View>
                  {p.avg_rating > 0 && (
                    <View style={styles.progressStatItem}>
                      <StarRating rating={p.avg_rating} size={14} />
                    </View>
                  )}
                  <View style={styles.progressStatItem}>
                    <Ionicons name="calendar" size={16} color={colors.gray[400]} />
                    <Text style={styles.progressStatText}>
                      Dernier: {formatDate(p.last_session_date)}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  center: { alignItems: "center", justifyContent: "center" },
  summaryRow: {
    flexDirection: "row",
    padding: spacing.lg,
    gap: spacing.sm,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: "center",
  },
  summaryValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    marginTop: spacing.xs,
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    marginTop: 2,
  },
  section: {
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.gray[400],
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.gray[700],
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    textAlign: "center",
  },
  progressCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  progressHeader: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  progressIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.gray[50],
    alignItems: "center",
    justifyContent: "center",
  },
  progressTitleCol: {
    flex: 1,
    justifyContent: "center",
  },
  progressSubject: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
  },
  progressTeacher: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginTop: 2,
  },
  progressBarContainer: {
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
  progressStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  progressStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  progressStatText: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
  },
});
