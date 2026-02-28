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
import { adminAPI } from "@/api/services";
import { colors, spacing, radius, fontSize, fontWeight } from "@/utils/theme";
import { formatPrice } from "@/utils/helpers";
import Toast from "react-native-toast-message";
import type { AdminStats } from "@/types";

export default function AdminDashboardScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await adminAPI.getDashboard();
      setStats(data);
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

  const statCards = [
    {
      label: "Utilisateurs",
      value: stats?.total_users || 0,
      icon: "people" as const,
      color: colors.blue[500],
      bg: colors.blue[100],
    },
    {
      label: "Professeurs",
      value: stats?.total_teachers || 0,
      icon: "school" as const,
      color: colors.primary[600],
      bg: colors.primary[50],
    },
    {
      label: "Parents",
      value: stats?.total_parents || 0,
      icon: "people-circle" as const,
      color: colors.accent[600],
      bg: colors.accent[50],
    },
    {
      label: "Élèves",
      value: stats?.total_students || 0,
      icon: "person" as const,
      color: colors.orange[500],
      bg: colors.orange[50],
    },
    {
      label: "Réservations",
      value: stats?.total_bookings || 0,
      icon: "calendar" as const,
      color: colors.blue[500],
      bg: colors.blue[100],
    },
    {
      label: "Abonnements actifs",
      value: stats?.active_subscriptions || 0,
      icon: "card" as const,
      color: colors.primary[600],
      bg: colors.primary[50],
    },
  ];

  const quickActions = [
    {
      label: "Gestion utilisateurs",
      icon: "people-outline" as const,
      onPress: () => navigation.navigate("Utilisateurs"),
    },
    {
      label: "Vérification professeurs",
      icon: "checkmark-circle-outline" as const,
      badge: stats?.pending_verifications || 0,
      onPress: () => navigation.navigate("Vérifications"),
    },
    {
      label: "Réservations",
      icon: "calendar-outline" as const,
      onPress: () => navigation.navigate("AdminBookings"),
    },
    {
      label: "Signalements",
      icon: "flag-outline" as const,
      badge: stats?.pending_reports || 0,
      onPress: () => navigation.navigate("Reports"),
    },
    {
      label: "Notifications",
      icon: "notifications-outline" as const,
      onPress: () => navigation.navigate("Notifications"),
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Tableau de bord</Text>
        <Text style={styles.headerSubtitle}>Administration KalanConnect</Text>
      </View>

      {/* Revenue highlight */}
      <View style={styles.revenueCard}>
        <View>
          <Text style={styles.revenueLabel}>Revenu total</Text>
          <Text style={styles.revenueAmount}>
            {formatPrice(stats?.total_revenue || 0)}
          </Text>
        </View>
        <View style={styles.revenueChange}>
          <Ionicons name="trending-up" size={16} color={colors.primary[600]} />
          <Text style={styles.revenueChangeText}>
            +{stats?.new_users_this_month || 0} ce mois
          </Text>
        </View>
      </View>

      {/* Stats grid */}
      <View style={styles.statsGrid}>
        {statCards.map((card) => (
          <View key={card.label} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: card.bg }]}>
              <Ionicons name={card.icon} size={22} color={card.color} />
            </View>
            <Text style={styles.statValue}>{card.value}</Text>
            <Text style={styles.statLabel}>{card.label}</Text>
          </View>
        ))}
      </View>

      {/* Quick actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.label}
            style={styles.actionItem}
            onPress={action.onPress}
            activeOpacity={0.7}
          >
            <View style={styles.actionIcon}>
              <Ionicons name={action.icon} size={22} color={colors.primary[600]} />
            </View>
            <Text style={styles.actionLabel}>{action.label}</Text>
            {action.badge ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{action.badge}</Text>
              </View>
            ) : null}
            <Ionicons name="chevron-forward" size={18} color={colors.gray[300]} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Monthly stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ce mois-ci</Text>
        <View style={styles.monthlyCard}>
          <View style={styles.monthlyRow}>
            <Text style={styles.monthlyLabel}>Nouveaux utilisateurs</Text>
            <Text style={styles.monthlyValue}>{stats?.new_users_this_month || 0}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.monthlyRow}>
            <Text style={styles.monthlyLabel}>Réservations</Text>
            <Text style={styles.monthlyValue}>{stats?.bookings_this_month || 0}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.monthlyRow}>
            <Text style={styles.monthlyLabel}>En attente de vérification</Text>
            <Text style={[styles.monthlyValue, { color: colors.accent[600] }]}>
              {stats?.pending_verifications || 0}
            </Text>
          </View>
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
  headerTitle: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginTop: 2,
  },
  revenueCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: spacing.lg,
    padding: spacing.xl,
    backgroundColor: colors.primary[600],
    borderRadius: radius.xl,
    marginBottom: spacing.lg,
  },
  revenueLabel: {
    fontSize: fontSize.sm,
    color: colors.primary[100],
  },
  revenueAmount: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginTop: 2,
  },
  revenueChange: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  revenueChangeText: {
    fontSize: fontSize.xs,
    color: colors.white,
    fontWeight: fontWeight.medium,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    width: "48%",
    flexGrow: 1,
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: radius.lg,
    alignItems: "center",
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
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
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.gray[400],
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primary[50],
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    flex: 1,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.gray[900],
  },
  badge: {
    backgroundColor: colors.red[500],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  monthlyCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  monthlyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  monthlyLabel: {
    fontSize: fontSize.base,
    color: colors.gray[600],
  },
  monthlyValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[100],
  },
});
