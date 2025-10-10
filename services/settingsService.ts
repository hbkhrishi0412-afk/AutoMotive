import type { PlatformSettings } from '../types';
import { DatabaseServiceClient } from './databaseServiceClient';

const defaultSettings: PlatformSettings = {
    listingFee: 25,
    siteAnnouncement: 'Welcome to AutoVerse AI! All EVs are 10% off this week.',
};

export const getSettings = async (): Promise<PlatformSettings> => {
  try {
    const dbSettings = await DatabaseServiceClient.getSettings();
    return { ...defaultSettings, ...dbSettings };
  } catch (error) {
    console.error("Failed to fetch settings from database", error);
    return defaultSettings;
  }
};

export const saveSettings = async (settings: PlatformSettings): Promise<void> => {
  try {
    await DatabaseServiceClient.saveSettings(settings);
  } catch (error) {
    console.error("Failed to save settings to database", error);
  }
};
