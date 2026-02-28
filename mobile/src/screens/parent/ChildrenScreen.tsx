import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { childrenAPI } from "@/api/services";
import { colors, spacing, radius, fontSize, fontWeight } from "@/utils/theme";
import { formatDate } from "@/utils/helpers";
import Toast from "react-native-toast-message";
import type { Child } from "@/types";

export default function ChildrenScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [school, setSchool] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await childrenAPI.list();
      setChildren(res.results);
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

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleAdd = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Toast.show({ type: "error", text1: "Prénom et nom requis" });
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("first_name", firstName.trim());
      formData.append("last_name", lastName.trim());
      if (dob.trim()) formData.append("date_of_birth", dob.trim());
      if (school.trim()) formData.append("school", school.trim());

      await childrenAPI.create(formData);
      Toast.show({ type: "success", text1: "Enfant ajouté" });
      setShowModal(false);
      setFirstName("");
      setLastName("");
      setDob("");
      setSchool("");
      await load();
    } catch {
      Toast.show({ type: "error", text1: "Erreur lors de l'ajout" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (child: Child) => {
    Alert.alert(
      "Retirer l'enfant",
      `Retirer ${child.first_name} ${child.last_name} de votre liste ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Retirer",
          style: "destructive",
          onPress: async () => {
            try {
              await childrenAPI.delete(child.id);
              setChildren((prev) => prev.filter((c) => c.id !== child.id));
              Toast.show({ type: "success", text1: "Enfant retiré" });
            } catch {
              Toast.show({ type: "error", text1: "Erreur" });
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={children}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}
        ListHeaderComponent={
          <Text style={styles.subtitle}>
            Gérez les profils de vos enfants pour un suivi personnalisé
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Avatar
              src={item.avatar}
              firstName={item.first_name}
              lastName={item.last_name}
              size={56}
            />
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>
                {item.first_name} {item.last_name}
              </Text>
              {item.level && (
                <Text style={styles.cardLevel}>Niveau: {item.level.name}</Text>
              )}
              {item.school && (
                <Text style={styles.cardSchool}>
                  <Ionicons name="school" size={12} color={colors.gray[400]} />{" "}
                  {item.school}
                </Text>
              )}
              {item.date_of_birth && (
                <Text style={styles.cardDob}>
                  Né(e) le {formatDate(item.date_of_birth)}
                </Text>
              )}
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.cardBtn}
                onPress={() =>
                  navigation.navigate("ChildProgress", {
                    childId: item.id,
                    childName: item.first_name,
                  })
                }
              >
                <Ionicons name="bar-chart-outline" size={18} color={colors.primary[600]} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cardBtn}
                onPress={() => handleDelete(item)}
              >
                <Ionicons name="trash-outline" size={18} color={colors.red[500]} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={60} color={colors.gray[300]} />
            <Text style={styles.emptyTitle}>Aucun enfant enregistré</Text>
            <Text style={styles.emptySubtitle}>
              Ajoutez vos enfants pour suivre leur progression scolaire
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity style={[styles.fab, { bottom: Math.max(insets.bottom, 20) + 60 }]} onPress={() => setShowModal(true)}>
        <Ionicons name="add" size={28} color={colors.white} />
      </TouchableOpacity>

      {/* Add child modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ajouter un enfant</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={colors.gray[500]} />
              </TouchableOpacity>
            </View>

            <Input
              label="Prénom"
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Prénom de l'enfant"
            />
            <Input
              label="Nom"
              value={lastName}
              onChangeText={setLastName}
              placeholder="Nom de l'enfant"
            />
            <Input
              label="Date de naissance (optionnel)"
              value={dob}
              onChangeText={setDob}
              placeholder="AAAA-MM-JJ"
            />
            <Input
              label="École (optionnel)"
              value={school}
              onChangeText={setSchool}
              placeholder="Nom de l'école"
            />

            <Button
              title="Ajouter"
              onPress={handleAdd}
              loading={submitting}
              size="lg"
              style={{ marginTop: spacing.lg }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  center: { alignItems: "center", justifyContent: "center" },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: radius.xl,
    marginBottom: spacing.md,
  },
  cardInfo: { flex: 1 },
  cardName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
  },
  cardLevel: {
    fontSize: fontSize.sm,
    color: colors.primary[600],
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },
  cardSchool: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginTop: 2,
  },
  cardDob: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    marginTop: 2,
  },
  cardActions: {
    gap: spacing.sm,
  },
  cardBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray[100],
    alignItems: "center",
    justifyContent: "center",
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[600],
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.gray[700],
    marginTop: spacing.lg,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    textAlign: "center",
    marginTop: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
  },
});
