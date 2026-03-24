import { Worker } from 'bullmq';
import { prisma } from '../config/db';
import { env } from '../config/env';
import { deliverToSubscribers } from '../services/delivery.service';
import { processPayload } from '../services/processing.service';

const worker = new Worker(
  'pipeline-jobs',
  async (bullJob) => {
    const { jobId, eventId, pipelineId } = bullJob.data as {
      jobId: string;
      eventId: string;
      pipelineId: string;
    };

    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'processing',
        attempts: {
          increment: 1,
        },
      },
    });

    try {
      const jobRecord = await prisma.job.findUnique({
        where: { id: jobId },
        include: {
          event: true,
          pipeline: true,
        },
      });

      if (!jobRecord) {
        throw new Error(`Job not found: ${jobId}`);
      }

      const payload = (jobRecord.event.payload ?? {}) as Record<string, unknown>;
      const actionConfig = (jobRecord.pipeline.actionConfig ?? {}) as Record<
        string,
        unknown
      >;

      const result = processPayload({
        actionType: jobRecord.pipeline.actionType,
        actionConfig,
        payload,
        pipelineId,
        eventId,
      });

      const deliverySummary = await deliverToSubscribers({
        jobId,
        pipelineId,
        payload: result as Record<string, unknown>,
      });

      let finalStatus = 'completed';

      if (deliverySummary.total > 0) {
        if (deliverySummary.failedCount === deliverySummary.total) {
          finalStatus = 'failed';
        } else if (deliverySummary.failedCount > 0) {
          finalStatus = 'partially_failed';
        }
      }

      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: finalStatus,
          result: result as object,
          lastError:
            finalStatus === 'failed'
              ? 'All subscriber deliveries failed'
              : null,
        },
      });

      await prisma.webhookEvent.update({
        where: { id: eventId },
        data: {
          status: finalStatus === 'failed' ? 'failed' : 'processed',
          processedAt: new Date(),
        },
      });

      console.log(`Job finished: ${jobId} with status ${finalStatus}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown worker error';

      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'failed',
          lastError: message,
        },
      });

      await prisma.webhookEvent.update({
        where: { id: eventId },
        data: {
          status: 'failed',
        },
      });

      console.error(`Job failed: ${jobId}`, error);
      throw error;
    }
  },
  {
    connection: {
      host: env.redisHost,
      port: env.redisPort,
    },
  }
);

worker.on('ready', () => {
  console.log('Worker is ready');
});

worker.on('error', (error) => {
  console.error('Worker error:', error);
});