import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import api from '../api/client';
import ReceiveModal from '../components/modals/ReceiveModal';
import FileViewer from '../components/modals/FileViewer';

export default function ReceivedFiles() {
  const [items, setItems] = useState([]);
  const [groupFiles, setGroupFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReceive, setShowReceive] = useState(false);
  const [viewFile, setViewFile] = useState(null);
  const [activeTab, setActiveTab] = useState('individual');
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [received, gFiles] = await Promise.all([
        api.getReceived(),
        api.listGroupSharedFiles()
      ]);
      setItems(received);
      setGroupFiles(gFiles);
    } catch { showToast('Failed to load received files', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const onReceived = () => {
    load();
    setShowReceive(false);
    showToast('File decrypted & downloaded', 'success');
  };

  const handleView = (fileId, kemCiphertext, fileName, contentType) => {
    setViewFile({ fileId, kemPayload: kemCiphertext, fileName, contentType });
  };

  const tabs = [
    { key: 'individual', label: '📤 Direct Shares', count: items.length },
    { key: 'group', label: '👥 Group Shares', count: groupFiles.length },
  ];

  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">📥 Received Files</h2>
          <p className="text-gray-400 text-sm mt-1">Encrypted files shared with you</p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition" onClick={() => setShowReceive(true)}>
          + Receive File
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === tab.key
                ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                : 'bg-white/[0.02] text-gray-400 border border-white/[0.06] hover:border-indigo-500/20'
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            <span className="ml-2 px-1.5 py-0.5 rounded-full text-[0.6rem] bg-white/10">{tab.count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-4">
          <div className="w-10 h-10 border-3 border-gray-700 border-t-indigo-500 rounded-full animate-spin" />
          <p>Loading…</p>
        </div>
      ) : activeTab === 'individual' ? (
        items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-5xl mb-4">📥</span>
            <h3 className="text-white font-semibold mb-1">No received files</h3>
            <p className="text-gray-400 text-sm">Enter a share code to decrypt files sent to you</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {items.map(item => (
              <div key={item.id} className="bg-white/[0.03] backdrop-blur-md border border-white/[0.06] rounded-xl p-4 hover:border-indigo-500/30 transition">
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl">📄</span>
                  <div className="min-w-0 flex-1">
                    <strong className="text-white text-sm block truncate">{item.fileName}</strong>
                    <span className="text-gray-500 text-xs">From: {item.senderName}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">{item.permission || 'view'}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-gray-500/15 text-gray-400 border border-gray-500/20">Kyber-512 KEM</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
                  <span className="text-gray-500 text-xs">{new Date(item.createdAt).toLocaleDateString()}</span>
                  <button
                    className="px-3 py-1 text-xs bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/25 transition"
                    onClick={() => handleView(item.fileId, item.kemCiphertext, item.fileName, null)}
                  >
                    👁️ View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        groupFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-5xl mb-4">👥</span>
            <h3 className="text-white font-semibold mb-1">No group-shared files</h3>
            <p className="text-gray-400 text-sm">Files shared with your groups will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {groupFiles.map(item => (
              <div key={item.id} className="bg-white/[0.03] backdrop-blur-md border border-white/[0.06] rounded-xl p-4 hover:border-indigo-500/30 transition">
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl">📄</span>
                  <div className="min-w-0 flex-1">
                    <strong className="text-white text-sm block truncate">{item.fileName}</strong>
                    <span className="text-gray-500 text-xs">Group: {item.groupName}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="px-2 py-0.5 rounded-full text-xs bg-violet-500/15 text-violet-400 border border-violet-500/20">👥 Group</span>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-gray-500/15 text-gray-400 border border-gray-500/20">Kyber-512 KEM</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
                  <span className="text-gray-500 text-xs">{new Date(item.createdAt).toLocaleDateString()}</span>
                  {item.myKemCiphertext ? (
                    <button
                      className="px-3 py-1 text-xs bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/25 transition"
                      onClick={() => handleView(item.fileId, item.myKemCiphertext, item.fileName, item.contentType)}
                    >
                      👁️ View
                    </button>
                  ) : (
                    <span className="text-gray-600 text-xs">No KEM key for you</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {showReceive && <ReceiveModal onClose={() => setShowReceive(false)} onReceived={onReceived} />}
      {viewFile && (
        <FileViewer
          fileId={viewFile.fileId}
          kemPayload={viewFile.kemPayload}
          fileName={viewFile.fileName}
          contentType={viewFile.contentType}
          onClose={() => setViewFile(null)}
        />
      )}
    </div>
  );
}
