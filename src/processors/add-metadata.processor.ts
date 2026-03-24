export function addMetadataProcessor(
  payload: Record<string, unknown>,
  meta: {
    pipelineId: string;
    eventId: string;
  }
) {
  return {
    original: payload,
    metadata: {
      pipelineId: meta.pipelineId,
      eventId: meta.eventId,
      processedAt: new Date().toISOString(),
    },
  };
}