const MODEL = "gemini-2.5-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const SYSTEM_PROMPT = `You are Penny, the friendly AI assistant inside "Pulse", a personal expense tracker app.
Answer the user's questions about their spending, budget, todos, and planned expenses using ONLY the data snapshot below.
Be concise (2-4 sentences), warm, and practical. Use the user's currency symbol when mentioning amounts.
If asked something unrelated to personal finance, gently steer back to their expenses.
You may give short money-saving tips when asked.`;

export interface ChatTurn {
  from: "user" | "bot";
  text: string;
}

/** Ask Gemini, grounding the reply in a snapshot of the user's data. Throws on any failure. */
export async function askGemini(
  apiKey: string,
  contextSummary: string,
  history: ChatTurn[]
): Promise<string> {
  const contents = history.map((m) => ({
    role: m.from === "user" ? "user" : "model",
    parts: [{ text: m.text }],
  }));

  const res = await fetch(`${ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: `${SYSTEM_PROMPT}\n\n--- USER DATA SNAPSHOT ---\n${contextSummary}` }],
      },
      contents,
      generationConfig: { maxOutputTokens: 400, temperature: 0.6 },
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini request failed (${res.status})`);
  }
  const data = await res.json();
  const text: string =
    data?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? "")
      .join("") ?? "";
  if (!text.trim()) throw new Error("Gemini returned an empty reply");
  return text.trim();
}
