import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter } from "expo-router";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@/server/routers";
import { trpc } from "@/lib/trpc";
import { getApiBaseUrl } from "@/constants/oauth";
import { useAuth } from "@/lib/auth-context";

interface User {
  id: number;
  username: string;
  fullName: string;
  profilePhoto?: string | null;
  bio?: string | null;
  isFollowing?: boolean;
}

export default function SearchScreen() {
  const router = useRouter();
  const { state } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Get current user's following list
  const getFollowingQuery = trpc.vibe.followers.getFollowing.useQuery(
    { userId: state.user?.id || 0 },
    { enabled: !!state.user?.id }
  );

  // Follow mutation
  const followMutation = trpc.vibe.followers.follow.useMutation();
  const unfollowMutation = trpc.vibe.followers.unfollow.useMutation();

  // Update search results with isFollowing status
  useEffect(() => {
    if (getFollowingQuery.data && searchResults.length > 0) {
      const followingIds = getFollowingQuery.data.map((f: any) => f.followingId);
      setSearchResults(
        searchResults.map((user) => ({
          ...user,
          isFollowing: followingIds.includes(user.id),
        }))
      );
    }
  }, [getFollowingQuery.data]);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    setHasSearched(true);

    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const baseUrl = getApiBaseUrl() || "http://localhost:3000";
      const client = trpc.createClient({
        links: [
          httpBatchLink({
            url: `${baseUrl}/api/trpc`,
            transformer: superjson,
            fetch(url, options) {
              return fetch(url, {
                ...options,
                credentials: "include",
              });
            },
          }),
        ],
      });

      const users = await client.vibe.auth.searchUsers.query({ q: query });
      
      // Check if current user is following each result
      const followingIds = getFollowingQuery.data?.map((f: any) => f.followingId) || [];
      
      setSearchResults(
        users.map((user: any) => ({
          ...user,
          isFollowing: followingIds.includes(user.id),
        }))
      );
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, [getFollowingQuery.data]);

  const handleUserPress = (userId: number) => {
    // TODO: Abrir perfil do usuário em tempo real
    // router.push(`/user/${userId}`);
  };

  const handleToggleFollow = async (userId: number) => {
    if (!state.user?.id) {
      Alert.alert("Erro", "Faça login para seguir usuários");
      return;
    }

    try {
      const user = searchResults.find((u) => u.id === userId);
      if (!user) return;

      if (user.isFollowing) {
        // Unfollow
        await unfollowMutation.mutateAsync({
          userId: userId,
        });
      } else {
        // Follow
        await followMutation.mutateAsync({
          userId: userId,
        });
      }

      // Update local state
      setSearchResults(
        searchResults.map((u) =>
          u.id === userId ? { ...u, isFollowing: !u.isFollowing } : u
        )
      );

      // Refetch following list
      await getFollowingQuery.refetch();
    } catch (error) {
      console.error("Error toggling follow:", error);
      Alert.alert("Erro", "Falha ao seguir/deseguir usuário");
    }
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      onPress={() => handleUserPress(item.id)}
      className="flex-row items-center justify-between px-4 py-3 border-b border-border bg-surface"
    >
      <View className="flex-row items-center gap-3 flex-1">
        {item.profilePhoto ? (
          <Image
            source={{ uri: item.profilePhoto }}
            className="w-12 h-12 rounded-full bg-border"
          />
        ) : (
          <View className="w-12 h-12 rounded-full bg-border items-center justify-center">
            <Text className="text-foreground font-bold">👤</Text>
          </View>
        )}
        <View className="flex-1">
          <Text className="font-semibold text-sm text-foreground">@{item.username}</Text>
          <Text className="text-muted text-xs">{item.fullName}</Text>
          {item.bio && (
            <Text className="text-muted text-xs mt-1" numberOfLines={1}>
              {item.bio}
            </Text>
          )}
        </View>
      </View>
      <TouchableOpacity
        onPress={() => handleToggleFollow(item.id)}
        className={`rounded-full px-4 py-2 ${
          item.isFollowing ? "bg-surface border border-border" : "bg-primary"
        }`}
      >
        <Text
          className={`text-xs font-semibold ${
            item.isFollowing ? "text-foreground" : "text-white"
          }`}
        >
          {item.isFollowing ? "Seguindo" : "Seguir"}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer className="p-0">
      <View className="px-4 py-4 border-b border-border gap-3">
        <Text className="text-2xl font-bold text-foreground">Buscar</Text>
        <TextInput
          placeholder="Buscar usuários..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={handleSearch}
          className="bg-surface border border-border rounded-full px-4 py-2 text-foreground"
        />
      </View>

      {!hasSearched ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted text-center px-4">Digite para buscar usuários</Text>
        </View>
      ) : loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF006E" />
        </View>
      ) : searchResults.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">
            {searchQuery.trim() ? "Nenhum usuário encontrado" : "Digite para buscar"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={searchResults}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenContainer>
  );
}
