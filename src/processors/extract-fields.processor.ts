export function extractFieldsProcessor(
  payload: Record<string, unknown>,
  config: Record<string, unknown>
) {
  const fields = Array.isArray(config.fields) ? config.fields : [];
  const result: Record<string, unknown> = {};

  for (const field of fields) {
    if (typeof field === 'string' && field in payload) {
      result[field] = payload[field];
    }
  }

  return result;
}