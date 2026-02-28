import React, { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { bookingsAPI } from "@/api/services";
import { useAuth } from "@/contexts/AuthContext";
import Badge from "@/components/ui/Badge";
import { colors, spacing, radius, fontSize } from "@/utils/theme";
import { formatPrice, formatDate, formatTime } from "@/utils/helpers";
import type { Booking } from "@/types";

const statusConfig: Record<string, { label: string; variant: "green" | "yellow" | "red" | "gray" }> = {
  pending: { label: "En attente", variant: "yellow" },
  confirmed: { label: "Confirmé", variant: "green" },
  completed: { label: "Terminé", variant: "gray" },
  cancelled: { label: "Annulé", variant: "red" },
};

export default function BookingsScreen() {
  const navigation = useNavigation<any>();
  const { isLoggedIn } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    try {
      const data = await bookingsAPI.list();
      setBookings(data.results);
    } catch {}
    setLoading(false);
  }, [isLoggedIn]);

  useFocusEffect(useCallback(() => { fetchBookings(); }, [fetchBookings]));

  if (!isLoggedIn) {
    return (
      <View style={styles.empty}>
        <Ionicons name="calendar-outline" size={48} color={colors.gray[200]} />
        <Text style={styles.emptyTitle}>Connectez-vous</Text>
        <Text style={styles.emptyDesc}>Pour voir vos réservations</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Login")} style={styles.loginBtn}>
          <Text style={styles.loginBtnText}>Se connecter</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mes cours</Text>
      <FlatList
        data={bookings}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchBookings} tintColor={colors.primary[500]} />}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => {
          const cfg = statusConfig[item.status] || statusConfig.pending;
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardSubject}>{item.subject_name}</Text>
                <Badge label={cfg.label} variant={cfg.variant} />
              </View>
              <Text style={styles.cardTeacher}>{item.teacher_name}</Text>
              <View style={styles.cardMeta}>
                <Ionicons name="calendar-outline" size={14} color={colors.gray[400]} />
                <Text style={styles.cardMetaText}>{formatDate(item.date)}</Text>
                <Ionicons name="time-outline" size={14} color={colors.gray[400]} />
                <Text style={styles.cardMetaText}>
                  {formatTime(item.start_time)} – {formatTime(item.end_time)}
                </Text>
              </View>
              <View style={styles.cardFooter}>
                <Text style={styles.cardPrice}>{formatPrice(item.price)}</Text>
                {item.status === "pending" && (
                  <TouchableOpacity
                    onPress={async () => {
                      await bookingsAPI.action(item.id, "cancel");
                      fetchBookings();
                    }}
                    style={styles.cancelBtn}
                  >
                    <Text style={styles.cancelBtnText}>Annuler</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={48} color={colors.gray[200]} />
              <Text style={styles.emptyTitle}>Aucune réservation</Text>
              <Text style={styles.emptyDesc}>Trouvez un professeur et réservez un cours</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  title: { fontSize: fontSize.xl, fontWeight: "800", color: colors.gray[900], paddingHorizontal: spacing.xl, paddingTop: spacing.xl },
  card: { backgroundColor: colors.white, marginHorizontal: spacing.lg, marginTop: spacing.md, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.gray[100] },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardSubject: { fontSize: 15, fontWeight: "700", color: colors.gray[900] },
  cardTeacher: { fontSize: 13, color: colors.gray[500], marginTop: 2 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.sm },
  cardMetaText: { fontSize: 12, color: colors.gray[500] },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.md },
  cardPrice: { fontSize: 16, fontWeight: "800", color: colors.gray[900] },
  cancelBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.md, backgroundColor: colors.red[100] },
  cancelBtnText: { fontSize: 12, fontWeight: "600", color: colors.red[500] },
  empty: { alignItems: "center", paddingTop: 100 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: colors.gray[600], marginTop: 16 },
  emptyDesc: { fontSize: 13, color: colors.gray[400], marginTop: 4 },
  loginBtn: { marginTop: 16, backgroundColor: colors.primary[500], paddingHorizontal: 24, paddingVertical: 12, borderRadius: radius.lg },
  loginBtnText: { color: colors.white, fontWeight: "700", fontSize: 14 },
});
