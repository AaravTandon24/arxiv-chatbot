"use client";

import { type CoreMessage } from "ai";
import { useState } from "react";
import { continueConversation, chatbot } from "./actions";
import { readStreamableValue } from "ai/rsc";

export const maxDuration = 30;

export default function Chat() {
    const [messages, setMessages] = useState<CoreMessage[]>([]);
    const [input, setInput] = useState("");
    const [paperUrl, setPaperUrl] = useState("");
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [currentPaper, setCurrentPaper] = useState("");
    const [pdfText, setPdfText] = useState<string | null>(null);
    const [currentPaperUrl, setCurrentPaperUrl] = useState("");

    const handlePdfUpload = async () => {
        if (!pdfFile) return;

        const formData = new FormData();
        formData.append("file", pdfFile);

        const response = await fetch("/api/extract-pdf", {
            method: "POST",
            body: formData,
        });

        const result = await response.json();

        if (result.text) {
            setCurrentPaper(result.text);
            alert("PDF uploaded and processed!");
        } else {
            alert("Failed to extract text from PDF");
        }
    };

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

        if (currentPaper) {
            const response = await chatbot(currentPaper, input);
            setMessages((prevMessages) => [
                ...prevMessages,
                {
                    role: "assistant",
                    content: response.answer,
                },
            ]);
        } else if (pdfText) {
            const response = await chatbot(pdfText, input);
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
        <div className="flex justify-center items-center min-h-screen bg-black">
            <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch bg-black text-white">
                <div className="mb-4">
                    <form onSubmit={handlePaperUrlSubmit} className="flex items-center gap-2">
                        <input
                            className="flex-grow p-2 border border-gray-600 rounded bg-gray-800 text-gray-300 placeholder-gray-500 focus:outline-none"
                            value={paperUrl}
                            placeholder="Enter Arxiv Link"
                            onChange={(e) => setPaperUrl(e.target.value)}
                        />
                        <button
                            type="submit"
                            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                        >
                            Set Paper
                        </button>
                    </form>

                    <div className="flex items-center gap-2 mt-2">
                        <input
                            type="file"
                            accept="application/pdf"
                            onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                            className="p-2 border border-gray-600 rounded bg-gray-800 text-gray-300 focus:outline-none"
                        />
                        <button
                            type="button"
                            onClick={handlePdfUpload}
                            className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-600"
                        >
                            Upload PDF
                        </button>
                    </div>
                </div>

                {currentPaperUrl && (
                    <div className="mb-4 p-2 bg-gray-800 rounded text-gray-300">
                        Current paper: {currentPaperUrl}
                    </div>
                )}
                {pdfText && (
                    <div className="mb-4 p-2 bg-gray-800 rounded text-gray-300">
                        PDF uploaded and processed.
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
                    />
                    <button
                        type="submit"
                        className="px-4 py-2 bg-green-700 text-white rounded-r hover:bg-green-600"
                    >
                        Ask
                    </button>
                </form>
            </div>
        </div>
    );
}
