export type TopicStatus = "completed" | "in-progress" | "locked";

export interface PracticeQuestion {
  id: string;
  question: string;
  answers: {
    detailed: string;
    simplified: string;
  };
  isFree: boolean;
}

export interface AiTopic {
  id: string;
  title: string;
  progress: number;
  status: TopicStatus;
  content: string;
  questions: PracticeQuestion[];
}

import { artificialIntelligence } from "./subjects/artificialIntelligence";
import { cns } from "./subjects/cns";
import { digitalForensics } from "./subjects/digitalForensics";
import { oose } from "./subjects/oose";
import { webAppDevelopment } from "./subjects/webAppDevelopment";

export const aiSyllabus: Record<string, Record<string, AiTopic[]>> = {
  "Web Application Development and Software Frameworks(WAD)": webAppDevelopment,
  "Artificial intelligence": artificialIntelligence,
  "Cryptography and Network Security": cns,
  "Digital Forensics": digitalForensics,
  "OOSE Based Application Development":oose,
  
  
};

export const normalize = (value: string) =>
  value.toLowerCase().replace(/\s+/g, " ").trim();

export const getAiSubject = (subjectName: string) => {
  const entry = Object.entries(aiSyllabus).find(
    ([key]) => normalize(key) === normalize(subjectName)
  );

  return entry ? entry[1] : undefined;
};