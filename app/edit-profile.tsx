import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth-context";
import { trpc } from "@/lib/trpc";
import * as ImagePicker from "expo-image-picker";
import { useState, useEffect } from "react";

export default function EditProfileScreen() {
  const router = useRouter();
  const { state, updateProfile: updateAuthProfile } = useAuth();
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const updateProfileMutation = trpc.vibe.auth.updateProfile.useMutation();

  useEffect(() => {
    if (state.user) {
      setFullName(state.user.fullName || "");
      setBio(state.user.bio || "");
      setProfilePhoto(state.user.profilePhoto || null);
    }
  }, [state.user]);

  const handlePickImage = async () => {
    try {
      console.log("[DEBUG] handlePickImage: Solicitando permissão");
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permissão Negada", "Você precisa permitir acesso à galeria");
        return;
      }

      console.log("[DEBUG] handlePickImage: Abrindo galeria");
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      console.log("[DEBUG] handlePickImage: Resultado", { canceled: result.canceled });

      if (result.canceled) {
        return;
      }

      if (!result.assets || result.assets.length === 0) {
        Alert.alert("Erro", "Nenhuma imagem selecionada");
        return;
      }

      const asset = result.assets[0];
      console.log("[DEBUG] handlePickImage: Asset", { hasBase64: !!asset.base64 });

      if (!asset.base64) {
        Alert.alert("Erro", "Não foi possível processar a imagem");
        return;
      }

      // Validar tipo de imagem (PNG ou JPG)
      const mimeType = asset.mimeType || "image/jpeg";
      if (!mimeType.includes("png") && !mimeType.includes("jpeg") && !mimeType.includes("jpg")) {
        Alert.alert("Erro", "Apenas imagens PNG e JPG são suportadas");
        return;
      }
      const base64Image = `data:${mimeType};base64,${asset.base64}`;
      setProfilePhoto(base64Image);
    } catch (error: any) {
      console.error("[DEBUG] handlePickImage error:", error);
      Alert.alert("Erro", error?.message || "Falha ao selecionar imagem");
    }
  };

  const handleTakePhoto = async () => {
    try {
      console.log("[DEBUG] handleTakePhoto: Solicitando permissão");
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permissão Negada", "Você precisa permitir acesso à câmera");
        return;
      }

      console.log("[DEBUG] handleTakePhoto: Abrindo câmera");
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      console.log("[DEBUG] handleTakePhoto: Resultado", { canceled: result.canceled });

      if (result.canceled) {
        return;
      }

      if (!result.assets || result.assets.length === 0) {
        Alert.alert("Erro", "Nenhuma foto capturada");
        return;
      }

      const asset = result.assets[0];
      console.log("[DEBUG] handleTakePhoto: Asset", { hasBase64: !!asset.base64 });

      if (!asset.base64) {
        Alert.alert("Erro", "Não foi possível processar a foto");
        return;
      }

      // Validar tipo de imagem (PNG ou JPG)
      const mimeType = asset.mimeType || "image/jpeg";
      if (!mimeType.includes("png") && !mimeType.includes("jpeg") && !mimeType.includes("jpg")) {
        Alert.alert("Erro", "Apenas imagens PNG e JPG são suportadas");
        return;
      }
      const base64Image = `data:${mimeType};base64,${asset.base64}`;
      setProfilePhoto(base64Image);
    } catch (error: any) {
      console.error("[DEBUG] handleTakePhoto error:", error);
      Alert.alert("Erro", error?.message || "Falha ao tirar foto");
    }
  };

  const handleSave = async () => {
    if (!state.user?.email) {
      Alert.alert("Erro", "Email não encontrado");
      return;
    }

    setIsLoading(true);
    try {
      let photoToSend: string | undefined = profilePhoto || undefined;

      // Limitar tamanho da imagem em base64 (máximo 5MB)
      if (photoToSend && photoToSend.startsWith("data:")) {
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (photoToSend.length > maxSize) {
          Alert.alert("Aviso", "Imagem muito grande (máximo 5MB). Mantendo foto anterior.");
          photoToSend = undefined;
        }
      }

      console.log("[DEBUG] handleSave: Atualizando perfil");
      const result = await updateProfileMutation.mutateAsync({
        email: state.user.email,
        profilePhoto: photoToSend,
        bio: bio || undefined,
        fullName: fullName || undefined,
      });

      if (result.success) {
        try {
          await updateAuthProfile({
            email: state.user!.email,
            profilePhoto: photoToSend,
            bio: bio || undefined,
            fullName: fullName || undefined,
          });
        } catch (contextError) {
          console.error("Error updating auth context:", contextError);
        }

        Alert.alert("Sucesso", "Perfil atualizado com sucesso!");
        router.back();
      } else {
        Alert.alert("Erro", result.message || "Falha ao atualizar perfil");
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      Alert.alert("Erro", error?.message || "Falha ao atualizar perfil");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-4 p-4">
          <Text className="text-2xl font-bold text-foreground">Editar Perfil</Text>

          {/* Profile Photo */}
          <View className="w-32 h-32 bg-surface rounded-lg overflow-hidden border border-border">
            {profilePhoto ? (
              <Image source={{ uri: profilePhoto }} className="w-full h-full" />
            ) : (
              <View className="flex-1 items-center justify-center">
                <Text className="text-muted">Sem foto</Text>
              </View>
            )}
          </View>

          {/* Photo Buttons */}
          <View className="gap-2">
            <TouchableOpacity
              onPress={handlePickImage}
              className="bg-primary py-3 px-4 rounded-lg active:opacity-80"
            >
              <Text className="text-background font-semibold text-center">Selecionar Foto</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleTakePhoto}
              className="bg-primary py-3 px-4 rounded-lg active:opacity-80"
            >
              <Text className="text-background font-semibold text-center">Tirar Foto</Text>
            </TouchableOpacity>
          </View>

          {/* Full Name Input */}
          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">Nome Completo</Text>
            <TextInput
              placeholder="Seu nome"
              placeholderTextColor="#999"
              value={fullName}
              onChangeText={setFullName}
              className="bg-surface border border-border rounded-lg p-3 text-foreground"
            />
          </View>

          {/* Bio Input */}
          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">Bio</Text>
            <TextInput
              placeholder="Sua bio"
              placeholderTextColor="#999"
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={3}
              className="bg-surface border border-border rounded-lg p-3 text-foreground"
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={isLoading}
            className={`py-3 px-4 rounded-lg ${isLoading ? "bg-muted opacity-50" : "bg-primary"}`}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-background font-semibold text-center">Salvar</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
