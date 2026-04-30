"use client";

import api from "./axios";

export const login = async (email: string, password: string) => {
  const response = await api.post("/auth/login", { email, password });
  return response.data;
};

export const signup = async (payload: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
}) => {
  const response = await api.post("/auth/signup", payload);
  return response.data;
};

export const logout = async () => {
  const response = await api.post("/auth/logout");
  return response.data;
};

export const getMe = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};

export const forgotPassword = async (email: string) => {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data;
};

export const resetPassword = async (
  token: string,
  password: string,
  confirmPassword: string,
) => {
  const response = await api.post(`/auth/reset-password?token=${token}`, {
    password,
    confirmPassword,
  });
  return response.data;
};
