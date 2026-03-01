import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import { adminAPI } from "@/api/services";
import { colors, spacing, radius, fontSize, fontWeight } from "@/utils/theme";
import { formatDate } from "@/utils/helpers";
import Toast from "react-native-toast-message";
import type { AdminUserListItem } from "@/types";

const ROLE_FILTERS = [
  { key: "", label: "Tous" },
  { key: "parent", label: "Parents" },
  { key: "teacher", label: "Professeurs" },
  { key: "student", label: "Élèves" },
  { key: "admin", label: "Admins" },
];

const ROLE_BADGE: Record<string, { label: string; variant: "green" | "blue" | "yellow" | "gray" }> = {
  parent: { label: "Parent", variant: "blue" },
  teacher: { label: "Prof", variant: "green" },
  student: { label: "Élève", variant: "yellow" },
  admin: { label: "Admin", variant: "gray" },
};

export default function UserManagementScreen() {
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    try {
      const res = await adminAPI.getUsers({
        role: roleFilter || undefined,
        q: search || undefined,
      });
      setUsers(res.results);
      setTotal(res.count);
    } catch {
      Toast.show({ type: "error", text1: "Erreur de chargement" });
    } finally {
      setLoading(false);
    }
  }, [roleFilter, search]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const toggleActive = async (user: AdminUserListItem) => {
    Alert.alert(
      user.is_active ? "Désactiver le compte" : "Activer le compte",
      `${user.first_name} ${user.last_name} — ${user.phone}`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: user.is_active ? "Désactiver" : "Activer",
          style: user.is_active ? "destructive" : "default",
          onPress: async () => {
            try {
              await adminAPI.toggleUserActive(user.id);
              setUsers((prev) =>
                prev.map((u) =>
                  u.id === user.id ? { ...u, is_active: !u.is_active } : u
                )
              );
            } catch {
              Toast.show({ type: "error", text1: "Erreur lors de la modification" });
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.gray[400]} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher par nom ou téléphone..."
          placeholderTextColor={colors.gray[400]}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => {
            setLoading(true);
            load();
          }}
          returnKeyType="search"
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color={colors.gray[400]} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Role filters */}
      <View style={styles.filters}>
        {ROLE_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, roleFilter === f.key && styles.filterChipActive]}
            onPress={() => setRoleFilter(f.key)}
          >
            <Text
              style={[
                styles.filterChipText,
                roleFilter === f.key && styles.filterChipTextActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.totalCount}>{total} utilisateur(s)</Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => {
            const roleInfo = ROLE_BADGE[item.role] || { label: item.role, variant: "gray" as const };
            return (
              <View style={[styles.userCard, !item.is_active && styles.userInactive]}>
                <Avatar
                  src={null}
                  firstName={item.first_name}
                  lastName={item.last_name}
                  size={48}
                />
                <View style={styles.userInfo}>
                  <View style={styles.userNameRow}>
                    <Text style={styles.userName} numberOfLines={1}>
                      {item.first_name} {item.last_name}
                    </Text>
                    <Badge label={roleInfo.label} variant={roleInfo.variant} />
                  </View>
                  <Text style={styles.userPhone}>{item.phone}</Text>
                  <Text style={styles.userDate}>
                    Inscrit le {formatDate(item.created_at)}
                  </Text>
                  <View style={styles.userFlags}>
                    {item.is_phone_verified && (
                      <Ionicons name="checkmark-circle" size={14} color={colors.primary[500]} />
                    )}
                    {item.has_active_subscription && (
                      <Ionicons name="card" size={14} color={colors.accent[500]} />
                    )}
                    {!item.is_active && (
                      <Text style={styles.inactiveLabel}>Désactivé</Text>
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => toggleActive(item)}
                >
                  <Ionicons
                    name={item.is_active ? "ban" : "checkmark-circle"}
                    size={20}
                    color={item.is_active ? colors.red[500] : colors.primary[500]}
                  />
                </TouchableOpacity>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={50} color={colors.gray[300]} />
              <Text style={styles.emptyText}>Aucun utilisateur trouvé</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    margin: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.gray[900],
  },
  filters: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  filterChipActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  filterChipText: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    fontWeight: fontWeight.medium,
  },
  filterChipTextActive: {
    color: colors.white,
  },
  totalCount: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  userInactive: {
    opacity: 0.6,
  },
  userInfo: { flex: 1 },
  userNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  userName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
    flex: 1,
  },
  userPhone: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginTop: 2,
  },
  userDate: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    marginTop: 2,
  },
  userFlags: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  inactiveLabel: {
    fontSize: fontSize.xs,
    color: colors.red[500],
    fontWeight: fontWeight.medium,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray[100],
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    alignItems: "center",
    paddingTop: 80,
  },
  emptyText: {
    fontSize: fontSize.base,
    color: colors.gray[400],
    marginTop: spacing.md,
  },
});
