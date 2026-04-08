import React, { createContext, useContext, useReducer, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@/server/routers";
import { trpc } from "./trpc";

export interface VibeUser {
  id: number;
  email: string;
  username: string;
  fullName: string;
  profilePhoto?: string | null;
  bio?: string | null;
}

interface AuthState {
  user: VibeUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "LOGIN_SUCCESS"; payload: VibeUser }
  | { type: "LOGOUT" }
  | { type: "SET_ERROR"; payload: string }
  | { type: "CLEAR_ERROR" }
  | { type: "RESTORE_USER"; payload: VibeUser | null };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const AuthContext = createContext<
  | {
      state: AuthState;
      login: (email: string, password: string) => Promise<void>;
      logout: () => Promise<void>;
      signup: (data: {
        fullName: string;
        dateOfBirth: string;
        email: string;
        username: string;
        password: string;
      }) => Promise<void>;
      verifyEmail: (email: string, code: string) => Promise<void>;
      resendVerificationCode: (email: string) => Promise<void>;
      updateProfile: (data: { email: string; profilePhoto?: string; bio?: string; fullName?: string }) => Promise<void>;
    }
  | undefined
>(undefined);

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "LOGIN_SUCCESS":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case "LOGOUT":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    case "RESTORE_USER":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
        error: null,
      };
    default:
      return state;
  }
}

/**
 * Create a tRPC client for auth operations
 */
function createAuthClient() {
  const { getApiBaseUrl } = require("@/constants/oauth");
  const baseUrl = getApiBaseUrl() || "http://localhost:3000";

  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${baseUrl}/api/trpc`,
        transformer: superjson,
        async fetch(url, options) {
          // Get the stored token from AsyncStorage
          const token = await AsyncStorage.getItem("vibeon_token");
          
          const headers = {
            ...(options?.headers || {}),
          };
          
          // Add Authorization header if token exists
          if (token) {
            headers["Authorization"] = `Bearer ${token}`;
          }
          
          return fetch(url, {
            ...options,
            headers,
            credentials: "include",
          });
        },
      }),
    ],
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restore user from AsyncStorage on app start
  useEffect(() => {
    const restoreUser = async () => {
      try {
        dispatch({ type: "SET_LOADING", payload: true });
        const userJson = await AsyncStorage.getItem("vibeon_user");
        if (userJson) {
          const user = JSON.parse(userJson);
          dispatch({ type: "RESTORE_USER", payload: user });
        } else {
          dispatch({ type: "RESTORE_USER", payload: null });
        }
      } catch (error) {
        console.error("Failed to restore user:", error);
        dispatch({ type: "RESTORE_USER", payload: null });
      }
    };

    restoreUser();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const client = createAuthClient();
      const result = await client.vibe.auth.login.mutate({ email, password });

      if (!result || !result.user) {
        throw new Error("No user data in response");
      }

      // Store user and token
      await AsyncStorage.setItem("vibeon_user", JSON.stringify(result.user));
      if (result.token) {
        await AsyncStorage.setItem("vibeon_token", result.token);
      }
      dispatch({ type: "LOGIN_SUCCESS", payload: result.user });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      dispatch({ type: "SET_ERROR", payload: message });
      throw error;
    }
  }, []);

  const signup = useCallback(
    async (data: {
      fullName: string;
      dateOfBirth: string;
      email: string;
      username: string;
      password: string;
    }) => {
      dispatch({ type: "SET_LOADING", payload: true });
      try {
        const client = createAuthClient();
        await client.vibe.auth.signUp.mutate(data);
        dispatch({ type: "SET_LOADING", payload: false });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Signup failed";
        dispatch({ type: "SET_ERROR", payload: message });
        throw error;
      }
    },
    []
  );

  const verifyEmail = useCallback(async (email: string, code: string) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const client = createAuthClient();
      await client.vibe.auth.verifyEmail.mutate({ email, code });
      dispatch({ type: "SET_LOADING", payload: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Verification failed";
      dispatch({ type: "SET_ERROR", payload: message });
      throw error;
    }
  }, []);

  const resendVerificationCode = useCallback(async (email: string) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const client = createAuthClient();
      await client.vibe.auth.resendVerificationCode.mutate({ email });
      dispatch({ type: "SET_LOADING", payload: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to resend code";
      dispatch({ type: "SET_ERROR", payload: message });
      throw error;
    }
  }, []);

  const updateProfile = useCallback(async (data: { email: string; profilePhoto?: string; bio?: string; fullName?: string }) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const client = createAuthClient();
      const result = await client.vibe.auth.updateProfile.mutate(data);
      
      if (result && result.user && state.user) {
        const updatedUser: VibeUser = {
          ...state.user,
          ...result.user,
        };
        
        dispatch({ type: "LOGIN_SUCCESS", payload: updatedUser });
        await AsyncStorage.setItem("vibeon_user", JSON.stringify(updatedUser));
      }
      
      dispatch({ type: "SET_LOADING", payload: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Update failed";
      dispatch({ type: "SET_ERROR", payload: message });
      throw error;
    }
  }, [state.user])

  return (
    <AuthContext.Provider
      value={{
        state,
        login,
        logout: async () => {
          await AsyncStorage.removeItem("vibeon_user");
          await AsyncStorage.removeItem("vibeon_token");
          dispatch({ type: "LOGOUT" });
        },
        signup,
        verifyEmail,
        resendVerificationCode,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
