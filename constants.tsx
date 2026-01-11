
import { RankItem, CheckIn, SEOAction } from './types';

export const COLORS = {
  P1: '#16a34a', // Verde
  P2: '#facc15', // Amarelo
  P3: '#f97316', // Laranja
  P4: '#ef4444', // Vermelho
};

export const DEFAULT_CHECKLIST: string[] = [
  "Melhorar Title",
  "Melhorar H1",
  "Adicionar FAQs",
  "Adicionar imagens com alt",
  "Linkagem interna",
  "Schema",
  "Atualizar conteúdo"
];

export const INITIAL_ITEMS: RankItem[] = [
  {
    id: '1',
    project: 'Arte Clean Brasil',
    url: 'https://arteclean.com.br/limpeza-de-sofa',
    keyword: 'limpeza de sofa sp',
    currentPage: 1,
    targetPage: 1,
    priority: 'Alta',
    notes: 'Página principal de conversão',
    testNotes: '',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    checklist: DEFAULT_CHECKLIST.map(label => ({ id: Math.random().toString(), label, completed: false })),
  },
  {
    id: '2',
    project: 'CleanOrder',
    url: 'https://cleanorder.pt/servicos',
    keyword: 'limpeza comercial lisboa',
    currentPage: 3,
    targetPage: 1,
    priority: 'Média',
    notes: 'Focar em backlinks',
    testNotes: 'Alterado H1 em 05/10',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    checklist: DEFAULT_CHECKLIST.map(label => ({ id: Math.random().toString(), label, completed: false })),
  }
];

export const INITIAL_CHECKINS: CheckIn[] = [
  { id: 'c1', itemId: '1', date: new Date(Date.now() - 10 * 86400000).toISOString(), page: 2 },
  { id: 'c2', itemId: '1', date: new Date().toISOString(), page: 1 },
  { id: 'c3', itemId: '2', date: new Date(Date.now() - 15 * 86400000).toISOString(), page: 4 },
  { id: 'c4', itemId: '2', date: new Date().toISOString(), page: 3 },
];
