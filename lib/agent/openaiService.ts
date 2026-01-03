import OpenAI from 'openai';
import { buildSystemPrompt } from './systemPrompt';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function chat(
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
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    temperature: 0.7,
    max_tokens: 500,
  });
  
  return response.choices[0]?.message?.content || 'Hmm, da ist etwas schiefgelaufen. Versuch es nochmal! 💙';
}

export async function* chatStream(
  userMessage: string,
  userContext: string,
  conversationHistory: ChatMessage[] = []
): AsyncGenerator<string> {
  const systemPrompt = buildSystemPrompt(userContext);
  
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    { role: 'user', content: userMessage },
  ];
  
  const stream = await openai.chat.completions.create({
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

