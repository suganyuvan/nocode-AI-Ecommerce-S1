import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { ShieldCheck, RefreshCw, Eye, CheckCircle2, CreditCard } from 'lucide-react';

export function WebhookLogsManager() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('webhook_logs')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) {
      setLogs(data);
    }
    if (error) {
      console.error('Error fetching payment logs:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const successfulCaptures = logs.filter(
    l => l.status === 'processed' || l.event_type.includes('captured') || l.event_type.includes('paid') || l.event_type.includes('verified')
  ).length;

  const successRate = logs.length > 0 ? Math.round((successfulCaptures / logs.length) * 100) : 100;

  return (
    <div className="space-y-6 text-[#1b1c1c]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#111615] tracking-tight">Payment Details & Logs</h2>
          <p className="text-xs text-[#747878] mt-1 font-label-caps uppercase tracking-wider">
            Audit log of verified customer transactions and payment statuses
          </p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[#0f1513] text-white hover:bg-[#1f2926] rounded-xl text-xs font-bold font-label-caps uppercase tracking-wider transition-all cursor-pointer shadow-sm hover:shadow"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#fed65b]' : ''}`} />
          Refresh Feed
        </button>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#ffffff] p-5 rounded-2xl border border-[#ece8df] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-[#747878] font-label-caps uppercase">Total Logged Transactions</span>
            <p className="text-2xl font-bold text-[#111615] mt-1">{logs.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#fed65b]/20 text-[#735c00] flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#ffffff] p-5 rounded-2xl border border-[#ece8df] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-[#747878] font-label-caps uppercase">Successful Captures</span>
            <p className="text-2xl font-bold text-[#2e6930] mt-1">
              {successfulCaptures}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#2e6930]/15 text-[#2e6930] flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#ffffff] p-5 rounded-2xl border border-[#ece8df] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-[#747878] font-label-caps uppercase">Verification Success Rate</span>
            <p className="text-2xl font-bold text-[#735c00] mt-1">
              {successRate}%
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#fed65b]/20 text-[#735c00] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-[#ece8df] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#fbfaf8] border-b border-[#ece8df] text-xs font-semibold text-[#555] uppercase tracking-wider font-label-caps">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Event / Type</th>
                <th className="p-4">Order Ref</th>
                <th className="p-4">Razorpay Payment ID</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f2efe9]">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-[#747878]">
                    <ShieldCheck className="w-8 h-8 mx-auto text-[#c4c7c7] mb-2" />
                    <p className="font-semibold text-sm">No payment records logged yet.</p>
                    <p className="text-xs text-[#999c9c] mt-1">Completed checkout payments will automatically appear here.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isSuccess = log.status === 'processed' || !log.error_message;
                  return (
                    <tr key={log.id} className="hover:bg-[#fcfbfa] transition-colors">
                      <td className="p-4 text-xs font-mono text-[#747878]">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold font-mono uppercase tracking-wider bg-[#fed65b]/25 text-[#735c00] border border-[#fed65b]/40">
                          {log.event_type}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-xs text-[#111615] font-semibold">
                        {log.payload?.order_number || log.razorpay_order_id || <span className="text-[#999c9c] italic">N/A</span>}
                      </td>
                      <td className="p-4">
                        {log.razorpay_payment_id ? (
                          <span className="font-mono text-xs bg-[#f4f2ec] px-2 py-0.5 rounded border border-[#e4e0d8] text-[#111615] font-semibold">
                            {log.razorpay_payment_id}
                          </span>
                        ) : (
                          <span className="text-[#999c9c] text-xs italic">N/A</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                          isSuccess ? 'bg-[#fed65b]/20 text-[#735c00] border border-[#fed65b]/30' : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]"></span>
                          {isSuccess ? 'Verified' : 'Failed'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-2 text-[#747878] hover:text-[#111615] hover:bg-[#f2efe9] rounded-lg transition-colors cursor-pointer"
                          title="View Payment Breakdown"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON Payload Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#1b1c1c] text-white w-full max-w-2xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#141515]">
              <div>
                <h3 className="font-bold text-sm text-[#fed65b] flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Transaction Details: {selectedLog.event_type}
                </h3>
                <p className="text-xs text-gray-400 font-mono mt-0.5">ID: {selectedLog.id}</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-[#0f1111]">
              <pre className="text-xs font-mono text-[#fed65b] leading-relaxed overflow-x-auto p-4 bg-black/50 rounded-xl border border-white/5">
                {JSON.stringify(selectedLog.payload || selectedLog, null, 2)}
              </pre>
            </div>

            <div className="p-4 border-t border-white/10 flex justify-end bg-[#141515]">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 bg-[#fed65b] text-[#1b1c1c] font-bold rounded-xl text-xs uppercase tracking-wider hover:opacity-90 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
