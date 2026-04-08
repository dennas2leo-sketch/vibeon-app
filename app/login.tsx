import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth-context";

export default function LoginScreen() {
  const router = useRouter();
  const { login, state } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Erro", "Por favor, preencha todos os campos");
      return;
    }

    try {
      await login(email, password);
      router.replace("/(tabs)/feed");
    } catch (error) {
      Alert.alert("Erro de Login", state.error || "Falha ao fazer login");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <ScreenContainer className="flex-1 justify-between p-0" containerClassName="bg-background">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          {/* Gradient Background Header */}
          <View className="bg-gradient-to-b from-primary to-background px-6 pt-12 pb-8 items-center">
            <View className="items-center gap-3">
              <Text className="text-6xl font-black text-white">✨ VibeOn ✨</Text>
              <Text className="text-base text-white/90 text-center font-semibold">Compartilhe seus momentos com estilo</Text>
            </View>
          </View>

          {/* Form Container */}
          <View className="flex-1 justify-center px-6 pt-8 gap-8">

            {/* Form */}
            <View className="gap-4 bg-surface rounded-2xl p-6 border border-border shadow-sm">
              {/* Email Input */}
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">E-mail</Text>
                <TextInput
                  placeholder="seu@email.com"
                  placeholderTextColor="#666"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  editable={!state.isLoading}
                  className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                />
              </View>

              {/* Password Input */}
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">Senha</Text>
                <TextInput
                  placeholder="••••••••"
                  placeholderTextColor="#666"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  editable={!state.isLoading}
                  className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                />
              </View>

              {/* Error Message */}
              {state.error && (
                <View className="bg-error/20 border border-error rounded-lg p-3">
                  <Text className="text-error text-sm">{state.error}</Text>
                </View>
              )}

              {/* Login Button */}
              <TouchableOpacity
                onPress={handleLogin}
                disabled={state.isLoading}
                className="bg-primary rounded-lg py-3 items-center mt-4"
              >
                {state.isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white font-semibold text-base">Entrar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Sign Up Link */}
        <View className="flex-row justify-center items-center gap-1 pb-8 px-6">
          <Text className="text-muted text-sm">Não tem conta?</Text>
          <TouchableOpacity onPress={() => router.push("/signup")}>
            <Text className="text-primary font-semibold text-sm">Criar conta</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}
