export type NotificationPayload = {
  tokens: string[];
  title: string;
  body: string;
  image?: string;
  data?: Record<string, string>;
};

export type JwtDecodedData = {
  userId: string;
  scope: any[];
  uniqueCode: string;
  exp: number;
};

export type abhaPreferredAccounts = {
  ABHANumber: string;
  preferredAbhaAddress: string;
  name: string;
  gender: string;
  dob: string;
  verifiedStatus: string;
  verificationType: string;
  status: string;
  profilePhoto: string;
  kycVerified: boolean;
  mobileVerified: boolean;
};

type PromQuestionsMap = Record<string, string>;

export type PromQuestionsAndScoring = {
  questions: PromQuestionsMap;
  scoring_instructions: string;
}

export type UploadPromResponse = {
  error: boolean;
  data: 'success' | string;
  group_id: string;
  prom_id: string;
  questions_and_scoring_instructions: PromQuestionsAndScoring;
}

export type QuestionScoreInput = {
  question: string;
  response: any;
  score: number;
};

export type ApiResponse = {
  data: {
    question_scores: Record<string, QuestionScoreInput>;
    total_score: number;
    severity: string;
  };
};

export type QuestionScoreSchemaType = {
  questionId: number;
  question: string;
  response: any;
  score: number;
};

