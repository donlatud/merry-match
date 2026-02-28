// lib/apiClient.ts
import axios from "axios";
import { getAccessToken } from "./auth";

export const apiClient = axios.create({
  baseURL: "/api",
});

apiClient.interceptors.request.use(async (config) => {
  const token = await getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});