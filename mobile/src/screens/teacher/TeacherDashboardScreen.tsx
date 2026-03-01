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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { teachersAPI, bookingsAPI } from "@/api/services";
import { colors, spacing, radius, fontSize, fontWeight } from "@/utils/theme";
import { formatPrice, formatDate, formatTime } from "@/utils/helpers";
import Toast from "react-native-toast-message";
import Badge from "@/components/ui/Badge";
import type { TeacherStats, Booking } from "@/types";

export default function TeacherDashboardScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [statsData, bookingsData] = await Promise.all([
        teachersAPI.getMyStats(),
        bookingsAPI.list(),
      ]);
      setStats(statsData);
      // Filter upcoming (confirmed and pending)
      setUpcomingBookings(
        bookingsData.results
          .filter((b) => b.status === "confirmed" || b.status === "pending")
          .slice(0, 5)
      );
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

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Welcome */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.greeting}>Bonjour,</Text>
        <Text style={styles.userName}>{user?.first_name} 👋</Text>
      </View>

      {/* Earnings card */}
      <View style={styles.earningsCard}>
        <View>
          <Text style={styles.earningsLabel}>Revenus ce mois</Text>
          <Text style={styles.earningsAmount}>
            {formatPrice(stats?.this_month_earnings || 0)}
          </Text>
        </View>
        <View style={styles.earningsRight}>
          <Text style={styles.earningsSessions}>
            {stats?.this_month_bookings || 0} cours
          </Text>
          <Text style={styles.earningsTotal}>
            Total: {formatPrice(stats?.total_earnings || 0)}
          </Text>
        </View>
      </View>

      {/* Quick stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Ionicons name="people" size={24} color={colors.blue[500]} />
          <Text style={styles.statValue}>{stats?.total_students || 0}</Text>
          <Text style={styles.statLabel}>Élèves</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="calendar" size={24} color={colors.primary[500]} />
          <Text style={styles.statValue}>{stats?.completed_sessions || 0}</Text>
          <Text style={styles.statLabel}>Cours donnés</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="star" size={24} color={colors.accent[500]} />
          <Text style={styles.statValue}>
            {stats?.avg_rating?.toFixed(1) || "—"}
          </Text>
          <Text style={styles.statLabel}>{stats?.total_reviews || 0} avis</Text>
        </View>
      </View>

      {/* Quick actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate("EditTeacherProfile")}
          >
            <Ionicons name="create-outline" size={28} color={colors.primary[600]} />
            <Text style={styles.actionText}>Modifier profil</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate("ManageAvailability")}
          >
            <Ionicons name="time-outline" size={28} color={colors.accent[600]} />
            <Text style={styles.actionText}>Disponibilités</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate("Élèves")}
          >
            <Ionicons name="people-outline" size={28} color={colors.blue[500]} />
            <Text style={styles.actionText}>Mes élèves</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Upcoming sessions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Prochains cours</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Cours")}>
            <Text style={styles.seeAll}>Voir tout</Text>
          </TouchableOpacity>
        </View>

        {upcomingBookings.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={40} color={colors.gray[300]} />
            <Text style={styles.emptyText}>Aucun cours prévu</Text>
          </View>
        ) : (
          upcomingBookings.map((booking) => (
            <View key={booking.id} style={styles.bookingCard}>
              <View style={styles.bookingDate}>
                <Text style={styles.bookingDay}>
                  {new Date(booking.date).toLocaleDateString("fr-FR", { weekday: "short" })}
                </Text>
                <Text style={styles.bookingDayNum}>
                  {new Date(booking.date).getDate()}
                </Text>
              </View>
              <View style={styles.bookingInfo}>
                <Text style={styles.bookingSubject}>{booking.subject_name}</Text>
                <Text style={styles.bookingTime}>
                  {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                </Text>
                <Text style={styles.bookingParent}>
                  {booking.parent.first_name} {booking.parent.last_name}
                </Text>
              </View>
              <Badge
                label={booking.status === "pending" ? "En attente" : "Confirmé"}
                variant={booking.status === "pending" ? "yellow" : "green"}
              />
            </View>
          ))
        )}
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
  earningsCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: spacing.lg,
    padding: spacing.xl,
    backgroundColor: colors.primary[600],
    borderRadius: radius.xl,
    marginBottom: spacing.lg,
  },
  earningsLabel: {
    fontSize: fontSize.sm,
    color: colors.primary[100],
  },
  earningsAmount: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginTop: 2,
  },
  earningsRight: {
    alignItems: "flex-end",
  },
  earningsSessions: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  earningsTotal: {
    fontSize: fontSize.xs,
    color: colors.primary[200],
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statItem: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: "center",
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    marginTop: spacing.xs,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    marginTop: 2,
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
  },
  bookingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
  },
  bookingDate: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary[50],
    alignItems: "center",
    justifyContent: "center",
  },
  bookingDay: {
    fontSize: fontSize.xs,
    color: colors.primary[600],
    fontWeight: fontWeight.medium,
    textTransform: "capitalize",
  },
  bookingDayNum: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
  },
  bookingInfo: { flex: 1 },
  bookingSubject: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
  },
  bookingTime: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  bookingParent: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    marginTop: 1,
  },
});
