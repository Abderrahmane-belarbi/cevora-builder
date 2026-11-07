"use client";
import { create } from "zustand";
import { translate, type Language } from "./translations";

const key = "cevora.interface-language";
export const useLocale = create<{ language: Language; ready: boolean; chosen: boolean; initialize(): void; choose(language: Language): void }>((set) => ({
  language: "en", ready: false, chosen: false,
  initialize() {
    let language: string | null = null;
    try { language = localStorage.getItem(key); } catch { /* preferences remain usable in memory */ }
    set({ language: language === "ar" ? "ar" : "en", ready: true, chosen: language === "ar" || language === "en" });
  },
  choose(language) {
    try { localStorage.setItem(key, language); } catch { /* document saving reports its own errors */ }
    set({ language, chosen: true });
  },
}));
export const t = (text: string) => translate(text, useLocale.getState().language);
