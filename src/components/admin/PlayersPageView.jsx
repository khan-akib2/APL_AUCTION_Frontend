'use client';
import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import SkillBadge from '@/components/SkillBadge';
import Spinner from '@/components/Spinner';
import { displaySkills } from '@/lib/skills';
import { CricketIcon, FootballIcon } from '@/components/SportIcons';

const CRICKET_SKILLS = ['Batsman', 'Bowler', 'Wicketkeeper', 'Fielder'];
const FOOTBALL_SKILLS = ['Forward', 'Midfielder', 'Defender', 'Goalkeeper'];

const CRICKET_ROLES = ['Batsman', 'Bowler', 'All-rounder', 'Wicketkeeper', 'Fielder'];
const FOOTBALL_ROLES = ['Forward', 'Midfielder', 'Defender', 'Goalkeeper'];

const STATUSES = ['available', 'sold', 'unsold', 'resold'];
const STATUS_COLORS = {
  available: 'bg-green-500/15 text-green-400 border-green-500/30',
  sold: 'bg-[#c9a227]/15 text-[#c9a227] border-[#c9a227]/30',
  unsold: 'bg-white/10 text-white/40 border-white/20',
  resold: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
};

const emptyForm = {
  name: '', photo: '', skills: [], gender: 'Male', basePrice: 20, status: 'available',
  isMysteryPlayer: false,
  mysteryConfig: { roleHint: '', ratingRange: '', formStatus: '', region: '', isStar: false, isBust: false, deceptionLevel: 'low', blurredPhoto: '' },
};

