// src/store/useWebsiteInfoStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WebsiteInfo {
  name: string;
  alias: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  logoUrl: string;
  [key: string]: string; // untuk fleksibilitas tambahan
}

interface WebsiteInfoState {
  websiteInfo: WebsiteInfo;
  setWebsiteInfo: (info: Partial<WebsiteInfo>) => void;
  resetWebsiteInfo: () => void;
}

export const useWebsiteInfoStore = create<WebsiteInfoState>()(
  persist(
    (set) => ({
      websiteInfo: {
        name: "",
        alias: "",
        description: "",
        address: "",
        phone: "",
        email: "",
        logoUrl: "",
      },
      setWebsiteInfo: (info) =>
        set((state) => ({
          websiteInfo: {
            ...state.websiteInfo,
            ...Object.fromEntries(
              Object.entries(info).filter(
                ([, value]) => value !== undefined
              ) as [string, string][]
            ),
          },
        })),
      resetWebsiteInfo: () =>
        set(() => ({
          websiteInfo: {
            alias: "",
            name: "",
            description: "",
            address: "",
            phone: "",
            email: "",
            logoUrl: "",
          },
        })),
    }),
    {
      name: "website-info", // nama key di localStorage
    }
  )
);
