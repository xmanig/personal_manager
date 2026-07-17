import { PrismaClient } from './src/generated/prisma';
import { google } from 'googleapis';
import { encrypt } from '../src/lib/encryption';
import { createOAuth2Client, SCOPES } from '../src/services/google-auth';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking for legacy single-account tokens...');

  const [accessToken, refreshToken, expiry] = await Promise.all([
    prisma.userSetting.findUnique({ where: { key: 'google_access_token' } }),
    prisma.userSetting.findUnique({ where: { key: 'google_refresh_token' } }),
    prisma.userSetting.findUnique({ where: { key: 'google_token_expiry' } }),
  ]);

  if (!accessToken || !refreshToken) {
    console.log('No legacy tokens found — nothing to migrate.');
    return;
  }

  const existingAccounts = await prisma.googleAccount.count();
  if (existingAccounts > 0) {
    console.log(`Already have ${existingAccounts} GoogleAccount(s) — migration already complete.`);
    return;
  }

  console.log('Legacy tokens found. Attempting to fetch email...');

  let email = 'unknown@unknown.com';
  try {
    const client = createOAuth2Client();
    client.setCredentials({
      access_token: accessToken.value,
      refresh_token: refreshToken.value,
      expiry_date: expiry ? parseInt(expiry.value, 10) : undefined,
    });

    const oauth2 = google.oauth2({ version: 'v2', auth: client });
    const { data } = await oauth2.userinfo.get();
    if (data.email) {
      email = data.email;
    }
  } catch (err) {
    console.warn('Could not fetch email from Google, using placeholder:', err);
  }

  const account = await prisma.googleAccount.create({
    data: {
      email,
      label: 'Default',
      accessToken: encrypt(accessToken.value),
      refreshToken: encrypt(refreshToken.value),
      tokenExpiry: expiry ? new Date(parseInt(expiry.value, 10)) : new Date(Date.now() + 3600 * 1000),
      scopes: SCOPES,
      isDefault: true,
    },
  });

  console.log(`Created GoogleAccount: ${email} (id=${account.id})`);

  const billCount = await prisma.bill.updateMany({
    where: { googleAccountId: null },
    data: { googleAccountId: account.id },
  });
  console.log(`Tagged ${billCount.count} bill(s) with account.`);

  const eventCount = await prisma.calendarEvent.updateMany({
    where: { googleAccountId: null },
    data: { googleAccountId: account.id },
  });
  console.log(`Tagged ${eventCount.count} calendar event(s) with account.`);

  await prisma.userSetting.deleteMany({
    where: { key: { in: ['google_access_token', 'google_refresh_token', 'google_token_expiry'] } },
  });
  console.log('Cleaned up legacy UserSetting token keys.');

  console.log('Migration complete!');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
