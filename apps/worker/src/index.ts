import * as dotenv from 'dotenv';
import path from 'path';

// Load env from root
dotenv.config({ path: path.join(__dirname, '../../../.env') });

import { Worker } from 'bullmq';
import { connection, QUEUE_NAMES, storyImageQueue } from 'queue';
import { generateStoryText, StoryParams } from 'ai-pipeline';
import { PrismaClient } from 'db';

const prisma = new PrismaClient();
console.log('Worker starting...');

import { initTextWorker } from './text.worker';
import { initImageWorker } from './image.worker';

console.log('Worker processes starting...');

// Initialize all workers
initTextWorker();
initImageWorker();

// Keep the process alive
process.on('SIGINT', () => {
  console.log('Shutting down workers...');
  process.exit(0);
});
