import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { adminAPI } from "@/api/services";
import Badge from "@/components/ui/Badge";
import { colors, spacing, radius, fontSize, fontWeight } from "@/utils/theme";
import { formatRelativeTime } from "@/utils/helpers";
import Toast from "react-native-toast-message";
import type { Report } from "@/types";

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  reviewed: "Examiné",
  resolved: "Résolu",
  dismissed: "Rejeté",
};

const STATUS_COLORS: Record<string, string> = {
  pending: colors.accent[600],
  reviewed: colors.blue[500],
  resolved: colors.primary[600],
  dismissed: colors.gray[500],
};

const REASON_LABELS: Record<string, string> = {
  bad_behavior: "Mauvais comportement",
  no_show: "Absence",
  inappropriate: "Contenu inapproprié",
  fraud: "Fraude",
  low_quality: "Qualité insuffisante",
  other: "Autre",
};

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>("pending");

  const load = useCallback(async () => {
    try {
      const data = await adminAPI.getReports(filter || undefined);
      setReports(data.results);
    } catch {
      Toast.show({ type: "error", text1: "Erreur de chargement" });
    } finally {
      setLoading(false);
    }
  }, [filter]);

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

  const handleAction = (report: Report, newStatus: string) => {
    const label = STATUS_LABELS[newStatus];
    Alert.alert(
      `Marquer comme "${label}" ?`,
      `Le signalement #${report.id} sera marqué comme ${label.toLowerCase()}.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Confirmer",
          onPress: async () => {
            try {
              await adminAPI.updateReport(report.id, { status: newStatus });
              Toast.show({ type: "success", text1: `Signalement ${label.toLowerCase()}` });
              load();
            } catch {
              Toast.show({ type: "error", text1: "Erreur" });
            }
          },
        },
      ]
    );
  };

  const filters = ["pending", "reviewed", "resolved", "dismissed"];

  const renderReport = ({ item }: { item: Report }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Ionicons name="flag" size={16} color={colors.red[500]} />
          <Text style={styles.reportedName}>{item.reported_user_name}</Text>
        </View>
        <Badge
          label={STATUS_LABELS[item.status] || item.status}
          variant={item.status === "resolved" ? "green" : "default"}
        />
      </View>

      <View style={styles.reasonBadge}>
        <Text style={styles.reasonText}>{REASON_LABELS[item.reason] || item.reason}</Text>
      </View>

      <Text style={styles.description} numberOfLines={3}>
        {item.description}
      </Text>

      <View style={styles.cardFooter}>
        <Text style={styles.reporterText}>
          Par {item.reporter.first_name} {item.reporter.last_name}
        </Text>
        <Text style={styles.dateText}>{formatRelativeTime(item.created_at)}</Text>
      </View>

      {/* Actions */}
      {item.status === "pending" && (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.blue[50] }]}
            onPress={() => handleAction(item, "reviewed")}
          >
            <Ionicons name="eye-outline" size={16} color={colors.blue[600]} />
            <Text style={[styles.actionBtnText, { color: colors.blue[600] }]}>Examiner</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary[50] }]}
            onPress={() => handleAction(item, "resolved")}
          >
            <Ionicons name="checkmark-outline" size={16} color={colors.primary[600]} />
            <Text style={[styles.actionBtnText, { color: colors.primary[600] }]}>Résoudre</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.gray[100] }]}
            onPress={() => handleAction(item, "dismissed")}
          >
            <Ionicons name="close-outline" size={16} color={colors.gray[600]} />
            <Text style={[styles.actionBtnText, { color: colors.gray[600] }]}>Rejeter</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {STATUS_LABELS[f]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={reports}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderReport}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 20 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle-outline" size={48} color={colors.gray[300]} />
            <Text style={styles.emptyText}>Aucun signalement</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  center: { alignItems: "center", justifyContent: "center" },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.white,
  },
  filterTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.gray[100],
  },
  filterTabActive: {
    backgroundColor: colors.primary[50],
  },
  filterText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.gray[500],
  },
  filterTextActive: {
    color: colors.primary[700],
    fontWeight: fontWeight.semibold,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  reportedName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
  },
  reasonBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.red[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
  },
  reasonText: {
    fontSize: fontSize.xs,
    color: colors.red[700],
    fontWeight: fontWeight.medium,
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reporterText: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
  },
  dateText: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  actionBtnText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing["5xl"],
    gap: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
  },
});
