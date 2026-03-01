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
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { notificationsAPI } from "@/api/services";
import Toast from "react-native-toast-message";
import { colors, spacing, radius, fontSize, fontWeight } from "@/utils/theme";
import { formatRelativeTime } from "@/utils/helpers";
import type { AppNotification } from "@/types";

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  booking: "calendar",
  chat: "chatbubble",
  payment: "card",
  system: "information-circle",
  review: "star",
};

const COLOR_MAP: Record<string, string> = {
  booking: colors.blue[500],
  chat: colors.primary[500],
  payment: colors.accent[500],
  system: colors.gray[500],
  review: colors.accent[600],
};

export default function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await notificationsAPI.list();
      setNotifications(res.results);
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

  const handlePress = async (notif: AppNotification) => {
    if (!notif.is_read) {
      await notificationsAPI.markAsRead(notif.id).catch(() => {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
    }

    // Navigate based on type
    if (notif.type === "booking" && notif.data?.booking_id) {
      navigation.navigate("Cours");
    } else if (notif.type === "chat" && notif.data?.conversation_id) {
      navigation.navigate("ChatRoom", {
        conversationId: notif.data.conversation_id,
        name: String(notif.data.name || "Chat"),
      });
    } else if (notif.type === "payment") {
      navigation.navigate("Payment");
    }
  };

  const markAllRead = async () => {
    await notificationsAPI.markAllAsRead().catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {notifications.some((n) => !n.is_read) && (
        <TouchableOpacity style={styles.markAllBtn} onPress={markAllRead}>
          <Ionicons name="checkmark-done" size={16} color={colors.primary[600]} />
          <Text style={styles.markAllText}>Tout marquer comme lu</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.item, !item.is_read && styles.unread]}
            onPress={() => handlePress(item)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: (COLOR_MAP[item.type] || colors.gray[500]) + "15" },
              ]}
            >
              <Ionicons
                name={ICON_MAP[item.type] || "notifications"}
                size={20}
                color={COLOR_MAP[item.type] || colors.gray[500]}
              />
            </View>
            <View style={styles.content}>
              <Text style={styles.title} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.message} numberOfLines={2}>
                {item.message}
              </Text>
              <Text style={styles.time}>{formatRelativeTime(item.created_at)}</Text>
            </View>
            {!item.is_read && <View style={styles.dot} />}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={60} color={colors.gray[300]} />
            <Text style={styles.emptyTitle}>Aucune notification</Text>
            <Text style={styles.emptySubtitle}>
              Vous serez notifié des réservations, messages et paiements
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
  markAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  markAllText: {
    fontSize: fontSize.sm,
    color: colors.primary[600],
    fontWeight: fontWeight.medium,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    backgroundColor: colors.white,
  },
  unread: { backgroundColor: colors.primary[50] },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { flex: 1 },
  title: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
  },
  message: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginTop: 2,
    lineHeight: 18,
  },
  time: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    marginTop: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary[500],
  },
  empty: {
    alignItems: "center",
    paddingTop: 80,
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
});
