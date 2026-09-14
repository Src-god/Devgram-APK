export const DEVGRAM_CONFIG = {
  appName: 'Devgram',
  packageName: 'com.devgram.messenger',
  appPin: '709177',
  featurePin: '56530',
  channelLink: 'https://t.me/tech_zone_dev',
  groupLink: 'https://t.me/high_table_dev',
  channelName: 'Tech Zone Dev',
  groupName: 'High Table Dev',
  brandLine: 'Remastered by Dev',
  developerLine: 'Developed by Dev 🫍',
} as const;

export type FeatureTarget = 'bot' | 'music';