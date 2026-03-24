import axios from 'axios';
import { prisma } from '../config/db';

type DeliveryInput = {
  jobId: string;
  subscriberId: string;
  targetUrl: string;
  payload: Record<string, unknown>;
};

type DeliveryResult = {
  success: boolean;
  attempts: number;
};

const MAX_DELIVERY_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [1000, 3000, 5000];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function deliverToSubscriber(
  input: DeliveryInput
): Promise<DeliveryResult> {
  let lastErrorMessage: string | null = null;

  for (let attempt = 1; attempt <= MAX_DELIVERY_ATTEMPTS; attempt += 1) {
    try {
      const response = await axios.post(input.targetUrl, input.payload, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
        },
        validateStatus: () => true,
      });

      const isSuccess = response.status >= 200 && response.status < 300;
      const shouldRetry = response.status >= 500 || response.status === 429;

      await prisma.deliveryAttempt.create({
        data: {
          jobId: input.jobId,
          subscriberId: input.subscriberId,
          attemptNumber: attempt,
          status: isSuccess ? 'success' : 'failed',
          responseStatus: response.status,
          responseBody:
            typeof response.data === 'string'
              ? response.data
              : JSON.stringify(response.data),
          errorMessage: isSuccess
            ? null
            : `HTTP ${response.status}`,
        },
      });

      if (isSuccess) {
        return {
          success: true,
          attempts: attempt,
        };
      }

      lastErrorMessage = `HTTP ${response.status}`;

      if (!shouldRetry || attempt === MAX_DELIVERY_ATTEMPTS) {
        return {
          success: false,
          attempts: attempt,
        };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown delivery error';

      lastErrorMessage = errorMessage;

      await prisma.deliveryAttempt.create({
        data: {
          jobId: input.jobId,
          subscriberId: input.subscriberId,
          attemptNumber: attempt,
          status: 'failed',
          errorMessage,
        },
      });

      if (attempt === MAX_DELIVERY_ATTEMPTS) {
        return {
          success: false,
          attempts: attempt,
        };
      }
    }

    await sleep(RETRY_DELAYS_MS[attempt - 1] ?? 5000);
  }

  return {
    success: false,
    attempts: MAX_DELIVERY_ATTEMPTS,
  };
}

export async function deliverToSubscribers(params: {
  jobId: string;
  pipelineId: string;
  payload: Record<string, unknown>;
}) {
  const subscribers = await prisma.subscriber.findMany({
    where: {
      pipelineId: params.pipelineId,
      isActive: true,
    },
  });

  if (subscribers.length === 0) {
    return {
      total: 0,
      successCount: 0,
      failedCount: 0,
    };
  }

  let successCount = 0;
  let failedCount = 0;

  for (const subscriber of subscribers) {
    const result = await deliverToSubscriber({
      jobId: params.jobId,
      subscriberId: subscriber.id,
      targetUrl: subscriber.targetUrl,
      payload: params.payload,
    });

    if (result.success) {
      successCount += 1;
    } else {
      failedCount += 1;
    }
  }

  return {
    total: subscribers.length,
    successCount,
    failedCount,
  };
}