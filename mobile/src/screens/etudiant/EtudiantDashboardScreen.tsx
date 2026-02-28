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
import { bookingsAPI } from "@/api/services";
import { colors, spacing, radius, fontSize, fontWeight } from "@/utils/theme";
import { formatPrice, formatDate, formatTime } from "@/utils/helpers";
import type { Booking } from "@/types";

export default function EtudiantDashboardScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await bookingsAPI.list();
      setBookings(data.results);
    } catch {
      // silently fail
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

  const upcomingBookings = bookings.filter(
    (b) => b.status === "pending" || b.status === "confirmed"
  );

  const quickActions = [
    {
      label: "Trouver un prof",
      icon: "search-outline" as const,
      color: colors.primary[600],
      bg: colors.primary[50],
      onPress: () => navigation.navigate("Recherche"),
    },
    {
      label: "Mes cours",
      icon: "calendar-outline" as const,
      color: colors.blue[500],
      bg: colors.blue[100],
      onPress: () => navigation.navigate("Cours"),
    },
    {
      label: "Messages",
      icon: "chatbubbles-outline" as const,
      color: colors.accent[600],
      bg: colors.accent[50],
      onPress: () => navigation.navigate("Chat"),
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.greeting}>
          Bonjour, {user?.first_name} !
        </Text>
        <Text style={styles.subtitle}>Bienvenue sur KalanConnect</Text>
      </View>

      {/* Quick actions */}
      <View style={styles.actionsRow}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.label}
            style={styles.actionCard}
            onPress={action.onPress}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: action.bg }]}>
              <Ionicons name={action.icon} size={24} color={action.color} />
            </View>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Upcoming courses */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Prochains cours</Text>
        {upcomingBookings.length > 0 ? (
          upcomingBookings.slice(0, 5).map((booking) => (
            <TouchableOpacity
              key={booking.id}
              style={styles.bookingCard}
              activeOpacity={0.7}
            >
              <View style={styles.bookingLeft}>
                <View style={styles.dateBox}>
                  <Text style={styles.dateBoxDay}>
                    {new Date(booking.date).toLocaleDateString("fr-FR", { weekday: "short" })}
                  </Text>
                  <Text style={styles.dateBoxNum}>
                    {new Date(booking.date).getDate()}
                  </Text>
                </View>
              </View>
              <View style={styles.bookingRight}>
                <Text style={styles.bookingSubject}>{booking.subject_name}</Text>
                <Text style={styles.bookingTeacher}>avec {booking.teacher_name}</Text>
                <View style={styles.bookingMeta}>
                  <Ionicons name="time-outline" size={12} color={colors.gray[400]} />
                  <Text style={styles.bookingTime}>
                    {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          booking.status === "confirmed"
                            ? colors.primary[50]
                            : colors.accent[50],
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color:
                            booking.status === "confirmed"
                              ? colors.primary[700]
                              : colors.accent[700],
                        },
                      ]}
                    >
                      {booking.status === "confirmed" ? "Confirmé" : "En attente"}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={40} color={colors.gray[300]} />
            <Text style={styles.emptyText}>Aucun cours à venir</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate("Recherche")}
            >
              <Text style={styles.emptyButtonText}>Trouver un professeur</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  center: { alignItems: "center", justifyContent: "center" },
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  greeting: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.sm,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.gray[700],
    textAlign: "center",
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.gray[400],
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  bookingCard: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  bookingLeft: {},
  dateBox: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary[50],
    alignItems: "center",
    justifyContent: "center",
  },
  dateBoxDay: {
    fontSize: 10,
    fontWeight: fontWeight.medium,
    color: colors.primary[600],
    textTransform: "capitalize",
  },
  dateBoxNum: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary[700],
  },
  bookingRight: { flex: 1 },
  bookingSubject: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
  },
  bookingTeacher: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    marginTop: 1,
  },
  bookingMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  bookingTime: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  statusText: {
    fontSize: 10,
    fontWeight: fontWeight.semibold,
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing["2xl"],
    alignItems: "center",
    gap: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
  },
  emptyButton: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
  },
  emptyButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary[700],
  },
});
