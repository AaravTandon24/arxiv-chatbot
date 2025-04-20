"use server";

import { createStreamableValue } from "ai/rsc";
import { CoreMessage, generateText, streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { JSDOM } from "jsdom";

// Stream conversation
export async function continueConversation(messages: CoreMessage[]) {
  const result = await streamText({
    model: openai("gpt-4o-mini"),
    messages,
  });

  const stream = createStreamableValue(result.textStream);
  return stream.value;
}

// Fetch HTML content and extract visible text
async function fetchHTMLText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch HTML: ${res.statusText}`);
  }

  const html = await res.text();
  const dom = new JSDOM(html);

  // Extract only the visible text from the body
  return dom.window.document.body.textContent || "";
}

// Summarize HTML page content
export async function summarise(url: string) {
  const text = await fetchHTMLText(url);

  const { text: summary } = await generateText({
    model: openai("gpt-4o-mini"),
    system: "You are an arXiv research paper summarizer.",
    prompt: `Summarize this research paper:\n\n${text}`,
  });

  return { summary };
}

// Answer questions based on HTML content
export async function chatbot(url: string, question: string) {
  const text = await fetchHTMLText(url);

  const { text: answer } = await generateText({
    model: openai("gpt-4o-mini"),
    system:
      "You are an assistant specializing in arXiv research papers. Use the provided content to answer user questions or give a summary if asked.",
    prompt: `Here is the arXiv paper in HTML format:\n\n${text}\n\nUser's question: "${question}". If the user is asking for a summary, provide a clear summary.`,
  });

  return { answer };
}
