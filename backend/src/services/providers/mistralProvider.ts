import OpenAI from "openai";
import { buildUserPrompt, SYSTEM_PROMPT } from "../../prompts/extraction.js";

export async function callMistral(
  apiKey: string,
  model: string,
  batch: { rowIndex: number; data: Record<string, string> }[]
): Promise<string> {
  const client = new OpenAI({
    apiKey,
    baseURL: "https://api.mistral.ai/v1",
  });

  const response = await client.chat.completions.create({
    model,
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(batch) },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from Mistral");
  }

  return content;
}