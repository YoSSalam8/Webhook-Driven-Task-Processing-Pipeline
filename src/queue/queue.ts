import { Queue } from 'bullmq';
import { env } from '../config/env';

export const redisConfig = {
  host: env.redisHost,
  port: env.redisPort,
};

export const jobQueue = new Queue('pipeline-jobs', {
  connection: redisConfig,
});