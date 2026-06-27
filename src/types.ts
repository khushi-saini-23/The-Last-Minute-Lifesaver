export type PriorityLevel = "High" | "Medium" | "Low";

export interface AnalyzedTask {
  task_title: string;
  priority: PriorityLevel;
  time_urgency: string;
  action_plan: string[];
  proactive_nudge: string;
}

export interface AnalysisResponse {
  analyzed_tasks: AnalyzedTask[];
  productivity_recommendation: string;
}

export interface StudyNookItem {
  id: string;
  name: string;
  emoji: string;
  description: string;
}
