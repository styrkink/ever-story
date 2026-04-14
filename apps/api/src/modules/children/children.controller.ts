import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { createChildSchema, updateChildSchema, childParamsSchema } from './children.schema';
import { AppError } from '../../utils/AppError';
import sharp from 'sharp';
import { encrypt } from '../../utils/crypto';
import { FaceService } from '../../services/face.service';

const TIER_LIMITS: Record<string, number> = {
  FREE: 1,
  BASIC: 2,
  PREMIUM: 5,
};

export const childrenController: FastifyPluginAsync = async (server: FastifyInstance) => {
  // Apply both authenticate and requireCoppa middleware to all routes in this controller
  server.addHook('preValidation', server.authenticate);
  server.addHook('preValidation', server.requireCoppa);

  server.get('/api/children', async (request, reply) => {
    const children = await server.prisma.child.findMany({
      where: { userId: request.user.userId },
      orderBy: { createdAt: 'asc' },
    });
    return reply.status(200).send(children);
  });

  server.post('/api/children', async (request, reply) => {
    const data = createChildSchema.parse(request.body);

    const userWithChildren = await server.prisma.user.findUnique({
      where: { id: request.user.userId },
      include: {
        _count: {
          select: { children: true },
        },
      },
    });

    if (!userWithChildren) {
      throw new AppError('User not found', 404);
    }

    const { subscriptionTier, _count } = userWithChildren;
    const currentLimit = TIER_LIMITS[subscriptionTier] || 1;

    if (_count.children >= currentLimit) {
      throw new AppError('Profile limit reached for current subscription tier.', 402);
    }

    const newChild = await server.prisma.child.create({
      data: {
        ...data,
        userId: request.user.userId,
      },
    });

    return reply.status(201).send(newChild);
  });

  server.put('/api/children/:id', async (request, reply) => {
    const { id } = childParamsSchema.parse(request.params);
    const data = updateChildSchema.parse(request.body);

    // Verify ownership before updating
    const existingChild = await server.prisma.child.findFirst({
      where: { id, userId: request.user.userId },
    });

    if (!existingChild) {
      throw new AppError('Child profile not found or unauthorized', 404);
    }

    const updatedChild = await server.prisma.child.update({
      where: { id },
      data,
    });

    return reply.status(200).send(updatedChild);
  });

  server.delete('/api/children/:id', async (request, reply) => {
    const { id } = childParamsSchema.parse(request.params);

    // Verify ownership
    const existingChild = await server.prisma.child.findFirst({
      where: { id, userId: request.user.userId },
    });

    if (!existingChild) {
      throw new AppError('Child profile not found or unauthorized', 404);
    }

    // Prisma Schema has onDelete: Cascade for stories etc.,
    // so deleting the child handles related records.
    await server.prisma.child.delete({
      where: { id },
    });

    return reply.status(200).send({ message: 'Child profile deleted successfully' });
  });

  server.post('/api/children/:id/photo', async (request, reply) => {
    const { id } = childParamsSchema.parse(request.params);

    // Verify ownership
    const existingChild = await server.prisma.child.findFirst({
      where: { id, userId: request.user.userId },
    });

    if (!existingChild) {
      throw new AppError('Child profile not found or unauthorized', 404);
    }

    let data;
    try {
      data = await request.file();
    } catch(err) {
      throw new AppError('Error processing file upload', 400);
    }

    if (!data) {
      throw new AppError('No file uploaded', 400);
    }

    // Check mimetype
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(data.mimetype)) {
      throw new AppError('Unsupported file type. Use JPG, PNG or WEBP', 400);
    }

    const buffer = await data.toBuffer();

    // Validate using sharp and remove EXIF
    let metadata;
    try {
      metadata = await sharp(buffer).metadata();
    } catch (e) {
      throw new AppError('Invalid image data', 400);
    }

    if (!metadata.width || !metadata.height || metadata.width < 200 || metadata.height < 200) {
      throw new AppError('Image too small. Minimum size is 200x200px', 422);
    }

    // Strip EXIF
    const processedBuffer = await sharp(buffer)
      // sharp strips EXIF by default
      .toBuffer();

    const base64Image = processedBuffer.toString('base64');

    // Call face-service
    const faceResult = await FaceService.extractEmbedding(base64Image);

    if (faceResult.qualityScore < 0.7) {
      // 422 Unprocessable Entity
      throw new AppError('Image quality is too low or face not clearly visible. Please upload a clear photo with good lighting.', 422);
    }

    // Encrypt the embedding using AES-256
    const embeddingStr = JSON.stringify(faceResult.embedding);
    const encryptedEmbedding = encrypt(embeddingStr);

    // Save to DB
    await server.prisma.child.update({
      where: { id },
      data: { embeddingVector: encryptedEmbedding },
    });

    return reply.status(200).send({ message: 'Photo processed successfully' });
  });

  server.delete('/api/children/:id/photo', async (request, reply) => {
    const { id } = childParamsSchema.parse(request.params);

    // Verify ownership
    const existingChild = await server.prisma.child.findFirst({
      where: { id, userId: request.user.userId },
    });

    if (!existingChild) {
      throw new AppError('Child profile not found or unauthorized', 404);
    }

    await server.prisma.child.update({
      where: { id },
      data: { embeddingVector: null },
    });

    return reply.status(200).send({ message: 'Photo embedding deleted successfully' });
  });
};
