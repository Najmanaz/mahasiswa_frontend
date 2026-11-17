import type { User, FormUser } from "./users.types";

const API_URL = "http://localhost:3000/api/v1/users";

// Mengambil semua user
export const getUsers = async (): Promise<User[]> => {
  const response = await fetch(API_URL);
  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Gagal mengambil data users");
  }

  return result.data;
};

// Menambahkan user
export const createUser = async (data: FormUser) => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Gagal menambahkan user");
  }

  return result.data;
};