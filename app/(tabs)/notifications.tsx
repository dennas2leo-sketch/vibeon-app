import { useState, useEffect } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, RefreshControl } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth-context";
import { trpc } from "@/lib/trpc";

interface NotificationWithUser {
  id: number;
  userId: number;
  type: "like" | "comment" | "follow" | "message";
  relatedUserId?: number;
  relatedPostId?: number;
  isRead: number;
  createdAt: Date;
  user?: {
    id: number;
    username: string;
    fullName: string;
    profilePhoto?: string;
    bio?: string;
  };
}

export default function NotificationsScreen() {
  const { state } = useAuth();
  const [notifications, setNotifications] = useState<NotificationWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Query for notifications with polling
  const notificationsQuery = trpc.vibe.notifications.getNotifications.useQuery(
    undefined,
    { enabled: !!state.user?.id, refetchInterval: 3000 }
  );

  // Mutation to mark notification as read
  const markAsReadMutation = trpc.vibe.notifications.markAsRead.useMutation();

  // Use data directly from backend
  useEffect(() => {
    if (notificationsQuery.data && Array.isArray(notificationsQuery.data)) {
      console.log("[DEBUG] Notifications from backend:", notificationsQuery.data);
      setNotifications(notificationsQuery.data as NotificationWithUser[]);
    } else {
      setNotifications([]);
    }
    setLoading(false);
  }, [notificationsQuery.data]);

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await markAsReadMutation.mutateAsync({ notificationId });
      notificationsQuery.refetch();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await notificationsQuery.refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const getNotificationText = (notification: NotificationWithUser) => {
    const username = notification.user?.username || "Usuário";

    switch (notification.type) {
      case "follow":
        return `começou a te seguir`;
      case "like":
        return `curtiu seu post`;
      case "comment":
        return `comentou em seu post`;
      case "message":
        return `enviou uma mensagem`;
      default:
        return "Nova notificação";
    }
  };

  const renderNotification = ({ item }: { item: NotificationWithUser }) => (
    <TouchableOpacity
      onPress={() => handleMarkAsRead(item.id)}
      className={`flex-row items-stretch justify-between px-4 py-3 border-b border-border ${
        item.isRead === 0 ? "bg-surface" : "bg-background"
      }`}
    >
      {/* User Photo */}
      <View className="mr-3">
        {item.user?.profilePhoto ? (
          <Image
            source={{ uri: item.user.profilePhoto }}
            className="w-16 h-16 rounded-full bg-border"
          />
        ) : (
          <View className="w-16 h-16 rounded-full bg-border items-center justify-center">
            <Text className="text-2xl">👤</Text>
          </View>
        )}
      </View>

      {/* User Info and Notification Text */}
      <View className="flex-1">
        {/* Name and Username */}
        <View className="flex-row items-center gap-2 mb-1">
          <Text className="font-bold text-foreground text-sm" numberOfLines={1}>
            {item.user?.fullName || "Usuário"}
          </Text>
          <Text className="text-muted text-xs">@{item.user?.username || "unknown"}</Text>
        </View>

        {/* Bio */}
        {item.user?.bio && (
          <Text className="text-muted text-xs mb-2" numberOfLines={1}>
            {item.user.bio}
          </Text>
        )}

        {/* Notification Text */}
        <Text className="text-foreground text-sm">
          {getNotificationText(item)}
        </Text>

        {/* Timestamp */}
        <Text className="text-muted text-xs mt-2">
          {new Date(item.createdAt).toLocaleDateString("pt-BR")}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text className="text-muted">Carregando notificações...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-0">
      {notifications.length > 0 ? (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted text-lg">Nenhuma notificação</Text>
        </View>
      )}
    </ScreenContainer>
  );
}
