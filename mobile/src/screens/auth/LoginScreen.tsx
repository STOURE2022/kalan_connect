import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/api/client";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { colors, spacing, radius, fontSize } from "@/utils/theme";
import Toast from "react-native-toast-message";

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const { login } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone || !password) {
      Toast.show({ type: "error", text1: "Remplissez tous les champs" });
      return;
    }
    setLoading(true);
    try {
      await login(phone, password);
      Toast.show({ type: "success", text1: "Connexion réussie !" });
      navigation.goBack();
    } catch (err) {
      if (err instanceof ApiError) {
        Toast.show({ type: "error", text1: "Téléphone ou mot de passe incorrect" });
      } else {
        Toast.show({ type: "error", text1: "Erreur de connexion" });
      }
    } finally {
      setLoading(false);
    }
  };

  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.logo}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>K</Text>
        </View>
        <Text style={styles.title}>Bon retour !</Text>
        <Text style={styles.subtitle}>
          Connectez-vous à votre compte KalanConnect
        </Text>
      </View>

      <View style={styles.form}>
        <Input
          label="Numéro de téléphone"
          value={phone}
          onChangeText={setPhone}
          placeholder="+223 70 00 00 00"
          keyboardType="phone-pad"
          icon={<Ionicons name="call-outline" size={16} color={colors.gray[400]} />}
        />

        <Input
          label="Mot de passe"
          value={password}
          onChangeText={setPassword}
          placeholder="Votre mot de passe"
          secureTextEntry
          icon={<Ionicons name="lock-closed-outline" size={16} color={colors.gray[400]} />}
        />

        <Button
          title="Se connecter"
          onPress={handleLogin}
          loading={loading}
          size="lg"
          style={{ marginTop: spacing.md }}
        />
      </View>

      <TouchableOpacity
        onPress={() => navigation.navigate("Register")}
        style={styles.footer}
      >
        <Text style={styles.footerText}>
          Pas encore de compte ?{" "}
          <Text style={styles.footerLink}>S'inscrire</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: "center",
  },
  logo: { alignItems: "center", marginBottom: spacing["3xl"] },
  logoBox: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.primary[500],
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { fontSize: 22, fontWeight: "800", color: colors.white },
  title: {
    fontSize: fontSize.xl,
    fontWeight: "800",
    color: colors.gray[900],
    marginTop: spacing.lg,
  },
  subtitle: { fontSize: fontSize.sm, color: colors.gray[500], marginTop: 4 },
  form: {},
  footer: { alignItems: "center", marginTop: spacing["3xl"] },
  footerText: { fontSize: fontSize.sm, color: colors.gray[500] },
  footerLink: { color: colors.primary[600], fontWeight: "700" },
});
