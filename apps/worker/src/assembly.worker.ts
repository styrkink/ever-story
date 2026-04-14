import { Worker } from 'bullmq';
import { connection, QUEUE_NAMES } from 'queue';
import { assembleStory } from 'ai-pipeline';
import { PrismaClient } from 'db';

const prisma = new PrismaClient();

export const initAssemblyWorker = () => {
  const assemblyWorker = new Worker(
    QUEUE_NAMES.STORY_ASSEMBLY,
    async (job) => {
      const { storyId } = job.data as { storyId: string };
      console.log(`[AssemblyWorker] Started assembly for storyId: ${storyId}`);

      try {
        await job.updateProgress({ stage: 'assembling', percent: 10 });

        // 1. Fetch Story with pages & child
        const story = await prisma.story.findUnique({
          where: { id: storyId },
          include: {
            pages: { orderBy: { pageNum: 'asc' } },
            child: true,
            user: { include: { subscription: true } } // Fixed relation name
          },
        });

        if (!story) {
          throw new Error(`Story ${storyId} not found`);
        }

        // Determine if free tier
        // Based on schema, User has a Subscription.
        const subscription = await prisma.subscription.findUnique({
          where: { userId: story.userId }
        });
        
        const isFreeTier = !subscription || subscription.tier === 'FREE';

        // 2. Map pages to the exact format expected by assembleStory
        const pagesParams = story.pages.map(p => ({
          pageNum: p.pageNum,
          text: p.text,
          illustrationUrl: p.illustrationUrl,
          audioUrl: p.audioUrl,
          wordTimestamps: p.wordTimestamps
        }));

        await job.updateProgress({ stage: 'generating_pdf', percent: 40 });

        // 3. Assemble story (generates manifest, PDF, uploads to S3)
        const assemblyResult = await assembleStory({
          storyId,
          childName: story.child.name,
          theme: story.theme,
          artStyle: story.artStyle,
          createdAt: story.createdAt.toISOString(),
          isFreeTier,
          pages: pagesParams
        });

        await job.updateProgress({ stage: 'saving', percent: 90 });

        // 6. Update DB status and URLs
        await prisma.story.update({
          where: { id: storyId },
          data: {
            status: 'DONE',
            manifestUrl: assemblyResult.manifestUrl,
            pdfUrl: assemblyResult.pdfUrl,
          }
        });

        // Also update generation job
        await prisma.generationJob.update({
          where: { storyId },
          data: {
            completedAt: new Date(),
          }
        });

        console.log(`[AssemblyWorker] Finished assembly for storyId: ${storyId}`);
        console.log(`[AssemblyWorker] Manifest: ${assemblyResult.manifestUrl}`);
        console.log(`[AssemblyWorker] PDF: ${assemblyResult.pdfUrl}`);

        await job.updateProgress({ stage: 'complete', percent: 100 });

        // 7. Send WebSocket event
        // We publish to Redis so the fastify API instances can pick it up
        await connection.publish('story-assembly-events', JSON.stringify({
          type: 'story_ready',
          storyId,
          manifestUrl: assemblyResult.manifestUrl,
          pdfUrl: assemblyResult.pdfUrl,
        }));

        return { success: true, storyId, ...assemblyResult };
      } catch (error) {
        console.error(`[AssemblyWorker] Error assembling story ${storyId}:`, error);

        await prisma.story.update({
          where: { id: storyId },
          data: { status: 'FAILED' },
        });

        await prisma.generationJob.update({
          where: { storyId },
          data: {
            error: error instanceof Error ? error.message : String(error),
            completedAt: new Date(),
          },
        });

        // Publish failure event
        await connection.publish('story-assembly-events', JSON.stringify({
          type: 'failed',
          storyId,
          reason: error instanceof Error ? error.message : "Unknown error",
        }));

        throw error;
      }
    },
    { connection, concurrency: 2 } // Puppeteer is heavy, run fewer concurrently
  );

  assemblyWorker.on('ready', () => {
    console.log('[AssemblyWorker] Assembly Worker is ready and listening to queue:', QUEUE_NAMES.STORY_ASSEMBLY);
  });

  assemblyWorker.on('failed', (job, err) => {
    console.error(`[AssemblyWorker] Job ${job?.id} failed:`, err);
  });

  return assemblyWorker;
};
