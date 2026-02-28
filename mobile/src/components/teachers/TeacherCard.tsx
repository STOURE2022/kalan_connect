import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Avatar from "@/components/ui/Avatar";
import StarRating from "@/components/ui/StarRating";
import Badge from "@/components/ui/Badge";
import { colors, radius, spacing } from "@/utils/theme";
import { formatPrice } from "@/utils/helpers";
import type { TeacherListItem } from "@/types";

interface TeacherCardProps {
  teacher: TeacherListItem;
  onPress: () => void;
}

export default function TeacherCard({ teacher, onPress }: TeacherCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.card}
    >
      <View style={styles.row}>
        {/* Photo */}
        <Avatar
          src={teacher.photo}
          firstName={teacher.user.first_name}
          lastName={teacher.user.last_name}
          size={64}
        />

        {/* Info */}
        <View style={styles.info}>
          {/* Name */}
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {teacher.user.first_name} {teacher.user.last_name}
            </Text>
            {teacher.is_featured && <Badge label="Top" variant="yellow" />}
          </View>

          {/* Subjects */}
          <View style={styles.subjects}>
            {teacher.subjects.slice(0, 2).map((s) => (
              <Badge key={s} label={s} variant="green" />
            ))}
          </View>

          {/* Rating */}
          <StarRating
            rating={teacher.avg_rating}
            reviewCount={teacher.total_reviews}
            size={13}
          />

          {/* Location */}
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={13} color={colors.gray[400]} />
            <Text style={styles.locationText} numberOfLines={1}>
              {teacher.neighborhood}, {teacher.city}
              {teacher.distance_km
                ? ` (${teacher.distance_km.toFixed(1)} km)`
                : ""}
            </Text>
          </View>

          {/* Footer: price + badges */}
          <View style={styles.footer}>
            <Text style={styles.price}>
              {formatPrice(teacher.hourly_rate)}
              <Text style={styles.perHour}>/h</Text>
            </Text>

            <View style={styles.badges}>
              {teacher.is_verified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons
                    name="checkmark-circle"
                    size={14}
                    color={colors.primary[500]}
                  />
                  <Text style={styles.verifiedText}>Vérifié</Text>
                </View>
              )}
              {teacher.teaches_online && (
                <Ionicons
                  name="laptop-outline"
                  size={14}
                  color={colors.blue[500]}
                />
              )}
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray[100],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.gray[900],
    flex: 1,
  },
  subjects: {
    flexDirection: "row",
    gap: 4,
    flexWrap: "wrap",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  locationText: {
    fontSize: 12,
    color: colors.gray[500],
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  price: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.gray[900],
  },
  perHour: {
    fontSize: 12,
    fontWeight: "400",
    color: colors.gray[400],
  },
  badges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.primary[600],
  },
});
