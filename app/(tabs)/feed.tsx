import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  RefreshControl,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth-context";
import { trpc } from "@/lib/trpc";

interface Post {
  id: number;
  userId: number;
  caption: string | null;
  imageUrl: string;
  likesCount: number;
  commentsCount: number;
  createdAt: Date;
  updatedAt?: Date;
  isLiked?: boolean;
  user?: {
    username: string;
    fullName: string;
    profilePhoto: string;
  };
}interface Comment {
  id: number;
  userId: number;
  postId: number;
  text: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
  user?: {
    username: string;
    fullName: string;
  };
}

export default function FeedScreen() {
  const { state } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const getFeedQuery = trpc.vibe.posts.getFeed.useQuery(
    { limit: 20 },
    { 
      enabled: !!state.user?.id,
      refetchInterval: 5000, // Atualizar a cada 5 segundos
    }
  );

  const likeMutation = trpc.vibe.posts.like.useMutation();
  const unlikeMutation = trpc.vibe.posts.unlike.useMutation();
  const addCommentMutation = trpc.vibe.posts.addComment.useMutation();
  const deleteMutation = trpc.vibe.posts.delete.useMutation();
  const getCommentQuery = trpc.vibe.posts.getComments.useQuery(
    { postId: selectedPost?.id || 0 },
    { enabled: !!selectedPost }
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await getFeedQuery.refetch();
    setRefreshing(false);
  };

  useEffect(() => {
    if (getFeedQuery.data) {
      setPosts(getFeedQuery.data);
    }
    setLoading(false);
  }, [getFeedQuery.data]);

  const handleLike = async (postId: number) => {
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      const hasLiked = (post as any).isLiked || false;

      if (hasLiked) {
        await unlikeMutation.mutateAsync({ postId });
        setPosts(posts.map(p => p.id === postId ? { ...p, likesCount: Math.max(0, p.likesCount - 1), isLiked: false } : p));
      } else {
        await likeMutation.mutateAsync({ postId });
        setPosts(posts.map(p => p.id === postId ? { ...p, likesCount: p.likesCount + 1, isLiked: true } : p));
      }
    } catch (error) {
      Alert.alert("Erro", "Falha ao curtir post");
    }
  };

  useEffect(() => {
    if (getCommentQuery.data) {
      setComments(getCommentQuery.data);
    }
  }, [getCommentQuery.data]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedPost) return;

    try {
      await addCommentMutation.mutateAsync({
        postId: selectedPost.id,
        text: newComment,
      });
      
      await getCommentQuery.refetch();
      setPosts(posts.map(p => p.id === selectedPost.id ? { ...p, commentsCount: p.commentsCount + 1 } : p));
      setNewComment("");
    } catch (error) {
      Alert.alert("Erro", "Falha ao adicionar comentário");
    }
  };

  const handleDeletePost = async (postId: number) => {
    console.log("[Feed] handleDeletePost called for postId:", postId, "state.user?.id:", state.user?.id);
    Alert.alert(
      "Excluir Post",
      "Tem certeza que deseja excluir este post?",
      [
        { text: "Cancelar", onPress: () => {}, style: "cancel" },
        {
          text: "Excluir",
          onPress: async () => {
            try {
              console.log("[Feed] Sending delete mutation for postId:", postId);
              await deleteMutation.mutateAsync({ postId });
              console.log("[Feed] Delete successful");
              setPosts(posts.filter(p => p.id !== postId));
              setSelectedPost(null);
              Alert.alert("Sucesso", "Post excluído com sucesso");
            } catch (error: any) {
              console.error("[Feed] Delete error:", error);
              Alert.alert("Erro", error.message || "Falha ao excluir post");
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const renderPost = ({ item }: { item: Post }) => {
    const canDelete = state.user?.id === item.userId;
    console.log("[Feed] Rendering post:", item.id, "userId:", item.userId, "state.user?.id:", state.user?.id, "canDelete:", canDelete);
    return (
    <View className="mb-4 bg-surface rounded-lg overflow-hidden border border-border">
      {/* Post Header */}
      <View className="flex-row items-center p-3 border-b border-border">
        <Image
          source={{ uri: item.user?.profilePhoto || "https://via.placeholder.com/40" }}
          className="w-10 h-10 rounded-full bg-border"
        />
        <View className="flex-1 ml-3">
          <Text className="text-foreground font-semibold text-sm">
            {item.user?.fullName}
          </Text>
          <Text className="text-muted text-xs">@{item.user?.username}</Text>
        </View>
      </View>

      {/* Post Image */}
      <TouchableOpacity onPress={() => setSelectedPost(item)}>
        <Image
          source={{ uri: item.imageUrl }}
          className="w-full bg-border"
          style={{ aspectRatio: 4 / 5 }}
        />
      </TouchableOpacity>

      {/* Post Caption */}
      {item.caption && (
        <View className="p-3 border-b border-border">
          <Text className="text-foreground text-sm">{item.caption}</Text>
        </View>
      )}

      {/* Post Actions */}
      <View className="flex-row justify-around p-3 border-b border-border">
        <TouchableOpacity
          onPress={() => handleLike(item.id)}
          className="flex-row items-center gap-2"
        >
          <Text className="text-lg">❤️</Text>
          <Text className="text-muted text-sm">{item.likesCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setSelectedPost(item)}
          className="flex-row items-center gap-2"
        >
          <Text className="text-lg">💬</Text>
          <Text className="text-muted text-sm">{item.commentsCount}</Text>
        </TouchableOpacity>
        {state.user?.id === item.userId && (
          <TouchableOpacity
            onPress={() => handleDeletePost(item.id)}
            className="flex-row items-center gap-2"
          >
            <Text className="text-lg">🗑️</Text>
            <Text className="text-muted text-sm">Excluir</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Quick Comment Preview */}
      <TouchableOpacity
        onPress={() => setSelectedPost(item)}
        className="p-3"
      >
        <Text className="text-primary text-sm font-semibold">
          Ver comentários
        </Text>
      </TouchableOpacity>
    </View>
    );
  };

  if (!state.user) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text className="text-foreground">Faça login para ver o feed</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-0">
      <View className="flex-1">
        {/* Feed Header */}
        <View className="px-4 py-3 border-b border-border">
          <Text className="text-foreground font-bold text-lg">Feed</Text>
        </View>

        {/* Posts List */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-muted">Carregando...</Text>
          </View>
        ) : posts.length > 0 ? (
          <FlatList
            data={posts}
            renderItem={renderPost}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ padding: 12 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            }
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-muted">Nenhum post no feed</Text>
          </View>
        )}
      </View>

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
            <View className="flex-row gap-3">
              {state.user?.id === selectedPost?.userId && (
                <TouchableOpacity onPress={() => handleDeletePost(selectedPost.id)}>
                  <Text className="text-lg">🗑️</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setSelectedPost(null)}>
                <Text className="text-foreground text-lg font-bold">✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Modal Content */}
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {selectedPost && (
              <View>
                {/* Post Header */}
                <View className="flex-row items-center p-4 border-b border-border">
                  <Image
                    source={{
                      uri: selectedPost.user?.profilePhoto || "https://via.placeholder.com/40",
                    }}
                    className="w-10 h-10 rounded-full bg-border"
                  />
                  <View className="flex-1 ml-3">
                    <Text className="text-foreground font-semibold text-sm">
                      {selectedPost.user?.fullName}
                    </Text>
                    <Text className="text-muted text-xs">
                      @{selectedPost.user?.username}
                    </Text>
                  </View>
                </View>

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
                          setPosts(posts.map(p => p.id === selectedPost.id ? { ...p, likesCount: Math.max(0, p.likesCount - 1), isLiked: false } : p));
                        } else {
                          await likeMutation.mutateAsync({ postId: selectedPost.id });
                          setSelectedPost({ ...selectedPost, likesCount: selectedPost.likesCount + 1, isLiked: true });
                          setPosts(posts.map(p => p.id === selectedPost.id ? { ...p, likesCount: p.likesCount + 1, isLiked: true } : p));
                        }
                      } catch (error) {
                        Alert.alert("Erro", "Falha ao curtir post");
                      }
                    }}
                    className="items-center"
                  >
                    <Text className="text-lg">❤️</Text>
                    <Text className="text-muted text-xs mt-1">
                      {selectedPost.likesCount}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity className="items-center">
                    <Text className="text-lg">💬</Text>
                    <Text className="text-muted text-xs mt-1">
                      {selectedPost.commentsCount}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Comments Section */}
                <View className="p-4">
                  <Text className="text-foreground font-semibold text-sm mb-3">
                    Comentários
                  </Text>

                  {/* Add Comment */}
                  <View className="flex-row gap-2 mb-4 pb-4 border-b border-border">
                    <TextInput
                      placeholder="Adicione um comentário..."
                      placeholderTextColor="#999"
                      value={newComment}
                      onChangeText={setNewComment}
                      className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-foreground"
                    />
                    <TouchableOpacity
                      onPress={handleAddComment}
                      className="bg-primary rounded-lg px-4 items-center justify-center"
                    >
                      <Text className="text-white font-semibold text-sm">
                        ✓
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Comments List */}
                  {comments.length > 0 ? (
                    comments.map((comment) => (
                      <View key={comment.id} className="mb-3 pb-3 border-b border-border">
                        <View className="flex-row items-center gap-2 mb-1">
                          <Text className="text-foreground font-semibold text-sm">
                            {comment.user?.fullName}
                          </Text>
                          <Text className="text-muted text-xs">
                            @{comment.user?.username}
                          </Text>
                        </View>
                        <Text className="text-foreground text-sm">
                          {comment.text}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text className="text-muted text-sm text-center py-4">
                      Nenhum comentário ainda
                    </Text>
                  )}
                </View>
              </View>
            )}
          </ScrollView>
        </ScreenContainer>
      </Modal>
    </ScreenContainer>
  );
}
