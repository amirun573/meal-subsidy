"use client";

import Navbar from "@/Components/Navbar";
import { MainContent } from "@/Components/Main";
import { StatusAPICode } from "@/_Common/enum/status-api-code.enum";
import { GetLocalStorageDetails, HandleUnAuthorized } from "@/_Common/function/LocalStorage";
import { UserDetailsLocalStorage } from "@/_Common/interface/auth.interface";
import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";

type UploadLog = {
  id: number;
  file_name: string;
  uploaded_by: string;
  status: string;
  created: number;
  updated: number;
  active: number;
  inactive: number;
  issue: string | null;
  created_at: string;
};

export default function EmployeeUploadLogsPage() {
  const [page, setPage] = useState(1);
  const [logs, setLogs] = useState<UploadLog[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const user = await GetLocalStorageDetails() as UserDetailsLocalStorage;
        if (!user) {
          await HandleUnAuthorized(null);
          return;
        }
        const response = await axios.get(`/api/user?code=${StatusAPICode.GET_EMPLOYEE_UPLOAD_LOGS}&page=${page}`, {
          headers: { Authorization: `Bearer ${user.accessToken}` },
        });
        if (!cancelled) {
          setLogs(response.data.logs ?? []);
          setTotalItems(response.data.totalItems ?? 0);
        }
      } catch (cause: any) {
        if (!cancelled) setError(cause?.response?.data?.message || cause?.message || "Unable to load upload logs");
        await HandleUnAuthorized(cause);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(totalItems / 10));

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <MainContent />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Employee upload logs</h1>
            <p className="text-sm text-gray-500 mt-1">Newest uploads first. Failed uploads show the issue that stopped processing.</p>
          </div>
          <Link href="/employee-details" className="text-sm text-blue-600 hover:underline">← Employee details</Link>
        </div>
        {error && <p role="alert" className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-left text-sm text-gray-700">
            <thead className="bg-gray-100 text-xs uppercase text-gray-700">
              <tr>
                {['Uploaded', 'File', 'Uploaded by', 'Result', 'Created', 'Updated', 'Active', 'Inactive', 'Issue'].map(label =>
                  <th key={label} className="px-4 py-3">{label}</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map(log => (
                <tr key={log.id} className="align-top">
                  <td className="px-4 py-3 whitespace-nowrap">{new Date(log.created_at).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })}</td>
                  <td className="px-4 py-3 break-all">{log.file_name}</td>
                  <td className="px-4 py-3">{log.uploaded_by}</td>
                  <td className="px-4 py-3"><span className={log.status === 'SUCCESS' ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold'}>{log.status === 'SUCCESS' ? 'Success' : 'Failed'}</span></td>
                  <td className="px-4 py-3">{log.created}</td>
                  <td className="px-4 py-3">{log.updated}</td>
                  <td className="px-4 py-3">{log.active}</td>
                  <td className="px-4 py-3">{log.inactive}</td>
                  <td className="px-4 py-3 min-w-56 break-words">{log.issue || '—'}</td>
                </tr>
              ))}
              {!loading && !logs.length && <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500">No upload logs found.</td></tr>}
              {loading && <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500">Loading upload logs…</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <span>Page {page} of {totalPages} · {totalItems} uploads</span>
          <div className="flex gap-2">
            <button disabled={page <= 1 || loading} onClick={() => setPage(page - 1)} className="px-3 py-1.5 border rounded disabled:opacity-50">← Previous</button>
            <button disabled={page >= totalPages || loading} onClick={() => setPage(page + 1)} className="px-3 py-1.5 border rounded disabled:opacity-50">Next →</button>
          </div>
        </div>
      </main>
    </div>
  );
}
