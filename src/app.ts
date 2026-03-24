import express from 'express';
import cors from 'cors';
import pipelineRoutes from './routes/pipeline.routes';
import webhookRoutes from './routes/webhook.routes';
import jobRoutes from './routes/job.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/pipelines', pipelineRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/webhooks', webhookRoutes);

export default app;