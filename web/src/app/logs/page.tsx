"use client";

import Navbar from "@/Components/Navbar";
import { MainContent } from "@/Components/Main";
import { GetLocalStorageDetails, HandleUnAuthorized } from "@/_Common/function/LocalStorage";
import { UserDetailsLocalStorage } from "@/_Common/interface/auth.interface";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";

type ApplicationLog = {
  id: number;
  level: string;
  source: string;
  message: string;
  detail: string | null;
  created_at: string;
};

function formatLog(log: ApplicationLog) {
  return `${new Date(log.created_at).toISOString()} [${log.level}] ${log.source}: ${log.message}${log.detail ? `\n${log.detail}` : ""}`;
}

export default function LogsPage() {
  const [page, setPage] = useState(1);
  const [logs, setLogs] = useState<ApplicationLog[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const totalPages = Math.max(1, Math.ceil(totalItems / 25));

  const load = useCallback(async (cancelled: () => boolean) => {
    setLoading(true);
    setError("");
    try {
      const user = await GetLocalStorageDetails() as UserDetailsLocalStorage;
      if (!user) {
        await HandleUnAuthorized(null);
        return;
      }
      const response = await axios.get(`/api/logs?page=${page}`, {
        headers: { Authorization: `Bearer ${user.accessToken}` },
      });
      if (!cancelled()) {
        setLogs(response.data.logs ?? []);
        setTotalItems(response.data.totalItems ?? 0);
      }
    } catch (cause: any) {
      if (!cancelled()) setError(cause?.response?.data?.message || cause?.message || "Unable to load logs");
      await HandleUnAuthorized(cause);
    } finally {
      if (!cancelled()) setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    let cancelled = false;
    load(() => cancelled);
    return () => { cancelled = true; };
  }, [load]);

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      setError("Unable to copy logs to the clipboard");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <MainContent />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Application logs</h1>
            <p className="text-sm text-gray-500 mt-1">Latest errors first. Open an event to see its stack trace.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => load(() => false)} disabled={loading} className="px-3 py-2 rounded border bg-white text-sm disabled:opacity-50">Refresh</button>
            <button onClick={() => copy(logs.map(formatLog).join("\n\n"), "page")} disabled={!logs.length} className="px-3 py-2 rounded bg-blue-600 text-white text-sm disabled:opacity-50">{copied === 'page' ? 'Copied' : 'Copy page'}</button>
          </div>
        </div>
        {error && <p role="alert" className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-[185px_85px_190px_1fr_80px] gap-3 bg-gray-100 px-4 py-3 text-xs font-semibold uppercase text-gray-600">
              <span>Time</span><span>Level</span><span>Source</span><span>Message</span><span>Copy</span>
            </div>
            {logs.map(log => (
              <div key={log.id} className="border-t border-gray-100 font-mono text-xs text-gray-800">
                <div className="grid grid-cols-[185px_85px_190px_1fr_80px] gap-3 px-4 py-3 items-start">
                  <span className="whitespace-nowrap">{new Date(log.created_at).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })}</span>
                  <span className="font-semibold text-red-700">{log.level}</span>
                  <span className="break-all">{log.source}</span>
                  <span className="break-words whitespace-pre-wrap">{log.message}</span>
                  <button onClick={() => copy(formatLog(log), String(log.id))} className="text-blue-600 hover:underline text-left">{copied === String(log.id) ? 'Copied' : 'Copy'}</button>
                </div>
                {log.detail && <details className="px-4 pb-3"><summary className="cursor-pointer text-blue-600">Stack trace</summary><pre className="mt-2 p-3 bg-gray-900 text-gray-100 rounded overflow-x-auto whitespace-pre-wrap break-words select-text">{log.detail}</pre></details>}
              </div>
            ))}
            {!loading && !logs.length && <p className="p-8 text-center text-sm text-gray-500">No application logs found.</p>}
            {loading && <p className="p-8 text-center text-sm text-gray-500">Loading logs…</p>}
          </div>
        </div>
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <span>Page {page} of {totalPages} · {totalItems} events</span>
          <div className="flex gap-2">
            <button disabled={page <= 1 || loading} onClick={() => setPage(page - 1)} className="px-3 py-1.5 border rounded disabled:opacity-50">← Previous</button>
            <button disabled={page >= totalPages || loading} onClick={() => setPage(page + 1)} className="px-3 py-1.5 border rounded disabled:opacity-50">Next →</button>
          </div>
        </div>
      </main>
    </div>
  );
}
