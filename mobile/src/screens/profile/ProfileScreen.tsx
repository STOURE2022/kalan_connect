import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { paymentsAPI } from "@/api/services";
import { colors, spacing, radius, fontSize, fontWeight } from "@/utils/theme";
import type { Subscription } from "@/types";

const ROLE_LABELS: Record<string, string> = {
  parent: "Parent",
  teacher: "Professeur",
  admin: "Administrateur",
  student: "Élève",
};

const ROLE_COLORS: Record<string, "green" | "blue" | "yellow" | "gray"> = {
  parent: "blue",
  teacher: "green",
  admin: "gray",
  student: "yellow",
};

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, isLoggedIn, isParent, isTeacher, isAdmin, isStudent, hasSubscription, logout } = useAuth();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadSubscription = useCallback(async () => {
    if (!isLoggedIn || !isParent) return;
    try {
      const subs = await paymentsAPI.getSubscriptions();
      const active = subs.results.find((s) => s.status === "active");
      setSubscription(active || null);
    } catch {}
  }, [isLoggedIn, isParent]);

  useFocusEffect(
    useCallback(() => {
      loadSubscription();
    }, [loadSubscription])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSubscription();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert("Déconnexion", "Voulez-vous vraiment vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Se déconnecter",
        style: "destructive",
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  // ── Not logged in ──
  if (!isLoggedIn) {
    return (
      <View style={[styles.container, styles.center]}>
        <Ionicons name="person-circle-outline" size={80} color={colors.gray[300]} />
        <Text style={styles.guestTitle}>Bienvenue sur KalanConnect</Text>
        <Text style={styles.guestSubtitle}>
          Connectez-vous pour accéder à votre profil et gérer vos cours
        </Text>
        <Button
          title="Se connecter"
          onPress={() => navigation.navigate("Login")}
          size="lg"
          style={{ width: "100%", marginTop: spacing.xl }}
        />
        <Button
          title="Créer un compte"
          onPress={() => navigation.navigate("Register")}
          variant="secondary"
          size="md"
          style={{ width: "100%", marginTop: spacing.sm }}
        />
      </View>
    );
  }

  // ── Build menu items per role ──
  const menuItems: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    subtitle?: string;
    onPress: () => void;
    color?: string;
  }[] = [
    {
      icon: "person-outline",
      label: "Modifier le profil",
      subtitle: "Nom, photo, ville",
      onPress: () => navigation.navigate("EditProfile"),
    },
  ];

  // Teacher-specific items
  if (isTeacher) {
    menuItems.push(
      {
        icon: "create-outline",
        label: "Profil professeur",
        subtitle: "Bio, tarifs, matières",
        onPress: () => navigation.navigate("EditTeacherProfile"),
        color: colors.primary[600],
      },
      {
        icon: "time-outline",
        label: "Disponibilités",
        subtitle: "Gérer vos créneaux",
        onPress: () => navigation.navigate("ManageAvailability"),
      }
    );
  }

  // Parent-specific items
  if (isParent) {
    menuItems.push({
      icon: "people-outline",
      label: "Mes enfants",
      subtitle: "Gérer les profils enfants",
      onPress: () => navigation.navigate("AddChild"),
    });

    if (!hasSubscription) {
      menuItems.push({
        icon: "card-outline",
        label: "S'abonner",
        subtitle: "Accédez à tous les professeurs",
        onPress: () => navigation.navigate("Payment"),
        color: colors.primary[600],
      });
    }
  }

  // Student item
  if (isStudent) {
    menuItems.push({
      icon: "bar-chart-outline",
      label: "Ma progression",
      subtitle: "Suivre mes résultats",
      onPress: () => navigation.navigate("Main", { screen: "Progression" }),
    });
  }

  // Common items
  menuItems.push(
    {
      icon: "notifications-outline",
      label: "Notifications",
      subtitle: "Gérer les alertes",
      onPress: () => navigation.navigate("Notifications"),
    },
    {
      icon: "shield-checkmark-outline",
      label: "Confidentialité",
      subtitle: "Données et sécurité",
      onPress: () => navigation.navigate("Privacy"),
    },
    {
      icon: "help-circle-outline",
      label: "Aide & Support",
      subtitle: "FAQ, nous contacter",
      onPress: () => navigation.navigate("Help"),
    }
  );

  const roleLabel = ROLE_LABELS[user?.role || "parent"] || user?.role || "parent";
  const roleColor = ROLE_COLORS[user?.role || "parent"] || ("blue" as const);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBg} />
        <View style={styles.profileSection}>
          <Avatar
            src={user?.avatar || null}
            firstName={user?.first_name || ""}
            lastName={user?.last_name || ""}
            size={80}
          />
          <Text style={styles.userName}>
            {user?.first_name} {user?.last_name}
          </Text>
          <View style={styles.roleRow}>
            <Badge label={roleLabel} variant={roleColor} />
            {user?.is_phone_verified && (
              <Badge
                label="Vérifié"
                variant="green"
                icon={
                  <Ionicons
                    name="checkmark-circle"
                    size={12}
                    color={colors.primary[700]}
                  />
                }
              />
            )}
          </View>
          <Text style={styles.userInfo}>
            <Ionicons name="call-outline" size={12} color={colors.gray[400]} />{" "}
            {user?.phone}
          </Text>
          {user?.city && (
            <Text style={styles.userInfo}>
              <Ionicons name="location-outline" size={12} color={colors.gray[400]} />{" "}
              {user.neighborhood ? `${user.neighborhood}, ` : ""}
              {user.city}
            </Text>
          )}
        </View>
      </View>

      {/* Subscription card (parents only) */}
      {isParent && (
        <View style={styles.section}>
          <View
            style={[
              styles.subscriptionCard,
              hasSubscription ? styles.subActive : styles.subInactive,
            ]}
          >
            <View style={styles.subHeader}>
              <Ionicons
                name={hasSubscription ? "checkmark-circle" : "alert-circle"}
                size={22}
                color={hasSubscription ? colors.primary[600] : colors.accent[600]}
              />
              <Text
                style={[
                  styles.subTitle,
                  { color: hasSubscription ? colors.primary[700] : colors.accent[600] },
                ]}
              >
                {hasSubscription ? "Abonnement actif" : "Aucun abonnement"}
              </Text>
            </View>
            {hasSubscription && subscription ? (
              <View style={styles.subDetails}>
                <Text style={styles.subDetailText}>
                  Plan: {subscription.plan === "monthly" ? "Mensuel" : "Annuel"}
                </Text>
                {subscription.end_date && (
                  <Text style={styles.subDetailText}>
                    Expire le:{" "}
                    {new Date(subscription.end_date).toLocaleDateString("fr-FR")}
                  </Text>
                )}
              </View>
            ) : (
              <Button
                title="S'abonner maintenant"
                onPress={() => navigation.navigate("Payment")}
                size="sm"
                style={{ marginTop: spacing.sm }}
              />
            )}
          </View>
        </View>
      )}

      {/* Menu */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Paramètres</Text>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.label}
            onPress={item.onPress}
            activeOpacity={0.6}
            style={styles.menuItem}
          >
            <View
              style={[
                styles.menuIcon,
                item.color
                  ? { backgroundColor: colors.primary[50] }
                  : { backgroundColor: colors.gray[100] },
              ]}
            >
              <Ionicons
                name={item.icon}
                size={20}
                color={item.color || colors.gray[600]}
              />
            </View>
            <View style={styles.menuContent}>
              <Text
                style={[styles.menuLabel, item.color && { color: item.color }]}
              >
                {item.label}
              </Text>
              {item.subtitle && (
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.gray[300]} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout */}
      <View style={styles.section}>
        <TouchableOpacity
          onPress={handleLogout}
          activeOpacity={0.6}
          style={styles.logoutBtn}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.red[500]} />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </View>

      {/* App version */}
      <Text style={styles.version}>KalanConnect v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing["2xl"],
  },

  // Guest
  guestTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    marginTop: spacing.xl,
  },
  guestSubtitle: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    textAlign: "center",
    marginTop: spacing.sm,
    lineHeight: 20,
  },

  // Header
  header: { marginBottom: spacing.md },
  headerBg: {
    height: 100,
    backgroundColor: colors.primary[500],
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  profileSection: {
    alignItems: "center",
    marginTop: -40,
  },
  userName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    marginTop: spacing.sm,
  },
  roleRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  userInfo: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginTop: 4,
  },

  // Subscription card
  section: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  subscriptionCard: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
  },
  subActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[200],
  },
  subInactive: {
    backgroundColor: colors.accent[50],
    borderColor: colors.accent[200],
  },
  subHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  subTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  subDetails: { marginTop: spacing.sm },
  subDetailText: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    marginTop: 2,
  },

  // Menu
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.gray[400],
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  menuContent: { flex: 1 },
  menuLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.gray[900],
  },
  menuSubtitle: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    marginTop: 1,
  },

  // Logout
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.red[100],
  },
  logoutText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.red[500],
  },

  // Version
  version: {
    fontSize: fontSize.xs,
    color: colors.gray[300],
    textAlign: "center",
    paddingVertical: spacing.xl,
  },
});
