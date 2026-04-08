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
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth-context";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

export default function CreateScreen() {
  const { state } = useAuth();
  const [image, setImage] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);

  const utils = trpc.useUtils();
  const createPostMutation = trpc.vibe.posts.create.useMutation({
    onSuccess: () => {
      // Invalidar com userId correto
      if (state.user?.id) {
        utils.vibe.posts.getUserPosts.invalidate({ userId: state.user.id });
      }
      utils.vibe.posts.getFeed.invalidate();
    },
  });

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
        quality: 0.5,
        base64: true,
      });

      console.log("[DEBUG] pickImage: Resultado", { canceled: result.canceled, assetCount: result.assets?.length });

      if (result.canceled) {
        console.log("[DEBUG] pickImage: Cancelado");
        return;
      }

      if (!result.assets || result.assets.length === 0) {
        Alert.alert("Erro", "Nenhuma imagem selecionada");
        return;
      }

      const asset = result.assets[0];
      console.log("[DEBUG] pickImage: Asset", { hasBase64: !!asset.base64, mimeType: asset.mimeType });

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
      console.log("[DEBUG] pickImage: Imagem pronta", { size: base64Image.length });
      setImage(base64Image);
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
        quality: 0.2,
        base64: true,
      });

      console.log("[DEBUG] takePhoto: Resultado", { canceled: result.canceled, assetCount: result.assets?.length });

      if (result.canceled) {
        console.log("[DEBUG] takePhoto: Cancelado");
        return;
      }

      if (!result.assets || result.assets.length === 0) {
        Alert.alert("Erro", "Nenhuma foto capturada");
        return;
      }

      const asset = result.assets[0];
      console.log("[DEBUG] takePhoto: Asset", { hasBase64: !!asset.base64, mimeType: asset.mimeType });

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
      console.log("[DEBUG] takePhoto: Foto pronta", { size: base64Image.length });
      setImage(base64Image);
    } catch (error: any) {
      console.error("[DEBUG] takePhoto error:", error);
      Alert.alert("Erro", error?.message || "Falha ao tirar foto");
    }
  };

  const handlePost = async () => {
    if (!image) {
      Alert.alert("Erro", "Por favor, selecione uma imagem");
      return;
    }

    if (!state.user) {
      Alert.alert("Erro", "Você precisa estar logado para criar um post");
      return;
    }

    setLoading(true);
    try {
      let imageToSend = image;

      // Limitar tamanho da imagem em base64 (máximo 1MB)
      if (imageToSend && imageToSend.startsWith("data:")) {
        const maxSize = 1 * 1024 * 1024; // 1MB
        if (imageToSend.length > maxSize) {
          Alert.alert("Erro", "Imagem muito grande (máximo 1MB). Selecione uma menor ou comprima.")
          setLoading(false);
          return;
        }
      }

      console.log("[DEBUG] handlePost: Criando post");
      console.log("[DEBUG] handlePost: User", state.user?.id, state.user?.email);
      console.log("[DEBUG] handlePost: Image size", imageToSend?.length);

      // Sanitizar caption: remover caracteres de controle e line separators
      let cleanCaption = caption.trim();
      if (cleanCaption) {
        // Remover caracteres de controle inválidos (exceto \n e \t)
        cleanCaption = cleanCaption.replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F\u2028\u2029]/g, '');
        // Limitar tamanho
        if (cleanCaption.length > 2000) {
          cleanCaption = cleanCaption.substring(0, 2000);
        }
      }

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Timeout ao criar post. Tente novamente.")), 30000);
      });

      const result = (await Promise.race([
        createPostMutation.mutateAsync({
          imageUrl: imageToSend,
          caption: cleanCaption || undefined,
        }),
        timeoutPromise,
      ])) as any;

      console.log("[DEBUG] handlePost: Post criado", result);

      if (result?.success) {
        Alert.alert("Sucesso", "Post criado com sucesso!");
        setImage(null);
        setCaption("");
      } else {
        Alert.alert("Erro", result?.message || "Falha ao criar post");
      }
    } catch (error: any) {
      console.error("[DEBUG] handlePost error:", error);
      Alert.alert("Erro", error?.message || "Falha ao criar post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="p-4 gap-4">
          <Text className="text-2xl font-bold text-foreground">Criar Post</Text>

          {/* Image Preview - Fixed height */}
          {image ? (
            <View className="w-full bg-surface rounded-lg overflow-hidden border border-border" style={{ height: 200 }}>
              <Image source={{ uri: image }} style={{ width: "100%", height: "100%" }} />
            </View>
          ) : (
            <View className="w-full bg-surface rounded-lg overflow-hidden border border-border items-center justify-center" style={{ height: 200 }}>
              <Text className="text-muted">Nenhuma imagem selecionada</Text>
            </View>
          )}

          {/* Buttons */}
          <View className="gap-2">
            <TouchableOpacity
              onPress={pickImage}
              className="bg-primary py-3 px-4 rounded-lg active:opacity-80"
            >
              <Text className="text-background font-semibold text-center">Selecionar da Galeria</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={takePhoto}
              className="bg-primary py-3 px-4 rounded-lg active:opacity-80"
            >
              <Text className="text-background font-semibold text-center">Tirar Foto</Text>
            </TouchableOpacity>
          </View>

          {/* Caption Input */}
          <TextInput
            placeholder="Adicione uma legenda..."
            placeholderTextColor="#999"
            value={caption}
            onChangeText={setCaption}
            multiline
            numberOfLines={4}
            className="bg-surface border border-border rounded-lg p-3 text-foreground"
          />

          {/* Post Button */}
          <TouchableOpacity
            onPress={handlePost}
            disabled={loading || !image}
            className={`py-3 px-4 rounded-lg ${loading || !image ? "bg-muted opacity-50" : "bg-primary"}`}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-background font-semibold text-center">Compartilhar</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
