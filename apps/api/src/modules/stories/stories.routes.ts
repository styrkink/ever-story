import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { generateStory, getStory, getStoryStatus, listStories } from './stories.controller';

const storiesRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  // Uses existing authentication and coppa checks globally applied or locally added.
  // Wait, the prior pattern: user must be authenticated.
  server.addHook('onRequest', server.authenticate);

  server.post('/generate', generateStory);
  server.get('/:id', getStory);
  server.get('/:id/status', getStoryStatus);
  server.get('/', listStories);
};

export default storiesRoutes;
