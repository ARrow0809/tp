
import { HistoryItem, Tag } from '../types';
import { MAX_HISTORY_ITEMS, LOCAL_STORAGE_HISTORY_KEY } from '../constants';

// Helper to stringify tags for comparison, ensuring order doesn't matter
const getStringifiedSortedTagIds = (tags?: Tag[]): string => {
  if (!tags || tags.length === 0) return '[]';
  return JSON.stringify(tags.map(t => t.id).sort());
};

export const getHistoryItems = (): HistoryItem[] => {
  try {
    const itemsJson = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
    if (itemsJson) {
      const items = JSON.parse(itemsJson) as HistoryItem[];
      // Ensure sorting by timestamp descending (newest first)
      return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
  } catch (error) {
    console.error("Error retrieving history items from localStorage:", error);
  }
  return [];
};

export const saveHistoryItem = (item: HistoryItem): void => {
  try {
    let items = getHistoryItems(); // Already sorted newest first
    let existingItemIndex = -1;

    if (item.type === 'prompt_generation') {
      const newItemTagsString = getStringifiedSortedTagIds(item.selectedTagsSnapshot);
      existingItemIndex = items.findIndex(
        (histItem) =>
          histItem.type === 'prompt_generation' &&
          getStringifiedSortedTagIds(histItem.selectedTagsSnapshot) === newItemTagsString
      );
    } else if (item.type === 'image_generation') {
      existingItemIndex = items.findIndex(
        (histItem) => histItem.type === 'image_generation' && histItem.promptText === item.promptText
      );
    }

    if (existingItemIndex > -1) {
      // Remove the old item if it exists
      items.splice(existingItemIndex, 1);
    }
    
    // Add the new (or updated) item to the beginning
    items.unshift(item);

    // Rotate: Keep only the newest MAX_HISTORY_ITEMS
    if (items.length > MAX_HISTORY_ITEMS) {
      items = items.slice(0, MAX_HISTORY_ITEMS);
    }
    
    localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(items));
  } catch (error) {
    console.error("Error saving history item to localStorage:", error);
  }
};

export const deleteHistoryItem = (id: string): void => {
  try {
    let items = getHistoryItems();
    items = items.filter(item => item.id !== id);
    localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(items));
  } catch (error) {
    console.error("Error deleting history item from localStorage:", error);
  }
};

export const clearAllHistory = (): void => {
  try {
    localStorage.removeItem(LOCAL_STORAGE_HISTORY_KEY);
  } catch (error) {
    console.error("Error clearing history from localStorage:", error);
  }
};
