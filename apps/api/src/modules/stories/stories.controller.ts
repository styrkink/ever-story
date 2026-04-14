import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { storyGenerationQueue } from 'queue';
import { AppError } from '../../utils/AppError';

// POST /api/stories/generate
const GenerateStorySchema = z.object({
  childId: z.string().uuid(),
  theme: z.string().min(2),
  artStyle: z.string().min(2),
  moral: z.string().min(2),
  ageGroup: z.string().min(2),
  customIdea: z.string().optional(),
});

export const generateStory = async (req: FastifyRequest, reply: FastifyReply) => {
  const user = req.user!;
  const data = GenerateStorySchema.parse(req.body);

  // 1. Verify child belongs to user
  const child = await req.server.prisma.child.findUnique({
    where: { id: data.childId },
  });

  if (!child || child.userId !== user.userId) {
    throw new AppError('Child not found or access denied', 403);
  }

  // 2. Check Plan Limits
  const subscription = await req.server.prisma.subscription.findUnique({
    where: { userId: user.userId },
  });

  const tierLimits = {
    FREE: 1,
    BASIC: 5,
    PREMIUM: 50,
  };

  const limit = tierLimits[(subscription?.tier as keyof typeof tierLimits) || 'FREE'];
  const used = subscription?.storiesUsedThisMonth || 0;

  if (used >= limit) {
    throw new AppError(`Story generation limit reached for your ${subscription?.tier || 'FREE'} plan.`, 402);
  }

  // 3. Create Story and GenerationJob records
  const story = await req.server.prisma.story.create({
    data: {
      userId: user.userId,
      childId: data.childId,
      theme: data.theme,
      artStyle: data.artStyle,
      moral: data.moral,
      ageGroup: data.ageGroup,
      status: 'QUEUED',
      generationJob: {
        create: {},
      },
    },
    include: {
      generationJob: true,
    },
  });

  // 4. Update usage
  if (subscription) {
    await req.server.prisma.subscription.update({
      where: { userId: user.userId },
      data: { storiesUsedThisMonth: used + 1 },
    });
  } else {
    await req.server.prisma.subscription.create({
      data: {
        userId: user.userId,
        tier: 'FREE',
        storiesUsedThisMonth: 1,
      }
    });
  }

  // 5. Add to queue
  const job = await storyGenerationQueue.add('generate-text', {
    storyId: story.id,
    params: {
      childName: child.name,
      theme: data.theme,
      artStyle: data.artStyle,
      moral: data.moral,
      ageGroup: data.ageGroup,
      petName: child.petName || undefined,
      customIdea: data.customIdea,
    },
  });

  return { storyId: story.id, jobId: job.id };
};

// GET /api/stories/:id
export const getStory = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  const story = await req.server.prisma.story.findUnique({
    where: { id: req.params.id },
    include: {
      pages: {
        orderBy: { pageNum: 'asc' },
      },
      child: {
        select: { name: true },
      },
    },
  });

  if (!story || story.userId !== req.user!.userId) {
    throw new AppError('Story not found', 404);
  }

  return { story };
};

// GET /api/stories/:id/status
export const getStoryStatus = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  const story = await req.server.prisma.story.findUnique({
    where: { id: req.params.id },
    select: { status: true, userId: true, manifestUrl: true, pdfUrl: true },
  });

  if (!story || story.userId !== req.user!.userId) {
    throw new AppError('Story not found', 404);
  }

  return { 
    status: story.status,
    manifestUrl: story.manifestUrl,
    pdfUrl: story.pdfUrl
  };
};

// GET /api/stories
export const listStories = async (req: FastifyRequest, reply: FastifyReply) => {
  const stories = await req.server.prisma.story.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: 'desc' },
    include: {
      child: {
        select: { name: true }
      }
    }
  });

  return { stories };
};
