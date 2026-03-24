import {
  addMetadataProcessor,
  extractFieldsProcessor,
  uppercaseProcessor,
} from '../processors';

type ProcessInput = {
  actionType: string;
  actionConfig: Record<string, unknown>;
  payload: Record<string, unknown>;
  pipelineId: string;
  eventId: string;
};

export function processPayload(input: ProcessInput) {
  switch (input.actionType) {
    case 'uppercase_text':
      return uppercaseProcessor(input.payload);

    case 'extract_fields':
      return extractFieldsProcessor(input.payload, input.actionConfig);

    case 'add_metadata':
      return addMetadataProcessor(input.payload, {
        pipelineId: input.pipelineId,
        eventId: input.eventId,
      });

    default:
      throw new Error(`Unsupported action type: ${input.actionType}`);
  }
}