import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  type ViewStyle,
  type TextStyle,
} from "react-native";
import { colors, radius } from "@/utils/theme";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "accent" | "orange" | "danger";
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: "sm" | "md" | "lg";
}

const variantStyles: Record<string, { bg: string; text: string; border?: string }> = {
  primary: { bg: colors.primary[500], text: colors.white },
  secondary: { bg: "transparent", text: colors.primary[600], border: colors.primary[500] },
  accent: { bg: colors.accent[500], text: colors.white },
  orange: { bg: colors.orange[500], text: colors.white },
  danger: { bg: colors.red[500], text: colors.white },
};

const sizeStyles: Record<string, { py: number; px: number; fontSize: number }> = {
  sm: { py: 8, px: 14, fontSize: 13 },
  md: { py: 12, px: 20, fontSize: 14 },
  lg: { py: 16, px: 24, fontSize: 15 },
};

export default function Button({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  size = "md",
}: ButtonProps) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.button,
        {
          backgroundColor: v.bg,
          borderColor: v.border || "transparent",
          borderWidth: v.border ? 2 : 0,
          paddingVertical: s.py,
          paddingHorizontal: s.px,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              { color: v.text, fontSize: s.fontSize },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.lg,
    gap: 8,
  },
  text: {
    fontWeight: "600",
  },
});
