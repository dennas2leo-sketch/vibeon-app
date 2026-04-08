import { useState } from "react";
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

export default function SignUpScreen() {
  const router = useRouter();
  const { signup, state } = useAuth();
  const [fullName, setFullName] = useState("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSignUp = async () => {
    if (!fullName || !day || !month || !year || !email || !username || !password || !confirmPassword) {
      Alert.alert("Erro", "Por favor, preencha todos os campos");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Erro", "As senhas não correspondem");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Erro", "A senha deve ter pelo menos 6 caracteres");
      return;
    }

    // Validate date
    const dayNum = parseInt(day);
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);

    if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || yearNum < 1900 || yearNum > new Date().getFullYear()) {
      Alert.alert("Erro", "Data de nascimento inválida");
      return;
    }

    const dateOfBirth = `${yearNum}-${String(monthNum).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;

    try {
      await signup({
        fullName,
        dateOfBirth,
        email,
        username,
        password,
      });

      // Navigate to email verification
      router.push("/verify-email");
    } catch (error) {
      Alert.alert("Erro de Cadastro", state.error || "Falha ao criar conta");
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
          <View className="gap-2 mb-6">
            <Text className="text-3xl font-bold text-primary">Criar Conta</Text>
            <Text className="text-sm text-muted">Junte-se ao VibeOn</Text>
          </View>

          {/* Form */}
          <View className="gap-4">
            {/* Full Name */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Nome Completo</Text>
              <TextInput
                placeholder="Seu nome"
                placeholderTextColor="#666"
                value={fullName}
                onChangeText={setFullName}
                editable={!state.isLoading}
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
              />
            </View>

            {/* Date of Birth - Improved */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Data de Nascimento</Text>
              <View className="flex-row gap-2">
                {/* Day */}
                <View className="flex-1">
                  <TextInput
                    placeholder="DD"
                    placeholderTextColor="#666"
                    value={day}
                    onChangeText={(text) => {
                      if (text.length <= 2 && /^\d*$/.test(text)) {
                        setDay(text);
                      }
                    }}
                    keyboardType="number-pad"
                    maxLength={2}
                    editable={!state.isLoading}
                    className="bg-surface border border-border rounded-lg px-3 py-3 text-foreground text-center"
                  />
                  <Text className="text-xs text-muted text-center mt-1">Dia</Text>
                </View>

                {/* Month */}
                <View className="flex-1">
                  <TextInput
                    placeholder="MM"
                    placeholderTextColor="#666"
                    value={month}
                    onChangeText={(text) => {
                      if (text.length <= 2 && /^\d*$/.test(text)) {
                        setMonth(text);
                      }
                    }}
                    keyboardType="number-pad"
                    maxLength={2}
                    editable={!state.isLoading}
                    className="bg-surface border border-border rounded-lg px-3 py-3 text-foreground text-center"
                  />
                  <Text className="text-xs text-muted text-center mt-1">Mês</Text>
                </View>

                {/* Year */}
                <View className="flex-1.5">
                  <TextInput
                    placeholder="YYYY"
                    placeholderTextColor="#666"
                    value={year}
                    onChangeText={(text) => {
                      if (text.length <= 4 && /^\d*$/.test(text)) {
                        setYear(text);
                      }
                    }}
                    keyboardType="number-pad"
                    maxLength={4}
                    editable={!state.isLoading}
                    className="bg-surface border border-border rounded-lg px-3 py-3 text-foreground text-center"
                  />
                  <Text className="text-xs text-muted text-center mt-1">Ano</Text>
                </View>
              </View>
            </View>

            {/* Email */}
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

            {/* Username */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Username (@)</Text>
              <View className="flex-row items-center bg-surface border border-border rounded-lg px-4 py-3">
                <Text className="text-primary">@</Text>
                <TextInput
                  placeholder="seu_username"
                  placeholderTextColor="#666"
                  value={username}
                  onChangeText={setUsername}
                  editable={!state.isLoading}
                  className="flex-1 ml-2 text-foreground"
                />
              </View>
              <Text className="text-sm text-primary font-semibold mt-2">⚠️ Use apenas letras minúsculas, números e underscore (_)</Text>
            </View>

            {/* Password */}
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

            {/* Confirm Password */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Confirmar Senha</Text>
              <TextInput
                placeholder="••••••••"
                placeholderTextColor="#666"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
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

            {/* Sign Up Button */}
            <TouchableOpacity
              onPress={handleSignUp}
              disabled={state.isLoading}
              className="bg-primary rounded-lg py-3 items-center mt-4"
            >
              {state.isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white font-semibold text-base">Próximo</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Login Link */}
        <View className="flex-row justify-center items-center gap-1 pb-6">
          <Text className="text-muted text-sm">Já tem conta?</Text>
          <TouchableOpacity onPress={() => router.push("/login")}>
            <Text className="text-primary font-semibold text-sm">Entrar</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}
