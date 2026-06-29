export interface AssessmentResult {
  id: string;
  userId: string;
  type: 'personality' | 'interest' | 'career_match';
  data: Record<string, unknown>;
  aiInsights?: string;
  createdAt: string;
}

export interface MBTIResult {
  type: string;
  dimensions: {
    extroversion: number;
    openness: number;
    conscientiousness: number;
    agreeableness: number;
    neuroticism: number;
  };
}
