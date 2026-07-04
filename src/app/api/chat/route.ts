import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { messages, selectedText, currentPage, bookTitle, model } =
      await req.json();

    const systemPrompt = `You are BookMind, an intelligent reading companion helping the user understand a book.

Book: "${bookTitle || "Unknown"}"
Current Page: ${currentPage || "Unknown"}
${selectedText ? `\nSelected text from the book:\n"${selectedText}"\n` : ""}

Guidelines:
- Be clear, insightful, and encouraging
- Reference the selected text when answering
- Use simple language to explain complex ideas
- Provide examples and analogies when helpful
- If the user asks about something unrelated to the book, gently redirect
- Format responses with markdown for readability`;

    const openRouterMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://bookmind.app",
          "X-Title": "BookMind",
        },
        body: JSON.stringify({
          model: model || "anthropic/claude-3.5-sonnet",
          messages: openRouterMessages,
          temperature: 0.7,
          max_tokens: 2048,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter error:", errorText);
      return NextResponse.json(
        { error: `OpenRouter API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 500 });
    }

    return NextResponse.json({
      content: data.choices[0].message.content,
      model: data.model,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to get AI response" },
      { status: 500 }
    );
  }
}
