import { describe, expect, it } from 'vitest';
import { processPayload } from '../src/services/processing.service';

describe('processing service - error paths', () => {
  it('throws for unsupported action type', () => {
    expect(() =>
      processPayload({
        actionType: 'unsupported_action',
        actionConfig: {},
        payload: {},
        pipelineId: 'pipeline-id',
        eventId: 'event-id',
      })
    ).toThrow('Unsupported action type: unsupported_action');
  });

  it('does not fail when extract_fields config is missing fields', () => {
    const result = processPayload({
      actionType: 'extract_fields',
      actionConfig: {},
      payload: { orderId: 'ORD-1' },
      pipelineId: 'pipeline-id',
      eventId: 'event-id',
    });

    expect(result).toEqual({});
  });

  it('does not fail when uppercase_text payload has no text field', () => {
    const result = processPayload({
      actionType: 'uppercase_text',
      actionConfig: {},
      payload: {},
      pipelineId: 'pipeline-id',
      eventId: 'event-id',
    });

    expect(result).toEqual({ text: '' });
  });
});