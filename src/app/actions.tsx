"use server";

import { createStreamableValue } from "ai/rsc";
import { CoreMessage, generateText, streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { JSDOM } from "jsdom";
import { promises as fs } from "fs";
import { join } from "path";
import { mkdir } from "fs/promises";
import { v4 as uuidv4 } from "uuid";

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

async function extractPDFText(fileId: string): Promise<string> {
  try {
    // Directly import pdf-parse package
    const pdfParse = require("pdf-parse");

    const filePath = join(process.cwd(), "uploads", `${fileId}.pdf`);

    // Check if the file exists before trying to read it
    const fileExists = await fs
      .access(filePath)
      .then(() => true)
      .catch(() => false);
    if (!fileExists) {
      throw new Error(`PDF file not found at ${filePath}`);
    }

    const pdfBuffer = await fs.readFile(filePath);

    // PDF-parse has minimal options, we'll keep it simple
    const pdfData = await pdfParse(pdfBuffer);

    if (!pdfData.text || pdfData.text.trim().length === 0) {
      throw new Error("PDF text extraction returned empty content");
    }

    return pdfData.text;
  } catch (error) {
    console.error("Error extracting PDF text:", error);
    // Access error.message safely with optional chaining
    throw new Error(
      `Failed to extract text from PDF: ${error?.message || "Unknown error"}`
    );
  }
}

// Helper to determine if string is a URL or file ID
function isUrl(str: string): boolean {
  return str.startsWith("http");
}

export async function summarise(source: string) {
  let text;

  if (isUrl(source)) {
    text = await fetchHTMLText(source);
  } else {
    text = await extractPDFText(source);
  }

  const { text: summary } = await generateText({
    model: openai("gpt-4o-mini"),
    system: "You are an arXiv research paper summarizer.",
    prompt: `Summarize this research paper:\n\n${text}`,
  });

  return { summary };
}

export async function chatbot(source: string, question: string) {
  let text;
  const sourceType = isUrl(source) ? "HTML" : "PDF";

  if (isUrl(source)) {
    text = await fetchHTMLText(source);
  } else {
    text = await extractPDFText(source);
  }

  const { text: answer } = await generateText({
    model: openai("gpt-4o-mini"),
    system:
      "You are an assistant specializing in summarizing arXiv research papers. If the user asks for a summary or general information, provide a detailed summary of the paper. If the user asks a specific question, use the provided content to answer it.",
    prompt: `Here is the arXiv paper extracted from ${sourceType}:\n\n${text}\n\nUser's question: "${question}". If the user is asking for a summary, provide a clear summary.`,
  });

  return { answer };
}

// New function to handle PDF uploads
export async function uploadPDF(formData: FormData) {
  const file = formData.get("file") as File;

  if (!file) {
    throw new Error("No file uploaded");
  }

  // Check if it's a PDF
  if (!file.name.endsWith(".pdf")) {
    throw new Error("Uploaded file must be a PDF");
  }

  // Create a unique ID for the file
  const fileId = uuidv4();

  // Create uploads directory if it doesn't exist
  const uploadDir = join(process.cwd(), "uploads");
  try {
    await mkdir(uploadDir, { recursive: true });
  } catch (error) {
    console.error("Error creating uploads directory:", error);
  }

  // Save the file
  const filePath = join(uploadDir, `${fileId}.pdf`);
  const buffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(buffer);
  await fs.writeFile(filePath, uint8Array);

  return {
    fileId,
    fileName: file.name,
  };
}
