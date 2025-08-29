import {
  Injectable,
  HttpException,
  HttpStatus,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { RegenerateArticleDto } from './dto/regenerate-article.dto';
import { ClientOptions, OpenAI } from 'openai';
// Removed chat functionality - chat-completion.dto import deleted
// import {
//   ChatCompletionRequestMessage,
//   ChatMessageRole,
// } from './dto/chat-completion.dto';
import { ArticleService } from '@modules/article/article.service';
import { ChatOpenAI } from '@langchain/openai';
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
} from '@langchain/core/messages';
import { StateGraph, END, START, Annotation } from '@langchain/langgraph';
import { DynamicTool } from '@langchain/core/tools';
import { ToolNode } from '@langchain/langgraph/prebuilt';

@Injectable()
export class OpenAIService {
  OPENAI_API_KEY: string;
  private openai: OpenAI;
  private langchainModel: ChatOpenAI;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => ArticleService))
    private readonly articleService: ArticleService,
  ) {
    this.OPENAI_API_KEY = this.configService.get<string>('OPENAI_API_KEY', '');
    const configuration: ClientOptions = {
      apiKey: process.env.OPENAI_API_KEY,
    };
    this.openai = new OpenAI(configuration);

    // Initialize LangChain ChatOpenAI model
    this.langchainModel = new ChatOpenAI({
      openAIApiKey: this.OPENAI_API_KEY,
      modelName: 'gpt-4o',
      temperature: 0.7,
    });
  }

  async regenerateArticlePortion(data: RegenerateArticleDto) {
    const messages = [
      {
        role: 'system',
        content: `
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
          `.trim(),
      },
      {
        role: 'user',
        content: `Full Article:
          ${data.article}
          
          Selected Portion to Modify:
          ${data.text}
          
          User Prompt for Modification:
          ${data.prompt}`,
      },
    ];

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-4o',
            messages,
            temperature: 0.7,
          },
          {
            headers: {
              Authorization: `Bearer ${this.OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      const modifiedPortion =
        response.data.choices[0]?.message?.content?.trim();

      if (!modifiedPortion) {
        throw new HttpException(
          'Failed to generate content',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return { modifiedPortion };
    } catch (error) {
      console.error('OpenAI API Error:', error.message || error);

      throw new HttpException(
        'Failed to process OpenAI request',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Removed chat functionality - chatWithOpenAI method deleted
  /*
  async chatWithOpenAI(body: ChatCompletionRequestMessage): Promise<string> {
    try {
      // Convert messages to LangChain format
      const messages = body.messages.map((msg) => {
        switch (msg.role) {
          case ChatMessageRole.User:
            return new HumanMessage(msg.content);
          case ChatMessageRole.Assistant:
            return new AIMessage(msg.content);
          case ChatMessageRole.System:
            return new SystemMessage(msg.content);
          default:
            return new HumanMessage(msg.content);
        }
      });

      // Get last message
      const lastUserMessage = body.messages[body.messages.length - 1];

      // Create tools for article data retrieval
      const tools: DynamicTool[] = [];

      if (body?.articleId) {
        const articleId = body.articleId;

        const getArticleContextTool = new DynamicTool({
          name: 'get_article_context',
          description:
            'Get current article overview details including title, outline, keywords, and metadata. Use this when user asks about article information, metadata, or overview.',
          func: async () => {
            try {
              const article = await this.articleService.findOne(articleId);
              const contextData = { ...article, _id: undefined };
              return JSON.stringify(contextData, null, 2);
            } catch (error) {
              console.error(`Error fetching article ${articleId}:`, error);
              return 'Error: Could not retrieve article context.';
            }
          },
        });

        tools.push(getArticleContextTool);
      }

      // Create a model with tools
      const modelWithTools = this.langchainModel.bindTools(tools);

      // Define the assistant node
      const callModel = async (state: { messages: any[] }) => {
        let systemPrompt = '';

        if (lastUserMessage.selectedText) {
          // Use the same system prompt as regenerateArticlePortion for consistency
          systemPrompt = `
            You are a Markdown-aware article editor.
            
            You will receive:
            1. The full article content (if available via tools).
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
            
            **Available Tools:**
            ${
              tools.length > 0
                ? `
                - get_article_context: Get article metadata and overview information
                
                **IMPORTANT:** Always use get_article_context tool first to get the full article context before modifying the selected text.
            `
                : '- No article-specific tools available for this conversation'
            }`;
        } else {
          systemPrompt = `
            You are an AI content assistant for a writing platform. Your role is to help users with:

            - **Content Creation**: Generate blog sections, headlines, descriptions, CTAs, intros, conclusions
            - **Content Improvement**: Rewrite, simplify, expand, summarize, correct grammar
            - **Research & Analysis**: Provide insights and recommendations
            - **SEO Optimization**: Suggest improvements in readability, keyword use, structure

            **Available Tools:**
            ${
              tools.length > 0
                ? `
                - get_article_context: Get article metadata and overview information

                **When to use tools:**
                - Use tools when users ask about "current article", "this document", "what's in the article", etc.
                - Always use appropriate tools to get accurate, up-to-date information
                - Don't make assumptions about article content without checking
            `
                : '- No article-specific tools available for this conversation'
            }

            **Guidelines:**
            - Always respond in markdown format
            - Maintain a professional, helpful tone
            - Provide actionable advice and specific recommendations
            - If you need article information, use the available tools
            - Focus on content-related tasks and writing assistance

            **Important:** When users reference the current article or document, always use the appropriate tools to get the most current information rather than making assumptions.`;
        }

        const messagesWithSystem = [
          new SystemMessage(systemPrompt),
          ...state.messages,
        ];

        // If this is a text modification request, modify the last user message
        if (lastUserMessage.selectedText) {
          const lastMessageIndex = messagesWithSystem.length - 1;
          const originalContent = messagesWithSystem[lastMessageIndex].content;
          messagesWithSystem[lastMessageIndex] = new HumanMessage(
            `Selected text to modify: "${lastUserMessage.selectedText}"

User request: ${originalContent}`,
          );
        }

        const response = await modelWithTools.invoke(messagesWithSystem);
        return { messages: [response] };
      };

      // Create the graph
      const StateAnnotation = Annotation.Root({
        messages: Annotation<any[]>({
          reducer: (x, y) => x.concat(y),
        }),
      });

      const toolNode = new ToolNode(tools);

      const workflow = new StateGraph(StateAnnotation)
        .addNode('agent', callModel)
        .addNode('tools', toolNode)
        .addEdge(START, 'agent')
        .addConditionalEdges('agent', (state) => {
          const lastMessage = state.messages[state.messages.length - 1];
          if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
            return 'tools';
          }
          return END;
        })
        .addEdge('tools', 'agent');

      const app = workflow.compile();

      // Run the workflow
      const result = await app.invoke({ messages });
      const finalMessage = result.messages[result.messages.length - 1];

      return finalMessage.content;
    } catch (error) {
      console.error('OpenAI Chat Error:', error.message || error);
      throw new HttpException(
        'Failed to process chat request',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  */
}