import type { PrismaClient } from '@prisma/client';
import { MAX_PLAYER_LEVEL } from '../src/shared/progression/progression.js';
import { LEVEL_MILESTONE_STEP } from '../src/shared/progression/level-milestone.js';

export const ENGLISH_CHALLENGE_APP_NAME = 'ENGLISH-CHALLENGE';
export const CHAT_BOX_APP_NAME = 'CHAT-BOX';

const ENGLISH_CHALLENGE_MESSAGES: Record<number, string> = {
  0: 'Rookie pilot — welcome to the English Challenge.',
  100: 'Century mark — your skills are taking shape.',
  200: 'Momentum builds. Keep your aim steady.',
  300: 'Rising through the ranks — stay sharp.',
  400: 'Precision and pace — you are on fire.',
  500: 'Elite territory — rivals take notice.',
  600: 'Veterans whisper your codename.',
  700: 'Pressure turns into pure precision.',
  800: 'Arena legend in the making.',
  900: 'One final push to the summit.',
  [MAX_PLAYER_LEVEL]: 'Max level reached — legend status unlocked.',
};

const CHAT_BOX_MESSAGES: Record<number, string> = {
  0: 'Welcome to Arcade Chat — say hello to the community!',
  100: 'Regular in the lobby — your voice is part of the arcade.',
  200: 'Building connections across the community.',
  300: 'Trusted member — keep the conversation going.',
  400: 'Your presence keeps the channels alive.',
  500: 'Community veteran — others look to you for tips.',
  600: 'Seasoned chatter — the arcade knows your name.',
  700: 'Hall-of-fame energy in every message.',
  800: 'Legend of the lobby — respect earned.',
  900: 'One step from the top of the chat ranks.',
  [MAX_PLAYER_LEVEL]: 'Max level — Arcade Chat legend unlocked.',
};

async function ensureMessagesForApp(
  prisma: PrismaClient,
  appName: string,
  messages: Record<number, string>,
): Promise<void> {
  const app = await prisma.app.findUnique({ where: { name: appName } });
  if (!app) {
    console.log(`[seed] App "${appName}" not found — skipping level messages.`);
    return;
  }

  for (let level = 0; level <= MAX_PLAYER_LEVEL; level += LEVEL_MILESTONE_STEP) {
    const message = messages[level];
    if (!message) continue;
    await prisma.levelMilestoneMessage.upsert({
      where: { appId_level: { appId: app.id, level } },
      create: { appId: app.id, level, message },
      update: { message },
    });
  }
  console.log(`[seed] Level milestone messages for "${appName}" ensured.`);
}

export async function ensureLevelMilestoneMessages(prisma: PrismaClient): Promise<void> {
  await ensureMessagesForApp(prisma, ENGLISH_CHALLENGE_APP_NAME, ENGLISH_CHALLENGE_MESSAGES);
  await ensureMessagesForApp(prisma, CHAT_BOX_APP_NAME, CHAT_BOX_MESSAGES);
}