function RoleSelect({ value, onChange, roles }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full bg-[#0a1628] border border-purple-500/20 rounded-lg px-3 py-2.5 text-sm text-left flex items-center justify-between focus:outline-none hover:border-purple-500/40 transition-colors">
        <span className={value ? 'text-white' : 'text-white/30'}>{value || '— None —'}</span>
        <svg className={`w-4 h-4 text-white/30 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} viewBox="0 0 16 16" fill="none">
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-[#0d1e3a] border border-purple-500/25 rounded-xl overflow-hidden shadow-2xl">
          <button type="button" onClick={() => { onChange(''); setOpen(false); }}
            className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-purple-500/10 ${!value ? 'text-purple-300' : 'text-white/40'}`}>
            — None —
          </button>
          {roles.map(r => (
            <button key={r} type="button" onClick={() => { onChange(r); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-purple-500/10 ${value === r ? 'text-purple-300 bg-purple-500/10' : 'text-white/70'}`}>
              {r}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PlayerPhoto({ src, alt }) {
  const [err, setErr] = useState(false);
  if (!src || err) return (
    <div className="w-full h-full flex items-center justify-center bg-[#0d1e3a]">
      <svg className="w-5 h-5 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    </div>
  );
  return <Image src={src} alt={alt} fill unoptimized className="object-cover" onError={() => setErr(true)} />;
}

function PhotoUpload({ value, onChange, token, toast }) {
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
          canvas.toBlob(resolve, 'image/jpeg', 0.82);
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });

    const fd = new FormData();
    fd.append('file', compressed, 'photo.jpg');
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
        <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-[#c9a227]/20 bg-[#0a1628] shrink-0">
          <Image src={value} alt="photo" fill unoptimized className="object-cover" />
          <button type="button" onClick={() => onChange('')}
            className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/70 rounded-full text-white/60 hover:text-white text-xs flex items-center justify-center leading-none">
            ×
          </button>
        </div>
      )}
      <label className={`flex items-center justify-center gap-2 bg-[#c9a227]/8 border border-[#c9a227]/20 hover:bg-[#c9a227]/12 text-white/50 hover:text-white text-sm px-4 py-2.5 rounded-lg transition-colors cursor-pointer flex-1 ${uploading ? 'opacity-40 pointer-events-none' : ''}`}>
        {uploading ? <Spinner size="sm" /> : <>{value ? 'Change Photo' : 'Upload Photo'}</>}
        <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
      </label>
    </div>
  );
}

export default function PlayersPageView({ sport = 'cricket' }) {
  const { request } = useApi();
  const { token } = useAuth();
  const toast = useToast();

  const isFootball = sport === 'football';
  const sportLabel = isFootball ? 'Football' : 'Cricket';
  const skillsList = isFootball ? FOOTBALL_SKILLS : CRICKET_SKILLS;
  const rolesList = isFootball ? FOOTBALL_ROLES : CRICKET_ROLES;

  const [players, setPlayers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false);
  const [csvUploading, setCsvUploading] = useState(false);
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

  const handleCsvUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setCsvUploading(true);
    try {
      const text = await file.text();
      const lines = text.trim().split('\n').filter(l => l.trim());
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const parsedPlayers = lines.slice(1).map(line => {
        const vals = [];
        let cur = '', inQuote = false;
        for (const ch of line) {
          if (ch === '"') { inQuote = !inQuote; }
          else if (ch === ',' && !inQuote) { vals.push(cur.trim()); cur = ''; }
          else { cur += ch; }
        }
        vals.push(cur.trim());

        const obj = {};
        headers.forEach((h, i) => { obj[h] = vals[i] || ''; });

        const rawName = obj['name'] || obj['your name'] || '';
        const rawGender = obj['gender'] || 'Male';
        const rawSkills = obj['primary skill'] || obj['primary skills'] || obj['skills'] || '';

        const skillMap = isFootball ? {
          'forward': 'Forward', 'striker': 'Forward', 'attacker': 'Forward',
          'midfielder': 'Midfielder', 'midfield': 'Midfielder', 'mid': 'Midfielder',
          'defender': 'Defender', 'defence': 'Defender', 'defense': 'Defender',
          'goalkeeper': 'Goalkeeper', 'goal keeper': 'Goalkeeper', 'keeper': 'Goalkeeper', 'gk': 'Goalkeeper',
          'winger': 'Forward', 'wing': 'Forward',
        } : {
          'batting': 'Batsman', 'batsman': 'Batsman', 'batter': 'Batsman',
          'bowling': 'Bowler', 'bowler': 'Bowler',
          'wicket keeper': 'Wicketkeeper', 'wicketkeeper': 'Wicketkeeper', 'wicket-keeper': 'Wicketkeeper',
          'fielding': 'Fielder', 'fielder': 'Fielder',
        };

        const skills = rawSkills
          .split(/[|,]/)
          .map(s => skillMap[s.trim().toLowerCase()] || s.trim())
          .filter(Boolean)
          .filter((v, i, a) => a.indexOf(v) === i);

        const gender = rawGender.charAt(0).toUpperCase() + rawGender.slice(1).toLowerCase();

        return {
          name: rawName,
          skills: skills.length ? skills : (isFootball ? ['Forward'] : ['Batsman']),
          gender: ['Male', 'Female'].includes(gender) ? gender : 'Male',
          basePrice: 20,
          status: 'available',
          sport,
        };
      }).filter(p => p.name);

      let success = 0;
      for (const p of parsedPlayers) {
        const res = await fetch(`${BACKEND_URL}/api/players`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(p),
        });
        if (res.ok) success++;
      }
      toast(`${success}/${parsedPlayers.length} ${sportLabel.toLowerCase()} players imported`, 'success');
      load();
    } catch {
      toast('CSV import failed', 'error');
    } finally {
      setCsvUploading(false);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams({ page, pageSize: 200, status, sport });
    const res = await request(`/api/players?${qs}`);
    if (res) {
      setPlayers(res.players || []);
      setTotal(res.total || 0);
    }
    setLoading(false);
  }, [request, page, status, sport]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setForm({ ...emptyForm, sport }); setEditId(null); setShowModal(true); };
  const openEdit = (player) => {
    setForm({
      name: player.name,
      photo: player.photo || '',
      skills: player.skills || [],
      gender: player.gender || 'Male',
      basePrice: player.basePrice ?? 20,
      status: player.status,
      isMysteryPlayer: player.isMysteryPlayer || false,
      mysteryConfig: {
        roleHint: player.mysteryConfig?.roleHint || '',
        ratingRange: player.mysteryConfig?.ratingRange || '',
        formStatus: player.mysteryConfig?.formStatus || '',
        region: player.mysteryConfig?.region || '',
        isStar: player.mysteryConfig?.isStar || false,
        isBust: player.mysteryConfig?.isBust || false,
        deceptionLevel: player.mysteryConfig?.deceptionLevel || 'low',
        blurredPhoto: player.mysteryConfig?.blurredPhoto || '',
      },
    });
    setEditId(player._id);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast('Player name required', 'warning');
    if (!form.skills.length) return toast('At least one skill required', 'warning');
    setSaving(true);
    const payload = { ...form, sport };
    const res = editId
      ? await request(`/api/players/${editId}`, { method: 'PUT', body: JSON.stringify(payload) })
      : await request('/api/players', { method: 'POST', body: JSON.stringify(payload) });
    setSaving(false);
    if (res?.error) { toast(res.error, 'error'); return; }
    toast(editId ? 'Player updated' : 'Player added', 'success');
    setShowModal(false); setForm(emptyForm); setEditId(null);
    load();
  };

  const handleDelete = async (id) => {
    const res = await request(`/api/players/${id}`, { method: 'DELETE' });
    if (res?.error) toast(res.error, 'error');
    else { toast('Player deleted', 'success'); load(); }
    setDeleteConfirm(null);
  };

  const handleDeleteAll = async () => {
    const res = await request(`/api/players/all?sport=${sport}`, { method: 'DELETE' });
    if (res?.error) toast(res.error, 'error');
    else { toast(`All ${sportLabel.toLowerCase()} players deleted`, 'success'); load(); }
    setDeleteAllConfirm(false);
  };

  const toggleSkill = (skill) => {
    setForm(f => ({
      ...f,
      skills: f.skills.includes(skill) ? f.skills.filter(s => s !== skill) : [...f.skills, skill],
    }));
  };

  const exportCSV = () => {
    const headers = ['ID', 'Name', 'Skills', 'Gender', 'Base Price', 'Status', 'Sold To', 'Sold Price', 'Is Mystery Player', 'Photo URL'];
    const rows = players.map(p => [
      p._id,
      `"${p.name}"`,
      `"${p.skills?.join('; ') || ''}"`,
      p.gender,
      p.basePrice,
      p.status,
      p.soldTo?.name ? `"${p.soldTo.name}"` : '',
      p.soldPrice || '',
      p.isMysteryPlayer ? 'Yes' : 'No',
      `"${p.photo || ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `APL_${sportLabel}_Players.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = players.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col min-h-screen lg:h-[calc(100vh-48px)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 lg:px-6 py-4 border-b border-[#c9a227]/15 gap-3 shrink-0">
        <div>
          <h1 className="text-base font-semibold text-white flex items-center gap-2">
            {isFootball ? <FootballIcon className="w-5 h-5 text-[#c9a227]" /> : <CricketIcon className="w-5 h-5 text-[#c9a227]" />}
            <span>{sportLabel} Players</span>
          </h1>
          <p className="text-white/40 text-xs mt-0.5">{total} total {sportLabel.toLowerCase()} players</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <label className={`bg-[#0d1e3a] border border-[#c9a227]/25 hover:border-[#c9a227]/50 text-white/70 hover:text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${csvUploading ? 'opacity-40 pointer-events-none' : ''}`}>
            {csvUploading ? <Spinner size="sm" /> : <svg className="w-3.5 h-3.5 text-[#c9a227]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>}
            Import CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} disabled={csvUploading} />
          </label>
          <button onClick={exportCSV}
            className="bg-[#0d1e3a] border border-[#c9a227]/25 hover:border-[#c9a227]/50 text-white/70 hover:text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-[#c9a227]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export CSV
          </button>
          <button onClick={() => setDeleteAllConfirm(true)} disabled={players.length === 0}
            className="bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 text-xs font-semibold px-3 py-2 rounded-lg transition-colors disabled:opacity-40">
            Delete All
          </button>
          <button onClick={openAdd}
            className="bg-[#c9a227] text-[#0a1628] text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#f0c040] transition-colors">
            + Add Player
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="px-4 lg:px-6 py-3 border-b border-[#c9a227]/10 flex flex-col sm:flex-row items-center gap-3 shrink-0">
        <div className="relative flex-1 w-full sm:w-auto">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${sportLabel.toLowerCase()} players...`}
            className="w-full bg-[#0d1e3a] border border-[#c9a227]/15 rounded-lg px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#c9a227]/40"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['all', ...STATUSES].map(s => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1); }}
              className={`text-xs px-3 py-1.5 rounded-lg capitalize font-medium transition-colors shrink-0 ${
                status === s
                  ? 'bg-[#c9a227] text-[#0a1628] font-bold'
                  : 'bg-[#0d1e3a] text-white/50 hover:text-white border border-[#c9a227]/15'
              }`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Players List Table */}
      <div className="flex-1 overflow-hidden p-4 lg:p-6">
        <div className="h-full border border-[#c9a227]/20 rounded-xl overflow-hidden bg-[#060f1e] flex flex-col">
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-48"><Spinner size="lg" /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 text-white/30 text-sm">
                No {sportLabel.toLowerCase()} players found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[650px]">
                  <thead className="sticky top-0 bg-[#0a1628] z-10">
                    <tr className="border-b border-[#c9a227]/15 text-left text-white/40 text-xs uppercase tracking-wider font-medium">
                      <th className="px-4 py-3">Player</th>
                      <th className="px-4 py-3">Role / Skills</th>
                      <th className="px-4 py-3">Base Price</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Sold Info</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#c9a227]/8">
                    {filtered.map(p => (
                      <tr key={p._id} className="hover:bg-[#c9a227]/5 transition-colors">
                        <td className="px-4 py-3 flex items-center gap-3">
                          <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-[#c9a227]/20 shrink-0 bg-[#0d1e3a]">
                            <PlayerPhoto src={p.photo} alt={p.name} />
                          </div>
                          <div>
                            <div className="text-white font-medium flex items-center gap-2">
                              <span>{p.name}</span>
                              {p.isMysteryPlayer && (
                                <span className="bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">
                                  Mystery
                                </span>
                              )}
                            </div>
                            <div className="text-white/30 text-xs">{p.gender}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {displaySkills(p.skills).map(s => <SkillBadge key={s} skill={s} />)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[#c9a227] font-semibold tabular-nums">{p.basePrice} pts</td>
                        <td className="px-4 py-3">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[p.status] || 'bg-white/10 text-white'}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {p.status === 'sold' && p.soldTo ? (
                            <div>
                              <span className="text-white font-medium">{p.soldTo.name}</span>
                              <span className="text-[#c9a227] ml-1.5 font-bold">({p.soldPrice} pts)</span>
                            </div>
                          ) : (
                            <span className="text-white/20">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => openEdit(p)}
                              className="text-xs text-white/40 hover:text-white bg-[#0d1e3a] border border-[#c9a227]/15 hover:border-[#c9a227]/40 px-2.5 py-1 rounded-md transition-colors">
                              Edit
                            </button>
                            <button onClick={() => setDeleteConfirm(p)}
                              className="text-xs text-red-400/60 hover:text-red-400 bg-[#0d1e3a] border border-red-500/20 hover:border-red-500/50 px-2.5 py-1 rounded-md transition-colors">
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit / Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[#0d1e3a] border border-[#c9a227]/20 rounded-2xl p-6 w-full max-w-lg my-8">
            <h2 className="text-base font-semibold text-white mb-5">{editId ? `Edit ${sportLabel} Player` : `Add ${sportLabel} Player`}</h2>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <label className="text-xs text-white/30 uppercase tracking-wider mb-1.5 block">Player Name</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Cristiano Ronaldo"
                  className="w-full bg-[#c9a227]/8 border border-[#c9a227]/20 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-white/30 uppercase tracking-wider mb-1.5 block">Photo</label>
                <PhotoUpload value={form.photo} onChange={url => setForm(f => ({ ...f, photo: url }))} token={token} toast={toast} />
              </div>

              <div>
                <label className="text-xs text-white/30 uppercase tracking-wider mb-1.5 block">Skills / Position</label>
                <div className="flex flex-wrap gap-2">
                  {skillsList.map(s => {
                    const active = form.skills.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleSkill(s)}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                          active
                            ? 'bg-[#c9a227] text-[#0a1628] border-[#c9a227] font-bold'
                            : 'bg-[#0a1628] text-white/50 border-white/10 hover:border-white/30'
                        }`}>
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/30 uppercase tracking-wider mb-1.5 block">Gender</label>
                  <select
                    value={form.gender}
                    onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                    className="w-full bg-[#0a1628] border border-[#c9a227]/20 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/30 uppercase tracking-wider mb-1.5 block">Base Price (pts)</label>
                  <input
                    type="number"
                    min="1"
                    value={form.basePrice}
                    onChange={e => setForm(f => ({ ...f, basePrice: Number(e.target.value) }))}
                    className="w-full bg-[#c9a227]/8 border border-[#c9a227]/20 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none"
                  />
                </div>
              </div>

              {/* Mystery Player Toggle */}
              <div className="border-t border-[#c9a227]/15 pt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isMysteryPlayer}
                    onChange={e => setForm(f => ({ ...f, isMysteryPlayer: e.target.checked }))}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-0 bg-[#0a1628] border-white/20"
                  />
                  <div>
                    <span className="text-sm font-semibold text-white">Mystery Player</span>
                    <p className="text-white/30 text-xs">Identity is hidden from captains until revealed or sold</p>
                  </div>
                </label>

                {form.isMysteryPlayer && (
                  <div className="mt-4 p-4 bg-purple-950/20 border border-purple-500/30 rounded-xl space-y-3">
                    <div>
                      <label className="text-xs text-purple-300 uppercase tracking-wider mb-1 block">Role Hint</label>
                      <RoleSelect
                        roles={rolesList}
                        value={form.mysteryConfig.roleHint}
                        onChange={v => setForm(f => ({ ...f, mysteryConfig: { ...f.mysteryConfig, roleHint: v } }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-purple-300 uppercase tracking-wider mb-1 block">Rating Range</label>
                      <input
                        value={form.mysteryConfig.ratingRange}
                        onChange={e => setForm(f => ({ ...f, mysteryConfig: { ...f.mysteryConfig, ratingRange: e.target.value } }))}
                        placeholder="e.g. 80-90"
                        className="w-full bg-[#0a1628] border border-purple-500/20 rounded-lg px-3 py-2 text-white text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowModal(false); setEditId(null); }}
                className="flex-1 bg-[#c9a227]/8 border border-[#c9a227]/20 text-white/50 py-2.5 rounded-lg text-sm hover:text-white transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 bg-[#c9a227] text-[#0a1628] font-semibold py-2.5 rounded-lg text-sm hover:bg-[#f0c040] disabled:opacity-40 flex items-center justify-center gap-2">
                {saving ? <Spinner size="sm" /> : 'Save Player'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Single Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d1e3a] border border-[#c9a227]/20 rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-base font-semibold text-white mb-2">Delete {deleteConfirm.name}?</h2>
            <p className="text-white/50 text-sm mb-6">Are you sure? This player will be permanently removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 bg-[#0a1628] border border-[#c9a227]/15 text-white/50 py-2.5 rounded-lg text-sm hover:text-white transition-colors">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm._id)} className="flex-1 bg-red-600/90 text-white font-medium py-2.5 rounded-lg text-sm hover:bg-red-600 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Modal */}
      {deleteAllConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d1e3a] border border-[#c9a227]/20 rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-base font-semibold text-white mb-2">Delete All {sportLabel} Players?</h2>
            <p className="text-white/50 text-sm mb-6">This will delete all {sportLabel.toLowerCase()} players and clear them from team rosters.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteAllConfirm(false)} className="flex-1 bg-[#0a1628] border border-[#c9a227]/15 text-white/50 py-2.5 rounded-lg text-sm hover:text-white transition-colors">Cancel</button>
              <button onClick={handleDeleteAll} className="flex-1 bg-red-600/90 text-white font-medium py-2.5 rounded-lg text-sm hover:bg-red-600 transition-colors">Delete All</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
