
export enum QuestionType {
  TEXT = 'TEXT',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  RATING = 'RATING',
  DATE = 'DATE',
  NUMBER = 'NUMBER'
}

export interface Condition {
  dependsOn: string; // question ID
  operator: 'equals' | 'not_equals' | 'greater_than';
  value: any;
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  text_hi?: string; // Hindi translation
  options?: string[];
  options_hi?: string[]; // Hindi options
  required: boolean;
  logic?: Condition;
  mospiCode?: string; // Standard MoSPI/NCO/NIC Code
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  createdAt: number;
  language: 'en' | 'hi';
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface Paradata {
  totalTime: number;
  questionTimings: Record<string, number>;
  deviceInfo: string;
  location?: LocationData;
  voiceInputUsed?: boolean;
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  answers: Record<string, any>;
  paradata: Paradata;
  submittedAt: number;
  autoCodedTags?: Record<string, string>; // AI inferred codes
}