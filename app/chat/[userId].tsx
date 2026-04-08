import { View, Text, FlatList, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/lib/auth-context";

interface Message {
  id: number;
  senderId: number;
  recipientId: number;
  text: string;
  createdAt: Date;
}

export default function ChatScreen() {
  const router = useRouter();
  const { userId, username } = useLocalSearchParams();
  const { state } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const numUserId = parseInt(userId as string);

  // Query for conversation
  const conversationQuery = trpc.vibe.messages.getConversation.useQuery(
    { userId: numUserId },
    { enabled: !!state.user?.id && !!numUserId, refetchInterval: 1000 }
  );

  // Mutation to send message
  const sendMessageMutation = trpc.vibe.messages.send.useMutation();

  // Use messages data directly from backend
  useEffect(() => {
    if (conversationQuery.data && Array.isArray(conversationQuery.data)) {
      console.log("[DEBUG] Messages from backend:", conversationQuery.data);
      setMessages(conversationQuery.data as Message[]);
    } else {
      setMessages([]);
    }
    setLoading(false);
  }, [conversationQuery.data]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const messageText = newMessage.trim();
      setNewMessage("");
      
      // Add message to local state immediately
      const newMsg: Message = {
        id: Date.now(),
        senderId: state.user?.id || 0,
        recipientId: numUserId,
        text: messageText,
        createdAt: new Date(),
      };
      setMessages([...messages, newMsg]);
      
      // Send to server
      await sendMessageMutation.mutateAsync({
        recipientId: numUserId,
        text: messageText,
      });
      
      // Refetch messages from server
      await conversationQuery.refetch();
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.senderId === state.user?.id;

    return (
      <View
        className={`flex-row ${isOwn ? "justify-end" : "justify-start"} px-4 py-2`}
      >
        <View
          className={`max-w-xs px-3 py-2 rounded-lg ${
            isOwn ? "bg-primary" : "bg-surface"
          }`}
        >
          <Text className={isOwn ? "text-background" : "text-foreground"}>
            {item.text}
          </Text>
          <Text
            className={`text-xs mt-1 ${
              isOwn ? "text-background opacity-70" : "text-muted"
            }`}
          >
            {new Date(item.createdAt).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <ScreenContainer className="p-0">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-foreground text-lg">← Voltar</Text>
          </TouchableOpacity>
          <Text className="text-lg font-bold text-foreground">@{username}</Text>
          <View className="w-8" />
        </View>

        {/* Messages List */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-muted">Carregando mensagens...</Text>
          </View>
        ) : (
          <FlatList
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center">
                <Text className="text-muted">Nenhuma mensagem ainda</Text>
                <Text className="text-muted text-xs mt-2">Comece a conversa!</Text>
              </View>
            }
          />
        )}

        {/* Input Area */}
        <View className="flex-row items-center gap-2 px-4 py-3 border-t border-border">
          <TextInput
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Digite uma mensagem..."
            placeholderTextColor="#999"
            className="flex-1 bg-surface text-foreground px-3 py-2 rounded-full"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={!newMessage.trim() || sendMessageMutation.isPending}
            className={`w-10 h-10 rounded-full items-center justify-center ${
              newMessage.trim() ? "bg-primary" : "bg-border"
            }`}
          >
            <Text className="text-background text-lg font-bold">→</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}
