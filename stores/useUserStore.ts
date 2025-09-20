import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserState {
  id: string;
  name: string;
  email: string;
  role: string;
  setUser: (user: {
    id: string;
    name: string;
    email: string;
    role: string;
  }) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      id: "",
      name: "",
      email: "",
      role: "",
      setUser: ({ id, name, email, role }) => set({ id, name, email, role }),
      clearUser: () => set({ id: "", name: "", email: "", role: "" }),
    }),
    {
      name: "user-storage", // key localStorage
    }
  )
);
