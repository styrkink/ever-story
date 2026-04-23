import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { stripe } from '../../config/stripe';
import { env } from '../../config/env';
import { CoppaService } from '../auth/coppa.service';
import Stripe from 'stripe';

export const webhookController: FastifyPluginAsync = async (server: FastifyInstance) => {
  server.post(
    '/api/webhooks/stripe',
    {
      config: { rawBody: true }, // requires fastify-raw-body registered in server.ts
    },
    async (request, reply) => {
      const sig = request.headers['stripe-signature'];

      if (!sig || !request.rawBody) {
        server.log.warn('Stripe webhook: missing signature or raw body');
        return reply.status(400).send({ error: 'Missing stripe-signature header or raw body' });
      }

      // ── 1. Verify Stripe webhook signature ──────────────────────────────────
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let event: any;
      try {
        event = stripe.webhooks.constructEvent(
          request.rawBody,
          sig,
          env.STRIPE_WEBHOOK_SECRET,
        );
      } catch (err: any) {
        server.log.error({ err: err.message }, 'Stripe webhook signature verification failed');
        return reply.status(400).send({ error: `Webhook Error: ${err.message}` });
      }

      server.log.info({ eventType: event.type, eventId: event.id }, 'Stripe webhook received');

      // ── 2. Route events ────────────────────────────────────────────────────
      try {
        switch (event.type) {
          case 'payment_intent.succeeded':
            await handlePaymentIntentSucceeded(server, event.data.object as any);
            break;

          case 'payment_intent.payment_failed':
            await handlePaymentIntentFailed(server, event.data.object as any);
            break;

          default:
            server.log.info({ eventType: event.type }, 'Stripe webhook: unhandled event type');
        }
      } catch (handlerErr: any) {
        // Do NOT return 5xx to Stripe — Stripe will retry aggressively.
        // Log the error and return 200 so we inspect it on our side.
        server.log.error(
          { eventId: event.id, eventType: event.type, err: handlerErr.message },
          'Stripe webhook handler error',
        );
      }

      // ── 3. Always acknowledge receipt to Stripe ────────────────────────────
      return reply.status(200).send({ received: true });
    },
  );
};

// ── Handlers ─────────────────────────────────────────────────────────────────

async function handlePaymentIntentSucceeded(
  server: FastifyInstance,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  paymentIntent: any,
): Promise<void> {
  const { userId, purpose } = paymentIntent.metadata ?? {};

  if (!userId || purpose !== 'coppa_verification') {
    // Not a COPPA PaymentIntent — skip silently
    return;
  }

  // ── Idempotency guard: skip if already verified ──────────────────────────
  const user = await server.prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, coppaVerifiedAt: true },
  });

  if (!user) {
    server.log.warn({ userId, paymentIntentId: paymentIntent.id }, 'COPPA webhook: user not found');
    return;
  }

  const coppaService = new CoppaService(server);

  if (!user.coppaVerifiedAt) {
    // First time: mark verified
    await coppaService.markVerified(userId);
  } else {
    server.log.info(
      { userId, paymentIntentId: paymentIntent.id },
      'COPPA webhook: user already verified, issuing refund only',
    );
  }

  // ── Always attempt refund (idempotent — Stripe ignores duplicate refund attempts) ──
  await coppaService.refundVerificationCharge(paymentIntent.id, userId);
}

async function handlePaymentIntentFailed(
  server: FastifyInstance,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  paymentIntent: any,
): Promise<void> {
  const { userId, purpose } = paymentIntent.metadata ?? {};

  if (!userId || purpose !== 'coppa_verification') return;

  server.log.warn(
    {
      userId,
      paymentIntentId: paymentIntent.id,
      lastPaymentError: paymentIntent.last_payment_error?.message,
    },
    'COPPA verification payment failed',
  );

  // Future: notify user via email/push that their verification attempt failed
}
