import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Badge from "@/components/ui/Badge";
import { studentAPI } from "@/api/services";
import { colors, spacing, radius, fontSize, fontWeight } from "@/utils/theme";
import { formatTime, DAYS_FR } from "@/utils/helpers";
import type { ScheduleItem } from "@/types";

export default function MyScheduleScreen() {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await studentAPI.getMySchedule();
      setSchedule(data);
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

  // Get next 7 days
  const days: { date: string; label: string; dayNum: number; isToday: boolean }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    days.push({
      date: dateStr,
      label: d.toLocaleDateString("fr-FR", { weekday: "short" }),
      dayNum: d.getDate(),
      isToday: i === 0,
    });
  }

  const currentDay = selectedDay || days[0]?.date;
  const filteredSchedule = schedule.filter((s) => s.date === currentDay);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Day selector */}
      <View style={styles.daySelector}>
        {days.map((day) => (
          <TouchableOpacity
            key={day.date}
            style={[
              styles.dayChip,
              currentDay === day.date && styles.dayChipActive,
            ]}
            onPress={() => setSelectedDay(day.date)}
          >
            <Text
              style={[
                styles.dayLabel,
                currentDay === day.date && styles.dayLabelActive,
              ]}
            >
              {day.label}
            </Text>
            <Text
              style={[
                styles.dayNum,
                currentDay === day.date && styles.dayNumActive,
              ]}
            >
              {day.dayNum}
            </Text>
            {day.isToday && <View style={styles.todayDot} />}
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredSchedule}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
        renderItem={({ item }) => (
          <View style={styles.scheduleCard}>
            <View style={styles.timeColumn}>
              <Text style={styles.startTime}>{formatTime(item.start_time)}</Text>
              <View style={styles.timeLine} />
              <Text style={styles.endTime}>{formatTime(item.end_time)}</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.subjectName}>{item.subject_name}</Text>
              <View style={styles.detailRow}>
                <Ionicons name="person" size={14} color={colors.gray[400]} />
                <Text style={styles.teacherName}>{item.teacher_name}</Text>
              </View>
              <View style={styles.badgesRow}>
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
                <Badge
                  label={
                    item.status === "confirmed"
                      ? "Confirmé"
                      : item.status === "pending"
                      ? "En attente"
                      : item.status
                  }
                  variant={
                    item.status === "confirmed"
                      ? "green"
                      : item.status === "pending"
                      ? "yellow"
                      : "gray"
                  }
                />
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={50} color={colors.gray[300]} />
            <Text style={styles.emptyTitle}>Aucun cours ce jour</Text>
            <Text style={styles.emptySubtitle}>
              Profitez de votre journée libre !
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
  daySelector: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    gap: spacing.xs,
  },
  dayChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  dayChipActive: {
    backgroundColor: colors.primary[600],
  },
  dayLabel: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    textTransform: "capitalize",
  },
  dayLabelActive: { color: colors.primary[100] },
  dayNum: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    marginTop: 2,
  },
  dayNumActive: { color: colors.white },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary[500],
    marginTop: 2,
  },
  scheduleCard: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  timeColumn: {
    alignItems: "center",
    width: 50,
  },
  startTime: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary[600],
  },
  timeLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.primary[200],
    marginVertical: spacing.xs,
  },
  endTime: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
  },
  cardContent: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary[500],
  },
  subjectName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  teacherName: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  badgesRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  empty: {
    alignItems: "center",
    paddingTop: 80,
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
    marginTop: spacing.sm,
  },
});
