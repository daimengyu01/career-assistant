export interface UserProfile {
  id: string;
  name: string;
  age: number;
  major: string;
  education?: string;
  graduationYear?: number;
  personality: {
    mbti: string;
    extroversion: number;
    openness: number;
    conscientiousness: number;
    agreeableness: number;
    neuroticism: number;
  };
  interests: string[];
  careerGoals?: string;
  riskPreference: 'conservative' | 'balanced' | 'aggressive';
  selfIntro?: string;
  resume?: {
    fileName?: string;
    filePath?: string;
    extractedText?: string;
  };
  assessmentUnlocked: boolean;
  createdAt: string;
  updatedAt: string;
}
