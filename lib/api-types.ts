// Types mirroring the DecisionIQ backend API (FastAPI schemas).

export type DecisionDomain =
  | 'education'
  | 'career'
  | 'finance'
  | 'travel'
  | 'lifestyle'
  | 'business'
  | 'technology'
  | 'products'
  | 'other';

export type DecisionStatus = 'draft' | 'analyzing' | 'completed' | 'failed';
export type StageStatus = 'pending' | 'active' | 'completed' | 'failed';

export interface User {
  id: string;
  full_name: string;
  email: string;
  plan: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface Preferences {
  decision_interests: string[];
  priorities: string[];
  budget_sensitivity: number;
  research_depth: string;
  preferred_categories: string[];
  currency: string;
  extra: Record<string, unknown>;
}

export interface Stage {
  key: string;
  label: string;
  description: string;
  status: StageStatus;
  detail?: string | null;
}

export interface ClarifyingQuestion {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'chips';
  options: string[];
  placeholder?: string | null;
  required: boolean;
  help?: string | null;
}

export interface Source {
  id: string;
  title: string;
  publisher: string | null;
  url: string;
  domain_name: string | null;
  source_type: string | null;
  snippet: string | null;
  authority_score: number;
  freshness_score: number;
  relevance_score: number;
  reliability_score: number;
  overall_score: number;
  published_date: string | null;
  retrieved_date: string;
}

export interface Evidence {
  id: string;
  claim: string;
  snippet?: string | null;
  evidence_key?: string | null;
  confidence?: number | null;
  relevance_score: number;
  conflict: boolean;
  source?: Source | null;
}

export interface CriterionScore {
  criterionId: string;
  name: string;
  score: number;
  note?: string | null;
}

export interface Option {
  id: string;
  name: string;
  summary: string | null;
  price_info: string | null;
  badge: string | null;
  highlights: string[];
  strengths: string[];
  weaknesses: string[];
  risks: string[];
  criterion_scores: CriterionScore[];
  fit_score: number | null;
  recommended: boolean;
  position: number;
}

export interface Criterion {
  id: string;
  name: string;
  weight: number;
  description: string | null;
  position: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  changed_recommendation: boolean;
  created_at: string;
}

export interface Recommendation {
  recommended_option_id: string | null;
  summary: string;
  reasoning: string;
  caveats: string | null;
  confidence_score: number | null;
  overall_fit_score: number | null;
  what_could_change: string[];
  next_steps: string[];
  trade_offs: string[];
  assumptions: string[];
}

export interface DecisionDetail {
  id: string;
  title: string;
  domain: DecisionDomain;
  status: DecisionStatus;
  raw_prompt: string;
  research_depth: string;
  stages: Stage[];
  clarifying_questions: ClarifyingQuestion[];
  error: string | null;
  created_at: string;
  updated_at: string;
  inputs: Record<string, string>;
  criteria: Criterion[];
  options: Option[];
  sources: Source[];
  evidence: Evidence[];
  messages: Message[];
  result: Recommendation | null;
  saved: boolean;
}

export interface DecisionSummary {
  id: string;
  title: string;
  domain: DecisionDomain;
  status: DecisionStatus;
  created_at: string;
  updated_at: string;
  fit_score: number | null;
  recommended_title: string | null;
  saved: boolean;
}

export interface DecisionListResponse {
  items: DecisionSummary[];
  total: number;
}

export interface FollowUpResponse {
  reply: string;
  changed_recommendation: boolean;
  decision: DecisionDetail;
}

export interface SavedDecisionSummary {
  id: string;
  decision: DecisionSummary;
  saved_at: string;
}

export interface SavedListResponse {
  items: SavedDecisionSummary[];
  total: number;
}

export interface AnalyticsSummary {
  total_decisions: number;
  completed_decisions: number;
  in_progress: number;
  saved_decisions: number;
  avg_fit_score: number | null;
  avg_confidence: number | null;
  total_messages: number;
  by_category: { category: string; count: number }[];
  activity_last_14_days: Record<string, number>;
  events_by_type: Record<string, number>;
  research_depth: Record<string, number>;
}

export interface PlanInfo {
  name: string;
  monthly_decisions: number;
  research_depth: string;
  features: string[];
}

export interface SubscriptionInfo {
  plan: string;
  limits: PlanInfo;
}