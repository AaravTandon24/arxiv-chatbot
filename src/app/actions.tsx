"use server";

import { createStreamableValue } from "ai/rsc";
import { CoreMessage, generateText, streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { JSDOM } from "jsdom";

export async function continueConversation(messages: CoreMessage[]) {
  const result = await streamText({
    model: openai("gpt-4o-mini"),
    messages,
  });

  const stream = createStreamableValue(result.textStream);
  return stream.value;
}

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
  return dom.window.document.body.textContent || "";
}

export async function summarise(url: string) {
  const htmlText = await fetchHTMLText(url);

  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    system: "You are an arXiv research paper summarizer.",
    prompt: `Summarize this research paper:\n\n${htmlText}`,
  });

  return { summary: text };
}

export async function chatbot(url: string, question: string) {
  const htmlText = await fetchHTMLText(url);

  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    system:
      "You are an assistant specializing in summarizing arXiv research papers. If the user asks for a summary or general information, provide a detailed summary of the paper. If the user asks a specific question, use the provided HTML content to answer it.",
    prompt: `Here is the arXiv paper extracted from HTML:\n\n${htmlText}\n\nUser's question: "${question}". If the user is asking for a summary, provide a clear summary.`,
  });

  return { answer: text };
}
