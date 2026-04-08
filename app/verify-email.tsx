import React, { useState, useRef } from "react";
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
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth-context";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { verifyEmail, resendVerificationCode, state } = useAuth();
  const [code, setCode] = useState("");
  const [email, setEmail] = useState((params.email as string) || "");
  const [resendTimer, setResendTimer] = useState(0);

  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      Alert.alert("Erro", "Por favor, digite o código de 6 dígitos");
      return;
    }

    if (!email) {
      Alert.alert("Erro", "E-mail não fornecido");
      return;
    }

    try {
      await verifyEmail(email, code);
      // Navigate to profile setup with email
      router.push({
        pathname: "/profile-setup",
        params: { email },
      });
    } catch (error) {
      Alert.alert("Erro de Verificação", state.error || "Código inválido");
    }
  };

  const handleResend = async () => {
    if (!email) {
      Alert.alert("Erro", "E-mail não fornecido");
      return;
    }

    try {
      await resendVerificationCode(email);
      setResendTimer(60);
      const interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      Alert.alert("Sucesso", "Código reenviado para seu e-mail");
    } catch (error) {
      Alert.alert("Erro", state.error || "Falha ao reenviar código");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <ScreenContainer className="flex-1 justify-between p-6">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="gap-4 mb-8">
            <Text className="text-3xl font-bold text-primary">Verificar E-mail</Text>
            <Text className="text-sm text-muted">
              Enviamos um código de 6 dígitos para {email}
            </Text>
          </View>

          {/* Form */}
          <View className="gap-6">
            {/* Email Display */}
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

            {/* Verification Code */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Código de Verificação</Text>
              <TextInput
                placeholder="000000"
                placeholderTextColor="#666"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
                editable={!state.isLoading}
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground text-center text-2xl tracking-widest"
              />
            </View>

            {/* Error Message */}
            {state.error && (
              <View className="bg-error/20 border border-error rounded-lg p-3">
                <Text className="text-error text-sm">{state.error}</Text>
              </View>
            )}

            {/* Verify Button */}
            <TouchableOpacity
              onPress={handleVerify}
              disabled={state.isLoading}
              className="bg-primary rounded-lg py-3 items-center mt-4"
            >
              {state.isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white font-semibold text-base">Verificar</Text>
              )}
            </TouchableOpacity>

            {/* Resend Code */}
            <TouchableOpacity
              onPress={handleResend}
              disabled={resendTimer > 0 || state.isLoading}
              className="py-3 items-center"
            >
              <Text className={`font-semibold text-sm ${resendTimer > 0 ? "text-muted" : "text-primary"}`}>
                {resendTimer > 0 ? `Reenviar em ${resendTimer}s` : "Reenviar Código"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Back Link */}
        <View className="flex-row justify-center items-center gap-1 pb-6">
          <TouchableOpacity onPress={() => router.push("/signup")}>
            <Text className="text-primary font-semibold text-sm">← Voltar</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}
