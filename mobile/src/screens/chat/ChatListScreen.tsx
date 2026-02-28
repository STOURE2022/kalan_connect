import React, { useCallback, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { chatAPI } from "@/api/services";
import { useAuth } from "@/contexts/AuthContext";
import Avatar from "@/components/ui/Avatar";
import { colors, spacing, radius, fontSize } from "@/utils/theme";
import { formatRelativeTime } from "@/utils/helpers";
import type { Conversation } from "@/types";

export default function ChatListScreen() {
  const navigation = useNavigation<any>();
  const { isLoggedIn } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    try {
      const data = await chatAPI.getConversations();
      setConversations(data.results);
    } catch {}
    setLoading(false);
  }, [isLoggedIn]);

  useFocusEffect(useCallback(() => { fetch(); }, [fetch]));

  if (!isLoggedIn) {
    return (
      <View style={styles.empty}>
        <Ionicons name="chatbubbles-outline" size={48} color={colors.gray[200]} />
        <Text style={styles.emptyTitle}>Connectez-vous</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Login")} style={styles.loginBtn}>
          <Text style={styles.loginBtnText}>Se connecter</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Messages</Text>
      <FlatList
        data={conversations}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetch} tintColor={colors.primary[500]} />}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate("ChatRoom", {
              conversationId: item.id,
              name: `${item.other_participant.first_name} ${item.other_participant.last_name}`,
            })}
            style={[styles.convItem, item.unread_count > 0 && styles.convItemUnread]}
            activeOpacity={0.7}
          >
            <Avatar
              src={item.other_participant.avatar}
              firstName={item.other_participant.first_name}
              lastName={item.other_participant.last_name}
              size={50}
            />
            <View style={styles.convInfo}>
              <View style={styles.convHeader}>
                <Text style={[styles.convName, item.unread_count > 0 && { fontWeight: "800" }]} numberOfLines={1}>
                  {item.other_participant.first_name} {item.other_participant.last_name}
                </Text>
                <Text style={styles.convTime}>
                  {item.last_message ? formatRelativeTime(item.last_message.created_at) : ""}
                </Text>
              </View>
              <View style={styles.convFooter}>
                <Text style={[styles.convMessage, item.unread_count > 0 && { color: colors.gray[800], fontWeight: "600" }]} numberOfLines={1}>
                  {item.last_message?.content || "Nouvelle conversation"}
                </Text>
                {item.unread_count > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.unread_count}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={48} color={colors.gray[200]} />
              <Text style={styles.emptyTitle}>Aucune conversation</Text>
              <Text style={styles.emptyDesc}>Trouvez un professeur et envoyez-lui un message</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  title: { fontSize: fontSize.xl, fontWeight: "800", color: colors.gray[900], paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.md },
  convItem: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  convItemUnread: { backgroundColor: "rgba(236, 253, 245, 0.7)" },
  convInfo: { flex: 1 },
  convHeader: { flexDirection: "row", justifyContent: "space-between" },
  convName: { fontSize: 14, fontWeight: "600", color: colors.gray[900], flex: 1 },
  convTime: { fontSize: 11, color: colors.gray[400] },
  convFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 2 },
  convMessage: { fontSize: 13, color: colors.gray[500], flex: 1 },
  badge: { backgroundColor: colors.primary[500], borderRadius: 10, minWidth: 20, height: 20, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
  badgeText: { fontSize: 11, fontWeight: "800", color: colors.white },
  empty: { alignItems: "center", paddingTop: 100 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: colors.gray[600], marginTop: 16 },
  emptyDesc: { fontSize: 13, color: colors.gray[400], marginTop: 4 },
  loginBtn: { marginTop: 16, backgroundColor: colors.primary[500], paddingHorizontal: 24, paddingVertical: 12, borderRadius: radius.lg },
  loginBtnText: { color: colors.white, fontWeight: "700", fontSize: 14 },
});
