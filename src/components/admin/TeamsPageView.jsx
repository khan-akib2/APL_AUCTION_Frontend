'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import Spinner from '@/components/Spinner';
import Image from 'next/image';

const emptyForm = { name: '', captainId: '', budget: 1000, logo: '' };

function CaptainSelect({ captains, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = captains.find(c => c._id === value);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full bg-[#c9a227]/8 border border-[#c9a227]/20 rounded-lg px-3 py-2.5 text-sm text-left flex items-center justify-between focus:outline-none focus:border-white/30 transition-colors hover:border-white/20">
        <span className={selected ? 'text-white' : 'text-white/40'}>
          {selected ? selected.name : '— No captain —'}
        </span>
        <svg className={`w-4 h-4 text-white/40 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 16 16" fill="none">
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-[#0d1e3a] border border-[#c9a227]/20 rounded-xl overflow-hidden shadow-2xl">
          <div className="max-h-52 overflow-y-auto">
            <button type="button" onClick={() => { onChange(''); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-[#c9a227]/8 ${!value ? 'text-white/60' : 'text-white/40'}`}>
              — No captain —
            </button>
            {captains.map(c => (
              <button key={c._id} type="button"
                onClick={() => { onChange(c._id); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-[#c9a227]/8 ${value === c._id ? 'text-white bg-[#c9a227]/8' : 'text-white/60'}`}>
                <div className="font-medium">{c.name}</div>
                <div className="text-white/40 text-xs mt-0.5">{c.email}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LogoUpload({ value, onChange, token, toast }) {
  const [uploading, setUploading] = useState(false);
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setUploading(true);

    const compressed = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX = 600;
          let w = img.width, h = img.height;
          if (w > h && w > MAX) { h = (h * MAX) / w; w = MAX; }
          else if (h > MAX) { w = (w * MAX) / h; h = MAX; }
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          canvas.toBlob(resolve, 'image/jpeg', 0.85);
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });

    const fd = new FormData();
    fd.append('file', compressed, 'logo.jpg');
    const res = await fetch(`${BACKEND_URL}/api/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    const data = await res.json();
    setUploading(false);
    if (data.url) onChange(data.url);
    else toast('Upload failed', 'error');
  };

  return (
    <div className="flex items-center gap-3">
      {value && (
        <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-[#c9a227]/20 bg-[#0a1628] shrink-0">
          <Image src={value} alt="logo" fill unoptimized className="object-contain p-1" />
          <button type="button" onClick={() => onChange('')}
            className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/70 rounded-full text-white/60 hover:text-white text-xs flex items-center justify-center leading-none">
            ×
          </button>
        </div>
      )}
      <label className={`flex items-center justify-center gap-2 bg-[#c9a227]/8 border border-[#c9a227]/20 hover:bg-[#c9a227]/12 text-white/50 hover:text-white text-sm px-4 py-2.5 rounded-lg transition-colors cursor-pointer flex-1 ${uploading ? 'opacity-40 pointer-events-none' : ''}`}>
        {uploading ? <Spinner size="sm" /> : <>{value ? 'Change Logo' : 'Upload Logo'}</>}
        <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
      </label>
    </div>
  );
}

export default function TeamsPageView({ sport = 'cricket' }) {
  const { request } = useApi();
  const { token } = useAuth();
  const toast = useToast();
  const [teams, setTeams] = useState([]);
  const [captains, setCaptains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);

  const isFootball = sport === 'football';
  const sportLabel = isFootball ? 'Football' : 'Cricket';

  const load = useCallback(async () => {
    setLoading(true);
    const [tRes, uRes] = await Promise.all([
      request(`/api/teams?sport=${sport}`),
      request('/api/users'),
    ]);
    if (tRes) setTeams((tRes.teams || []).map(t => ({ ...t, _id: t._id?.toString() || t._id })));
    if (uRes) setCaptains(uRes.users || []);
    setLoading(false);
  }, [request, sport]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setForm({ ...emptyForm, budget: 1000 }); setEditId(null); setShowForm(true); };
  const openEdit = (team) => {
    setForm({ name: team.name, captainId: team.captainId?._id || '', budget: team.budget ?? 1000, logo: team.logo || '' });
    setEditId(team._id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast('Team name required', 'warning');
    setSaving(true);
    const payload = { ...form, sport };
    const res = editId
      ? await request(`/api/teams/${editId}`, { method: 'PUT', body: JSON.stringify(payload) })
      : await request('/api/teams', { method: 'POST', body: JSON.stringify(payload) });
    setSaving(false);
    if (res?.error) { toast(res.error, 'error'); return; }
    toast(editId ? 'Team updated' : 'Team created', 'success');
    setShowForm(false); setForm(emptyForm); setEditId(null);
    load();
  };

  const handleResetAll = () => {
    setConfirmModal({
      title: `Reset All ${sportLabel} Teams?`,
      message: `This will restore all ${sportLabel.toLowerCase()} team budgets to their starting points (e.g. 1000 pts), clear all squads, restore reveal tokens to 1, and make all sold players available for auction again. Are you sure you want to proceed?`,
      confirmText: 'Reset All Teams',
      onConfirm: async () => {
        setConfirmModal(null);
        setResetting(true);
        const res = await request(`/api/teams/reset-all?sport=${sport}`, { method: 'POST' });
        setResetting(false);
        if (res?.error) {
          toast(res.error, 'error');
        } else {
          toast(`All ${sportLabel.toLowerCase()} teams have been reset to starting state!`, 'success');
          load();
        }
      },
    });
  };

  const handleResetTeam = (team) => {
    setConfirmModal({
      title: `Reset ${team.name}?`,
      message: `Reset ${team.name} to starting state? All acquired players will be returned to the auction pool and budget will be fully restored.`,
      confirmText: 'Reset Team',
      onConfirm: async () => {
        setConfirmModal(null);
        const res = await request(`/api/teams/${team._id}/reset`, { method: 'POST' });
        if (res?.error) toast(res.error, 'error');
        else {
          toast(`${team.name} has been reset to starting state`, 'success');
          load();
        }
      },
    });
  };

  const handleRemovePlayer = (teamId, playerId, playerName, refundAmt) => {
    setConfirmModal({
      title: 'Remove Player',
      message: `Remove ${playerName} from team? They will go back to the resold queue and ${refundAmt} pts will be refunded.`,
      confirmText: 'Remove',
      onConfirm: async () => {
        setConfirmModal(null);
        const res = await request(`/api/teams/${teamId}/remove-player/${playerId}`, { method: 'POST' });
        if (res?.error) toast(res.error, 'error');
        else { toast(`${playerName} removed — ${res.refund} pts refunded`, 'success'); load(); }
      },
    });
  };

  const handleAddToken = async (teamId, teamName) => {
    const res = await request(`/api/teams/${teamId}/add-token`, { method: 'POST' });
    if (res?.error) toast(res.error, 'error');
    else {
      toast(`+1 reveal token → ${teamName}`, 'success');
      setTeams(prev => prev.map(t => t._id === teamId ? { ...t, revealTokens: (t.revealTokens || 0) + 1 } : t));
    }
  };

  const handleDelete = (id) => {
    setConfirmModal({
      title: 'Delete Team',
      message: 'Delete this team? This will unlink the captain.',
      confirmText: 'Delete',
      onConfirm: async () => {
        setConfirmModal(null);
        const res = await request(`/api/teams/${id}`, { method: 'DELETE' });
        if (res?.error) toast(res.error, 'error');
        else { toast('Team deleted', 'success'); load(); }
      },
    });
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="flex flex-col min-h-screen lg:h-[calc(100vh-48px)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 lg:px-6 py-4 border-b border-[#c9a227]/15 shrink-0">
        <div>
          <h1 className="text-base font-semibold text-white flex items-center gap-2">
            <span>{isFootball ? '⚽' : '🏏'}</span>
            <span>{sportLabel} Teams</span>
          </h1>
          <p className="text-white/40 text-xs mt-0.5">{teams.length} teams</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleResetAll}
            disabled={resetting}
            className="flex items-center gap-2 bg-[#c9a227]/10 hover:bg-[#c9a227]/20 border border-[#c9a227]/30 hover:border-[#c9a227]/60 text-[#c9a227] text-xs font-semibold px-3.5 py-2 rounded-lg transition-all disabled:opacity-50 shadow-sm"
            title="Reset all teams, budgets, and squads to starting state"
          >
            <svg
              className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>{resetting ? 'Resetting...' : 'Reset All Teams'}</span>
          </button>
          <button
            onClick={openAdd}
            className="bg-[#c9a227] text-[#0a1628] text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#f0c040] transition-colors"
          >
            + Add Team
          </button>
        </div>
      </div>

      {/* Scrollable grid */}
      <div className="flex-1 overflow-hidden p-4 lg:p-6">
        <div className="h-full border border-[#c9a227]/20 rounded-xl overflow-hidden bg-[#060f1e] flex flex-col">
          {/* iframe-style header bar */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-[#0a1628] border-b border-[#c9a227]/15 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#c9a227]/20" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#c9a227]/20" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#c9a227]/20" />
            <span className="ml-2 text-white/20 text-xs">{sport}-teams · {teams.length} total</span>
          </div>

          {/* scrollable content */}
          <div className="flex-1 overflow-y-auto p-4">
            {teams.length === 0 ? (
              <div className="text-center py-16 text-white/30 text-sm">
                No {sportLabel.toLowerCase()} teams created yet. Click <span className="text-[#c9a227] font-semibold">+ Add Team</span> to add your first team!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 items-start">
                {teams.map(team => {
                  const totalBudget = (team.budget || 0) + (team.pointsSpent || 0) || 1000;
                  const pct = totalBudget > 0 ? Math.round((team.pointsSpent / totalBudget) * 100) : 0;
                  const id = team._id?.toString?.() ?? String(team._id);
                  const isExpanded = expanded !== null && expanded === id;
                  return (
                    <div key={team._id} className="bg-[#0d1e3a] border border-[#c9a227]/15 rounded-xl overflow-hidden">
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            {team.logo ? (
                              <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-[#c9a227]/20 bg-[#0a1628] shrink-0">
                                <Image src={team.logo} alt={team.name} fill unoptimized className="object-contain p-1" />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-lg border border-[#c9a227]/10 bg-[#0a1628] flex items-center justify-center shrink-0">
                                <span className="text-[#c9a227]/20 text-lg font-black">{team.name[0]}</span>
                              </div>
                            )}
                            <div>
                              <h2 className="text-base font-semibold text-white">{team.name}</h2>
                              <p className="text-white/40 text-xs mt-0.5">{team.captainId?.name || 'No captain'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-white font-semibold">{team.budget}</div>
                            <div className="text-white/40 text-xs">pts budget</div>
                          </div>
                        </div>

                        <div className="h-1 bg-[#c9a227]/8 rounded-full overflow-hidden mb-4">
                          <div className="h-full bg-[#c9a227]/50 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>

                        <div className="flex items-center justify-between text-xs text-white/40 mb-4">
                          <span>{team.playerCount}/7 players</span>
                          <span>{pct}% spent</span>
                        </div>

                        {/* Reveal tokens */}
                        <div className="flex items-center justify-between mb-3 px-1">
                          <div className="flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-purple-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span className="text-white/40 text-xs">Reveal tokens:</span>
                            <span className={`text-xs font-bold tabular-nums ${(team.revealTokens || 0) > 0 ? 'text-purple-400' : 'text-white/20'}`}>
                              {team.revealTokens ?? 0}
                            </span>
                          </div>
                          <button
                            onClick={() => handleAddToken(team._id, team.name)}
                            className="text-[10px] font-bold px-2 py-1 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-400 hover:bg-purple-500/25 transition-colors">
                            + Token
                          </button>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button onClick={() => setExpanded(isExpanded ? null : id)}
                            className="flex-1 text-xs text-white/30 hover:text-white bg-[#0d1e3a] border border-[#c9a227]/15 hover:bg-[#c9a227]/12 py-1.5 rounded-lg transition-colors">
                            {isExpanded ? 'Hide Squad' : 'View Squad'}
                          </button>
                          <button onClick={() => openEdit(team)}
                            className="text-xs text-white/30 hover:text-white bg-[#0d1e3a] border border-[#c9a227]/15 hover:bg-[#c9a227]/12 px-3 py-1.5 rounded-lg transition-colors">
                            Edit
                          </button>
                          <button onClick={() => handleResetTeam(team)}
                            title="Reset this team to starting"
                            className="text-xs text-[#c9a227]/60 hover:text-[#c9a227] bg-[#0d1e3a] border border-[#c9a227]/15 hover:bg-[#c9a227]/12 px-2.5 py-1.5 rounded-lg transition-colors">
                            Reset
                          </button>
                          <button onClick={() => handleDelete(team._id)}
                            className="text-xs text-white/30 hover:text-red-400 bg-[#0d1e3a] border border-[#c9a227]/15 hover:bg-[#c9a227]/12 px-3 py-1.5 rounded-lg transition-colors">
                            Del
                          </button>
                        </div>
                      </div>

                      {isExpanded && team.players !== undefined && (
                        <div className="border-t border-[#c9a227]/15 p-3 space-y-1.5 max-h-48 overflow-y-auto">
                          {team.players?.length === 0 && (
                            <p className="text-white/30 text-xs text-center py-3">No players yet</p>
                          )}
                          {team.players?.map(p => (
                            <div key={p._id} className="flex items-center justify-between bg-[#0a1628] rounded-lg px-3 py-2 gap-2">
                              <div className="flex-1 min-w-0">
                                <span className="text-white/70 text-xs font-medium truncate block">{p.name}</span>
                                <span className="text-[#c9a227]/50 text-[10px]">{p.soldPrice} pts</span>
                              </div>
                              <button
                                onClick={() => handleRemovePlayer(team._id, p._id, p.name, p.soldPrice)}
                                className="shrink-0 text-[10px] text-red-400/60 hover:text-red-400 border border-red-400/20 hover:border-red-400/50 px-2 py-1 rounded-md transition-colors">
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d1e3a] border border-[#c9a227]/20 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-base font-semibold text-white mb-5">{editId ? `Edit ${sportLabel} Team` : `Add ${sportLabel} Team`}</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/30 uppercase tracking-wider mb-1.5 block">Team Name</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder={isFootball ? 'e.g. Madrid Stars' : 'e.g. Thunder Hawks'}
                  className="w-full bg-[#c9a227]/8 border border-[#c9a227]/20 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-white/30 uppercase tracking-wider mb-1.5 block">Team Logo</label>
                <LogoUpload value={form.logo} onChange={url => setForm(f => ({ ...f, logo: url }))} token={token} toast={toast} />
              </div>
              <div>
                <label className="text-xs text-white/30 uppercase tracking-wider mb-1.5 block">Assign Captain</label>
                <CaptainSelect
                  captains={captains}
                  value={form.captainId}
                  onChange={val => setForm(f => ({ ...f, captainId: val }))}
                />
              </div>
              <div>
                <label className="text-xs text-white/30 uppercase tracking-wider mb-1.5 block">Budget (points)</label>
                <input
                  type="number"
                  min="0"
                  value={form.budget}
                  onChange={e => setForm(f => ({ ...f, budget: Number(e.target.value) }))}
                  className="w-full bg-[#c9a227]/8 border border-[#c9a227]/20 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/30 transition-colors"
                />
                <p className="text-white/30 text-xs mt-1">Starting purse allocated to this team</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowForm(false); setEditId(null); }}
                className="flex-1 bg-[#c9a227]/8 border border-[#c9a227]/20 text-white/50 py-2.5 rounded-lg text-sm hover:text-white transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-[#c9a227] text-[#0a1628] font-semibold py-2.5 rounded-lg text-sm hover:bg-[#f0c040] disabled:opacity-40 flex items-center justify-center gap-2">
                {saving ? <Spinner size="sm" /> : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d1e3a] border border-[#c9a227]/20 rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-base font-semibold text-white mb-2">{confirmModal.title}</h2>
            <p className="text-white/50 text-sm mb-6">{confirmModal.message}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmModal(null)}
                className="flex-1 bg-[#0a1628] border border-[#c9a227]/15 text-white/50 py-2.5 rounded-lg text-sm hover:text-white transition-colors">
                Cancel
              </button>
              <button onClick={confirmModal.onConfirm}
                className="flex-1 bg-red-600/90 text-white font-medium py-2.5 rounded-lg text-sm hover:bg-red-600 transition-colors">
                {confirmModal.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
