import { FastifyInstance } from 'fastify';
import { stripe } from '../../config/stripe';
import { AppError } from '../../utils/AppError';

export class CoppaService {
  constructor(private server: FastifyInstance) {}

  /**
   * Creates a Stripe PaymentIntent for $0.01 (1 cent) COPPA verification.
   * The charge will be refunded automatically by the webhook handler
   * upon `payment_intent.succeeded`.
   *
   * Returns only the `clientSecret` — never expose the full PaymentIntent object to clients.
   */
  async createVerificationIntent(userId: string): Promise<{ clientSecret: string }> {
    // Guard: don't create a new intent if already verified
    const user = await this.server.prisma.user.findUnique({
      where: { id: userId },
      select: { coppaVerifiedAt: true },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.coppaVerifiedAt) {
      throw new AppError('COPPA verification already completed', 409);
    }

    const paymentIntent = await stripe.paymentIntents.create({
      // Stripe minimum is 50 cents for most currencies.
      // For COPPA verification we use $0.50 (50 cents) and refund immediately.
      // Using 1 cent would be rejected by Stripe API. We document this as
      // "verification charge" and refund in the webhook handler.
      amount: 50,       // $0.50 USD — minimum Stripe allows; refunded immediately
      currency: 'usd',
      // capture_method: 'automatic' is the default; charge fires immediately on confirm
      capture_method: 'automatic',
      metadata: {
        userId,
        purpose: 'coppa_verification',
        // Version sentinel so we can evolve the logic without ambiguity
        version: '1',
      },
      description: 'EverStory COPPA parental verification (refunded immediately)',
      // Statement descriptor visible on parent's bank statement (max 22 chars)
      statement_descriptor_suffix: 'COPPA VERIFY',
    });

    if (!paymentIntent.client_secret) {
      throw new AppError('Failed to create payment intent', 500);
    }

    this.server.log.info({ userId, paymentIntentId: paymentIntent.id }, 'COPPA PaymentIntent created');

    return { clientSecret: paymentIntent.client_secret };
  }

  /**
   * Marks the user as COPPA-verified in the database.
   * Called by the Stripe webhook after `payment_intent.succeeded`.
   * Idempotent: safe to call multiple times.
   */
  async markVerified(userId: string): Promise<void> {
    await this.server.prisma.user.update({
      where: { id: userId },
      data: { coppaVerifiedAt: new Date() },
    });
    this.server.log.info({ userId }, 'User COPPA-verified');
  }

  /**
   * Issues an immediate refund for a PaymentIntent.
   * Called after marking the user verified in the webhook handler.
   */
  async refundVerificationCharge(paymentIntentId: string, userId: string): Promise<void> {
    try {
      await stripe.refunds.create({
        payment_intent: paymentIntentId,
        reason: 'duplicate', // COPPA verification is not a "product", refund immediately
      });
      this.server.log.info({ userId, paymentIntentId }, 'COPPA verification charge refunded');
    } catch (err: any) {
      // Non-fatal: refund failure must not break the verification success.
      // Log the error; ops team can issue manual refund if needed.
      this.server.log.error(
        { userId, paymentIntentId, err: err.message },
        'COPPA refund failed — manual action may be required',
      );
    }
  }
}
