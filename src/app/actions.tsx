"use server";

import { createStreamableValue } from "ai/rsc";
import { CoreMessage, generateText, streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { text } from "stream/consumers";

export async function continueConversation(messages: CoreMessage[]) {
  const result = await streamText({
    model: openai("gpt-4o-mini"),
    messages,
  });

  const stream = createStreamableValue(result.textStream);
  return stream.value;
}

export async function summarise(url: string) {
  const res = await fetch("https://md.dhr.wtf/?url=" + url, {
    headers: {
      "Content-Type": "text/plain",
    },
  });

  const md = await res.text();

  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    system: "you are a arxiv research paper summariser",
    prompt: `summarise this research paper: ${md}`,
  });

  return { summary: text };
}

export async function chatbot(url: string, question: string) {
  const res = await fetch("https://md.dhr.wtf/?url=" + url, {
    headers: {
      "Content-Type": "text/plain",
    },
  });

  const md = await res.text();

  // Adjust the prompt to ensure it can handle general questions
  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    system:
      "You are an assistant specializing in summarizing arXiv research papers. If the user asks for a summary or general information, provide a detailed summary of the paper. If the user asks a specific question, use the provided markdown data to answer it.",
    prompt: `Here is the arXiv paper in markdown format:\n\n${md}\n\nUser's question: "${question}". If the user is asking for a summary, provide a clear summary.`,
  });

  return { answer: text };
}
