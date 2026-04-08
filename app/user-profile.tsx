import { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth-context";
import { trpc } from "@/lib/trpc";

interface Post {
  id: number;
  imageUrl: string;
  caption: string;
  likesCount: number;
  commentsCount: number;
  timestamp: string;
}

export default function UserProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const { state } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        // TODO: Implement getUserProfile endpoint
        // For now, use mock data
        setUser({
          username: username || "usuário",
          fullName: "Nome do Usuário",
          bio: "Bio do usuário",
          profilePhoto: "https://via.placeholder.com/100",
          followersCount: 0,
          followingCount: 0,
          postsCount: 0,
        });
      } catch (error) {
        console.error("Error fetching profile:", error);
        Alert.alert("Erro", "Falha ao carregar perfil");
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchProfile();
    }
  }, [username]);

  const followMutation = trpc.vibe.followers.follow.useMutation();
  const unfollowMutation = trpc.vibe.followers.unfollow.useMutation();

  const handleFollowToggle = async () => {
    try {
      if (!user) return;

      if (isFollowing) {
        // Unfollow
        await unfollowMutation.mutateAsync({ userId: user.id });
      } else {
        // Follow
        await followMutation.mutateAsync({ userId: user.id });
      }

      setIsFollowing(!isFollowing);
      Alert.alert("Sucesso", isFollowing ? "Deixou de seguir" : "Agora você segue este usuário");
    } catch (error) {
      console.error("Error toggling follow:", error);
      Alert.alert("Erro", "Falha ao seguir/deixar de seguir usuário");
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // TODO: Refetch user profile and posts
    } finally {
      setRefreshing(false);
    }
  };

  const renderPost = ({ item }: { item: Post }) => (
    <TouchableOpacity className="flex-1 bg-border m-1 rounded-lg overflow-hidden">
      <Image
        source={{ uri: item.imageUrl }}
        className="w-full h-32"
        style={{ aspectRatio: 1 }}
      />
      <View className="absolute bottom-0 right-0 bg-black/50 px-2 py-1 rounded">
        <Text className="text-white text-xs">❤️ {item.likesCount}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text className="text-foreground">Carregando...</Text>
      </ScreenContainer>
    );
  }

  if (!user) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text className="text-foreground">Usuário não encontrado</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 bg-primary px-6 py-2 rounded-full"
        >
          <Text className="text-background font-semibold">Voltar</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-0">
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id.toString()}
        numColumns={3}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View className="bg-surface border-b border-border">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-4">
              <TouchableOpacity onPress={() => router.back()}>
                <Text className="text-primary text-xl">←</Text>
              </TouchableOpacity>
              <Text className="text-foreground font-semibold flex-1 text-center">
                @{user.username}
              </Text>
              <TouchableOpacity>
                <Text className="text-primary text-xl">⋮</Text>
              </TouchableOpacity>
            </View>

            {/* Profile Info */}
            <View className="px-4 pb-4">
              <View className="flex-row items-center gap-4 mb-4">
                <Image
                  source={{ uri: user.profilePhoto }}
                  className="w-20 h-20 rounded-full bg-border"
                />
                <View className="flex-1">
                  <Text className="text-foreground font-semibold text-lg">{user.fullName}</Text>
                  <Text className="text-muted text-sm">@{user.username}</Text>
                  <Text className="text-muted text-sm mt-1">{user.bio}</Text>
                </View>
              </View>

              {/* Stats */}
              <View className="flex-row justify-around mb-4 bg-background rounded-lg py-3">
                <View className="items-center">
                  <Text className="text-foreground font-semibold">{user.postsCount}</Text>
                  <Text className="text-muted text-xs">Posts</Text>
                </View>
                <View className="items-center">
                  <Text className="text-foreground font-semibold">{user.followersCount}</Text>
                  <Text className="text-muted text-xs">Seguidores</Text>
                </View>
                <View className="items-center">
                  <Text className="text-foreground font-semibold">{user.followingCount}</Text>
                  <Text className="text-muted text-xs">Seguindo</Text>
                </View>
              </View>

              {/* Follow Button */}
              {state.user?.id !== user.id && (
                <TouchableOpacity
                  onPress={handleFollowToggle}
                  className={`py-2 rounded-full ${
                    isFollowing
                      ? "bg-border border border-primary"
                      : "bg-primary"
                  }`}
                >
                  <Text
                    className={`text-center font-semibold ${
                      isFollowing ? "text-primary" : "text-background"
                    }`}
                  >
                    {isFollowing ? "Seguindo" : "Seguir"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Posts Header */}
            <View className="px-4 py-3 border-t border-border">
              <Text className="text-foreground font-semibold text-sm">Posts</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-12">
            <Text className="text-muted">Nenhum post para mostrar</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}
