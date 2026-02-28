import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import { teachersAPI } from "@/api/services";
import { colors, spacing, radius, fontSize, fontWeight } from "@/utils/theme";
import Toast from "react-native-toast-message";
import type { TeacherProfile } from "@/types";

export default function EditTeacherProfileScreen() {
  const navigation = useNavigation();
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [bio, setBio] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [radiusKm, setRadiusKm] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [teachesOnline, setTeachesOnline] = useState(false);
  const [teachesAtHome, setTeachesAtHome] = useState(false);
  const [teachesAtStudent, setTeachesAtStudent] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await teachersAPI.getMyProfile();
      setProfile(data);
      setBio(data.bio || "");
      setHourlyRate(String(data.hourly_rate || ""));
      setCity(data.city || "");
      setNeighborhood(data.neighborhood || "");
      setRadiusKm(String(data.radius_km || ""));
      setExperienceYears(String(data.experience_years || ""));
      setTeachesOnline(data.teaches_online);
      setTeachesAtHome(data.teaches_at_home);
      setTeachesAtStudent(data.teaches_at_student);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("bio", bio.trim());
      formData.append("hourly_rate", hourlyRate);
      formData.append("city", city.trim());
      formData.append("neighborhood", neighborhood.trim());
      formData.append("radius_km", radiusKm);
      formData.append("experience_years", experienceYears);
      formData.append("teaches_online", String(teachesOnline));
      formData.append("teaches_at_home", String(teachesAtHome));
      formData.append("teaches_at_student", String(teachesAtStudent));

      await teachersAPI.updateMyProfile(formData);
      Toast.show({ type: "success", text1: "Profil mis à jour" });
      navigation.goBack();
    } catch {
      Toast.show({ type: "error", text1: "Erreur lors de la mise à jour" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Photo */}
      <View style={styles.photoSection}>
        <Avatar
          src={profile?.photo || null}
          firstName={profile?.user.first_name || ""}
          lastName={profile?.user.last_name || ""}
          size={90}
        />
        <TouchableOpacity style={styles.changePhotoBtn}>
          <Ionicons name="camera" size={16} color={colors.primary[600]} />
          <Text style={styles.changePhotoText}>Changer la photo</Text>
        </TouchableOpacity>
      </View>

      {/* Bio */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Présentation</Text>
        <TextInput
          style={styles.bioInput}
          value={bio}
          onChangeText={setBio}
          placeholder="Décrivez votre parcours, votre approche pédagogique..."
          placeholderTextColor={colors.gray[400]}
          multiline
          numberOfLines={5}
          maxLength={1000}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{bio.length}/1000</Text>
      </View>

      {/* Professional info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations professionnelles</Text>
        <Input
          label="Tarif horaire (FCFA)"
          value={hourlyRate}
          onChangeText={setHourlyRate}
          placeholder="Ex: 3000"
          keyboardType="numeric"
        />
        <Input
          label="Années d'expérience"
          value={experienceYears}
          onChangeText={setExperienceYears}
          placeholder="Ex: 5"
          keyboardType="numeric"
        />
      </View>

      {/* Location */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Localisation</Text>
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
          placeholder="Ex: Hamdallaye ACI 2000"
        />
        <Input
          label="Rayon de déplacement (km)"
          value={radiusKm}
          onChangeText={setRadiusKm}
          placeholder="Ex: 10"
          keyboardType="numeric"
        />
      </View>

      {/* Teaching modes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Modes d'enseignement</Text>
        {[
          { label: "En ligne", icon: "globe-outline" as const, value: teachesOnline, set: setTeachesOnline },
          { label: "À mon domicile", icon: "home-outline" as const, value: teachesAtHome, set: setTeachesAtHome },
          { label: "Chez l'élève", icon: "car-outline" as const, value: teachesAtStudent, set: setTeachesAtStudent },
        ].map((mode) => (
          <TouchableOpacity
            key={mode.label}
            style={[styles.modeItem, mode.value && styles.modeItemActive]}
            onPress={() => mode.set(!mode.value)}
          >
            <Ionicons
              name={mode.icon}
              size={20}
              color={mode.value ? colors.primary[600] : colors.gray[400]}
            />
            <Text
              style={[styles.modeText, mode.value && styles.modeTextActive]}
            >
              {mode.label}
            </Text>
            <Ionicons
              name={mode.value ? "checkmark-circle" : "ellipse-outline"}
              size={22}
              color={mode.value ? colors.primary[600] : colors.gray[300]}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Subjects */}
      {profile?.teacher_subjects && profile.teacher_subjects.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Matières enseignées</Text>
          <View style={styles.subjectsWrap}>
            {profile.teacher_subjects.map((ts, i) => (
              <Badge key={i} label={`${ts.subject.name} (${ts.level.name})`} variant="blue" />
            ))}
          </View>
        </View>
      )}

      {/* Save */}
      <View style={styles.section}>
        <Button
          title="Enregistrer les modifications"
          onPress={handleSave}
          loading={saving}
          size="lg"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  center: { alignItems: "center", justifyContent: "center" },
  photoSection: {
    alignItems: "center",
    paddingVertical: spacing["2xl"],
  },
  changePhotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.sm,
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
  bioInput: {
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
  modeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  modeItemActive: {
    borderColor: colors.primary[300],
    backgroundColor: colors.primary[50],
  },
  modeText: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.gray[600],
  },
  modeTextActive: {
    color: colors.primary[700],
    fontWeight: fontWeight.medium,
  },
  subjectsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
});
