// Shared Chrome lookup so studio tools run on Windows and Linux without hard-coding one OS.
import fs from 'node:fs';

const CANDIDATES = [
  process.env.CHROME_PATH,
  '/usr/bin/google-chrome-stable',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
];

export function chromePath() {
  return CANDIDATES.find((p) => p && fs.existsSync(p)) || '';
}

export const chromeArgs = ['--no-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars', '--allow-file-access-from-files', '--force-color-profile=srgb', '--autoplay-policy=no-user-gesture-required'];
