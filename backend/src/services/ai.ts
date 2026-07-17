const AI_API_KEY = process.env.AI_API_KEY || '';
const AI_BASE_URL = process.env.AI_BASE_URL || process.env.AI_API_BASE_URL || 'http://host.docker.internal:1234/v1';
const AI_MODEL = process.env.AI_MODEL || 'google/gemma-4-e4b';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function chatCompletion(messages: ChatMessage[]): Promise<string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (AI_API_KEY) {
    headers['Authorization'] = `Bearer ${AI_API_KEY}`;
  }

  const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: AI_MODEL,
      messages,
      temperature: 0.2,
      max_tokens: 2000,
      stream: false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API error: ${error}`);
  }

  const data = await response.json() as { choices: { message: { content: string } }[] };
  return data.choices[0].message.content;
}

export async function summarizeNote(content: string): Promise<string> {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content:
        'You are a helpful assistant that creates concise summaries of notes. Summarize the following note in 2-3 sentences, capturing the key points.',
    },
    {
      role: 'user',
      content: content,
    },
  ];

  return chatCompletion(messages);
}
