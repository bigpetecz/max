import { Injectable, Logger } from '@nestjs/common';
import {
  SBAZAR_CREATE_LISTING_JSON_SCHEMA,
  SbazarCreateListingTaskSchema,
  type SbazarCreateListingTask,
} from '@max/spec-kit';

type OllamaResponse = {
  response?: string;
  message?: { content?: string };
  done?: boolean;
};

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly ollamaBaseUrl =
    process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  private readonly ollamaModel =
    process.env.OLLAMA_MODEL || 'qwen2.5:7b-instruct';

  async extractTask(userMessage: string): Promise<SbazarCreateListingTask> {
    const prompt = this.buildPrompt(userMessage);

    this.logger.debug(
      `Extracting task from message via Ollama (${this.ollamaModel})`,
    );

    const raw = await this.callOllama(prompt);
    const parsed = this.parseJson(raw);
    return SbazarCreateListingTaskSchema.parse(parsed);
  }

  private buildPrompt(userMessage: string): string {
    return [
      'You are a task extraction assistant for Max, a personal automation platform.',
      'The user wants to create a classified listing on Sbazar.',
      'Extract the listing details from the message below and return ONLY valid JSON.',
      '',
      `User message: "${userMessage}"`,
      '',
      'Return JSON matching this schema exactly — no markdown, no explanation:',
      JSON.stringify(SBAZAR_CREATE_LISTING_JSON_SCHEMA, null, 2),
      '',
      'Rules:',
      '- taskType must be "sbazar.createListing"',
      '- price must be a positive integer in CZK',
      '- title must be 3-120 chars',
      '- description must be 10-5000 chars — write a concise but helpful listing description',
      '- if imagePaths are not mentioned, omit the field',
    ].join('\n');
  }

  private async callOllama(prompt: string): Promise<string> {
    const response = await fetch(`${this.ollamaBaseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.ollamaModel,
        prompt,
        stream: false,
        format: 'json',
        options: { temperature: 0 },
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Ollama request failed: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as OllamaResponse;
    const content = data.response ?? data.message?.content ?? '';

    if (!content) {
      throw new Error('Ollama returned empty response');
    }

    return content;
  }

  private parseJson(raw: string): unknown {
    const trimmed = raw.trim();
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('No JSON object found in Ollama response');
    }

    return JSON.parse(jsonMatch[0]);
  }
}
