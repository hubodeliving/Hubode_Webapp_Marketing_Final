import { google, sheets_v4 } from 'googleapis';

const REQUIRED_ENV_VARS = ['GOOGLE_CLIENT_EMAIL', 'GOOGLE_PRIVATE_KEY', 'GOOGLE_SHEETS_ID'] as const;

function assertEnv() {
  REQUIRED_ENV_VARS.forEach((key) => {
    if (!process.env[key]) {
      throw new Error(`Missing required env variable: ${key}`);
    }
  });
  if (process.env.NODE_ENV !== 'production') {
    console.log('[googleSheets] env check:', {
      emailPresent: Boolean(process.env.GOOGLE_CLIENT_EMAIL),
      keyPresent: Boolean(process.env.GOOGLE_PRIVATE_KEY),
      sheetIdPresent: Boolean(process.env.GOOGLE_SHEETS_ID),
    });
  }
}

let sheetsClientPromise: Promise<sheets_v4.Sheets> | null = null;

async function getSheetsClient() {
  if (sheetsClientPromise) return sheetsClientPromise;

  sheetsClientPromise = (async () => {
    assertEnv();

    const rawKey = process.env.GOOGLE_PRIVATE_KEY || '';
    const privateKey = rawKey.includes('\\n') ? rawKey.replace(/\\n/g, '\n') : rawKey;
    if (!privateKey) {
      throw new Error('GOOGLE_PRIVATE_KEY is empty after normalization.');
    }
    if (process.env.NODE_ENV !== 'production') {
      console.log('[googleSheets] private key sample:', privateKey.substring(0, 30));
    }

    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    await auth.authorize();
    return google.sheets({ version: 'v4', auth });
  })();

  return sheetsClientPromise;
}

const sheetTabName = process.env.GOOGLE_SHEETS_TAB || 'Sheet1';

function formatSheetRange(range: string) {
  const hasSpace = /[\\s'!]/.test(sheetTabName);
  const escapedName = sheetTabName.replace(/'/g, "''");
  const tabReference = hasSpace ? `'${escapedName}'` : escapedName;
  return `${tabReference}!${range}`;
}

export interface WaitlistEntry {
  name: string;
  phone: string;
  occupation: string;
  comingFrom: string;
  moveInTimeline: string;
  source?: string;
  propertyName?: string;
  propertyLocation?: string;
  roomType?: string;
}

export async function appendWaitlistEntry(entry: WaitlistEntry) {
  const sheets = await getSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID as string;

  const values = [[
    new Date().toISOString(),
    entry.name,
    entry.phone,
    entry.occupation,
    entry.comingFrom,
    entry.moveInTimeline,
    entry.source ?? 'waitlist-popup',
    entry.propertyName ?? '',
    entry.propertyLocation ?? '',
    entry.roomType ?? '',
  ]];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: formatSheetRange('A:J'),
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values,
    },
  });
}
