export function uppercaseProcessor(payload: Record<string, unknown>) {
  const text = typeof payload.text === 'string' ? payload.text : '';

  return {
    text: text.toUpperCase(),
  };
}