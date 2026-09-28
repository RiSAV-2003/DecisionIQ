export type DecisionCategoryType = 
  | 'education'
  | 'career'
  | 'finance'
  | 'travel'
  | 'lifestyle'
  | 'business'
  | 'technology'
  | 'products';

export interface DecisionCategory {
  id: DecisionCategoryType;
  title: string;
  tagline: string;
  description: string;
  iconName: string;
  accentColor: string;
  gradient: string;
  sampleQuestions: string[];
}

export type SourceReliability = 'High' | 'Medium' | 'Low';
export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Critical';
export type StepStatus = 'pending' | 'active' | 'completed' | 'failed';

export interface OptionCriterionScore {
  criterionId: string;
  score: number;
  note: string;
}

export interface OptionItem {
  id: string;
  title: string;
  subtitle: string;
  tagline: string;
  fitScore: number;
  badge?: string;
  price?: string;
  highlights: string[];
  advantages: string[];
  disadvantages: string[];
  risks: string[];
  criterionScores: OptionCriterionScore[];
}

export interface EvidenceItem {
  id: string;
  claim: string;
  sourceTitle: string;
  publisher: string;
  publishDate: string;
  url: string;
  reliability: SourceReliability;
  reliabilityReason: string;
  snippet: string;
  relevanceScore: number;
}

export interface CounterEvidenceItem {
  id: string;
  title: string;
  impactLevel: RiskLevel;
  challengePoint: string;
  alternativeRecommendation?: string;
  hiddenRisks: string[];
  weakAssumptions: string[];
}

export interface CriterionWeight {
  id: string;
  name: string;
  weight: number;
  description: string;
}

export interface ResearchWorkflowStep {
  id: string;
  stageNumber: number;
  title: string;
  description: string;
  status: StepStatus;
  details?: string;
  durationMs?: number;
}

export interface DecisionReport {
  id: string;
  query: string;
  category: DecisionCategoryType;
  createdAt: string;
  recommendedOptionId: string;
  overallFitScore: number;
  confidenceLevel: SourceReliability;
  summaryRationale: string;
  options: OptionItem[];
  evidenceList: EvidenceItem[];
  counterEvidence: CounterEvidenceItem[];
  criteriaWeights: CriterionWeight[];
  workflowSteps: ResearchWorkflowStep[];
}

export interface DecisionHistoryRecord {
  id: string;
  query: string;
  category: DecisionCategoryType;
  recommendationTitle: string;
  fitScore: number;
  date: string;
  status: 'Completed' | 'Challenged' | 'In Progress';
}
