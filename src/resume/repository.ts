import { parseResume, type Resume } from "./model";

export const storageKey = "cevora.resume.v1";

export interface ResumeRepository {
  loadResume(): Promise<Resume | null>;
  saveResume(resume: Resume): Promise<void>;
}

export const resumeRepository: ResumeRepository = {
  async loadResume() {
    const raw = window.localStorage.getItem(storageKey);
    return raw === null ? null : parseResume(raw);
  },
  async saveResume(resume) {
    window.localStorage.setItem(storageKey, JSON.stringify(resume));
  },
};
