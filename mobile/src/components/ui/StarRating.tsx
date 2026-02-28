import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/utils/theme";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  showValue?: boolean;
  reviewCount?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export default function StarRating({
  rating,
  maxRating = 5,
  size = 16,
  showValue = true,
  reviewCount,
  interactive = false,
  onChange,
}: StarRatingProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: maxRating }).map((_, i) => {
        const filled = i < Math.round(rating);
        const StarWrapper = interactive ? TouchableOpacity : View;
        return (
          <StarWrapper
            key={i}
            onPress={() => interactive && onChange?.(i + 1)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={filled ? "star" : "star-outline"}
              size={size}
              color={filled ? colors.accent[400] : colors.gray[200]}
            />
          </StarWrapper>
        );
      })}
      {showValue && (
        <Text style={[styles.value, { fontSize: size * 0.85 }]}>
          {rating.toFixed(1)}
        </Text>
      )}
      {reviewCount !== undefined && (
        <Text style={[styles.count, { fontSize: size * 0.75 }]}>
          ({reviewCount} avis)
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  value: {
    fontWeight: "700",
    color: colors.gray[700],
    marginLeft: 4,
  },
  count: {
    color: colors.gray[400],
    marginLeft: 2,
  },
});
