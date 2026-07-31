import type { Board, BoardDetail, Card, CardPatch, List } from './types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const request = async <T,>(path: string, options?: RequestInit): Promise<T> => {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
};

export const getBoards = () => request<Board[]>('/boards');
export const createBoard = (title: string) =>
  request<Board>('/boards', { method: 'POST', body: JSON.stringify({ title }) });
export const getBoardDetail = (boardId: string) => request<BoardDetail>(`/boards/${boardId}`);
export const renameBoard = (boardId: string, title: string) =>
  request<Board>(`/boards/${boardId}`, { method: 'PUT', body: JSON.stringify({ title }) });
export const deleteBoard = (boardId: string) =>
  request<void>(`/boards/${boardId}`, { method: 'DELETE' });

export const createList = (boardId: string, title: string) =>
  request<List>(`/boards/${boardId}/lists`, { method: 'POST', body: JSON.stringify({ title }) });
export const renameList = (listId: string, title: string) =>
  request<List>(`/lists/${listId}`, { method: 'PUT', body: JSON.stringify({ title }) });
export const deleteList = (listId: string) =>
  request<void>(`/lists/${listId}`, { method: 'DELETE' });
export const reorderLists = (boardId: string, orderedListIds: string[]) =>
  request<List[]>(`/boards/${boardId}/lists/reorder`, {
    method: 'PUT',
    body: JSON.stringify({ orderedListIds }),
  });

export const createCard = (listId: string, title: string) =>
  request<Card>(`/lists/${listId}/cards`, { method: 'POST', body: JSON.stringify({ title }) });
export const updateCard = (cardId: string, patch: CardPatch) =>
  request<Card>(`/cards/${cardId}`, { method: 'PUT', body: JSON.stringify(patch) });
export const deleteCard = (cardId: string) =>
  request<void>(`/cards/${cardId}`, { method: 'DELETE' });
export const moveCard = (cardId: string, destListId: string, destOrderedCardIds: string[]) =>
  request<Card>('/cards/move', {
    method: 'PUT',
    body: JSON.stringify({ cardId, destListId, destOrderedCardIds }),
  });
