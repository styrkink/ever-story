import { Queue, QueueEvents, Worker } from 'bullmq';
import IORedis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

export const QUEUE_NAMES = {
  STORY_GENERATION: 'story-generation',
  STORY_IMAGE: 'story-image',
  STORY_AUDIO: 'story-audio',
  STORY_ASSEMBLY: 'story-assembly',
  EMAIL_TRANSACTIONAL: 'email-transactional',
} as const;

export const storyGenerationQueue = new Queue(QUEUE_NAMES.STORY_GENERATION, { connection });
export const storyImageQueue = new Queue(QUEUE_NAMES.STORY_IMAGE, { connection });
export const storyAudioQueue = new Queue(QUEUE_NAMES.STORY_AUDIO, { connection });
export const storyAssemblyQueue = new Queue(QUEUE_NAMES.STORY_ASSEMBLY, { connection });
export const emailTransactionalQueue = new Queue(QUEUE_NAMES.EMAIL_TRANSACTIONAL, { connection });

export { QueueEvents, Worker };
