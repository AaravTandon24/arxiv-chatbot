"use client";

import { type CoreMessage } from "ai";
import { useState, useRef } from "react";
import { continueConversation, chatbot } from "../actions";
import { readStreamableValue } from "ai/rsc";

export const maxDuration = 30;

export default function Chat() {
  const [messages, setMessages] = useState<CoreMessage[]>([]);
  const [input, setInput] = useState("");
  const [paperUrl, setPaperUrl] = useState("");
  const [currentPaperUrl, setCurrentPaperUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [paperSource, setPaperSource] = useState(""); // Can be URL or PDF ID
  const [paperName, setPaperName] = useState(""); // For display purposes
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePaperUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paperUrl.trim()) return;

    setPaperSource(paperUrl);
    setPaperName(paperUrl);
    setPaperUrl("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);

    try {
      // Create FormData to send the file
      const formData = new FormData();
      formData.append("file", file);

      console.log(`Uploading file: ${file.name}, size: ${file.size} bytes`);

      // Upload the file to server endpoint
      const response = await fetch("/api/upload-pdf", {
        method: "POST",
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error("Upload failed with response:", responseData);
        throw new Error(responseData.error || "Failed to upload PDF");
      }

      console.log("Upload successful:", responseData);

      setPaperSource(responseData.fileId); // Store the file ID
      setPaperName(`PDF: ${file.name}`);

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      console.error("Error uploading PDF:", error);
      alert(`Failed to upload PDF: ${error.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
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
    setIsLoading(true);

    try {
      if (paperSource) {
        const response = await chatbot(paperSource, input);
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
    } catch (error) {
      console.error("Error processing question:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: "assistant",
          content:
            "Sorry, I encountered an error processing your question. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-black">
      <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch bg-black text-white">
        <div className="mb-4">
          <div className="flex flex-col space-y-2">
            {/* URL Input */}
            <form
              onSubmit={handlePaperUrlSubmit}
              className="flex justify-center"
            >
              <input
                className="flex-grow p-2 border border-gray-600 rounded-l bg-gray-800 text-gray-300 placeholder-gray-500 focus:outline-none"
                value={paperUrl}
                placeholder="Arxiv Link"
                onChange={(e) => setPaperUrl(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="submit"
                className="px-4 py-2 bg-gray-700 text-white rounded-r hover:bg-gray-600 disabled:opacity-50"
                disabled={isLoading}
              >
                Set Paper
              </button>
            </form>

            {/* PDF Upload */}
            <div className="flex justify-center">
              <input
                type="file"
                accept=".pdf"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                disabled={isLoading}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                disabled={isLoading}
              >
                Upload PDF
              </button>
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="my-4 flex justify-center">
            <div className="animate-pulse text-gray-300">Processing...</div>
          </div>
        )}

        {paperName && (
          <div className="mb-4 p-2 bg-gray-800 rounded text-gray-300">
            Current paper: {paperName}
          </div>
        )}

        <div className="flex-grow overflow-y-auto mb-4">
          {messages.map((m, i) => (
            <div key={i} className="whitespace-pre-wrap mb-2">
              <strong>{m.role === "user" ? "User: " : "AI: "}</strong>
              {m.content as string}
            </div>
          ))}
        </div>

        <form onSubmit={handleQuestionSubmit} className="flex justify-center">
          <input
            className="flex-grow p-2 border border-gray-600 rounded-l bg-gray-800 text-gray-300 placeholder-gray-500 focus:outline-none"
            value={input}
            placeholder="Ask a question about the paper..."
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-green-700 text-white rounded-r hover:bg-green-600 disabled:opacity-50"
            disabled={isLoading || !paperName}
          >
            Ask
          </button>
        </form>
      </div>
    </div>
  );
}
