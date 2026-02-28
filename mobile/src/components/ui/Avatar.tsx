import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { colors, radius } from "@/utils/theme";
import { getInitials } from "@/utils/helpers";

interface AvatarProps {
  src: string | null;
  firstName: string;
  lastName: string;
  size?: number;
}

export default function Avatar({
  src,
  firstName,
  lastName,
  size = 40,
}: AvatarProps) {
  if (src) {
    return (
      <Image
        source={{ uri: src }}
        style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
        contentFit="cover"
        transition={200}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.35 }]}>
        {getInitials(firstName, lastName)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.gray[100],
  },
  fallback: {
    backgroundColor: colors.primary[100],
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    fontWeight: "700",
    color: colors.primary[700],
  },
});
