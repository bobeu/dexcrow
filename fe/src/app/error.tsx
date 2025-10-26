"use client";

import React from "react";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-white text-black dark:bg-black dark:text-white p-6">
          <div className="max-w-md w-full space-y-3 text-center">
            <div className="mx-auto h-12 w-12 rounded-full border-2 border-primary-500/40 border-t-primary-500 animate-spin" />
            <h2 className="text-lg font-semibold">Something went wrong</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Our team has been notified. You can try again.</p>
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => reset()} className="px-4 py-2 rounded-md bg-primary-500 text-black hover:bg-primary-400">Try again</button>
              <button onClick={() => location.reload()} className="px-4 py-2 rounded-md border border-neutral-700">Refresh</button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}


