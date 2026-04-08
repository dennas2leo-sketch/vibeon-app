import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth-context";
import { ScreenContainer } from "@/components/screen-container";
import { Text, ActivityIndicator, View } from "react-native";

export default function RootIndex() {
  const router = useRouter();
  const { state } = useAuth();

  useEffect(() => {
    // Wait a tick to ensure the Root Layout is fully mounted
    const timeout = setTimeout(() => {
      if (state.isLoading) {
        return;
      }

      if (state.isAuthenticated) {
        router.replace("/(tabs)/feed");
      } else {
        router.replace("/login");
      }
    }, 0);

    return () => clearTimeout(timeout);
  }, [state.isAuthenticated, state.isLoading]);

  return (
    <ScreenContainer className="items-center justify-center">
      <View className="gap-4 items-center">
        <ActivityIndicator size="large" color="#FF006E" />
        <Text className="text-foreground text-sm">Carregando...</Text>
      </View>
    </ScreenContainer>
  );
}
