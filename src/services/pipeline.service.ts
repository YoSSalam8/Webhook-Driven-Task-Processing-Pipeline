import { Prisma } from '@prisma/client';
import { prisma } from '../config/db';
import { generateSourceKey } from '../lib/generate-source-key';
import { CreatePipelineInput, UpdatePipelineInput } from '../types/pipeline';

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export async function createPipeline(data: CreatePipelineInput) {
  const sourceKey = generateSourceKey();

  const pipeline = await prisma.pipeline.create({
    data: {
      name: data.name,
      sourceKey,
      actionType: data.actionType,
      actionConfig: toJsonValue(data.actionConfig),
      subscribers: {
        create: data.subscribers.map((subscriber) => ({
          targetUrl: subscriber.targetUrl,
        })),
      },
    },
    include: {
      subscribers: true,
    },
  });

  return pipeline;
}

export async function getAllPipelines() {
  return prisma.pipeline.findMany({
    include: {
      subscribers: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function getPipelineById(id: string) {
  return prisma.pipeline.findUnique({
    where: { id },
    include: {
      subscribers: true,
    },
  });
}

export async function updatePipeline(id: string, data: UpdatePipelineInput) {
  const existing = await prisma.pipeline.findUnique({
    where: { id },
  });

  if (!existing) {
    return null;
  }

  const updateData: Prisma.PipelineUpdateInput = {
    ...(data.name !== undefined ? { name: data.name } : {}),
    ...(data.actionType !== undefined ? { actionType: data.actionType } : {}),
    ...(data.actionConfig !== undefined
      ? { actionConfig: toJsonValue(data.actionConfig) }
      : {}),
    ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
  };

  return prisma.pipeline.update({
    where: { id },
    data: updateData,
    include: {
      subscribers: true,
    },
  });
}

export async function deletePipeline(id: string) {
  const existing = await prisma.pipeline.findUnique({
    where: { id },
  });

  if (!existing) {
    return null;
  }

  await prisma.pipeline.delete({
    where: { id },
  });

  return { message: 'Pipeline deleted successfully' };
}