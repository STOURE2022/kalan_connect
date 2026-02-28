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
import { Ionicons } from "@expo/vector-icons";
import Avatar from "@/components/ui/Avatar";
import { teachersAPI, chatAPI } from "@/api/services";
import { colors, spacing, radius, fontSize, fontWeight } from "@/utils/theme";
import { formatRelativeTime } from "@/utils/helpers";
import type { User } from "@/types";
import Toast from "react-native-toast-message";

interface StudentItem {
  student: User;
  total_sessions: number;
  last_session: string;
}

export default function MyStudentsScreen() {
  const navigation = useNavigation<any>();
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await teachersAPI.getMyStudents();
      setStudents(res.results);
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

  const startChat = async (studentId: number, name: string) => {
    try {
      const conversation = await chatAPI.startConversation(studentId);
      navigation.navigate("ChatRoom", {
        conversationId: conversation.id,
        name,
      });
    } catch {
      Toast.show({ type: "error", text1: "Erreur de connexion" });
    }
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
      <Text style={styles.totalCount}>{students.length} élève(s)</Text>

      <FlatList
        data={students}
        keyExtractor={(item) => String(item.student.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Avatar
              src={item.student.avatar}
              firstName={item.student.first_name}
              lastName={item.student.last_name}
              size={52}
            />
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>
                {item.student.first_name} {item.student.last_name}
              </Text>
              <Text style={styles.cardSessions}>
                {item.total_sessions} cours effectués
              </Text>
              <Text style={styles.cardDate}>
                Dernier cours: {formatRelativeTime(item.last_session)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.chatBtn}
              onPress={() =>
                startChat(
                  item.student.id,
                  `${item.student.first_name} ${item.student.last_name}`
                )
              }
            >
              <Ionicons name="chatbubble-outline" size={20} color={colors.primary[600]} />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={60} color={colors.gray[300]} />
            <Text style={styles.emptyTitle}>Aucun élève pour le moment</Text>
            <Text style={styles.emptySubtitle}>
              Vos élèves apparaîtront ici après leur premier cours
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
  totalCount: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    padding: spacing.lg,
    fontWeight: fontWeight.medium,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  cardInfo: { flex: 1 },
  cardName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
  },
  cardSessions: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    marginTop: 2,
  },
  cardDate: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    marginTop: 2,
  },
  chatBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[50],
    alignItems: "center",
    justifyContent: "center",
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
