import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch models" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Filter and format the most useful models
    const models = data.data
      .filter(
        (m: { id: string }) =>
          m.id.includes("claude") ||
          m.id.includes("gpt") ||
          m.id.includes("gemini") ||
          m.id.includes("llama") ||
          m.id.includes("mistral") ||
          m.id.includes("qwen")
      )
      .map((m: { id: string; name: string; context_length: number; pricing: { prompt: string; completion: string } }) => ({
        id: m.id,
        name: m.name || m.id,
        context_length: m.context_length || 0,
        pricing: m.pricing || { prompt: "0", completion: "0" },
      }))
      .sort((a: { name: string }, b: { name: string }) =>
        a.name.localeCompare(b.name)
      );

    return NextResponse.json({ models });
  } catch (error) {
    console.error("Models API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch models" },
      { status: 500 }
    );
  }
}
