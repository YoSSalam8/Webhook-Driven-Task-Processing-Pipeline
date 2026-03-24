import { z } from 'zod';

export const subscriberSchema = z.object({
  targetUrl: z.string().url(),
});

export const createPipelineSchema = z.object({
  name: z.string().min(1),
  actionType: z.enum(['uppercase_text', 'extract_fields', 'add_metadata']),
  actionConfig: z.object({}).passthrough().default({}),
  subscribers: z.array(subscriberSchema).min(1),
});

export const updatePipelineSchema = z.object({
  name: z.string().min(1).optional(),
  actionType: z.enum(['uppercase_text', 'extract_fields', 'add_metadata']).optional(),
  actionConfig: z.object({}).passthrough().optional(),
  isActive: z.boolean().optional(),
});

export type CreatePipelineInput = z.infer<typeof createPipelineSchema>;
export type UpdatePipelineInput = z.infer<typeof updatePipelineSchema>;