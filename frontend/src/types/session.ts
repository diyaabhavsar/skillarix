export type Message = {
  role: "system" | "user";
  content: string;
  evaluation?: {
    score: number;
    feedback: string;
    idealAnswer?: string;
  };
};

export type FilterSettings = {
  difficultyLevel: "easy" | "medium" | "hard";
  customerPersona: string;
  focusAreas: string[];
  questionCount: number;
};

export type UserRole = "admin" | "employee";

export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
}

