import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { teachersAPI } from "@/api/services";
import TeacherCard from "@/components/teachers/TeacherCard";
import { colors, spacing, radius } from "@/utils/theme";
import type { TeacherListItem, SearchFilters } from "@/types";

export default function SearchScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const [query, setQuery] = useState(route.params?.q || "");
  const [results, setResults] = useState<TeacherListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const filters: SearchFilters = {
    q: query || undefined,
    subject: route.params?.subject,
    city: "Bamako",
    ordering: "-avg_rating",
    page,
  };

  const fetchResults = useCallback(
    async (f: SearchFilters, append = false) => {
      setLoading(true);
      try {
        const data = await teachersAPI.search(f);
        if (append) {
          setResults((prev) => [...prev, ...data.results]);
        } else {
          setResults(data.results);
        }
        setTotalCount(data.count);
        setHasMore(!!data.next);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchResults({ ...filters, page: 1 });
    setPage(1);
  }, [query, route.params?.subject]);

  const loadMore = () => {
    if (!hasMore || loading) return;
    const next = page + 1;
    setPage(next);
    fetchResults({ ...filters, page: next }, true);
  };

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.gray[400]} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher un professeur..."
            placeholderTextColor={colors.gray[400]}
            style={styles.searchInput}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Ionicons
              name="close-circle"
              size={18}
              color={colors.gray[300]}
              onPress={() => setQuery("")}
            />
          )}
        </View>
        {!loading && (
          <Text style={styles.resultCount}>
            {totalCount} professeur{totalCount !== 1 ? "s" : ""} trouvé
            {totalCount !== 1 ? "s" : ""}
          </Text>
        )}
      </View>

      {/* Results */}
      <FlatList
        data={results}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <TeacherCard
            teacher={item}
            onPress={() =>
              navigation.navigate("TeacherDetail", { id: item.id })
            }
          />
        )}
        contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: 100 }}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Ionicons name="search" size={48} color={colors.gray[200]} />
              <Text style={styles.emptyTitle}>Aucun résultat</Text>
              <Text style={styles.emptyDesc}>
                Essayez de modifier votre recherche
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loading ? (
            <ActivityIndicator
              size="small"
              color={colors.primary[500]}
              style={{ marginVertical: 20 }}
            />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  searchBarContainer: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.gray[50],
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.gray[900],
  },
  resultCount: {
    fontSize: 12,
    color: colors.gray[400],
    marginTop: spacing.sm,
  },
  empty: {
    alignItems: "center",
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.gray[600],
    marginTop: 16,
  },
  emptyDesc: {
    fontSize: 13,
    color: colors.gray[400],
    marginTop: 4,
  },
});
