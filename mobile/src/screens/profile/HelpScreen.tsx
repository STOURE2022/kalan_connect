import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radius, fontSize, fontWeight } from "@/utils/theme";

const FAQ_ITEMS = [
  {
    question: "Comment fonctionne KalanConnect ?",
    answer:
      "KalanConnect connecte les parents et élèves avec des professeurs particuliers qualifiés au Mali. Recherchez un professeur, réservez un cours et suivez la progression de votre enfant.",
  },
  {
    question: "Comment s'abonner ?",
    answer:
      "Pour accéder aux coordonnées des professeurs et réserver des cours, abonnez-vous via Orange Money. Allez dans Profil > S'abonner et choisissez votre plan (mensuel ou annuel).",
  },
  {
    question: "Comment devenir professeur ?",
    answer:
      "Inscrivez-vous en tant que professeur, complétez votre profil (diplômes, matières, disponibilités, tarif) et attendez la vérification par notre équipe. Une fois vérifié, vous apparaîtrez dans les résultats de recherche.",
  },
  {
    question: "Comment annuler une réservation ?",
    answer:
      "Vous pouvez annuler une réservation en attente depuis l'onglet Cours. Appuyez sur la réservation puis sur le bouton Annuler. Les réservations confirmées ne peuvent être annulées que 24h avant.",
  },
  {
    question: "Comment contacter un professeur ?",
    answer:
      "Depuis la page du professeur, appuyez sur 'Contacter'. Un abonnement actif est nécessaire pour envoyer des messages.",
  },
  {
    question: "Quels modes de paiement acceptez-vous ?",
    answer:
      "Nous acceptons Orange Money pour les abonnements. Les paiements des cours se font directement entre le parent et le professeur.",
  },
  {
    question: "Comment laisser un avis ?",
    answer:
      "Après un cours terminé, vous pouvez noter le professeur et laisser un commentaire depuis la section Cours.",
  },
];

export default function HelpScreen() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Contact section */}
      <View style={styles.contactSection}>
        <Text style={styles.contactTitle}>Besoin d'aide ?</Text>
        <Text style={styles.contactSubtitle}>
          Notre équipe est disponible pour vous aider du lundi au samedi, de 8h à 18h.
        </Text>

        <View style={styles.contactButtons}>
          <TouchableOpacity
            style={styles.contactBtn}
            onPress={() => Linking.openURL("tel:+22370000000")}
          >
            <Ionicons name="call" size={22} color={colors.primary[600]} />
            <Text style={styles.contactBtnText}>Appeler</Text>
            <Text style={styles.contactBtnDetail}>+223 70 00 00 00</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactBtn}
            onPress={() => Linking.openURL("mailto:support@kalanconnect.ml")}
          >
            <Ionicons name="mail" size={22} color={colors.primary[600]} />
            <Text style={styles.contactBtnText}>Email</Text>
            <Text style={styles.contactBtnDetail}>support@kalanconnect.ml</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactBtn}
            onPress={() => Linking.openURL("https://wa.me/22370000000")}
          >
            <Ionicons name="logo-whatsapp" size={22} color={colors.primary[600]} />
            <Text style={styles.contactBtnText}>WhatsApp</Text>
            <Text style={styles.contactBtnDetail}>+223 70 00 00 00</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* FAQ */}
      <View style={styles.faqSection}>
        <Text style={styles.sectionTitle}>Questions fréquentes</Text>
        {FAQ_ITEMS.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.faqItem}
            onPress={() => setExpandedIndex(expandedIndex === index ? null : index)}
            activeOpacity={0.7}
          >
            <View style={styles.faqHeader}>
              <Text style={styles.faqQuestion}>{item.question}</Text>
              <Ionicons
                name={expandedIndex === index ? "chevron-up" : "chevron-down"}
                size={18}
                color={colors.gray[400]}
              />
            </View>
            {expandedIndex === index && (
              <Text style={styles.faqAnswer}>{item.answer}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* About */}
      <View style={styles.aboutSection}>
        <Text style={styles.sectionTitle}>A propos</Text>
        <View style={styles.aboutCard}>
          <Text style={styles.aboutText}>
            KalanConnect est une plateforme malienne qui facilite la mise en relation entre
            parents/élèves et professeurs particuliers qualifiés. Notre mission est de
            rendre l'éducation de qualité accessible à tous au Mali.
          </Text>
          <View style={styles.aboutLinks}>
            <TouchableOpacity style={styles.aboutLink}>
              <Ionicons name="document-text-outline" size={16} color={colors.primary[600]} />
              <Text style={styles.aboutLinkText}>Conditions d'utilisation</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.aboutLink}>
              <Ionicons name="shield-outline" size={16} color={colors.primary[600]} />
              <Text style={styles.aboutLinkText}>Politique de confidentialité</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  contactSection: {
    padding: spacing.lg,
    backgroundColor: colors.primary[50],
    margin: spacing.lg,
    borderRadius: radius.xl,
  },
  contactTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.primary[800],
  },
  contactSubtitle: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  contactButtons: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  contactBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  contactBtnText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
    flex: 1,
  },
  contactBtnDetail: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
  },
  faqSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.gray[400],
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  faqItem: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  faqQuestion: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.gray[900],
    flex: 1,
    marginRight: spacing.md,
  },
  faqAnswer: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    marginTop: spacing.md,
    lineHeight: 20,
  },
  aboutSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  aboutCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  aboutText: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    lineHeight: 22,
  },
  aboutLinks: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  aboutLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  aboutLinkText: {
    fontSize: fontSize.sm,
    color: colors.primary[600],
    fontWeight: fontWeight.medium,
  },
});
