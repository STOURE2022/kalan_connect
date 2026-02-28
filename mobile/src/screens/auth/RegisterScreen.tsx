import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/api/client";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { colors, spacing, radius, fontSize } from "@/utils/theme";
import Toast from "react-native-toast-message";

export default function RegisterScreen() {
  const navigation = useNavigation<any>();
  const { register } = useAuth();

  const [role, setRole] = useState<"parent" | "teacher" | "student" | "etudiant">("parent");
  const [form, setForm] = useState({
    phone: "",
    first_name: "",
    last_name: "",
    email: "",
    city: "Bamako",
    neighborhood: "",
    password: "",
    password_confirm: "",
  });
  const [loading, setLoading] = useState(false);

  const update = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleRegister = async () => {
    if (form.password !== form.password_confirm) {
      Toast.show({ type: "error", text1: "Les mots de passe ne correspondent pas" });
      return;
    }
    setLoading(true);
    try {
      await register({ ...form, role });
      Toast.show({ type: "success", text1: "Compte créé !" });
      navigation.goBack();
    } catch (err) {
      if (err instanceof ApiError) {
        const msg = Object.values(err.data).flat().join(", ");
        Toast.show({ type: "error", text1: msg || "Erreur d'inscription" });
      }
    } finally {
      setLoading(false);
    }
  };

  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Créer un compte</Text>

      {/* Role selector */}
      <View style={styles.roleRow}>
        {([
          { key: "parent" as const, label: "Parent" },
          { key: "teacher" as const, label: "Professeur" },
          { key: "student" as const, label: "Élève" },
          { key: "etudiant" as const, label: "Étudiant" },
        ]).map((r) => (
          <TouchableOpacity
            key={r.key}
            onPress={() => setRole(r.key)}
            style={[styles.roleBtn, role === r.key && styles.roleBtnActive]}
          >
            <Text
              style={[
                styles.roleBtnText,
                role === r.key && styles.roleBtnTextActive,
              ]}
            >
              {r.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Form */}
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Input
            label="Prénom"
            value={form.first_name}
            onChangeText={(v) => update("first_name", v)}
            placeholder="Amadou"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Input
            label="Nom"
            value={form.last_name}
            onChangeText={(v) => update("last_name", v)}
            placeholder="Diallo"
          />
        </View>
      </View>

      <Input
        label="Téléphone"
        value={form.phone}
        onChangeText={(v) => update("phone", v)}
        placeholder="+223 70 00 00 00"
        keyboardType="phone-pad"
        icon={<Ionicons name="call-outline" size={16} color={colors.gray[400]} />}
      />

      <Input
        label="Email (optionnel)"
        value={form.email}
        onChangeText={(v) => update("email", v)}
        placeholder="email@exemple.com"
        keyboardType="email-address"
        icon={<Ionicons name="mail-outline" size={16} color={colors.gray[400]} />}
      />

      <Input
        label="Quartier"
        value={form.neighborhood}
        onChangeText={(v) => update("neighborhood", v)}
        placeholder="Hamdallaye"
        icon={<Ionicons name="location-outline" size={16} color={colors.gray[400]} />}
      />

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Input
            label="Mot de passe"
            value={form.password}
            onChangeText={(v) => update("password", v)}
            placeholder="Min. 6 car."
            secureTextEntry
          />
        </View>
        <View style={{ flex: 1 }}>
          <Input
            label="Confirmer"
            value={form.password_confirm}
            onChangeText={(v) => update("password_confirm", v)}
            placeholder="Confirmer"
            secureTextEntry
          />
        </View>
      </View>

      <Button
        title="Créer mon compte"
        onPress={handleRegister}
        loading={loading}
        size="lg"
        style={{ marginTop: spacing.md }}
      />

      <TouchableOpacity
        onPress={() => navigation.navigate("Login")}
        style={styles.footer}
      >
        <Text style={styles.footerText}>
          Déjà un compte ? <Text style={styles.footerLink}>Se connecter</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { paddingHorizontal: spacing.xl, paddingVertical: spacing["2xl"] },
  title: { fontSize: fontSize.xl, fontWeight: "800", color: colors.gray[900], marginBottom: spacing.xl },
  roleRow: {
    flexDirection: "row",
    backgroundColor: colors.gray[100],
    borderRadius: radius.lg,
    padding: 4,
    marginBottom: spacing.xl,
  },
  roleBtn: { flex: 1, paddingVertical: 10, borderRadius: radius.md, alignItems: "center" },
  roleBtnActive: { backgroundColor: colors.white, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  roleBtnText: { fontSize: 13, fontWeight: "600", color: colors.gray[500] },
  roleBtnTextActive: { color: colors.primary[600] },
  row: { flexDirection: "row", gap: spacing.md },
  footer: { alignItems: "center", marginTop: spacing["2xl"], marginBottom: spacing["3xl"] },
  footerText: { fontSize: fontSize.sm, color: colors.gray[500] },
  footerLink: { color: colors.primary[600], fontWeight: "700" },
});
