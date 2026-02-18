import OpenAI from "openai";

function getClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

/**
 * Gera texto com GPT-4o-mini (rapido e barato).
 * Usado para sumarizacao, classificacao e geracao de insights.
 */
export async function generateText(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const response = await getClient().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens: 1000,
  });

  return response.choices[0]?.message?.content || "";
}

/**
 * Gera texto com GPT-4o (mais capacidade de raciocinio).
 * Usado para analise de causa raiz e tarefas complexas.
 */
export async function generateTextAdvanced(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const response = await getClient().chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.4,
    max_tokens: 2000,
  });

  return response.choices[0]?.message?.content || "";
}

/**
 * Chat multi-turno com GPT-4o para conversacao.
 */
export async function chatCompletion(
  messages: { role: "system" | "user" | "assistant"; content: string }[]
): Promise<string> {
  const response = await getClient().chat.completions.create({
    model: "gpt-4o",
    messages,
    temperature: 0.5,
    max_tokens: 1000,
  });

  return response.choices[0]?.message?.content || "";
}
