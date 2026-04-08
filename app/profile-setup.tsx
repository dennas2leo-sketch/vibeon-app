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
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth-context";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";

export default function ProfileSetupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { updateProfile } = useAuth();

  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const email = (params.email as string) || "";

  const pickImage = async () => {
    try {
      console.log("[DEBUG] pickImage: Solicitando permissão");
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permissão Negada", "Você precisa permitir acesso à galeria");
        return;
      }

      console.log("[DEBUG] pickImage: Abrindo galeria");
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.4,
        base64: true,
      });

      console.log("[DEBUG] pickImage: Resultado", { canceled: result.canceled });

      if (result.canceled) {
        return;
      }

      if (!result.assets || result.assets.length === 0) {
        Alert.alert("Erro", "Nenhuma imagem selecionada");
        return;
      }

      const asset = result.assets[0];
      console.log("[DEBUG] pickImage: Asset", { hasBase64: !!asset.base64 });

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
      console.error("[DEBUG] pickImage error:", error);
      Alert.alert("Erro", error?.message || "Falha ao selecionar imagem");
    }
  };

  const takePhoto = async () => {
    try {
      console.log("[DEBUG] takePhoto: Solicitando permissão");
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permissão Negada", "Você precisa permitir acesso à câmera");
        return;
      }

      console.log("[DEBUG] takePhoto: Abrindo câmera");
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.3,
        base64: true,
      });

      console.log("[DEBUG] takePhoto: Resultado", { canceled: result.canceled });

      if (result.canceled) {
        return;
      }

      if (!result.assets || result.assets.length === 0) {
        Alert.alert("Erro", "Nenhuma foto capturada");
        return;
      }

      const asset = result.assets[0];
      console.log("[DEBUG] takePhoto: Asset", { hasBase64: !!asset.base64 });

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
      console.error("[DEBUG] takePhoto error:", error);
      Alert.alert("Erro", error?.message || "Falha ao tirar foto");
    }
  };

  const handleContinue = async () => {
    if (!email) {
      Alert.alert("Erro", "Email não encontrado");
      return;
    }

    setIsLoading(true);
    try {
      let photoToSend: string | undefined = profilePhoto || undefined;

      // Limitar tamanho da imagem em base64 (máximo 800KB)
      if (photoToSend && photoToSend.startsWith("data:")) {
        const maxSize = 800 * 1024; // 800KB
        if (photoToSend.length > maxSize) {
          Alert.alert("Aviso", "Imagem muito grande (máximo 800KB). Pulando foto de perfil.")
          photoToSend = undefined;
        }
      }

      console.log("[DEBUG] handleContinue: Atualizando perfil");
      await updateProfile({
        email: email,
        profilePhoto: photoToSend,
        bio: bio || undefined,
        fullName: fullName || undefined,
      });

      Alert.alert("Sucesso", "Perfil configurado com sucesso!");
      router.replace("/");
    } catch (error: any) {
      console.error("[DEBUG] handleContinue error:", error);
      Alert.alert("Erro", error?.message || "Falha ao configurar perfil");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-4 p-4">
          <Text className="text-2xl font-bold text-foreground">Configurar Perfil</Text>

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
              onPress={pickImage}
              className="bg-primary py-3 px-4 rounded-lg active:opacity-80"
            >
              <Text className="text-background font-semibold text-center">Selecionar Foto</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={takePhoto}
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

          {/* Continue Button */}
          <TouchableOpacity
            onPress={handleContinue}
            disabled={isLoading}
            className={`py-3 px-4 rounded-lg ${isLoading ? "bg-muted opacity-50" : "bg-primary"}`}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-background font-semibold text-center">Continuar</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
