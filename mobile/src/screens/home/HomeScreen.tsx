import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { searchAPI } from "@/api/services";
import { colors, spacing, radius, fontSize, fontWeight } from "@/utils/theme";
import type { Subject } from "@/types";

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_GAP = 12;
const CARD_W = (SCREEN_W - spacing.xl * 2 - CARD_GAP * 2) / 3;

// Fallback data when API not available
const FALLBACK_SUBJECTS = [
  { id: 1, name: "Maths", slug: "maths", icon: "🔢", category: "sciences", teacher_count: 120 },
  { id: 2, name: "Français", slug: "francais", icon: "📝", category: "langues", teacher_count: 98 },
  { id: 3, name: "Physique", slug: "physique", icon: "⚡", category: "sciences", teacher_count: 65 },
  { id: 4, name: "Anglais", slug: "anglais", icon: "🇬🇧", category: "langues", teacher_count: 87 },
  { id: 5, name: "SVT", slug: "svt", icon: "🌿", category: "sciences", teacher_count: 45 },
  { id: 6, name: "Histoire", slug: "histoire", icon: "📚", category: "lettres", teacher_count: 38 },
];

const SUBJECT_ICONS: Record<string, string> = {
  maths: "🔢", francais: "📝", physique: "⚡", anglais: "🇬🇧",
  svt: "🌿", histoire: "📚", chimie: "🧪", philosophie: "💡",
  informatique: "💻", geographie: "🌍", arabe: "🕌", economie: "📊",
};

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [popular, setPopular] = useState<(Subject & { teacher_count: number })[]>([]);

  useEffect(() => {
    searchAPI
      .popular("Bamako")
      .then((data) => setPopular(data.length > 0 ? data : FALLBACK_SUBJECTS as any))
      .catch(() => setPopular(FALLBACK_SUBJECTS as any));
  }, []);

  const handleSearch = () => {
    navigation.navigate("Recherche", { q: query });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary[600]} />

      {/* ── Hero ── */}
      <View style={styles.hero}>
        <View style={[styles.heroBg, { paddingTop: insets.top + 24 }]}>
          <Text style={styles.heroEmoji}>🎓</Text>
          <Text style={styles.heroTitle}>
            Trouvez le meilleur{"\n"}professeur pour{"\n"}votre enfant
          </Text>
          <Text style={styles.heroSub}>
            +500 professeurs qualifiés à Bamako
          </Text>

          {/* Search */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color={colors.gray[400]} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={handleSearch}
                placeholder="Physique, Maths, Anglais..."
                placeholderTextColor={colors.gray[400]}
                style={styles.searchInput}
                returnKeyType="search"
              />
            </View>
            <TouchableOpacity
              onPress={handleSearch}
              style={styles.searchButton}
              activeOpacity={0.8}
            >
              <Ionicons name="search" size={18} color={colors.white} />
              <Text style={styles.searchButtonText}>Rechercher</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Curved bottom */}
        <View style={styles.heroCurve} />
      </View>

      {/* ── Popular subjects ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Matières populaires</Text>
        <Text style={styles.sectionSub}>Les plus demandées à Bamako</Text>

        <View style={styles.subjectsGrid}>
          {popular.slice(0, 6).map((subject) => (
            <TouchableOpacity
              key={subject.id}
              onPress={() =>
                navigation.navigate("Recherche", { subject: subject.slug })
              }
              style={styles.subjectCard}
              activeOpacity={0.7}
            >
              <View style={styles.subjectIconBg}>
                <Text style={styles.subjectEmoji}>
                  {SUBJECT_ICONS[subject.slug] || subject.icon || "📖"}
                </Text>
              </View>
              <Text style={styles.subjectName} numberOfLines={1}>
                {subject.name}
              </Text>
              <Text style={styles.subjectCount}>
                {subject.teacher_count} profs
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── How it works ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Comment ça marche</Text>
        <Text style={styles.sectionSub}>En 4 étapes simples</Text>

        <View style={styles.stepsContainer}>
          {[
            { icon: "search-outline" as const, title: "Recherchez", desc: "Trouvez un prof par matière et quartier", color: colors.primary[500] },
            { icon: "chatbubble-outline" as const, title: "Contactez", desc: "Échangez via la messagerie intégrée", color: colors.blue[500] },
            { icon: "calendar-outline" as const, title: "Réservez", desc: "Choisissez un créneau qui vous convient", color: colors.accent[500] },
            { icon: "trending-up-outline" as const, title: "Progressez", desc: "Suivi personnalisé de l'enfant", color: colors.primary[600] },
          ].map((step, i) => (
            <View key={step.title} style={styles.stepCard}>
              <View style={[styles.stepIconBg, { backgroundColor: step.color + "15" }]}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{i + 1}</Text>
                </View>
                <Ionicons name={step.icon} size={26} color={step.color} />
              </View>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDesc}>{step.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Stats ── */}
      <View style={styles.statsBar}>
        {[
          { value: "500+", label: "Professeurs", icon: "people" as const },
          { value: "20+", label: "Matières", icon: "book" as const },
          { value: "4.8/5", label: "Satisfaction", icon: "star" as const },
        ].map((stat) => (
          <View key={stat.label} style={styles.stat}>
            <Ionicons name={stat.icon} size={22} color={colors.primary[400]} />
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* ── Pricing ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Un abonnement simple</Text>
        <Text style={styles.sectionSub}>Accédez à tous les professeurs</Text>

        <View style={styles.pricingRow}>
          <TouchableOpacity
            onPress={() => navigation.navigate("Payment", { plan: "monthly" })}
            style={styles.priceCard}
            activeOpacity={0.7}
          >
            <Text style={styles.planName}>Mensuel</Text>
            <Text style={styles.planPrice}>1 500</Text>
            <Text style={styles.planCurrency}>FCFA/mois</Text>
            <View style={styles.planDivider} />
            <Text style={styles.planDesc}>Sans engagement</Text>
            <Text style={styles.planFeature}>
              <Ionicons name="checkmark" size={12} color={colors.primary[500]} /> Accès illimité
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate("Payment", { plan: "annual" })}
            style={[styles.priceCard, styles.priceCardFeatured]}
            activeOpacity={0.7}
          >
            <View style={styles.priceBadge}>
              <Text style={styles.priceBadgeText}>-17%</Text>
            </View>
            <Text style={[styles.planName, { color: colors.primary[700] }]}>Annuel</Text>
            <Text style={[styles.planPrice, { color: colors.primary[700] }]}>15 000</Text>
            <Text style={styles.planCurrency}>FCFA/an</Text>
            <View style={styles.planDivider} />
            <Text style={[styles.planDesc, { color: colors.primary[600] }]}>
              2 mois offerts
            </Text>
            <Text style={styles.planFeature}>
              <Ionicons name="checkmark" size={12} color={colors.primary[500]} /> = 1 250 FCFA/mois
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },

  // ── Hero ──
  hero: {
    backgroundColor: colors.gray[50],
  },
  heroBg: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing["3xl"] + 20,
  },
  heroEmoji: {
    fontSize: 40,
    marginBottom: spacing.md,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: fontWeight.extrabold,
    color: colors.white,
    lineHeight: 36,
  },
  heroSub: {
    fontSize: fontSize.base,
    color: colors.primary[200],
    marginTop: spacing.sm,
    fontWeight: fontWeight.medium,
  },
  heroCurve: {
    height: 24,
    backgroundColor: colors.primary[600],
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginTop: -1,
  },
  searchContainer: {
    marginTop: spacing.xl,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    height: 52,
    gap: spacing.sm,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.gray[900],
  },
  searchButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary[700],
    borderRadius: radius.lg,
    height: 48,
    marginTop: spacing.md,
    gap: spacing.sm,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
      android: { elevation: 3 },
    }),
  },
  searchButtonText: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },

  // ── Sections ──
  section: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing["2xl"],
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
  },
  sectionSub: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginTop: 4,
  },

  // ── Subjects grid (3 columns) ──
  subjectsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: CARD_GAP,
    marginTop: spacing.lg,
  },
  subjectCard: {
    width: CARD_W,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.gray[100],
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
      android: { elevation: 1 },
    }),
  },
  subjectIconBg: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primary[50],
    alignItems: "center",
    justifyContent: "center",
  },
  subjectEmoji: {
    fontSize: 26,
  },
  subjectName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.gray[800],
    marginTop: spacing.sm,
    textAlign: "center",
  },
  subjectCount: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    marginTop: 2,
  },

  // ── Steps (2x2 grid) ──
  stepsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  stepCard: {
    width: (SCREEN_W - spacing.xl * 2 - spacing.md) / 2,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  stepIconBg: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary[500],
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    color: colors.white,
    fontWeight: fontWeight.extrabold,
    fontSize: fontSize.sm,
  },
  stepTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
  },
  stepDesc: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    marginTop: 4,
    lineHeight: 16,
  },

  // ── Stats ──
  statsBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: colors.gray[900],
    marginHorizontal: spacing.xl,
    marginTop: spacing["2xl"],
    borderRadius: radius.xl,
    paddingVertical: spacing.xl,
  },
  stat: { alignItems: "center", gap: 4 },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.extrabold,
    color: colors.white,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
  },

  // ── Pricing (side by side) ──
  pricingRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  priceCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray[100],
    alignItems: "center",
  },
  priceCardFeatured: {
    borderColor: colors.primary[400],
    borderWidth: 2,
    backgroundColor: colors.primary[50],
  },
  priceBadge: {
    position: "absolute",
    top: -10,
    right: 12,
    backgroundColor: colors.accent[500],
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  priceBadgeText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.extrabold,
  },
  planName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.gray[600],
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  planPrice: {
    fontSize: 26,
    fontWeight: fontWeight.extrabold,
    color: colors.gray[900],
    marginTop: 4,
  },
  planCurrency: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
  },
  planDivider: {
    width: "60%",
    height: 1,
    backgroundColor: colors.gray[100],
    marginVertical: spacing.md,
  },
  planDesc: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    fontWeight: fontWeight.semibold,
  },
  planFeature: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    marginTop: 4,
  },
});
