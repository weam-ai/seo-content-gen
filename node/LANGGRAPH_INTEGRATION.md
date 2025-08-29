# LangGraph Integration in OpenAI Service

## Overview

The OpenAI service has been upgraded to use LangGraph for autonomous decision-making and tool calling. This replaces the previous hardcoded logic with an intelligent graph-based workflow that allows the AI to autonomously decide when to fetch article data.

## Key Features

### 1. Autonomous Decision Making

- **No hardcoded keywords**: The AI now autonomously decides when to fetch article data based on context
- **Intelligent tool selection**: Uses LangGraph's conditional edges to determine the appropriate tools
- **Dynamic workflow**: The conversation flow adapts based on the AI's decisions

### 2. LangGraph Workflow

The implementation uses a state graph with the following nodes:

#### Nodes:

- **agent**: The main AI assistant that processes user messages and decides on tool usage
- **tools**: Executes the selected tools (article context or document retrieval)

#### Edges:

- **START → agent**: Initial entry point
- **agent → tools**: When AI decides to use tools
- **agent → END**: When AI provides final response
- **tools → agent**: After tool execution, return to agent for processing

### 3. Enhanced Tools

- **get_article_context**: Retrieves article metadata, title, outline, keywords, etc.
- **get_article_document**: Fetches full article content and version information

### 4. Improved Prompting

The system prompt now includes:

- Clear tool descriptions and usage guidelines
- Instructions for autonomous decision-making
- Professional content assistant persona
- Markdown formatting requirements

## Code Structure

```typescript
// Define state using Annotation
const GraphState = Annotation.Root({
  messages: Annotation<any[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
});

// Create model with bound tools
const modelWithTools = this.langchainModel.bindTools(tools);

// Define workflow nodes
const callModel = async (state: { messages: any[] }) => {
  // AI processing logic with enhanced prompts
};

const toolNode = new ToolNode(tools);

// Conditional logic for tool usage
const shouldContinue = (state: { messages: any[] }) => {
  const lastMessage = state.messages[state.messages.length - 1];
  return lastMessage.tool_calls?.length > 0 ? 'tools' : END;
};

// Build and compile the graph
const workflow = new StateGraph(GraphState)
  .addNode('agent', callModel)
  .addNode('tools', toolNode)
  .addEdge(START, 'agent')
  .addConditionalEdges('agent', shouldContinue)
  .addEdge('tools', 'agent');

const app = workflow.compile();
```

## Benefits

### 1. Autonomous Intelligence

- AI decides when article data is needed based on conversation context
- No more hardcoded keyword matching
- More natural and intelligent responses

### 2. Better User Experience

- More accurate responses based on actual article data
- Seamless tool integration without user awareness
- Contextually appropriate information retrieval

### 3. Maintainability

- Clean separation of concerns
- Easy to add new tools or modify workflow
- Better error handling and fallback mechanisms

### 4. Scalability

- Graph-based architecture allows for complex workflows
- Easy to extend with additional nodes and tools
- Supports parallel tool execution

## Usage Examples

### Autonomous Article Context Retrieval

```typescript
// User asks about current article
const response = await openaiService.chatWithOpenAI({
  articleId: 'article-123',
  messages: [{ role: 'user', content: 'What version is this document?' }],
});
// AI autonomously decides to use get_article_document tool
```

### Content Improvement Request

```typescript
const response = await openaiService.chatWithOpenAI({
  articleId: 'article-123',
  messages: [
    {
      role: 'user',
      content: 'Can you help improve the introduction of this article?',
    },
  ],
});
// AI autonomously fetches article content and provides improvement suggestions
```

## Workflow Visualization

```
START
  ↓
agent (AI processes message)
  ↓
shouldContinue() decision
  ↓                    ↓
tools (if needed)    END (if complete)
  ↓
agent (process tool results)
  ↓
END (final response)
```

## Future Enhancements

- Add web search tools for research
- Implement content generation workflows
- Add SEO analysis and optimization tools
- Support for collaborative editing workflows
- Integration with external content APIs
