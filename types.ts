
export type PageRank = 1 | 2 | 3 | 4; // 4 means 4+

export type Priority = 'Baixa' | 'Média' | 'Alta';

export interface SEOAction {
  id: string;
  label: string;
  completed: boolean;
  date?: string;
}

export interface CheckIn {
  id: string;
  itemId: string;
  date: string;
  page: PageRank;
  notes?: string;
}

export interface RankItem {
  id: string;
  project: string;
  url: string;
  keyword: string;
  currentPage: PageRank;
  targetPage: PageRank;
  priority: Priority;
  notes: string;
  testNotes: string;
  createdAt: string;
  lastUpdatedAt: string;
  checklist: SEOAction[];
}

export interface DashboardStats {
  total: number;
  pageOne: number;
  risers: number;
  fallers: number;
}
