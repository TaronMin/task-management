export type Priority = 'low' | 'medium' | 'high';

export const CARD_TITLE_MAX_LENGTH = 70;

export interface Board {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface List {
  id: string;
  boardId: string;
  title: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Card {
  id: string;
  listId: string;
  title: string;
  description: string;
  priority: Priority;
  dueDate: string | null;
  labels: Label[];
  checklist: ChecklistItem[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface BoardDetail {
  board: Board;
  lists: List[];
  cards: Card[];
}

export type CardPatch = Partial<
  Pick<Card, 'title' | 'description' | 'priority' | 'dueDate' | 'labels' | 'checklist'>
>;
