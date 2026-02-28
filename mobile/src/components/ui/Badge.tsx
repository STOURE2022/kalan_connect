import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, radius } from "@/utils/theme";

interface BadgeProps {
  label: string;
  variant?: "green" | "yellow" | "red" | "gray" | "blue";
  icon?: React.ReactNode;
}

const variants = {
  green: { bg: colors.primary[100], text: colors.primary[700] },
  yellow: { bg: colors.accent[100], text: colors.accent[600] },
  red: { bg: colors.red[100], text: colors.red[500] },
  gray: { bg: colors.gray[100], text: colors.gray[600] },
  blue: { bg: colors.blue[100], text: colors.blue[500] },
};

export default function Badge({ label, variant = "green", icon }: BadgeProps) {
  const v = variants[variant];
  return (
    <View style={[styles.badge, { backgroundColor: v.bg }]}>
      {icon}
      <Text style={[styles.text, { color: v.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    gap: 3,
  },
  text: {
    fontSize: 11,
    fontWeight: "600",
  },
});
