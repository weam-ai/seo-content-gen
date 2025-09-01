import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiService {
  private genAI: GoogleGenerativeAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey =
      this.configService.get('GEMINI_API_KEY') || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is required but not provided');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  // Utility: Parse JSON response from Gemini
  public parseGeminiJsonResponse(response: string): any {
    try {
      if (!response) return null;

      // Extract JSON from markdown code blocks if present
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          return JSON.parse(jsonMatch[1]);
        } catch (jsonError) {
          console.error(
            'Failed to parse JSON from markdown code block:',
            jsonError,
          );
          // Continue to try other parsing methods
        }
      }

      // Try direct JSON parsing if not in code blocks
      try {
        return JSON.parse(response);
      } catch (directJsonError) {
        // If direct parsing fails, return null
        console.error('Failed to parse JSON directly:', directJsonError);
        return null;
      }
    } catch (err) {
      console.error('Gemini response parsing error:', err);
      return null;
    }
  }



  async generateContent(prompt: string, options?: any): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: options?.model || 'gemini-1.5-flash',
      });

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      if (!text) {
        throw new Error('Gemini response missing expected content');
      }

      return text;
    } catch (error) {
      console.error('Gemini Content Generation Error:', error);
      throw new HttpException(
        'Failed to generate content with Gemini',
        HttpStatus.INTERNAL_SERVER_ERROR,
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
  //     const model = this.genAI.getGenerativeModel({
  //       model: 'gemini-1.5-flash',
  //     });

  //     // Convert messages to a single prompt for Gemini
  //     const conversationPrompt = messages
  //       .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
  //       .join('\n\n');

  //     const result = await model.generateContent(conversationPrompt);
  //     const response = result.response;
  //     const text = response.text();

  //     if (!text) {
  //       throw new Error('Gemini response missing expected content');
  //     }

  //     return text;
  //   } catch (error) {
  //     console.error('Gemini Chat Error:', error);
  //     throw new HttpException(
  //       'Failed to process chat request with Gemini',
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }

  private calculateGrade(score: number, maxScore: number): string {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'A+';
    if (percentage >= 85) return 'A';
    if (percentage >= 80) return 'A-';
    if (percentage >= 75) return 'B+';
    if (percentage >= 70) return 'B';
    if (percentage >= 65) return 'B-';
    if (percentage >= 60) return 'C+';
    if (percentage >= 55) return 'C';
    if (percentage >= 50) return 'C-';
    if (percentage >= 45) return 'D+';
    if (percentage >= 40) return 'D';
    return 'F';
  }
}