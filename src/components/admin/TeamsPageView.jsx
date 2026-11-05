'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import Spinner from '@/components/Spinner';
import Image from 'next/image';
import { CricketIcon, FootballIcon } from '@/components/SportIcons';

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
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full bg-white border border-[#e8e2d5] rounded-xl px-3.5 py-2.5 text-sm text-left flex items-center justify-between focus:outline-none focus:border-[#0d3a24] transition-colors hover:border-gray-300 shadow-sm"
      >
        <span className={selected ? 'text-[#111827] font-medium' : 'text-[#9ca3af]'}>
          {selected ? selected.name : '— No captain assigned —'}
        </span>
        <svg className={`w-4 h-4 text-[#6b7280] transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 16 16" fill="none">
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1.5 bg-white border border-[#e8e2d5] rounded-2xl overflow-hidden shadow-2xl">
          <div className="max-h-52 overflow-y-auto divide-y divide-gray-100">
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-[#faf8f5] ${!value ? 'text-[#0d3a24] font-bold bg-[#0d3a24]/5' : 'text-[#6b7280]'}`}
            >
              — No captain —
            </button>
            {captains.length === 0 && (
              <div className="px-4 py-3 text-xs text-[#9ca3af] text-center">
                No captains registered for this sport yet.
              </div>
            )}
            {captains.map(c => (
              <button
                key={c._id}
                type="button"
                onClick={() => { onChange(c._id); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-[#faf8f5] ${value === c._id ? 'text-[#0d3a24] font-bold bg-[#0d3a24]/5' : 'text-[#111827]'}`}
              >
                <div className="font-semibold">{c.name}</div>
                <div className="text-[#6b7280] text-xs mt-0.5">{c.email}</div>
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
        <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-[#e8e2d5] bg-[#f8f6f0] shrink-0 p-1">
          <Image src={value} alt="logo" fill unoptimized className="object-contain p-1" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-1 right-1 w-4 h-4 bg-stone-900/70 rounded-full text-white text-xs flex items-center justify-center leading-none hover:bg-red-600 transition-colors"
          >
            ×
          </button>
        </div>
      )}
      <label className={`flex items-center justify-center gap-2 bg-[#f4efe6] border border-[#e8e2d5] hover:border-[#0d3a24] text-[#0d3a24] text-xs font-semibold px-4 py-2.5 rounded-xl transition-all cursor-pointer flex-1 shadow-sm ${uploading ? 'opacity-40 pointer-events-none' : ''}`}>
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

  // Quick-create captain modal state
  const [showCaptainModal, setShowCaptainModal] = useState(false);
  const [newCapName, setNewCapName] = useState('');
  const [newCapEmail, setNewCapEmail] = useState('');
  const [newCapPass, setNewCapPass] = useState('');
  const [creatingCap, setCreatingCap] = useState(false);

  const isFootball = sport === 'football';
  const sportLabel = isFootball ? 'Football' : 'Cricket';

  const load = useCallback(async () => {
    setLoading(true);
    const [tRes, uRes] = await Promise.all([
      request(`/api/teams?sport=${sport}`),
      request(`/api/users?sport=${sport}`),
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

  const handleCreateCaptain = async () => {
    if (!newCapName.trim() || !newCapEmail.trim() || !newCapPass.trim()) {
      return toast('Name, email, and password required', 'warning');
    }
    setCreatingCap(true);
    const res = await request('/api/users', {
      method: 'POST',
      body: JSON.stringify({
        name: newCapName.trim(),
        email: newCapEmail.trim(),
        password: newCapPass.trim(),
        role: 'captain',
        sport,
      }),
    });
    setCreatingCap(false);
    if (res?.error) {
      toast(res.error, 'error');
      return;
    }
    if (res?.user) {
      toast(`${sportLabel} Captain created & login details sent!`, 'success');
      setCaptains(prev => [...prev, res.user]);
      setForm(f => ({ ...f, captainId: res.user._id }));
      setShowCaptainModal(false);
      setNewCapName('');
      setNewCapEmail('');
      setNewCapPass('');
    }
  };

  const handleResetAll = () => {
    setConfirmModal({
      title: `Reset All ${sportLabel} Teams?`,
      message: `This will restore all ${sportLabel.toLowerCase()} team budgets to their starting points (1000 pts), clear all squads, restore reveal tokens, and make all sold players available for auction again. Are you sure you want to proceed?`,
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

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Spinner size="lg" />
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen lg:h-[calc(100vh-48px)] bg-[#f8f6f0]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 lg:px-8 py-5 border-b border-[#e8e2d5] bg-white shrink-0">
        <div>
          <h1 className="text-xl font-bold font-serif text-[#111827] flex items-center gap-2">
            {isFootball ? (
              <FootballIcon className="w-5 h-5 text-[#0d3a24]" />
            ) : (
              <CricketIcon className="w-5 h-5 text-[#c59b27]" />
            )}
            <span>{sportLabel} Teams</span>
          </h1>
          <p className="text-[#6b7280] text-xs mt-0.5">{teams.length} clubs enrolled</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleResetAll}
            disabled={resetting}
            className="flex items-center gap-2 bg-white hover:bg-amber-50/50 border border-[#e8e2d5] hover:border-[#c59b27] text-[#c59b27] text-xs font-semibold px-4 py-2 rounded-xl transition-all disabled:opacity-50 shadow-sm"
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
            className="text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 bg-[#0d3a24] hover:bg-[#154d32] text-white shadow-sm"
          >
            + Add Team
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden p-4 lg:p-8">
        <div className="h-full border border-[#e8e2d5] rounded-2xl overflow-hidden flex flex-col bg-white shadow-sm">
          {/* Header Bar */}
          <div className="flex items-center gap-1.5 px-4 py-2.5 bg-[#faf8f5] border-b border-[#e8e2d5] shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0d3a24]/20" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#c59b27]/20" />
            <span className="w-2.5 h-2.5 rounded-full bg-stone-300" />
            <span className="text-[#6b7280] text-xs ml-2 font-mono">teams · {teams.length} total</span>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {teams.length === 0 ? (
              <div className="text-center py-16 text-[#9ca3af] text-sm">
                No {sportLabel.toLowerCase()} teams yet. Click &ldquo;+ Add Team&rdquo; to create one.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {teams.map(team => {
                  const isExpanded = expanded === team._id;
                  const pct = Math.round(((team.pointsSpent || 0) / (team.initialBudget || 1000)) * 100);
                  const maxPlayers = 7;
                  const count = team.playerCount ?? team.players?.length ?? 0;
                  return (
                    <div
                      key={team._id}
                      className="border border-[#e8e2d5] hover:border-[#0d3a24]/30 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between bg-white"
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {team.logo ? (
                              <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-[#e8e2d5] bg-[#faf8f5] shrink-0">
                                <Image src={team.logo} alt={team.name} fill unoptimized className="object-contain p-1" />
                              </div>
                            ) : (
                              <div className="w-11 h-11 rounded-xl border border-[#e8e2d5] bg-[#faf8f5] flex items-center justify-center shrink-0">
                                <span className="text-[#0d3a24] text-base font-black">{team.name[0]}</span>
                              </div>
                            )}
                            <div className="min-w-0">
                              <h3 className="text-[#111827] font-bold text-sm truncate">{team.name}</h3>
                              <p className="text-[#6b7280] text-xs truncate">
                                {team.captainId?.name || <span className="text-[#9ca3af] italic">No captain</span>}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-black text-lg text-[#0d3a24] tabular-nums">{team.budget}</span>
                            <span className="text-[#6b7280] text-[10px] block font-medium">pts left</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1.5 mb-3">
                          <div className="flex items-center justify-between text-[11px] text-[#6b7280]">
                            <span>{count}/{maxPlayers} players</span>
                            <span>{pct}% spent</span>
                          </div>
                          <div className="h-1.5 bg-[#f4efe6] rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all bg-[#0d3a24]" style={{ width: `${Math.min(pct, 100)}%` }} />
                          </div>
                        </div>

                        {/* Tokens info */}
                        <div className="flex items-center justify-between py-1 mb-3 text-xs">
                          <span className="text-purple-700 font-medium flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Reveal tokens: <strong>{team.revealTokens ?? 1}</strong>
                          </span>
                          <button
                            onClick={() => handleAddToken(team._id, team.name)}
                            className="text-[11px] text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2 py-0.5 rounded-lg transition-colors font-semibold"
                          >
                            + Token
                          </button>
                        </div>

                        {/* Card actions */}
                        <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-gray-100">
                          <button
                            onClick={() => setExpanded(isExpanded ? null : team._id)}
                            className={`col-span-2 text-xs py-1.5 rounded-lg font-semibold transition-colors flex items-center justify-center gap-1 ${
                              isExpanded
                                ? 'bg-[#0d3a24] text-white shadow-sm'
                                : 'bg-[#f4efe6] text-[#0d3a24] hover:bg-[#eae3d5]'
                            }`}
                          >
                            <span>Squad</span>
                            <span className="text-[10px]">({count})</span>
                          </button>
                          <button
                            onClick={() => openEdit(team)}
                            className="text-xs text-[#4b5563] hover:text-[#111827] bg-white border border-[#e8e2d5] hover:bg-stone-50 py-1.5 rounded-lg transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleResetTeam(team)}
                            className="text-xs text-[#c59b27] hover:text-[#916922] bg-white border border-[#e8e2d5] hover:bg-amber-50/50 py-1.5 rounded-lg transition-colors font-medium"
                            title="Reset team to initial budget"
                          >
                            Reset
                          </button>
                        </div>
                      </div>

                      {/* Expanded Squad Drawer */}
                      {isExpanded && team.players !== undefined && (
                        <div className="border-t border-[#e8e2d5] bg-[#faf8f5] p-3 space-y-1.5 max-h-48 overflow-y-auto rounded-b-2xl">
                          {team.players?.length === 0 && (
                            <p className="text-[#9ca3af] text-xs text-center py-3">No players yet</p>
                          )}
                          {team.players?.map(p => (
                            <div key={p._id} className="flex items-center justify-between bg-white border border-[#e8e2d5] rounded-xl px-3 py-2 gap-2 shadow-sm">
                              <div className="flex-1 min-w-0">
                                <span className="text-[#111827] text-xs font-semibold truncate block">{p.name}</span>
                                <span className="text-[#c59b27] text-[10px] font-bold">{p.soldPrice} pts</span>
                              </div>
                              <button
                                onClick={() => handleRemovePlayer(team._id, p._id, p.name, p.soldPrice)}
                                className="shrink-0 text-[10px] text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-2 py-1 rounded-lg transition-colors font-semibold"
                              >
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

      {/* Add / Edit Team Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl border border-gray-100">
            <h2 className="text-xl font-bold font-serif text-[#111827] mb-5">
              {editId ? `Edit ${sportLabel} Team` : `Add ${sportLabel} Team`}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#4b5563] mb-1.5 block">Team Name</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder={isFootball ? 'e.g. Madrid Stars' : 'e.g. Thunder Hawks'}
                  className="w-full bg-white border border-[#e8e2d5] rounded-xl px-3.5 py-2.5 text-[#111827] text-sm focus:outline-none focus:border-[#0d3a24] shadow-sm transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#4b5563] mb-1.5 block">Team Logo</label>
                <LogoUpload value={form.logo} onChange={url => setForm(f => ({ ...f, logo: url }))} token={token} toast={toast} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#4b5563] block">Assign Captain</label>
                  <button
                    type="button"
                    onClick={() => setShowCaptainModal(true)}
                    className="text-xs text-[#0d3a24] hover:underline flex items-center gap-1 font-bold"
                  >
                    + New {sportLabel} Captain
                  </button>
                </div>
                <CaptainSelect
                  captains={captains}
                  value={form.captainId}
                  onChange={val => setForm(f => ({ ...f, captainId: val }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#4b5563] mb-1.5 block">Budget (points)</label>
                <input
                  type="number"
                  min="0"
                  value={form.budget}
                  onChange={e => setForm(f => ({ ...f, budget: Number(e.target.value) }))}
                  className="w-full bg-white border border-[#e8e2d5] rounded-xl px-3.5 py-2.5 text-[#111827] text-sm focus:outline-none focus:border-[#0d3a24] shadow-sm transition-colors"
                />
                <p className="text-[#6b7280] text-xs mt-1">Starting purse allocated to this team</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6 pt-2">
              <button
                onClick={() => { setShowForm(false); setEditId(null); }}
                className="flex-1 bg-[#f3f4f6] text-[#374151] font-semibold py-2.5 rounded-xl text-sm hover:bg-[#e5e7eb] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-[#0d3a24] hover:bg-[#154d32] text-white font-semibold py-2.5 rounded-xl text-sm shadow-md transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {saving ? <Spinner size="sm" /> : 'Save Team'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Captain Modal */}
      {showCaptainModal && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-sm shadow-2xl border border-gray-100">
            <h3 className="text-lg font-bold font-serif text-[#111827] mb-1 flex items-center gap-2">
              {isFootball ? <FootballIcon className="w-5 h-5 text-[#0d3a24]" /> : <CricketIcon className="w-5 h-5 text-[#c59b27]" />}
              <span>Create {sportLabel} Captain</span>
            </h3>
            <p className="text-[#6b7280] text-xs mb-4">Add a dedicated login for this team&apos;s captain.</p>
            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-[#4b5563] block mb-1">Captain Name</label>
                <input
                  value={newCapName}
                  onChange={e => setNewCapName(e.target.value)}
                  placeholder="e.g. Captain Sharma"
                  className="w-full bg-white border border-[#e8e2d5] rounded-xl px-3.5 py-2 text-sm text-[#111827] focus:outline-none focus:border-[#0d3a24] shadow-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#4b5563] block mb-1">Email Address (Gmail)</label>
                <input
                  type="email"
                  value={newCapEmail}
                  onChange={e => setNewCapEmail(e.target.value)}
                  placeholder="captain@example.com"
                  className="w-full bg-white border border-[#e8e2d5] rounded-xl px-3.5 py-2 text-sm text-[#111827] focus:outline-none focus:border-[#0d3a24] shadow-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#4b5563] block mb-1">Password</label>
                <input
                  type="password"
                  value={newCapPass}
                  onChange={e => setNewCapPass(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-white border border-[#e8e2d5] rounded-xl px-3.5 py-2 text-sm text-[#111827] focus:outline-none focus:border-[#0d3a24] shadow-sm"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowCaptainModal(false)}
                className="flex-1 bg-[#f3f4f6] text-[#374151] font-semibold py-2.5 rounded-xl text-sm hover:bg-[#e5e7eb] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateCaptain}
                disabled={creatingCap}
                className="flex-1 bg-[#0d3a24] hover:bg-[#154d32] text-white font-semibold py-2.5 rounded-xl text-sm shadow-md transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {creatingCap ? <Spinner size="sm" /> : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-sm shadow-2xl border border-gray-100">
            <h3 className="text-lg font-bold font-serif text-[#111827] mb-2">{confirmModal.title}</h3>
            <p className="text-[#6b7280] text-xs leading-relaxed mb-6">{confirmModal.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 bg-[#f3f4f6] text-[#374151] font-semibold py-2.5 rounded-xl text-sm hover:bg-[#e5e7eb] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="flex-1 bg-[#0d3a24] hover:bg-[#154d32] text-white font-semibold py-2.5 rounded-xl text-sm shadow-md transition-all"
              >
                {confirmModal.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
