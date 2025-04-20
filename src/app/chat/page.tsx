"use client";

import { type CoreMessage } from "ai";
import { useState } from "react";
import { continueConversation, chatbot } from "../actions";
import { readStreamableValue } from "ai/rsc";
import Link from "next/link"; // ✅ Import Link

export const maxDuration = 30;

export default function Chat() {
  const [messages, setMessages] = useState<CoreMessage[]>([]);
  const [input, setInput] = useState("");
  const [paperUrl, setPaperUrl] = useState("");
  const [currentPaperUrl, setCurrentPaperUrl] = useState("");

  const handlePaperUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPaperUrl(paperUrl);
    setPaperUrl("");
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessages: CoreMessage[] = [
      ...messages,
      { content: input, role: "user" },
    ];

    setMessages(newMessages);
    setInput("");

    if (currentPaperUrl) {
      const response = await chatbot(currentPaperUrl, input);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: "assistant",
          content: response.answer,
        },
      ]);
    } else {
      const result = await continueConversation(newMessages);

      for await (const content of readStreamableValue(result)) {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            role: "assistant",
            content: content as string,
          },
        ]);
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-black to-gray-900 text-white px-4">
      <div className="flex flex-col w-full max-w-2xl bg-neutral-900 rounded-2xl shadow-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Arxiv Chatbot</h1>
          <Link
            href="/"
            className="text-sm bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-md font-medium transition"
          >
            ← Back to Home
          </Link>
        </div>

        <form onSubmit={handlePaperUrlSubmit} className="flex gap-2 mb-4">
          <input
            className="flex-grow px-4 py-2 rounded-md bg-gray-800 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={paperUrl}
            placeholder="Paste Arxiv link here..."
            onChange={(e) => setPaperUrl(e.target.value)}
          />
          <button
            type="submit"
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-md font-semibold"
          >
            Load
          </button>
        </form>

        {currentPaperUrl && (
          <div className="mb-4 p-3 bg-gray-800 text-sm rounded-md border border-gray-700">
            <span className="text-gray-400">Current paper:</span>{" "}
            {currentPaperUrl}
          </div>
        )}

        <div className="flex flex-col gap-3 overflow-y-auto max-h-[400px] p-3 mb-4 bg-gray-800 rounded-md border border-gray-700">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`whitespace-pre-wrap p-3 rounded-lg ${
                m.role === "user"
                  ? "bg-blue-600 text-white self-end"
                  : "bg-gray-700 text-gray-100 self-start"
              }`}
            >
              <strong>{m.role === "user" ? "You: " : "AI: "}</strong>
              {m.content as string}
            </div>
          ))}
        </div>

        <form onSubmit={handleQuestionSubmit} className="flex gap-2">
          <input
            className="flex-grow px-4 py-2 rounded-md bg-gray-800 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            value={input}
            placeholder="Ask a question about the paper..."
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md font-semibold"
          >
            Ask
          </button>
        </form>
      </div>
    </div>
  );
}
