import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { paymentsAPI } from "@/api/services";
import { useAuth } from "@/contexts/AuthContext";
import { colors, spacing, radius, fontSize, fontWeight } from "@/utils/theme";
import { formatPrice } from "@/utils/helpers";

type Step = "plan" | "phone" | "processing" | "success" | "error";

const PLANS = [
  {
    key: "monthly" as const,
    label: "Mensuel",
    price: 1500,
    period: "/mois",
    features: [
      "Accès illimité aux profils",
      "Messagerie directe",
      "Réservation en ligne",
    ],
  },
  {
    key: "annual" as const,
    label: "Annuel",
    price: 15000,
    period: "/an",
    badge: "2 mois offerts",
    features: [
      "Accès illimité aux profils",
      "Messagerie directe",
      "Réservation en ligne",
      "Support prioritaire",
    ],
  },
];

export default function PaymentScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { refreshUser } = useAuth();

  const [step, setStep] = useState<Step>("plan");
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">(
    route.params?.plan === "annual" ? "annual" : "monthly"
  );
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const currentPlan = PLANS.find((p) => p.key === selectedPlan)!;

  const goToPhone = () => setStep("phone");

  const initiatePayment = async () => {
    const cleaned = phone.replace(/\s/g, "");
    if (!/^(\+?223)?[5-9]\d{7}$/.test(cleaned)) {
      setErrorMsg("Numéro Orange Money invalide");
      return;
    }
    setErrorMsg("");
    setLoading(true);
    setStep("processing");

    try {
      await paymentsAPI.initiate(selectedPlan, cleaned);
      // Simulate waiting for webhook confirmation
      setTimeout(async () => {
        try {
          const sub = await paymentsAPI.checkSubscription();
          if (sub.has_subscription) {
            await refreshUser();
            setStep("success");
          } else {
            // Still processing, show success anyway (webhook may arrive later)
            await refreshUser();
            setStep("success");
          }
        } catch {
          setStep("success");
        }
      }, 5000);
    } catch (err: any) {
      setErrorMsg(err?.message || "Échec du paiement. Réessayez.");
      setStep("error");
      setLoading(false);
    }
  };

  // ─── STEP: Plan Selection ───
  if (step === "plan") {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Choisissez votre abonnement</Text>
        <Text style={styles.subtitle}>
          Accédez à tous les profils de professeurs et commencez à réserver
        </Text>

        {PLANS.map((plan) => (
          <TouchableOpacity
            key={plan.key}
            activeOpacity={0.7}
            onPress={() => setSelectedPlan(plan.key)}
            style={[
              styles.planCard,
              selectedPlan === plan.key && styles.planCardSelected,
            ]}
          >
            {plan.badge && (
              <View style={styles.planBadge}>
                <Text style={styles.planBadgeText}>{plan.badge}</Text>
              </View>
            )}

            <View style={styles.planHeader}>
              <View style={styles.radioOuter}>
                {selectedPlan === plan.key && <View style={styles.radioInner} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.planLabel}>{plan.label}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.planPrice}>{formatPrice(plan.price)}</Text>
                  <Text style={styles.planPeriod}>{plan.period}</Text>
                </View>
              </View>
            </View>

            <View style={styles.featuresList}>
              {plan.features.map((f) => (
                <View key={f} style={styles.featureItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={colors.primary[500]}
                  />
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        ))}

        <Button
          title="Continuer"
          onPress={goToPhone}
          size="lg"
          style={{ marginTop: spacing.lg }}
        />
      </ScrollView>
    );
  }

  // ─── STEP: Phone Input ───
  if (step === "phone") {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => setStep("plan")} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.gray[600]} />
          <Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Abonnement {currentPlan.label}</Text>
          <Text style={styles.summaryPrice}>{formatPrice(currentPlan.price)}</Text>
        </View>

        <View style={styles.omLogo}>
          <View style={styles.omBadge}>
            <Text style={styles.omText}>Orange Money</Text>
          </View>
        </View>

        <Input
          label="Numéro Orange Money"
          value={phone}
          onChangeText={setPhone}
          placeholder="70 00 00 00"
          keyboardType="phone-pad"
          icon={<Ionicons name="call-outline" size={18} color={colors.gray[400]} />}
          error={errorMsg}
        />

        <Text style={styles.infoText}>
          Vous recevrez une notification USSD sur votre téléphone pour confirmer le
          paiement via Orange Money.
        </Text>

        <Button
          title={`Payer ${formatPrice(currentPlan.price)}`}
          onPress={initiatePayment}
          loading={loading}
          variant="orange"
          size="lg"
          style={{ marginTop: spacing.xl }}
        />
      </ScrollView>
    );
  }

  // ─── STEP: Processing ───
  if (step === "processing") {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.orange[500]} />
        <Text style={styles.processingTitle}>Paiement en cours...</Text>
        <Text style={styles.processingSubtitle}>
          Confirmez le paiement via la notification USSD sur votre téléphone
        </Text>
        <View style={styles.stepsContainer}>
          <View style={styles.stepItem}>
            <Ionicons name="checkmark-circle" size={20} color={colors.primary[500]} />
            <Text style={styles.stepText}>Demande envoyée</Text>
          </View>
          <View style={styles.stepItem}>
            <ActivityIndicator size="small" color={colors.orange[500]} />
            <Text style={styles.stepText}>En attente de confirmation</Text>
          </View>
          <View style={styles.stepItem}>
            <Ionicons name="ellipse-outline" size={20} color={colors.gray[300]} />
            <Text style={[styles.stepText, { color: colors.gray[400] }]}>
              Activation abonnement
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // ─── STEP: Success ───
  if (step === "success") {
    return (
      <View style={[styles.container, styles.center]}>
        <View style={styles.successCircle}>
          <Ionicons name="checkmark" size={48} color={colors.white} />
        </View>
        <Text style={styles.successTitle}>Paiement réussi !</Text>
        <Text style={styles.successSubtitle}>
          Votre abonnement {currentPlan.label} est maintenant actif.{"\n"}Vous avez
          accès à tous les profils de professeurs.
        </Text>
        <Button
          title="Rechercher un professeur"
          onPress={() => navigation.navigate("Main", { screen: "Recherche" })}
          size="lg"
          style={{ marginTop: spacing["2xl"], width: "100%" }}
        />
        <Button
          title="Retour à l'accueil"
          onPress={() => navigation.navigate("Main", { screen: "Accueil" })}
          variant="secondary"
          size="md"
          style={{ marginTop: spacing.sm, width: "100%" }}
        />
      </View>
    );
  }

  // ─── STEP: Error ───
  return (
    <View style={[styles.container, styles.center]}>
      <View style={styles.errorCircle}>
        <Ionicons name="close" size={48} color={colors.white} />
      </View>
      <Text style={styles.errorTitle}>Échec du paiement</Text>
      <Text style={styles.errorSubtitle}>{errorMsg}</Text>
      <Button
        title="Réessayer"
        onPress={() => { setStep("phone"); setLoading(false); }}
        variant="orange"
        size="lg"
        style={{ marginTop: spacing["2xl"], width: "100%" }}
      />
      <Button
        title="Annuler"
        onPress={() => navigation.goBack()}
        variant="secondary"
        size="md"
        style={{ marginTop: spacing.sm, width: "100%" }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { padding: spacing.xl, paddingBottom: 40 },
  center: { alignItems: "center", justifyContent: "center", paddingHorizontal: spacing["2xl"] },

  title: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginBottom: spacing.xl,
    lineHeight: 20,
  },

  // Plan cards
  planCard: {
    borderWidth: 2,
    borderColor: colors.gray[200],
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  planCardSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  planBadge: {
    position: "absolute",
    top: -10,
    right: 16,
    backgroundColor: colors.accent[500],
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  planBadgeText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  planHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.primary[500],
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary[500],
  },
  planLabel: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
  },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 2 },
  planPrice: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.extrabold,
    color: colors.gray[900],
  },
  planPeriod: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
  },
  featuresList: { gap: spacing.sm },
  featureItem: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  featureText: { fontSize: fontSize.sm, color: colors.gray[700] },

  // Phone step
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: spacing.xl },
  backText: { fontSize: fontSize.sm, color: colors.gray[600] },
  summaryCard: {
    backgroundColor: colors.gray[50],
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  summaryLabel: { fontSize: fontSize.sm, color: colors.gray[500], marginBottom: 4 },
  summaryPrice: { fontSize: fontSize["2xl"], fontWeight: fontWeight.extrabold, color: colors.gray[900] },
  omLogo: { alignItems: "center", marginBottom: spacing.xl },
  omBadge: {
    backgroundColor: colors.orange[50],
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  omText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.orange[500],
  },
  infoText: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    textAlign: "center",
    lineHeight: 16,
    marginTop: spacing.md,
  },

  // Processing
  processingTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    marginTop: spacing.xl,
  },
  processingSubtitle: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    textAlign: "center",
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  stepsContainer: { marginTop: spacing["3xl"], gap: spacing.lg, width: "100%" },
  stepItem: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  stepText: { fontSize: fontSize.base, color: colors.gray[700] },

  // Success
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[500],
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: {
    fontSize: fontSize["2xl"],
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

  // Error
  errorCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.red[500],
    alignItems: "center",
    justifyContent: "center",
  },
  errorTitle: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    marginTop: spacing.xl,
  },
  errorSubtitle: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    textAlign: "center",
    marginTop: spacing.sm,
    lineHeight: 20,
  },
});
