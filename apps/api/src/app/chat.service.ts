import { Injectable } from '@nestjs/common';

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

@Injectable()
export class ChatService {
  async streamReply(
    messages: ChatMessage[],
    onToken: (chunk: string) => void,
  ): Promise<void> {
    const openAiApiKey = process.env.OPENAI_API_KEY;

    if (openAiApiKey) {
      await this.streamOpenAi(messages, openAiApiKey, onToken);
      return;
    }

    await this.streamFallback(messages, onToken);
  }

  private async streamFallback(
    messages: ChatMessage[],
    onToken: (chunk: string) => void,
  ): Promise<void> {
    const latestUser = [...messages].reverse().find((m) => m.role === 'user');
    const prompt = latestUser?.content?.trim() || 'No prompt provided.';

    const response =
      `This is a backend-streamed response from Max API. ` +
      `You said: "${prompt}". ` +
      `To use a real model, set OPENAI_API_KEY and optionally OPENAI_MODEL.`;

    const words = response.split(' ');

    for (const word of words) {
      onToken(`${word} `);
      await new Promise((resolve) => setTimeout(resolve, 28));
    }
  }

  private async streamOpenAi(
    messages: ChatMessage[],
    apiKey: string,
    onToken: (chunk: string) => void,
  ): Promise<void> {
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        stream: true,
        messages: messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error('OpenAI streaming request failed');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();

        if (!trimmed.startsWith('data: ')) {
          continue;
        }

        const payload = trimmed.slice(6);

        if (payload === '[DONE]') {
          return;
        }

        try {
          const parsed = JSON.parse(payload) as {
            choices?: Array<{
              delta?: {
                content?: string;
              };
            }>;
          };

          const token = parsed.choices?.[0]?.delta?.content;

          if (token) {
            onToken(token);
          }
        } catch {
          // Ignore malformed stream chunks.
        }
      }
    }
  }
}
