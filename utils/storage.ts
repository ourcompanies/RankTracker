
import { RankItem, CheckIn } from '../types';
import { INITIAL_ITEMS, INITIAL_CHECKINS } from '../constants';

const ITEMS_KEY = 'rank_tracker_items';
const CHECKINS_KEY = 'rank_tracker_checkins';

export const saveItems = (items: RankItem[]) => {
  localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
};

export const getItems = (): RankItem[] => {
  const data = localStorage.getItem(ITEMS_KEY);
  return data ? JSON.parse(data) : INITIAL_ITEMS;
};

export const saveCheckIns = (checkins: CheckIn[]) => {
  localStorage.setItem(CHECKINS_KEY, JSON.stringify(checkins));
};

export const getCheckIns = (): CheckIn[] => {
  const data = localStorage.getItem(CHECKINS_KEY);
  return data ? JSON.parse(data) : INITIAL_CHECKINS;
};
