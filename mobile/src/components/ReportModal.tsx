import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { reportsAPI } from "@/api/services";
import Button from "@/components/ui/Button";
import { colors, spacing, radius, fontSize, fontWeight } from "@/utils/theme";
import Toast from "react-native-toast-message";

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  reportedUserId: number;
  reportedUserName: string;
  bookingId?: number;
}

const REASONS = [
  { key: "bad_behavior", label: "Mauvais comportement", icon: "warning-outline" },
  { key: "no_show", label: "Absence", icon: "close-circle-outline" },
  { key: "inappropriate", label: "Contenu inapproprié", icon: "alert-circle-outline" },
  { key: "fraud", label: "Fraude", icon: "shield-outline" },
  { key: "low_quality", label: "Qualité insuffisante", icon: "thumbs-down-outline" },
  { key: "other", label: "Autre", icon: "ellipsis-horizontal-outline" },
] as const;

export default function ReportModal({
  visible,
  onClose,
  reportedUserId,
  reportedUserName,
  bookingId,
}: ReportModalProps) {
  const [reason, setReason] = useState<string>("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      Toast.show({ type: "error", text1: "Veuillez sélectionner une raison" });
      return;
    }
    if (!description.trim()) {
      Toast.show({ type: "error", text1: "Veuillez décrire le problème" });
      return;
    }

    setSubmitting(true);
    try {
      await reportsAPI.create({
        reported_user: reportedUserId,
        booking: bookingId || null,
        reason,
        description: description.trim(),
      });
      Toast.show({ type: "success", text1: "Signalement envoyé" });
      setReason("");
      setDescription("");
      onClose();
    } catch {
      Toast.show({ type: "error", text1: "Erreur lors de l'envoi" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Signaler {reportedUserName}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.gray[500]} />
            </TouchableOpacity>
          </View>

          {/* Reason selection */}
          <Text style={styles.label}>Raison du signalement</Text>
          <View style={styles.reasonGrid}>
            {REASONS.map((r) => (
              <TouchableOpacity
                key={r.key}
                style={[styles.reasonItem, reason === r.key && styles.reasonItemActive]}
                onPress={() => setReason(r.key)}
              >
                <Ionicons
                  name={r.icon as any}
                  size={18}
                  color={reason === r.key ? colors.red[600] : colors.gray[500]}
                />
                <Text
                  style={[
                    styles.reasonText,
                    reason === r.key && styles.reasonTextActive,
                  ]}
                >
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Description */}
          <Text style={styles.label}>Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Décrivez le problème rencontré..."
            placeholderTextColor={colors.gray[400]}
            multiline
            numberOfLines={4}
            maxLength={1000}
            style={styles.textarea}
          />
          <Text style={styles.charCount}>{description.length}/1000</Text>

          {/* Submit */}
          <Button
            title={submitting ? "Envoi..." : "Envoyer le signalement"}
            onPress={handleSubmit}
            loading={submitting}
            disabled={!reason || !description.trim()}
            size="lg"
            style={{ marginTop: spacing.md, backgroundColor: colors.red[500] }}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray[100],
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.gray[700],
    marginBottom: spacing.sm,
  },
  reasonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  reasonItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.gray[200],
    backgroundColor: colors.white,
  },
  reasonItemActive: {
    borderColor: colors.red[400],
    backgroundColor: colors.red[50],
  },
  reasonText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.gray[600],
  },
  reasonTextActive: {
    color: colors.red[700],
  },
  textarea: {
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: radius.lg,
    padding: spacing.md,
    fontSize: fontSize.base,
    color: colors.gray[900],
    textAlignVertical: "top",
    minHeight: 100,
  },
  charCount: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    textAlign: "right",
    marginTop: spacing.xs,
  },
});
