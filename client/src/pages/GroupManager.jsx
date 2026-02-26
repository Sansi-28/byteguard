import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import {
  generateAESKey, exportAESKey, wrapAESKeyWithKyber,
  uint8ToBase64, base64ToUint8
} from '../crypto/pqc';

export default function GroupManager() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const { showToast } = useToast();
  const { user } = useAuth();

  const load = useCallback(async () => {
    setLoading(true);
    try { setGroups(await api.listGroups()); }
    catch { showToast('Failed to load groups', 'error'); }
    finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">👥 Research Groups</h2>
          <p className="text-gray-400 text-sm mt-1">Create groups and share encrypted files with teams</p>
        </div>
        <button
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition"
          onClick={() => setShowCreate(true)}
        >
          + Create Group
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-4">
          <div className="w-10 h-10 border-3 border-gray-700 border-t-indigo-500 rounded-full animate-spin" />
          <p>Loading groups…</p>
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="text-5xl mb-4">👥</span>
          <h3 className="text-white font-semibold mb-1">No research groups</h3>
          <p className="text-gray-400 text-sm">Create a group to share encrypted files with your team</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {groups.map(g => (
            <div
              key={g.id}
              className="bg-white/[0.03] backdrop-blur-md border border-white/[0.06] rounded-xl p-5 hover:border-indigo-500/30 transition cursor-pointer group"
              onClick={() => setSelectedGroup(g)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">👥</span>
                  <div>
                    <h3 className="text-white font-semibold text-sm">{g.name}</h3>
                    <span className="text-gray-500 text-xs">by {g.ownerName}</span>
                  </div>
                </div>
                {g.isOwner && (
                  <span className="px-2 py-0.5 rounded-full text-[0.6rem] bg-amber-500/15 text-amber-400 border border-amber-500/20">
                    Owner
                  </span>
                )}
              </div>
              {g.description && (
                <p className="text-gray-400 text-xs mb-3 line-clamp-2">{g.description}</p>
              )}
              <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs">👤 {g.memberCount} members</span>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                    {g.myRole}
                  </span>
                </div>
                <span className="text-gray-600 text-xs">{new Date(g.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateGroupModal
          onClose={() => setShowCreate(false)}
          onCreated={(g) => { setGroups(prev => [g, ...prev]); setShowCreate(false); }}
        />
      )}

      {selectedGroup && (
        <GroupDetailModal
          groupId={selectedGroup.id}
          onClose={() => { setSelectedGroup(null); load(); }}
        />
      )}
    </div>
  );
}


/* ── Create Group Modal ──────────────────────────── */

function CreateGroupModal({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const { showToast } = useToast();

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { showToast('Enter a group name', 'warning'); return; }
    setCreating(true);
    try {
      const group = await api.createGroup(name.trim(), description.trim());
      showToast('Group created!', 'success');
      onCreated(group);
    } catch (err) {
      showToast(err.message || 'Failed to create group', 'error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-800">
          <h3 className="font-semibold text-white">👥 Create Research Group</h3>
          <button className="text-gray-400 hover:text-white" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit} className="p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-400">Group Name</label>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g., Quantum Research Lab"
              autoFocus
              className="bg-white/5 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-400">Description (optional)</label>
            <textarea
              value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Brief description of the group…"
              rows={3}
              className="bg-white/5 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 outline-none focus:border-indigo-500 resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="px-4 py-2 rounded-lg text-sm border border-gray-700 text-gray-400 hover:border-indigo-500 hover:text-indigo-400 transition" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg text-sm bg-indigo-600 text-white hover:bg-indigo-500 transition disabled:opacity-50" disabled={creating}>
              {creating ? 'Creating…' : '+ Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


/* ── Group Detail Modal ──────────────────────────── */

function GroupDetailModal({ groupId, onClose }) {
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [memberQuery, setMemberQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [addingMember, setAddingMember] = useState(false);
  const [showShareFile, setShowShareFile] = useState(false);
  const { showToast } = useToast();
  const { user } = useAuth();

  const loadGroup = useCallback(async () => {
    try {
      const data = await api.getGroup(groupId);
      setGroup(data);
    } catch (err) {
      showToast('Failed to load group details', 'error');
    } finally {
      setLoading(false);
    }
  }, [groupId, showToast]);

  useEffect(() => { loadGroup(); }, [loadGroup]);

  // Search users
  useEffect(() => {
    if (memberQuery.trim().length < 2) { setSearchResults([]); return; }
    const timer = setTimeout(() => {
      api.searchUsers(memberQuery.trim()).then(setSearchResults).catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [memberQuery]);

  const addMember = async (researcherId) => {
    setAddingMember(true);
    try {
      await api.addGroupMember(groupId, researcherId);
      showToast(`${researcherId} added to group`, 'success');
      setMemberQuery('');
      setSearchResults([]);
      loadGroup();
    } catch (err) {
      showToast(err.message || 'Failed to add member', 'error');
    } finally {
      setAddingMember(false);
    }
  };

  const removeMember = async (userId) => {
    try {
      await api.removeGroupMember(groupId, userId);
      showToast('Member removed', 'success');
      loadGroup();
    } catch (err) {
      showToast(err.message || 'Failed to remove member', 'error');
    }
  };

  const deleteGroup = async () => {
    if (!confirm('Delete this group? This cannot be undone.')) return;
    try {
      await api.deleteGroup(groupId);
      showToast('Group deleted', 'success');
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to delete group', 'error');
    }
  };

  if (loading) return (
    <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="w-10 h-10 border-3 border-gray-700 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );

  if (!group) return null;

  const isAdmin = group.isOwner || group.myRole === 'admin';

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-800">
          <div>
            <h3 className="font-semibold text-white">{group.name}</h3>
            {group.description && <p className="text-gray-500 text-xs mt-0.5">{group.description}</p>}
          </div>
          <button className="text-gray-400 hover:text-white" onClick={onClose}>✕</button>
        </div>

        <div className="p-5 flex flex-col gap-5">
          {/* Members */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white text-sm font-medium">Members ({group.members?.length || 0})</h4>
            </div>

            <div className="flex flex-col gap-2 mb-3">
              {group.members?.map(m => (
                <div key={m.id} className="flex items-center justify-between py-2 px-3 bg-white/[0.02] rounded-lg border border-white/[0.04]">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                      {m.researcherId?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                    <div>
                      <span className="text-white text-sm">{m.researcherId}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[0.6rem] text-gray-500">{m.role}</span>
                        {m.hasKyberKey && <span className="text-[0.6rem] text-emerald-400">🔑</span>}
                      </div>
                    </div>
                  </div>
                  {isAdmin && m.userId !== group.ownerId && (
                    <button
                      className="text-gray-500 hover:text-red-400 text-xs transition"
                      onClick={() => removeMember(m.userId)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add member */}
            {isAdmin && (
              <div className="flex flex-col gap-1.5">
                <input
                  type="text"
                  value={memberQuery}
                  onChange={e => setMemberQuery(e.target.value)}
                  placeholder="Search researcher to add…"
                  className="bg-white/5 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 outline-none focus:border-indigo-500"
                />
                {searchResults.length > 0 && (
                  <div className="bg-gray-800 border border-gray-700 rounded-lg max-h-32 overflow-y-auto">
                    {searchResults.map(u => (
                      <button
                        key={u.id}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-indigo-500/15 hover:text-indigo-400 transition flex justify-between"
                        onClick={() => addMember(u.researcherId)}
                        disabled={addingMember}
                      >
                        <span>{u.researcherId}</span>
                        {u.hasKyberKey && <span className="text-xs text-emerald-400">🔑</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Shared files */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white text-sm font-medium">Shared Files ({group.sharedFiles?.length || 0})</h4>
              <button
                className="px-3 py-1 text-xs bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/25 transition"
                onClick={() => setShowShareFile(true)}
              >
                + Share File
              </button>
            </div>
            {group.sharedFiles?.length === 0 ? (
              <p className="text-gray-500 text-xs">No files shared with this group yet</p>
            ) : (
              <div className="flex flex-col gap-2">
                {group.sharedFiles?.map(f => (
                  <div key={f.id} className="flex items-center justify-between py-2 px-3 bg-white/[0.02] rounded-lg border border-white/[0.04]">
                    <div className="flex items-center gap-2">
                      <span>📄</span>
                      <div>
                        <span className="text-white text-sm">{f.fileName}</span>
                        <span className="text-gray-500 text-xs block">by {f.sharedBy}</span>
                      </div>
                    </div>
                    <span className="text-gray-500 text-xs">{new Date(f.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Actions */}
          <div className="flex justify-between items-center pt-3 border-t border-gray-800">
            {group.isOwner && (
              <button className="px-3 py-1.5 text-xs bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition" onClick={deleteGroup}>
                🗑️ Delete Group
              </button>
            )}
            <button className="px-4 py-2 rounded-lg text-sm border border-gray-700 text-gray-400 hover:border-indigo-500 hover:text-indigo-400 transition ml-auto" onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        {showShareFile && (
          <GroupShareFileModal
            groupId={groupId}
            onClose={() => setShowShareFile(false)}
            onShared={() => { setShowShareFile(false); loadGroup(); }}
          />
        )}
      </div>
    </div>
  );
}


/* ── Group Share File Modal ──────────────────────── */

function GroupShareFileModal({ groupId, onClose, onShared }) {
  const [myFiles, setMyFiles] = useState([]);
  const [fileId, setFileId] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    api.myFiles().then(setMyFiles).catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!fileId) { showToast('Select a file', 'warning'); return; }

    setSending(true);
    try {
      // 1. Get all group members' public keys
      setStatus('Fetching group member public keys…');
      const pubkeys = await api.getGroupPubkeys(groupId);

      if (pubkeys.length === 0) {
        throw new Error('No group members have Kyber public keys');
      }

      // 2. Generate a fresh AES key
      setStatus('Generating AES-256-GCM key…');
      const aesKey = await generateAESKey();
      const aesKeyBytes = await exportAESKey(aesKey);

      // 3. Encapsulate AES key for each member
      setStatus(`Encapsulating key for ${pubkeys.length} members…`);
      const kemCiphertexts = {};
      for (const member of pubkeys) {
        const recipientPK = base64ToUint8(member.kyberPublicKey);
        const { kemCiphertext, wrappedKey } = await wrapAESKeyWithKyber(aesKeyBytes, recipientPK);
        const combined = new Uint8Array(kemCiphertext.length + wrappedKey.length);
        combined.set(kemCiphertext, 0);
        combined.set(wrappedKey, kemCiphertext.length);
        kemCiphertexts[String(member.userId)] = uint8ToBase64(combined);
      }

      // 4. Share with group on server
      setStatus('Sharing with group…');
      await api.shareFileWithGroup(groupId, Number(fileId), kemCiphertexts);

      showToast('File shared with group!', 'success');
      onShared();
    } catch (err) {
      showToast(err.message || 'Sharing failed', 'error');
    } finally {
      setSending(false);
      setStatus('');
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-800">
          <h3 className="font-semibold text-white">📤 Share File with Group</h3>
          <button className="text-gray-400 hover:text-white" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit} className="p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-400">Select File</label>
            <select
              value={fileId} onChange={e => setFileId(e.target.value)}
              className="bg-white/5 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-indigo-500"
            >
              <option value="">Select an encrypted file…</option>
              {myFiles.map(f => <option key={f.id} value={f.id}>{f.fileName}</option>)}
            </select>
          </div>

          {status && (
            <div className="flex items-center gap-2 text-xs text-indigo-400">
              <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              {status}
            </div>
          )}

          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3 text-xs text-indigo-300">
            <strong>🔐 End-to-End Encrypted:</strong> The AES key will be individually encapsulated with each member's Kyber-512 public key. Only group members can decrypt.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="px-4 py-2 rounded-lg text-sm border border-gray-700 text-gray-400 hover:border-indigo-500 hover:text-indigo-400 transition" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg text-sm bg-indigo-600 text-white hover:bg-indigo-500 transition disabled:opacity-50" disabled={sending}>
              {sending ? 'Encrypting…' : '🔐 Share with Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
