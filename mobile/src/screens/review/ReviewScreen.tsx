import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  StyleSheet,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import StarRating from "@/components/ui/StarRating";
import Button from "@/components/ui/Button";
import { bookingsAPI } from "@/api/services";
import { colors, spacing, radius, fontSize, fontWeight } from "@/utils/theme";
import Toast from "react-native-toast-message";

export default function ReviewScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { teacherId, bookingId } = route.params;

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Toast.show({ type: "error", text1: "Veuillez donner une note" });
      return;
    }

    setSubmitting(true);
    try {
      await bookingsAPI.createReview({
        teacher: teacherId,
        booking: bookingId,
        rating,
        comment: comment.trim(),
      });
      setSubmitted(true);
      Toast.show({ type: "success", text1: "Avis envoyé !" });
    } catch {
      Toast.show({ type: "error", text1: "Erreur lors de l'envoi" });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <View style={[styles.container, styles.center]}>
        <View style={styles.successIcon}>
          <Text style={{ fontSize: 48 }}>🎉</Text>
        </View>
        <Text style={styles.successTitle}>Merci pour votre avis !</Text>
        <Text style={styles.successSubtitle}>
          Votre retour aide les autres parents à trouver les meilleurs professeurs.
        </Text>
        <Button
          title="Retour"
          onPress={() => navigation.goBack()}
          size="lg"
          style={{ width: "100%", marginTop: spacing.xl }}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Évaluer le cours</Text>
        <Text style={styles.headerSubtitle}>
          Comment s'est passé le cours ? Votre avis est précieux.
        </Text>
      </View>

      {/* Rating */}
      <View style={styles.ratingSection}>
        <Text style={styles.label}>Note</Text>
        <StarRating
          rating={rating}
          onChange={setRating}
          interactive
          size={40}
        />
        <Text style={styles.ratingText}>
          {rating === 0
            ? "Appuyez pour noter"
            : rating <= 2
            ? "Peut mieux faire"
            : rating <= 3
            ? "Correct"
            : rating <= 4
            ? "Très bien"
            : "Excellent !"}
        </Text>
      </View>

      {/* Comment */}
      <View style={styles.commentSection}>
        <Text style={styles.label}>Commentaire (optionnel)</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Partagez votre expérience avec ce professeur..."
          placeholderTextColor={colors.gray[400]}
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={5}
          maxLength={500}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{comment.length}/500</Text>
      </View>

      <View style={styles.actions}>
        <Button
          title="Envoyer l'avis"
          onPress={handleSubmit}
          loading={submitting}
          size="lg"
        />
        <Button
          title="Annuler"
          onPress={() => navigation.goBack()}
          variant="secondary"
          size="md"
          style={{ marginTop: spacing.sm }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing["2xl"],
  },
  header: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  headerTitle: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginTop: spacing.xs,
  },
  ratingSection: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
  },
  label: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.gray[800],
    marginBottom: spacing.md,
  },
  ratingText: {
    fontSize: fontSize.base,
    color: colors.gray[500],
    marginTop: spacing.md,
  },
  commentSection: {
    padding: spacing.lg,
  },
  textInput: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.gray[200],
    padding: spacing.lg,
    fontSize: fontSize.base,
    color: colors.gray[900],
    minHeight: 120,
  },
  charCount: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    textAlign: "right",
    marginTop: spacing.xs,
  },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[50],
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    marginTop: spacing.xl,
  },
  successSubtitle: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    textAlign: "center",
    marginTop: spacing.sm,
    lineHeight: 20,
  },
});
