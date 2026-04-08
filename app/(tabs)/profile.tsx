import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useQueryClient } from "@tanstack/react-query";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  Share,
  FlatList,
  Modal,
  TextInput,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "expo-router";

interface Post {
  id: number;
  imageUrl: string;
  caption: string | null;
  likesCount: number;
  commentsCount?: number;
  userId?: number;
  isLiked?: boolean;
  user?: {
    username: string;
    fullName: string;
    profilePhoto: string;
  };
}

interface Stats {
  posts: number;
  followers: number;
  following: number;
}

interface User {
  id: number;
  username: string;
  fullName: string;
  profilePhoto?: string | null;
  bio?: string | null;
}

export default function ProfileScreen() {
  const { state, logout } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState<Stats>({
    posts: 0,
    followers: 0,
    following: 0,
  });
  const [activeTab, setActiveTab] = useState<"posts" | "followers" | "following">("posts");
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [followingUsers, setFollowingUsers] = useState<User[]>([]);
  const [followerUsers, setFollowerUsers] = useState<User[]>([]);

  const getUserPostsQuery = trpc.vibe.posts.getUserPosts.useQuery(
    { userId: state.user?.id || 0 },
    { enabled: !!state.user?.id }
  );

  const getFollowersQuery = trpc.vibe.followers.getFollowers.useQuery(
    { userId: state.user?.id || 0 },
    { enabled: !!state.user?.id, refetchInterval: 2000 }
  );

  const getFollowingQuery = trpc.vibe.followers.getFollowing.useQuery(
    { userId: state.user?.id || 0 },
    { enabled: !!state.user?.id, refetchInterval: 2000 }
  );

  const likeMutation = trpc.vibe.posts.like.useMutation();
  const unlikeMutation = trpc.vibe.posts.unlike.useMutation();
  const addCommentMutation = trpc.vibe.posts.addComment.useMutation();
  const getCommentQuery = trpc.vibe.posts.getComments.useQuery(
    { postId: selectedPost?.id || 0 },
    { enabled: !!selectedPost }
  );

  useEffect(() => {
    if (getCommentQuery.data) {
      setComments(getCommentQuery.data);
    }
  }, [getCommentQuery.data]);

  // Process following data directly from query
  useEffect(() => {
    if (getFollowingQuery.data && Array.isArray(getFollowingQuery.data)) {
      console.log("[DEBUG] Following query data:", getFollowingQuery.data);
      const users = getFollowingQuery.data
        .map((f: any) => f.user)
        .filter((u: any) => u !== null && u !== undefined);
      console.log("[DEBUG] Following users processed:", users);
      setFollowingUsers(users);
    }
  }, [getFollowingQuery.data]);

  // Process followers data directly from query
  useEffect(() => {
    if (getFollowersQuery.data && Array.isArray(getFollowersQuery.data)) {
      console.log("[DEBUG] Followers query data:", getFollowersQuery.data);
      const users = getFollowersQuery.data
        .map((f: any) => f.user)
        .filter((u: any) => u !== null && u !== undefined);
      console.log("[DEBUG] Followers users processed:", users);
      setFollowerUsers(users);
    }
  }, [getFollowersQuery.data]);

  useEffect(() => {
    if (getUserPostsQuery.data) {
      setPosts(getUserPostsQuery.data);
      setStats({
        posts: getUserPostsQuery.data.length,
        followers: getFollowersQuery.data?.length || 0,
        following: getFollowingQuery.data?.length || 0,
      });
    }
    setLoading(false);
  }, [getUserPostsQuery.data, getFollowersQuery.data, getFollowingQuery.data]);

  const handleLogout = () => {
    Alert.alert("Sair", "Tem certeza que deseja sair?", [
      { text: "Cancelar", onPress: () => {} },
      {
        text: "Sair",
        onPress: async () => {
          await logout();
          router.replace("/login");
        },
      },
    ]);
  };

  const handleEditProfile = () => {
    router.push("/edit-profile");
  };

  const handleShare = async () => {
    try {
      const profileLink = `vibeonsoc://profile/${state.user?.username}`;
      await Share.share({
        message: `Confira meu perfil no VibeOn! @${state.user?.username}`,
        url: profileLink,
        title: `Perfil de ${state.user?.fullName}`,
      });
    } catch (error) {
      Alert.alert("Erro", "Falha ao compartilhar perfil");
    }
  };

  const renderPost = ({ item }: { item: Post }) => (
    <TouchableOpacity
      onPress={() => setSelectedPost(item)}
      className="flex-1 m-1 bg-border rounded-lg overflow-hidden"
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: item.imageUrl }}
        className="w-full h-32 bg-border"
      />
      <View className="p-2 bg-surface items-center">
        <Text className="text-muted text-xs font-semibold">❤️ {item.likesCount}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderUserItem = ({ item }: { item: User }) => (
    <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
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
          <Text className="font-semibold text-sm text-foreground">{item.fullName}</Text>
          <Text className="text-muted text-xs">@{item.username}</Text>
          {item.bio && (
            <Text className="text-muted text-xs mt-1" numberOfLines={1}>
              {item.bio}
            </Text>
          )}
        </View>
      </View>
    </View>
  );

  if (!state.user) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text className="text-foreground">Faça login para ver seu perfil</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-0">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Logout Button - Top */}
        <View className="px-4 py-3 flex-row justify-end border-b border-border">
          <TouchableOpacity onPress={handleLogout}>
            <Text className="text-error font-semibold text-sm">Sair</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Header */}
        <View className="px-4 py-6 border-b border-border">
          {/* Profile Photo and Info */}
          <View className="flex-row items-center gap-4 mb-4">
            <Image
              source={{ uri: state.user.profilePhoto || "https://via.placeholder.com/80" }}
              className="w-20 h-20 rounded-full bg-border"
            />
            <View className="flex-1">
              <Text className="text-foreground font-bold text-lg">
                {state.user.fullName}
              </Text>
              <Text className="text-muted text-sm">@{state.user.username}</Text>
              {state.user.bio && (
                <Text className="text-muted text-xs mt-2">{state.user.bio}</Text>
              )}
            </View>
          </View>

          {/* Stats */}
          <View className="flex-row justify-around mb-4">
            <TouchableOpacity onPress={() => setActiveTab("posts")} className="items-center">
              <Text className="text-foreground font-bold text-lg">{stats.posts}</Text>
              <Text className="text-muted text-xs">Posts</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab("followers")} className="items-center">
              <Text className="text-foreground font-bold text-lg">{stats.followers}</Text>
              <Text className="text-muted text-xs">Seguidores</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab("following")} className="items-center">
              <Text className="text-foreground font-bold text-lg">{stats.following}</Text>
              <Text className="text-muted text-xs">Seguindo</Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={handleEditProfile}
              className="flex-1 bg-primary rounded-lg py-2 items-center"
            >
              <Text className="text-background font-semibold">Editar Perfil</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleShare}
              className="flex-1 bg-surface rounded-lg py-2 items-center border border-border"
            >
              <Text className="text-foreground font-semibold">Compartilhar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Posts Grid */}
        {activeTab === "posts" && (
          <View className="px-0 py-4">
            {posts.length > 0 ? (
              <FlatList
                data={posts}
                renderItem={renderPost}
                keyExtractor={(item) => item.id.toString()}
                numColumns={3}
                scrollEnabled={false}
              />
            ) : (
              <View className="items-center justify-center py-12">
                <Text className="text-muted text-sm">Nenhum post ainda</Text>
              </View>
            )}
          </View>
        )}

        {/* Followers List */}
        {activeTab === "followers" && (
          <View className="px-0 py-4">
            {followerUsers.length > 0 ? (
              <FlatList
                data={followerUsers}
                renderItem={renderUserItem}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
              />
            ) : (
              <View className="items-center justify-center py-12">
                <Text className="text-muted text-sm">Nenhum seguidor ainda</Text>
              </View>
            )}
          </View>
        )}

        {/* Following List */}
        {activeTab === "following" && (
          <View className="px-0 py-4">
            {followingUsers.length > 0 ? (
              <FlatList
                data={followingUsers}
                renderItem={renderUserItem}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
              />
            ) : (
              <View className="items-center justify-center py-12">
                <Text className="text-muted text-sm">Não está seguindo ninguém</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Post Detail Modal */}
      <Modal
        visible={!!selectedPost}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedPost(null)}
      >
        <ScreenContainer className="bg-background">
          {/* Modal Header */}
          <View className="flex-row items-center justify-between p-4 border-b border-border">
            <Text className="text-foreground font-bold text-lg">Post</Text>
            <TouchableOpacity onPress={() => setSelectedPost(null)}>
              <Text className="text-foreground text-lg font-bold">✕</Text>
            </TouchableOpacity>
          </View>

          {/* Modal Content */}
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {selectedPost && (
              <View>
                {/* Post Image */}
                <Image
                  source={{ uri: selectedPost.imageUrl }}
                  className="w-full bg-border"
                  style={{ aspectRatio: 4 / 5 }}
                />

                {/* Post Caption */}
                {selectedPost.caption && (
                  <View className="p-4 border-b border-border">
                    <Text className="text-foreground text-base">
                      {selectedPost.caption}
                    </Text>
                  </View>
                )}

                {/* Post Stats */}
                <View className="flex-row justify-around p-4 border-b border-border">
                  <TouchableOpacity
                    onPress={async () => {
                      try {
                        const hasLiked = (selectedPost as any).isLiked || false;
                        if (hasLiked) {
                          await unlikeMutation.mutateAsync({ postId: selectedPost.id });
                          setSelectedPost({ ...selectedPost, likesCount: Math.max(0, selectedPost.likesCount - 1), isLiked: false });
                        } else {
                          await likeMutation.mutateAsync({ postId: selectedPost.id });
                          setSelectedPost({ ...selectedPost, likesCount: selectedPost.likesCount + 1, isLiked: true });
                        }
                        // Refetch posts to sync with list
                        getUserPostsQuery.refetch();
                      } catch (error) {
                        console.error("Error liking post:", error);
                      }
                    }}
                    className="items-center"
                  >
                    <Text className="text-2xl">
                      {(selectedPost as any).isLiked ? "❤️" : "🤍"}
                    </Text>
                    <Text className="text-muted text-xs mt-1">{selectedPost.likesCount}</Text>
                  </TouchableOpacity>
                  <View className="items-center">
                    <Text className="text-2xl">💬</Text>
                    <Text className="text-muted text-xs mt-1">
                      {selectedPost.commentsCount || 0}
                    </Text>
                  </View>
                </View>

                {/* Comments Section */}
                <View className="p-4 border-b border-border">
                  <Text className="text-foreground font-semibold mb-3">Comentários</Text>
                  {comments.length > 0 ? (
                    <View className="gap-3 mb-4">
                      {comments.map((comment: any) => (
                        <View key={comment.id} className="bg-surface rounded-lg p-3">
                          <View className="flex-row items-center gap-2 mb-2">
                            {comment.user?.profilePhoto ? (
                              <Image
                                source={{ uri: comment.user.profilePhoto }}
                                className="w-8 h-8 rounded-full"
                              />
                            ) : (
                              <View className="w-8 h-8 rounded-full bg-border items-center justify-center">
                                <Text className="text-xs">👤</Text>
                              </View>
                            )}
                            <View className="flex-1">
                              <Text className="text-foreground font-semibold text-sm">
                                {comment.user?.fullName || "Usuário"}
                              </Text>
                              <Text className="text-muted text-xs">
                                @{comment.user?.username || "unknown"}
                              </Text>
                            </View>
                          </View>
                          <Text className="text-foreground text-sm">{comment.text}</Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text className="text-muted text-sm mb-4">Nenhum comentário ainda</Text>
                  )}

                  {/* Add Comment */}
                  <View className="flex-row gap-2">
                    <TextInput
                      placeholder="Adicionar comentário..."
                      placeholderTextColor="#999"
                      value={newComment}
                      onChangeText={setNewComment}
                      className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                    />
                    <TouchableOpacity
                      onPress={async () => {
                        if (newComment.trim() && selectedPost) {
                          try {
                            await addCommentMutation.mutateAsync({
                              postId: selectedPost.id,
                              text: newComment,
                            });
                            setNewComment("");
                            getCommentQuery.refetch();
                          } catch (error) {
                            console.error("Error adding comment:", error);
                          }
                        }
                      }}
                      className="bg-primary rounded-lg px-4 items-center justify-center"
                    >
                      <Text className="text-background font-semibold">Enviar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        </ScreenContainer>
      </Modal>
    </ScreenContainer>
  );
}
