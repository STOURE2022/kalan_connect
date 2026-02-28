import React, { useState } from "react";
import { View, Text, ScrollView, Switch, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radius, fontSize, fontWeight } from "@/utils/theme";

export default function PrivacyScreen() {
  const [profileVisible, setProfileVisible] = useState(true);
  const [showPhone, setShowPhone] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(true);

  const sections = [
    {
      title: "Visibilité du profil",
      items: [
        {
          icon: "eye-outline" as keyof typeof Ionicons.glyphMap,
          label: "Profil visible publiquement",
          subtitle: "Permet aux autres utilisateurs de trouver votre profil",
          value: profileVisible,
          onToggle: setProfileVisible,
        },
        {
          icon: "call-outline" as keyof typeof Ionicons.glyphMap,
          label: "Afficher le téléphone",
          subtitle: "Visible par les professeurs/parents",
          value: showPhone,
          onToggle: setShowPhone,
        },
        {
          icon: "mail-outline" as keyof typeof Ionicons.glyphMap,
          label: "Afficher l'email",
          subtitle: "Visible par les professeurs/parents",
          value: showEmail,
          onToggle: setShowEmail,
        },
      ],
    },
    {
      title: "Notifications",
      items: [
        {
          icon: "notifications-outline" as keyof typeof Ionicons.glyphMap,
          label: "Notifications push",
          subtitle: "Alertes sur votre téléphone",
          value: pushNotifications,
          onToggle: setPushNotifications,
        },
        {
          icon: "mail-outline" as keyof typeof Ionicons.glyphMap,
          label: "Notifications par email",
          subtitle: "Résumés et alertes par email",
          value: emailNotifications,
          onToggle: setEmailNotifications,
        },
        {
          icon: "chatbox-outline" as keyof typeof Ionicons.glyphMap,
          label: "Notifications SMS",
          subtitle: "Alertes par SMS",
          value: smsNotifications,
          onToggle: setSmsNotifications,
        },
      ],
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Data info */}
      <View style={styles.infoCard}>
        <Ionicons name="shield-checkmark" size={24} color={colors.primary[600]} />
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={styles.infoTitle}>Protection des données</Text>
          <Text style={styles.infoText}>
            Vos données personnelles sont protégées conformément à la loi malienne
            sur la protection des données. Nous ne partageons jamais vos informations
            sans votre consentement.
          </Text>
        </View>
      </View>

      {sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.items.map((item) => (
            <View key={item.label} style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Ionicons name={item.icon} size={20} color={colors.gray[600]} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>{item.label}</Text>
                <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
              </View>
              <Switch
                value={item.value}
                onValueChange={item.onToggle}
                trackColor={{ false: colors.gray[200], true: colors.primary[200] }}
                thumbColor={item.value ? colors.primary[500] : colors.gray[400]}
              />
            </View>
          ))}
        </View>
      ))}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vos droits</Text>
        <View style={styles.rightsList}>
          {[
            "Droit d'accès à vos données",
            "Droit de rectification",
            "Droit à la portabilité",
            "Droit à l'effacement",
            "Droit d'opposition",
          ].map((right) => (
            <View key={right} style={styles.rightItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.primary[500]} />
              <Text style={styles.rightText}>{right}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  infoCard: {
    flexDirection: "row",
    backgroundColor: colors.primary[50],
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  infoTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.primary[700],
  },
  infoText: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  section: {
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
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.gray[100],
    alignItems: "center",
    justifyContent: "center",
  },
  settingContent: { flex: 1 },
  settingLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.gray[900],
  },
  settingSubtitle: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    marginTop: 1,
  },
  rightsList: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  rightItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  rightText: {
    fontSize: fontSize.sm,
    color: colors.gray[700],
  },
});
