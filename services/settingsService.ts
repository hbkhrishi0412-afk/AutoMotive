import type { PlatformSettings } from '../types';

const SETTINGS_STORAGE_KEY = 'reRidePlatformSettings';

const defaultSettings: PlatformSettings = {
    listingFee: 25,
    siteAnnouncement: 'Welcome to ReRide! All EVs are 10% off this week.',
};

export const getSettings = (): PlatformSettings => {
  try {
    const settingsJson = localStorage.getItem(SETTINGS_STORAGE_KEY);
    return settingsJson ? { ...defaultSettings, ...JSON.parse(settingsJson) } : defaultSettings;
  } catch (error) {
    console.error("Failed to parse settings from localStorage", error);
    return defaultSettings;
  }
};

export const saveSettings = (settings: PlatformSettings) => {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (error)
    {
    console.error("Failed to save settings to localStorage", error);
  }
};