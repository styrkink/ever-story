import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import sharp from 'sharp';
import { AppError } from '../../utils/AppError';
import { encrypt, decrypt } from '../../utils/crypto';
import { FaceService } from '../../services/face.service';
import { extractS3Key, deleteS3Objects } from '../../utils/s3';
import {
  createChildSchema,
  updateChildSchema,
  step1Schema,
  step2Schema,
  step3Schema,
  patchQuerySchema,
  childParamsSchema,
} from './children.schema';

const TIER_LIMITS: Record<string, number> = {
  FREE: 1,
  BASIC: 2,
  PREMIUM: 5,
};

/** Decrypt specialNotesEncrypted and expose as specialNotes in the API response. */
function toApiResponse(child: Record<string, unknown>) {
  const { specialNotesEncrypted, _count, ...rest } = child as {
    specialNotesEncrypted: string | null;
    _count?: { faceEmbeddings: number };
    [key: string]: unknown;
  };
  const photoCount = _count?.faceEmbeddings ?? 0;
  return {
    ...rest,
    specialNotes: specialNotesEncrypted ? decrypt(specialNotesEncrypted) : null,
    photoCount,
    hasEmbedding: photoCount > 0,
  };
}

export const childrenController: FastifyPluginAsync = async (server: FastifyInstance) => {
  server.addHook('preValidation', server.authenticate);
  server.addHook('preValidation', server.requireCoppa);

  // ── GET /api/children ────────────────────────────────────────────────────
  server.get('/api/children', async (request, reply) => {
    const children = await server.prisma.child.findMany({
      where: { userId: request.user.userId },
      orderBy: { createdAt: 'asc' },
      include: { _count: { select: { faceEmbeddings: true } } },
    });
    return reply.status(200).send(children.map(toApiResponse));
  });

  // ── POST /api/children ───────────────────────────────────────────────────
  server.post('/api/children', async (request, reply) => {
    const data = createChildSchema.parse(request.body);

    const userWithChildren = await server.prisma.user.findUnique({
      where: { id: request.user.userId },
      include: { _count: { select: { children: true } } },
    });

    if (!userWithChildren) throw new AppError('User not found', 404);

    const limit = TIER_LIMITS[userWithChildren.subscriptionTier] ?? 1;
    if (userWithChildren._count.children >= limit) {
      throw new AppError('Profile limit reached for current subscription tier.', 402);
    }

    const { specialNotes, ...rest } = data;
    const newChild = await server.prisma.child.create({
      data: {
        ...rest,
        specialNotesEncrypted: specialNotes ? encrypt(specialNotes) : null,
        userId: request.user.userId,
      },
    });

    return reply.status(201).send(toApiResponse(newChild as unknown as Record<string, unknown>));
  });

  // ── PUT /api/children/:id ─────────────────────────────────────────────────
  server.put('/api/children/:id', async (request, reply) => {
    const { id } = childParamsSchema.parse(request.params);
    const data = updateChildSchema.parse(request.body);

    const existing = await server.prisma.child.findFirst({
      where: { id, userId: request.user.userId },
    });
    if (!existing) throw new AppError('Child profile not found or unauthorized', 404);

    const { specialNotes, ...rest } = data;
    const updated = await server.prisma.child.update({
      where: { id },
      data: {
        ...rest,
        specialNotesEncrypted: specialNotes !== undefined
          ? (specialNotes ? encrypt(specialNotes) : null)
          : undefined,
      },
    });

    return reply.status(200).send(toApiResponse(updated as unknown as Record<string, unknown>));
  });

  // ── PATCH /api/children/:id ───────────────────────────────────────────────
  server.patch('/api/children/:id', async (request, reply) => {
    const { id } = childParamsSchema.parse(request.params);
    const { step } = patchQuerySchema.parse(request.query);

    const existing = await server.prisma.child.findFirst({
      where: { id, userId: request.user.userId },
    });
    if (!existing) throw new AppError('Child profile not found or unauthorized', 404);

    let updateData: Record<string, unknown>;

    if (step === '1') {
      updateData = step1Schema.parse(request.body);
    } else if (step === '2') {
      updateData = step2Schema.parse(request.body);
    } else {
      const { specialNotes, ...appearance } = step3Schema.parse(request.body);
      updateData = {
        ...appearance,
        specialNotesEncrypted: specialNotes !== undefined
          ? (specialNotes ? encrypt(specialNotes) : null)
          : undefined,
      };
    }

    const updated = await server.prisma.child.update({
      where: { id },
      data: updateData,
    });

    return reply.status(200).send(toApiResponse(updated as unknown as Record<string, unknown>));
  });

  // ── DELETE /api/children/:id ──────────────────────────────────────────────
  server.delete('/api/children/:id', async (request, reply) => {
    const { id } = childParamsSchema.parse(request.params);

    const existing = await server.prisma.child.findFirst({
      where: { id, userId: request.user.userId },
      include: {
        stories: {
          select: {
            manifestUrl: true,
            pdfUrl: true,
            pages: { select: { illustrationUrl: true } },
          },
        },
      },
    });
    if (!existing) throw new AppError('Child profile not found or unauthorized', 404);

    // Collect all S3 keys to delete
    const s3Keys: string[] = [];
    for (const story of existing.stories) {
      if (story.manifestUrl) {
        const key = extractS3Key(story.manifestUrl);
        if (key) s3Keys.push(key);
      }
      if (story.pdfUrl) {
        const key = extractS3Key(story.pdfUrl);
        if (key) s3Keys.push(key);
      }
      for (const page of story.pages) {
        if (page.illustrationUrl) {
          const key = extractS3Key(page.illustrationUrl);
          if (key) s3Keys.push(key);
        }
      }
    }

    // Synchronously erase all face embeddings (COPPA compliance — biometric data first)
    await server.prisma.childFaceEmbedding.deleteMany({ where: { childId: id } });

    // Cascade delete — removes stories, pages, generationJobs via Prisma schema
    await server.prisma.child.delete({ where: { id } });

    // Fire S3 cleanup in parallel (non-blocking — cascade already removed DB records)
    deleteS3Objects(s3Keys).catch((err) =>
      console.error('[children] S3 cleanup error after child delete:', err)
    );

    return reply.status(204).send();
  });

  // ── POST /api/children/:id/photo ──────────────────────────────────────────
  server.post('/api/children/:id/photo', async (request, reply) => {
    const { id } = childParamsSchema.parse(request.params);

    // COPPA: must have verified parental consent before processing biometrics
    const user = await server.prisma.user.findUnique({
      where: { id: request.user.userId },
      select: { coppaVerifiedAt: true },
    });
    if (!user?.coppaVerifiedAt) {
      throw new AppError('Parental consent verification required before uploading photos', 403);
    }

    const existing = await server.prisma.child.findFirst({
      where: { id, userId: request.user.userId },
    });
    if (!existing) throw new AppError('Child profile not found or unauthorized', 404);

    let fileData;
    try {
      fileData = await request.file();
    } catch {
      throw new AppError('Error processing file upload', 400);
    }
    if (!fileData) throw new AppError('No file uploaded', 400);

    if (!['image/jpeg', 'image/png'].includes(fileData.mimetype)) {
      throw new AppError('Unsupported file type. Use JPEG or PNG', 400);
    }

    const buffer = await fileData.toBuffer();

    if (buffer.length > 10 * 1024 * 1024) {
      throw new AppError('File too large. Maximum size is 10MB', 400);
    }

    // Strip EXIF and validate dimensions
    let metadata: sharp.Metadata;
    try {
      metadata = await sharp(buffer).metadata();
    } catch {
      throw new AppError('Invalid image data', 400);
    }

    if (!metadata.width || !metadata.height || metadata.width < 480 || metadata.height < 480) {
      throw new AppError('Image too small. Minimum size is 480×480px', 422);
    }

    // sharp strips EXIF by default when converting
    const processedBuffer = await sharp(buffer).toBuffer();
    const base64Image = processedBuffer.toString('base64');

    const faceResult = await FaceService.extractEmbedding(base64Image);

    if (faceResult.qualityScore < 0.7) {
      return reply.status(422).send({
        error: 'FACE_QUALITY_LOW',
        score: faceResult.qualityScore,
        hint: 'Попробуйте фото при хорошем освещении, лицо анфас',
      });
    }

    const encryptedEmbedding = encrypt(JSON.stringify(faceResult.embedding));

    // Append a new face embedding row (multi-photo storage)
    const faceEmbedding = await server.prisma.childFaceEmbedding.create({
      data: {
        childId: id,
        embeddingVector: encryptedEmbedding,
        qualityScore: faceResult.qualityScore,
      },
    });

    // Store float array in pgvector column on the new row
    const vectorStr = `[${faceResult.embedding.join(',')}]`;
    await server.prisma.$executeRaw`
      UPDATE "child_face_embeddings" SET "photoEmbedding" = ${vectorStr}::vector(512) WHERE id = ${faceEmbedding.id}
    `;

    await server.prisma.auditLog.create({
      data: {
        userId: request.user.userId,
        action: 'PHOTO_UPLOAD',
        entityId: id,
        metadata: {
          qualityScore: faceResult.qualityScore,
          embeddingId: faceEmbedding.id,
        },
      },
    });

    return reply.status(200).send({
      success: true,
      qualityScore: faceResult.qualityScore,
      embeddingId: faceEmbedding.id,
    });
  });

  // ── DELETE /api/children/:id/photo ────────────────────────────────────────
  server.delete('/api/children/:id/photo', async (request, reply) => {
    const { id } = childParamsSchema.parse(request.params);

    const existing = await server.prisma.child.findFirst({
      where: { id, userId: request.user.userId },
    });
    if (!existing) throw new AppError('Child profile not found or unauthorized', 404);

    // Erase ALL stored face embeddings for this child (COPPA compliance)
    const result = await server.prisma.childFaceEmbedding.deleteMany({
      where: { childId: id },
    });

    await server.prisma.auditLog.create({
      data: {
        userId: request.user.userId,
        action: 'PHOTO_DELETE',
        entityId: id,
        metadata: { deletedCount: result.count },
      },
    });

    return reply.status(200).send({
      message: 'Photo embeddings deleted successfully',
      deletedCount: result.count,
    });
  });
};
