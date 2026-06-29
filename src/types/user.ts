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
  createdAt: string;
  updatedAt: string;
}
