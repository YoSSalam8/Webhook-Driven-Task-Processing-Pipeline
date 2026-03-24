import { prisma } from '../config/db';

export async function getAllJobs() {
  return prisma.job.findMany({
    include: {
      event: true,
      pipeline: true,
      deliveries: {
        include: {
          subscriber: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function getJobById(id: string) {
  return prisma.job.findUnique({
    where: { id },
    include: {
      event: true,
      pipeline: true,
      deliveries: {
        include: {
          subscriber: true,
        },
      },
    },
  });
}