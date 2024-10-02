import { create } from "zustand";

export interface User {
  email: string | null;
  name: string | null;
  profileImage: string | null;
  address: string | null;
  balance: number | null;
}

interface UserStore {
  user: User;
  setUser: (user: User) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: {
    email: null,
    name: null,
    profileImage: null,
    address: null,
    balance: null,
  },
  setUser: (user: User) => set({ user }),
}));
