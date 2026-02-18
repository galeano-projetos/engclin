/**
 * Cliente Manus API para tarefas que requerem navegacao web.
 * Usado para pesquisa de mercado e consulta de normas regulatorias.
 *
 * A Manus API usa o formato OpenAI-compatible.
 */

const MANUS_BASE_URL = "https://api.mfranceschi.dev/v1";

interface ManusMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ManusResponse {
  choices: { message: { content: string } }[];
}

export async function manusGenerate(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const apiKey = process.env.MANUS_API_KEY;
  if (!apiKey) {
    throw new Error("MANUS_API_KEY nao configurada");
  }

  const messages: ManusMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  const response = await fetch(`${MANUS_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "manus-1",
      messages,
      temperature: 0.3,
      max_tokens: 3000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Manus API error ${response.status}: ${errorText}`);
  }

  const data: ManusResponse = await response.json();
  return data.choices[0]?.message?.content || "";
}
