import { SavedDesign } from '../types';

const STORAGE_KEY = 'ladder_redesign_studio_saves';

export const getSavedDesigns = (): SavedDesign[] => {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    return json ? JSON.parse(json) : [];
  } catch (e) {
    console.error("Failed to load designs", e);
    return [];
  }
};

export const saveDesign = (design: SavedDesign): void => {
  const current = getSavedDesigns();
  // Limit to last 10 to avoid hitting quota too quickly with base64 images
  const updated = [design, ...current].slice(0, 10);
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    // Check for quota exceeded error
    if (e instanceof DOMException && 
        (e.name === 'QuotaExceededError' || 
         e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
      throw new Error("Storage full. Please delete old projects to save new ones.");
    }
    throw e;
  }
};

export const deleteDesign = (id: string): void => {
  const current = getSavedDesigns();
  const updated = current.filter(d => d.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};
