import { FastifyInstance, FastifyRequest } from 'fastify';
import { QueueEvents } from 'queue';

// Set to hold sockets mapped by jobId
const activeSockets = new Map<string, Set<any>>();

let eventsInitialized = false;

export function setupStoriesWebsockets(server: FastifyInstance) {
  if (!eventsInitialized) {
    eventsInitialized = true;
    
    // We import connection directly to share the ioredis instance
    const { connection } = require('queue');
    const generationEvents = new QueueEvents('story-generation', { connection });

    generationEvents.on('progress', ({ jobId, data }) => {
      const sockets = activeSockets.get(jobId);
      if (sockets) {
        sockets.forEach(socket => {
          socket.send(JSON.stringify({ type: 'progress', ...(data as any) }));
        });
      }
    });

    generationEvents.on('completed', ({ jobId, returnvalue }) => {
      const sockets = activeSockets.get(jobId);
      if (sockets) {
        sockets.forEach(socket => {
          try {
            const parsed = typeof returnvalue === 'string' ? JSON.parse(returnvalue) : returnvalue;
            socket.send(JSON.stringify({ type: 'story_ready', storyId: parsed?.storyId }));
          } catch (e) {
            socket.send(JSON.stringify({ type: 'story_ready' }));
          }
        });
      }
    });

    generationEvents.on('failed', ({ jobId, failedReason }) => {
      const sockets = activeSockets.get(jobId);
      if (sockets) {
        sockets.forEach(socket => {
          socket.send(JSON.stringify({ type: 'failed', reason: failedReason }));
        });
      }
    });
  }

  server.get<{ Params: { jobId: string } }>('/ws/stories/:jobId', { websocket: true }, (connection, req) => {
    const jobId = req.params.jobId;
    
    if (!activeSockets.has(jobId)) {
      activeSockets.set(jobId, new Set());
    }
    
    const sockets = activeSockets.get(jobId)!;
    sockets.add(connection.socket);

    connection.socket.on('close', () => {
      sockets.delete(connection.socket);
      if (sockets.size === 0) {
        activeSockets.delete(jobId);
      }
    });
  });
}
