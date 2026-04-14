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
import { compilerDesign }         from "./subjects/compilerDesign";
import { webAppDevelopment } from "./subjects/wad";

export const aiSyllabus: Record<string, Record<string, AiTopic[]>> = {
  "Artificial intelligence": artificialIntelligence,
  "Compiler Design":         compilerDesign,
  "Web Application Development and Software Frameworks(WAD)": webAppDevelopment
};