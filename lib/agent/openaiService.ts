import OpenAI from 'openai';
import { buildSystemPrompt, buildAnonymizedSystemPrompt } from './systemPrompt';

// Lazy initialization - nur Server-Side
let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * DSGVO-konformer Chat - verwendet nur anonymisierten Kontext
 */
export async function chat(
  userMessage: string,
  userContext: string,
  conversationHistory: ChatMessage[] = []
): Promise<string> {
  // Verwende anonymisierten System-Prompt
  const systemPrompt = buildAnonymizedSystemPrompt(userContext);
  
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    { role: 'user', content: userMessage },
  ];
  
  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    temperature: 0.7,
    max_tokens: 500,
  });
  
  return response.choices[0]?.message?.content || 'Hmm, da ist etwas schiefgelaufen. Versuch es nochmal!';
}

/**
 * Legacy-Funktion mit vollem Kontext (nur für lokale Verarbeitung)
 * NICHT für externe APIs verwenden!
 */
export async function chatWithFullContext(
  userMessage: string,
  userContext: string,
  conversationHistory: ChatMessage[] = []
): Promise<string> {
  const systemPrompt = buildSystemPrompt(userContext);
  
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    { role: 'user', content: userMessage },
  ];
  
  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    temperature: 0.7,
    max_tokens: 500,
  });
  
  return response.choices[0]?.message?.content || 'Hmm, da ist etwas schiefgelaufen. Versuch es nochmal!';
}

/**
 * DSGVO-konformer Streaming Chat - verwendet nur anonymisierten Kontext
 */
export async function* chatStream(
  userMessage: string,
  userContext: string,
  conversationHistory: ChatMessage[] = []
): AsyncGenerator<string> {
  // Verwende anonymisierten System-Prompt
  const systemPrompt = buildAnonymizedSystemPrompt(userContext);
  
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    { role: 'user', content: userMessage },
  ];
  
  const stream = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    temperature: 0.7,
    max_tokens: 500,
    stream: true,
  });
  
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      yield content;
    }
  }
}

