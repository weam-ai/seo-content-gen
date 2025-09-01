import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class ClaudeService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.anthropic.com/v1';

  constructor(private readonly configService: ConfigService) {
    const apiKey =
      this.configService.get('CLAUDE_API_KEY') || process.env.CLAUDE_API_KEY;

    if (!apiKey) {
      throw new Error('CLAUDE_API_KEY is required but not provided');
    }

    this.apiKey = apiKey;
  }

  async generateContent(prompt: string, options?: any): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/messages`,
        {
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: options?.maxTokens || 4000,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
          },
        },
      );

      return response.data.content[0].text as string;
    } catch (error) {
      console.error('Claude API Error:', error);
      throw new InternalServerErrorException(
        'Failed to generate content with Claude',
      );
    }
  }



  async regenerateArticlePortion(data: {
    article: string;
    text: string;
    prompt: string;
  }): Promise<{ modifiedPortion: string }> {
    const regenerationPrompt = `
      You are a Markdown-aware article editor.
      
      You will receive:
      1. The full article (markdown).
      2. A selected portion to modify (markdown).
      3. A user prompt describing the modification.
      
      Your job is to **only modify the selected portion**, based on what the prompt asks.
      
      Guidelines:
      
      - ✍️ For prompts like "rewrite", "reword", or "improve":
        - Keep the meaning **and** markdown structure identical.
        - Only rephrase using clearer, tighter, or more modern language.
        - Do **not** expand or elaborate unless the prompt explicitly asks for it.
        - Stay within ±10% of the original text length.
      
      - 🧹 For prompts about style/formatting/headings:
        - Only make the **exact change requested**.
        - Do **not** reword or touch other parts of the selection.
      
      - 🔠 Preserve all Markdown formatting:
        - Headings, lists, emphasis, blockquotes, etc.
      
      - 🤐 Never include the full article or explanations.
      - 🎯 Return **only** the updated version of the selected portion, as valid Markdown.
      
      When in doubt, do the **smallest** meaningful change.
      
      Full Article:
      ${data.article}
      
      Selected Portion to Modify:
      ${data.text}
      
      User Prompt for Modification:
      ${data.prompt}`;

    const modifiedPortion = await this.generateContent(regenerationPrompt);
    return { modifiedPortion };
  }

  // Removed chat functionality - chatCompletion method deleted
  // async chatCompletion(messages: Array<{ role: string; content: string }>): Promise<string> {
  //   try {
  //     const response = await axios.post(
  //       `${this.baseUrl}/messages`,
  //       {
  //         model: 'claude-3-5-sonnet-20241022',
  //         max_tokens: 4000,
  //         messages: messages.map(msg => ({
  //           role: msg.role === 'assistant' ? 'assistant' : 'user',
  //           content: msg.content,
  //         })),
  //       },
  //       {
  //         headers: {
  //           'Content-Type': 'application/json',
  //           'x-api-key': this.apiKey,
  //           'anthropic-version': '2023-06-01',
  //         },
  //       },
  //     );

  //     return response.data.content[0].text as string;
  //   } catch (error) {
  //     console.error('Claude Chat API Error:', error);
  //     throw new InternalServerErrorException(
  //       'Failed to process chat request with Claude',
  //     );
  //   }
  // }
}