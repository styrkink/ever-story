import { Worker } from 'bullmq';
import { connection, QUEUE_NAMES, storyImageQueue } from 'queue';
import { generateStoryText, StoryParams } from 'ai-pipeline';
import { PrismaClient } from 'db';

const prisma = new PrismaClient();

export const initTextWorker = () => {
  const textWorker = new Worker(
    QUEUE_NAMES.STORY_GENERATION,
    async (job) => {
      const { storyId, params } = job.data as { storyId: string; params: StoryParams };
      
      console.log(`[TextWorker] Started story generation for storyId: ${storyId}`);
      
      // Update DB status to GENERATING
      await prisma.story.update({
        where: { id: storyId },
        data: { status: 'GENERATING' },
      });

      await job.updateProgress({ stage: 'text_generation', percent: 10 });
      
      try {
        // 1. Generate Text
        const pages = await generateStoryText(params);
        await job.updateProgress({ stage: 'text_generation', percent: 100 });
        
        // 2. Save Pages to DB
        const dbPages = await Promise.all(
          pages.map((p) =>
            prisma.storyPage.create({
              data: {
                storyId,
                pageNum: p.scene_number,
                text: p.text,
              },
            })
          )
        );

        // 3. Dispatch Image Jobs
        for (let i = 0; i < dbPages.length; i++) {
          const page = dbPages[i];
          const generatedInfo = pages.find((p) => p.scene_number === page.pageNum)!;
          
          await storyImageQueue.add('generate-image', {
            storyId,
            pageId: page.id,
            pageNum: page.pageNum,
            prompt: generatedInfo.illustration_prompt,
            artStyle: params.artStyle,
            childName: params.childName,
          });
        }

        console.log(`[TextWorker] Finished text generation for storyId: ${storyId}`);
        return { success: true, storyId };
      } catch (error) {
        console.error(`[TextWorker] Error generating story ${storyId}:`, error);
        
        await prisma.story.update({
          where: { id: storyId },
          data: { status: 'FAILED' },
        });
        
        // Update the generation job
        await prisma.generationJob.update({
          where: { storyId },
          data: {
            error: error instanceof Error ? error.message : String(error),
            completedAt: new Date(),
          },
        });

        throw error;
      }
    },
    { connection, concurrency: 5 }
  );

  textWorker.on('ready', () => {
    console.log('[TextWorker] Text Generation Worker is ready and listening to queue:', QUEUE_NAMES.STORY_GENERATION);
  });

  textWorker.on('failed', (job, err) => {
    console.error(`[TextWorker] Job ${job?.id} failed:`, err);
  });

  return textWorker;
};
