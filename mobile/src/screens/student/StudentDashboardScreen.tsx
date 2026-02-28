import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { studentAPI, bookingsAPI } from "@/api/services";
import Badge from "@/components/ui/Badge";
import { colors, spacing, radius, fontSize, fontWeight } from "@/utils/theme";
import { formatTime } from "@/utils/helpers";
import type { ScheduleItem, StudentProgress } from "@/types";

export default function StudentDashboardScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [progress, setProgress] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [schedData, progressData] = await Promise.all([
        studentAPI.getMySchedule(),
        studentAPI.getMyProgress(),
      ]);
      setSchedule(schedData);
      setProgress(progressData);
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

  // Today's schedule
  const today = new Date().toISOString().split("T")[0];
  const todaySchedule = schedule.filter((s) => s.date === today);
  const upcomingSchedule = schedule.filter((s) => s.date > today).slice(0, 5);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Welcome */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.greeting}>Bonjour,</Text>
        <Text style={styles.userName}>{user?.first_name} 📚</Text>
      </View>

      {/* Today's classes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Aujourd'hui</Text>
        {todaySchedule.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="sunny-outline" size={36} color={colors.accent[500]} />
            <Text style={styles.emptyText}>Pas de cours aujourd'hui</Text>
          </View>
        ) : (
          todaySchedule.map((item) => (
            <View key={item.id} style={styles.scheduleCard}>
              <View style={[styles.scheduleDot, { backgroundColor: colors.primary[500] }]} />
              <View style={styles.scheduleInfo}>
                <Text style={styles.scheduleSubject}>{item.subject_name}</Text>
                <Text style={styles.scheduleTeacher}>
                  <Ionicons name="person" size={12} color={colors.gray[400]} />{" "}
                  {item.teacher_name}
                </Text>
                <Text style={styles.scheduleTime}>
                  {formatTime(item.start_time)} - {formatTime(item.end_time)}
                </Text>
              </View>
              <Badge
                label={
                  item.location_type === "online"
                    ? "En ligne"
                    : item.location_type === "at_teacher"
                    ? "Chez le prof"
                    : "A domicile"
                }
                variant={item.location_type === "online" ? "green" : "blue"}
              />
            </View>
          ))
        )}
      </View>

      {/* Progress overview */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ma progression</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Progression")}>
            <Text style={styles.seeAll}>Voir tout</Text>
          </TouchableOpacity>
        </View>
        {progress.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="bar-chart-outline" size={36} color={colors.gray[300]} />
            <Text style={styles.emptyText}>Commencez vos cours pour suivre votre progression</Text>
          </View>
        ) : (
          progress.slice(0, 3).map((p, i) => (
            <View key={i} style={styles.progressCard}>
              <View style={styles.progressIcon}>
                <Text style={{ fontSize: 24 }}>
                  {p.subject.icon || "📖"}
                </Text>
              </View>
              <View style={styles.progressInfo}>
                <Text style={styles.progressSubject}>{p.subject.name}</Text>
                <Text style={styles.progressTeacher}>
                  avec {p.teacher.first_name} {p.teacher.last_name}
                </Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${
                          p.total_sessions > 0
                            ? (p.completed_sessions / p.total_sessions) * 100
                            : 0
                        }%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressSessions}>
                  {p.completed_sessions}/{p.total_sessions} cours terminés
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Upcoming */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Prochains cours</Text>
        {upcomingSchedule.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={36} color={colors.gray[300]} />
            <Text style={styles.emptyText}>Aucun cours à venir</Text>
          </View>
        ) : (
          upcomingSchedule.map((item) => (
            <View key={item.id} style={styles.upcomingCard}>
              <View style={styles.upcomingDate}>
                <Text style={styles.upcomingDay}>
                  {new Date(item.date).toLocaleDateString("fr-FR", { weekday: "short" })}
                </Text>
                <Text style={styles.upcomingDayNum}>
                  {new Date(item.date).getDate()}
                </Text>
              </View>
              <View style={styles.upcomingInfo}>
                <Text style={styles.upcomingSubject}>{item.subject_name}</Text>
                <Text style={styles.upcomingTeacher}>{item.teacher_name}</Text>
                <Text style={styles.upcomingTime}>
                  {formatTime(item.start_time)} - {formatTime(item.end_time)}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Quick actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate("Recherche")}
          >
            <Ionicons name="search" size={28} color={colors.primary[600]} />
            <Text style={styles.actionText}>Trouver un prof</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate("Chat")}
          >
            <Ionicons name="chatbubbles" size={28} color={colors.blue[500]} />
            <Text style={styles.actionText}>Messages</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate("Emploi du temps")}
          >
            <Ionicons name="calendar" size={28} color={colors.accent[600]} />
            <Text style={styles.actionText}>Emploi du temps</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  center: { alignItems: "center", justifyContent: "center" },
  header: {
    padding: spacing.lg,
  },
  greeting: {
    fontSize: fontSize.base,
    color: colors.gray[500],
  },
  userName: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.gray[400],
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  seeAll: {
    fontSize: fontSize.sm,
    color: colors.primary[600],
    fontWeight: fontWeight.medium,
    marginBottom: spacing.md,
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    textAlign: "center",
  },
  scheduleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
  },
  scheduleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  scheduleInfo: { flex: 1 },
  scheduleSubject: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
  },
  scheduleTeacher: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  scheduleTime: {
    fontSize: fontSize.sm,
    color: colors.primary[600],
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },
  progressCard: {
    flexDirection: "row",
    gap: spacing.md,
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
  },
  progressIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.gray[50],
    alignItems: "center",
    justifyContent: "center",
  },
  progressInfo: { flex: 1 },
  progressSubject: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
  },
  progressTeacher: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.gray[100],
    borderRadius: 3,
    marginTop: spacing.sm,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary[500],
    borderRadius: 3,
  },
  progressSessions: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    marginTop: spacing.xs,
  },
  upcomingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
  },
  upcomingDate: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary[50],
    alignItems: "center",
    justifyContent: "center",
  },
  upcomingDay: {
    fontSize: fontSize.xs,
    color: colors.primary[600],
    textTransform: "capitalize",
  },
  upcomingDayNum: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
  },
  upcomingInfo: { flex: 1 },
  upcomingSubject: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
  },
  upcomingTeacher: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  upcomingTime: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    marginTop: 1,
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.sm,
  },
  actionText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.gray[700],
    textAlign: "center",
  },
});
