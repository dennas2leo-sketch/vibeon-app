import { View, Text, FlatList, Image, TouchableOpacity, Modal, TextInput, ScrollView } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/lib/auth-context";

interface Conversation {
  id: number;
  userId: number;
  username: string;
  fullName: string;
  profilePhoto?: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
}

interface User {
  id: number;
  username: string;
  fullName: string;
  profilePhoto?: string;
  bio?: string;
}

interface Message {
  id: number;
  senderId: number;
  recipientId: number;
  text: string;
  createdAt: Date;
  sender?: {
    username: string;
    profilePhoto?: string;
  };
}

export default function MessagesScreen() {
  const router = useRouter();
  const { state } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [followingUsers, setFollowingUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Query for conversations
  const conversationsQuery = trpc.vibe.messages.getConversations.useQuery(
    undefined,
    { enabled: !!state.user?.id, refetchInterval: 3000 }
  );

  // Query for following users
  const getFollowingQuery = trpc.vibe.followers.getFollowing.useQuery(
    { userId: state.user?.id || 0 },
    { enabled: !!state.user?.id }
  );

  // Use conversations data directly from backend
  useEffect(() => {
    if (conversationsQuery.data && Array.isArray(conversationsQuery.data)) {
      console.log("[DEBUG] Conversations from backend:", conversationsQuery.data);
      setConversations(conversationsQuery.data as Conversation[]);
    } else {
      setConversations([]);
    }
    setLoading(false);
  }, [conversationsQuery.data]);

  // Process following users
  useEffect(() => {
    if (getFollowingQuery.data && Array.isArray(getFollowingQuery.data)) {
      const users = getFollowingQuery.data
        .map((f: any) => f.user)
        .filter((u: any) => u !== null && u !== undefined);
      console.log("[DEBUG] Following users:", users);
      setFollowingUsers(users);
    }
  }, [getFollowingQuery.data]);

  const handleNewMessage = () => {
    setShowUserSelector(true);
  };

  const handleSelectUser = (user: User) => {
    setShowUserSelector(false);
    // Navigate to chat screen with user ID
    router.push({
      pathname: "/chat/[userId]" as any,
      params: { userId: user.id.toString(), username: user.username },
    });
  };

  const handleOpenConversation = (userId: number, username: string) => {
    router.push({
      pathname: "/chat/[userId]" as any,
      params: { userId: userId.toString(), username },
    });
  };

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      onPress={() => handleOpenConversation(item.userId, item.username)}
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
            <Text className="text-lg">👤</Text>
          </View>
        )}
        <View className="flex-1">
          <Text
            className={`font-semibold text-sm ${
              item.unread ? "text-primary" : "text-foreground"
            }`}
          >
            {item.fullName}
          </Text>
          <Text className="text-muted text-xs">@{item.username}</Text>
          <Text className="text-muted text-xs mt-1" numberOfLines={1}>
            {item.lastMessage}
          </Text>
        </View>
      </View>
      <View className="items-end gap-2">
        <Text className="text-muted text-xs">{item.timestamp}</Text>
        {item.unread && <View className="w-2 h-2 rounded-full bg-primary" />}
      </View>
    </TouchableOpacity>
  );

  const renderUserOption = ({ item }: { item: User }) => (
    <TouchableOpacity
      onPress={() => handleSelectUser(item)}
      className="flex-row items-center gap-3 px-4 py-3 border-b border-border"
    >
      {item.profilePhoto ? (
        <Image
          source={{ uri: item.profilePhoto }}
          className="w-12 h-12 rounded-full bg-border"
        />
      ) : (
        <View className="w-12 h-12 rounded-full bg-border items-center justify-center">
          <Text className="text-lg">👤</Text>
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
    </TouchableOpacity>
  );

  return (
    <ScreenContainer className="p-0">
      {/* Header */}
      <View className="px-4 py-4 border-b border-border flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-foreground">Mensagens</Text>
        <TouchableOpacity
          onPress={handleNewMessage}
          className="bg-primary rounded-full w-10 h-10 items-center justify-center"
        >
          <Text className="text-background text-xl font-bold">+</Text>
        </TouchableOpacity>
      </View>

      {/* Conversations List */}
      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center justify-center py-12">
            <Text className="text-muted">Nenhuma conversa ainda</Text>
            <Text className="text-muted text-xs mt-2">Toque em + para começar</Text>
          </View>
        }
      />

      {/* User Selector Modal */}
      <Modal
        visible={showUserSelector}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUserSelector(false)}
      >
        <ScreenContainer className="bg-background">
          {/* Modal Header */}
          <View className="flex-row items-center justify-between p-4 border-b border-border">
            <Text className="text-foreground font-bold text-lg">Selecione um usuário</Text>
            <TouchableOpacity onPress={() => setShowUserSelector(false)}>
              <Text className="text-foreground text-lg font-bold">✕</Text>
            </TouchableOpacity>
          </View>

          {/* Users List */}
          <FlatList
            data={followingUsers}
            renderItem={renderUserOption}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View className="items-center justify-center py-12">
                <Text className="text-muted">Nenhum usuário para seguir</Text>
              </View>
            }
          />
        </ScreenContainer>
      </Modal>
    </ScreenContainer>
  );
}
