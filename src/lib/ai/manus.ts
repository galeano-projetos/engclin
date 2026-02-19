/**
 * Cliente Manus API para tarefas que requerem navegacao web.
 * Usado para pesquisa de mercado e consulta de normas regulatorias.
 *
 * A Manus API e assincrona (task-based): cria-se uma task, aguarda polling ate completar.
 * Docs: https://open.manus.im/docs/openai-compatibility
 */

const MANUS_BASE_URL = "https://api.manus.im";
const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 60; // 3s * 60 = 3 min max

interface ManusTaskResponse {
  id: string;
  status: "running" | "pending" | "completed" | "error" | "failed";
  output?: { role: string; content: { type: string; text: string }[] }[];
  error?: string;
}

function getHeaders(): Record<string, string> {
  const apiKey = process.env.MANUS_API_KEY;
  if (!apiKey) {
    throw new Error("MANUS_API_KEY nao configurada");
  }
  return {
    "Content-Type": "application/json",
    API_KEY: apiKey,
  };
}

async function createTask(
  systemPrompt: string,
  userPrompt: string
): Promise<ManusTaskResponse> {
  const response = await fetch(`${MANUS_BASE_URL}/responses`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      model: "manus-1.6-lite",
      input: [
        { role: "system", content: [{ type: "input_text", text: systemPrompt }] },
        { role: "user", content: [{ type: "input_text", text: userPrompt }] },
      ],
      task_mode: "agent",
      agent_profile: "manus-1.6-lite",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Manus API error ${response.status}: ${errorText}`);
  }

  return response.json();
}

async function pollTask(taskId: string): Promise<ManusTaskResponse> {
  for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

    const response = await fetch(`${MANUS_BASE_URL}/responses/${taskId}`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Manus poll error ${response.status}: ${errorText}`);
    }

    const task: ManusTaskResponse = await response.json();

    if (task.status === "completed") {
      return task;
    }
    if (task.status === "error" || task.status === "failed") {
      throw new Error(`Manus task failed: ${task.error || "Unknown error"}`);
    }
  }

  throw new Error("Manus task timeout after 3 minutes");
}

function extractText(task: ManusTaskResponse): string {
  if (!task.output) return "";

  for (const msg of task.output) {
    if (msg.role === "assistant" && msg.content) {
      for (const part of msg.content) {
        if (part.type === "output_text" || part.type === "text") {
          return part.text;
        }
      }
    }
  }

  return "";
}

export async function manusGenerate(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const task = await createTask(systemPrompt, userPrompt);

  // If already completed (unlikely but possible)
  if (task.status === "completed") {
    return extractText(task);
  }

  // Poll until done
  const completedTask = await pollTask(task.id);
  return extractText(completedTask);
}
