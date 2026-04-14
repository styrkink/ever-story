import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { stripe } from '../../config/stripe';
import { env } from '../../config/env';

export const webhookController: FastifyPluginAsync = async (server: FastifyInstance) => {
  server.post(
    '/api/webhooks/stripe',
    { config: { rawBody: true } }, // Requires fastify-raw-body to be registered in server.ts
    async (request, reply) => {
      const sig = request.headers['stripe-signature'];
      
      if (!sig || !request.rawBody) {
        return reply.status(400).send({ error: 'Missing stripe signature or raw body' });
      }

      let event;
      try {
        event = stripe.webhooks.constructEvent(request.rawBody, sig, env.STRIPE_WEBHOOK_SECRET);
      } catch (err: any) {
        server.log.error(`Webhook Error: ${err.message}`);
        return reply.status(400).send(`Webhook Error: ${err.message}`);
      }

      // Handle the event
      switch (event.type) {
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as any;
          const userId = paymentIntent.metadata?.userId;
          const purpose = paymentIntent.metadata?.purpose;

          if (userId && purpose === 'coppa_verification') {
            // Update user in DB
            await server.prisma.user.update({
              where: { id: userId },
              data: { coppaVerifiedAt: new Date() },
            });

            // Issue a refund for the verification charge
            try {
              await stripe.refunds.create({
                payment_intent: paymentIntent.id,
              });
              server.log.info(`Refunded validation charge for user ${userId}`);
            } catch (refundError: any) {
              server.log.error(`Refund failed for user ${userId}: ${refundError.message}`);
            }
          }
          break;
        }
        // ... add more event types here
        default:
          server.log.info(`Unhandled event type ${event.type}`);
      }

      // Return a 200 response to acknowledge receipt of the event
      return reply.status(200).send({ received: true });
    }
  );
};
