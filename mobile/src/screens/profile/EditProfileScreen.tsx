import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import Avatar from "@/components/ui/Avatar";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { authAPI, deleteAccount } from "@/api/services";
import { colors, spacing, radius, fontSize, fontWeight } from "@/utils/theme";
import Toast from "react-native-toast-message";

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { user, refreshUser, logout } = useAuth();

  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [city, setCity] = useState(user?.city || "");
  const [neighborhood, setNeighborhood] = useState(user?.neighborhood || "");
  const [saving, setSaving] = useState(false);

  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Toast.show({ type: "error", text1: "Permission requise pour accéder à la galerie" });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Toast.show({ type: "error", text1: "Nom et prénom requis" });
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("first_name", firstName.trim());
      formData.append("last_name", lastName.trim());
      if (email.trim()) formData.append("email", email.trim());
      formData.append("city", city.trim());
      formData.append("neighborhood", neighborhood.trim());
      if (avatarUri) {
        const filename = avatarUri.split("/").pop() || "avatar.jpg";
        formData.append("avatar", { uri: avatarUri, name: filename, type: "image/jpeg" } as any);
      }

      await authAPI.updateProfile(formData);
      await refreshUser();
      Toast.show({ type: "success", text1: "Profil mis à jour" });
      navigation.goBack();
    } catch {
      Toast.show({ type: "error", text1: "Erreur lors de la mise à jour" });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
      Toast.show({ type: "error", text1: "Remplissez les deux champs" });
      return;
    }
    if (newPassword.length < 8) {
      Toast.show({ type: "error", text1: "Le mot de passe doit contenir au moins 8 caractères" });
      return;
    }

    setChangingPassword(true);
    try {
      await authAPI.changePassword({ old_password: oldPassword, new_password: newPassword });
      Toast.show({ type: "success", text1: "Mot de passe modifié" });
      setOldPassword("");
      setNewPassword("");
    } catch {
      Toast.show({ type: "error", text1: "Ancien mot de passe incorrect" });
    } finally {
      setChangingPassword(false);
    }
  };

  if (!user) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Avatar section */}
      <View style={styles.avatarSection}>
        <Avatar
          src={avatarUri || user.avatar}
          firstName={user.first_name}
          lastName={user.last_name}
          size={90}
        />
        <TouchableOpacity style={styles.changePhotoBtn} onPress={handlePickPhoto}>
          <Ionicons name="camera" size={16} color={colors.primary[600]} />
          <Text style={styles.changePhotoText}>Changer la photo</Text>
        </TouchableOpacity>
      </View>

      {/* Personal info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations personnelles</Text>

        <Input
          label="Prénom"
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Votre prénom"
        />
        <Input
          label="Nom"
          value={lastName}
          onChangeText={setLastName}
          placeholder="Votre nom"
        />
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="email@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Input
          label="Téléphone"
          value={user.phone}
          editable={false}
          placeholder="Téléphone"
          icon={<Ionicons name="lock-closed" size={16} color={colors.gray[300]} />}
        />
        <Input
          label="Ville"
          value={city}
          onChangeText={setCity}
          placeholder="Ex: Bamako"
        />
        <Input
          label="Quartier"
          value={neighborhood}
          onChangeText={setNeighborhood}
          placeholder="Ex: Hamdallaye"
        />

        <Button
          title="Enregistrer"
          onPress={handleSave}
          loading={saving}
          size="lg"
          style={{ marginTop: spacing.lg }}
        />
      </View>

      {/* Change password */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Changer le mot de passe</Text>

        <Input
          label="Ancien mot de passe"
          value={oldPassword}
          onChangeText={setOldPassword}
          placeholder="Mot de passe actuel"
          secureTextEntry
        />
        <Input
          label="Nouveau mot de passe"
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Nouveau mot de passe (8+ caractères)"
          secureTextEntry
        />

        <Button
          title="Changer le mot de passe"
          onPress={handleChangePassword}
          loading={changingPassword}
          variant="secondary"
          size="md"
          style={{ marginTop: spacing.md }}
        />
      </View>

      {/* Danger zone */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.red[500] }]}>Zone dangereuse</Text>
        <TouchableOpacity
          style={styles.dangerBtn}
          onPress={() =>
            Alert.alert(
              "Supprimer le compte",
              "Cette action est irréversible. Toutes vos données seront supprimées.",
              [
                { text: "Annuler", style: "cancel" },
                {
                  text: "Supprimer",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      await deleteAccount();
                      await logout();
                    } catch {
                      Toast.show({ type: "error", text1: "Erreur lors de la suppression" });
                    }
                  },
                },
              ]
            )
          }
        >
          <Ionicons name="trash-outline" size={18} color={colors.red[500]} />
          <Text style={styles.dangerText}>Supprimer mon compte</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  avatarSection: {
    alignItems: "center",
    paddingVertical: spacing["2xl"],
  },
  changePhotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.sm,
    padding: spacing.sm,
  },
  changePhotoText: {
    fontSize: fontSize.sm,
    color: colors.primary[600],
    fontWeight: fontWeight.medium,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.gray[800],
    marginBottom: spacing.md,
  },
  dangerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.red[100],
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.red[500],
  },
  dangerText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.red[500],
  },
});
