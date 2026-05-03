import { Worker } from 'bullmq';
import { connection, QUEUE_NAMES, storyAssemblyQueue } from 'queue';
import { generateIllustration, ImageGenerationParams, AppearanceHint } from 'ai-pipeline';
import { PrismaClient } from 'db';

const prisma = new PrismaClient();

export const initImageWorker = () => {
  const imageWorker = new Worker(
    QUEUE_NAMES.STORY_IMAGE,
    async (job) => {
      const {
        storyId,
        pageId,
        pageNum,
        prompt,
        artStyle,
        childName,
        hasEmbedding,
        appearanceHint,
      } = job.data as {
        storyId: string;
        pageId: string;
        pageNum: number;
        prompt: string;
        artStyle: string;
        childName?: string;
        hasEmbedding?: boolean;
        appearanceHint?: AppearanceHint;
      };

      console.log(`[ImageWorker] Started image generation for storyId: ${storyId}, pageNum: ${pageNum}`);

      try {
        await job.updateProgress({ stage: 'generating_image', percent: 10 });

        const illustrationUrl = await generateIllustration({
          prompt,
          artStyle,
          childName,
          aspectRatio: '1:1',
          hasEmbedding: hasEmbedding ?? false,
          appearanceHint,
        });

        await job.updateProgress({ stage: 'saving', percent: 90 });

        await prisma.storyPage.update({
          where: { id: pageId },
          data: { illustrationUrl },
        });

        const allPages = await prisma.storyPage.findMany({
          where: { storyId },
          select: { illustrationUrl: true },
        });

        if (allPages.every((p) => p.illustrationUrl !== null)) {
          console.log(`[ImageWorker] All images generated for storyId: ${storyId}. Dispatching assembly job.`);
          await storyAssemblyQueue.add('assemble', { storyId });
        }

        console.log(`[ImageWorker] Finished image generation for storyId: ${storyId}, pageNum: ${pageNum}`);
        await job.updateProgress({ stage: 'complete', percent: 100 });

        return { success: true, storyId, pageId, illustrationUrl };
      } catch (error) {
        console.error(`[ImageWorker] Error generating image for storyId: ${storyId}, pageNum: ${pageNum}:`, error);
        throw error;
      }
    },
    { connection, concurrency: 10 }
  );

  imageWorker.on('ready', () => {
    console.log('[ImageWorker] Image Generation Worker is ready and listening to queue:', QUEUE_NAMES.STORY_IMAGE);
  });

  imageWorker.on('failed', (job, err) => {
    console.error(`[ImageWorker] Job ${job?.id} failed:`, err);
  });

  return imageWorker;
};
