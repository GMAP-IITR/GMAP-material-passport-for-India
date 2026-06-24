import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 60_000, // 60 s — enough for large IFC / Excel files
});

export const UPLOAD_ENDPOINT = "/api/upload";
