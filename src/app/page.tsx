"use client";
//balls
import { useState } from "react";
import { summarise } from "./actions";

export default function Home() {
  const [summary, setSummary] = useState("");
  const [url, setUrl] = useState("");

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          const result = await summarise(url);
          setSummary(result.summary);
        }}
      >
        <div className="flex flex-col gap-2">
          <input
            type="text"
            name="url"
            onChange={(event) => setUrl(event.target.value)}
            className="px-4 py-2 rounded-md bg-neutral-800"
            placeholder="Arxiv Link"
          />
          <button type="submit">summarise</button>
        </div>
      </form>

      {summary ? <div>{summary}</div> : null}
    </div>
  );
}
