"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";

import * as authApi from "@/lib/auth";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

type AuthAction =
  | { type: "START_LOADING" }
  | { type: "SET_USER"; payload: User | null }
  | { type: "LOGOUT" };

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<User>;
  signup: (payload: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    phone?: string;
  }) => Promise<User>;
  logout: () => Promise<void>;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
};

const authContext = createContext<AuthContextValue | null>(null);

const reducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "START_LOADING":
      return { ...state, isLoading: true };
    case "SET_USER":
      return {
        user: action.payload,
        isAuthenticated: Boolean(action.payload),
        isLoading: false,
      };
    case "LOGOUT":
      return {
        user: null,
        isAuthenticated: false,
        isLoading: false,
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const hydrate = async () => {
      try {
        const accessToken = window.localStorage.getItem("capitalLabAccessToken");
        if (!accessToken) {
          dispatch({ type: "SET_USER", payload: null });
          return;
        }

        const response = await authApi.getMe();
        dispatch({ type: "SET_USER", payload: response.user });
      } catch {
        dispatch({ type: "SET_USER", payload: null });
      }
    };

    void hydrate();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login: async (email, password) => {
        dispatch({ type: "START_LOADING" });
        const response = await authApi.login(email, password);
        window.localStorage.setItem("capitalLabAccessToken", response.accessToken);
        dispatch({ type: "SET_USER", payload: response.user });
        return response.user;
      },
      signup: async (payload) => {
        dispatch({ type: "START_LOADING" });
        const response = await authApi.signup(payload);
        window.localStorage.setItem("capitalLabAccessToken", response.accessToken);
        dispatch({ type: "SET_USER", payload: response.user });
        return response.user;
      },
      logout: async () => {
        await authApi.logout();
        window.localStorage.removeItem("capitalLabAccessToken");
        dispatch({ type: "LOGOUT" });
      },
    }),
    [state],
  );

  return <authContext.Provider value={value}>{children}</authContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(authContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
