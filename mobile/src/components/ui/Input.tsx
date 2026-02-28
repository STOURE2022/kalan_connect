import React from "react";
import { View, TextInput, Text, StyleSheet, type TextInputProps } from "react-native";
import { colors, radius } from "@/utils/theme";

interface InputProps extends TextInputProps {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
}

export default function Input({ label, icon, error, style, ...props }: InputProps) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputRow, error && styles.inputError]}>
        {icon && <View style={styles.iconBox}>{icon}</View>}
        <TextInput
          placeholderTextColor={colors.gray[400]}
          style={[styles.input, icon && { paddingLeft: 0 }, style]}
          {...props}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.gray[600],
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: radius.lg,
    paddingHorizontal: 14,
  },
  inputError: {
    borderColor: colors.red[500],
  },
  iconBox: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.gray[900],
  },
  errorText: {
    fontSize: 11,
    color: colors.red[500],
    marginTop: 4,
  },
});
