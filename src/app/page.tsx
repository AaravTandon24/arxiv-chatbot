"use client";

import { useState } from "react";
import { summarise } from "./actions";
import { useRouter } from "next/navigation";

export default function Home() {
  const [summary, setSummary] = useState("");
  const [url, setUrl] = useState("");
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="bg-neutral-900 p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center">
          Arxiv Summariser
        </h1>

        <form
          onSubmit={async (event) => {
            event.preventDefault();
            const result = await summarise(url);
            setSummary(result.summary);
          }}
          className="flex flex-col gap-4"
        >
          <input
            type="text"
            name="url"
            onChange={(event) => setUrl(event.target.value)}
            className="px-4 py-2 rounded-md bg-neutral-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Paste Arxiv link here"
          />
          <button
            type="submit"
            className="bg-purple-600 hover:bg-purple-700 transition-colors px-4 py-2 rounded-md font-semibold"
          >
            Summarise
          </button>
        </form>

        {summary && (
          <div className="mt-6 p-4 bg-neutral-800 rounded-md border border-neutral-700 max-h-64 overflow-y-auto">
            <h2 className="text-lg font-semibold mb-2">Summary:</h2>
            <p className="text-sm">{summary}</p>
          </div>
        )}

        <button
          onClick={() => router.push("/chat")}
          className="mt-6 w-full bg-blue-600 hover:bg-blue-700 transition-colors px-4 py-2 rounded-md font-semibold"
        >
          Go to Chat
        </button>
      </div>
    </div>
  );
}
