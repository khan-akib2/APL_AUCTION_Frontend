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

const CRICKET_SKILLS = ['Batsman', 'Bowler', 'All-Rounder', 'Wicketkeeper', 'Fielder'];
const FOOTBALL_SKILLS = ['Forward', 'Midfielder', 'Defender', 'Goalkeeper'];

const CRICKET_ROLES = ['Batsman', 'Bowler', 'All-Rounder', 'Wicketkeeper', 'Fielder'];
const FOOTBALL_ROLES = ['Forward', 'Midfielder', 'Defender', 'Goalkeeper'];

const STATUSES = ['available', 'sold', 'unsold', 'resold'];
const STATUS_COLORS = {
  available: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  sold: 'bg-amber-50 text-amber-800 border-amber-200',
  unsold: 'bg-stone-100 text-stone-600 border-stone-200',
  resold: 'bg-orange-50 text-orange-800 border-orange-200',
};

const emptyForm = {
  name: '',
  photo: '',
  category: 'Batsman',
  playingStyle: '',
  skills: ['Batsman'],
  gender: 'Male',
  basePrice: 20,
  status: 'available',
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

function PhotoUpload({ value, onChange, token, toast, playerName = '' }) {
  const [uploading, setUploading] = useState(false);
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setUploading(true);

    try {
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
    } catch {
      setUploading(false);
      toast('Upload failed', 'error');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      {/* Circular Avatar */}
      <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden border-[6px] border-[#ece4d0] shadow-md bg-[#f6f4ee] flex items-center justify-center relative">
        {value ? (
          <Image
            src={value}
            alt={playerName || 'Player photo'}
            fill
            unoptimized
            className="object-cover"
          />
        ) : (
          <svg className="w-20 h-20 text-[#c8bfab]" viewBox="0 0 80 80" fill="currentColor">
            <circle cx="40" cy="26" r="14" />
            <path d="M18 64 C18 48 26 44 40 44 C54 44 62 48 62 64 Z" />
            <path d="M34 44 L40 52 L46 44 Z" fill="#b8af9b" />
          </svg>
        )}
      </div>

      {/* Pill Button: Change Photo */}
      <label className={`bg-[#184832] hover:bg-[#205e42] active:scale-95 text-white text-xs font-semibold px-5 py-2 rounded-full mt-4 shadow-sm transition-all cursor-pointer flex items-center gap-1.5 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
        {uploading ? (
          <Spinner size="sm" />
        ) : (
          <span>{value ? 'Change Photo' : 'Upload Photo'}</span>
        )}
        <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
      </label>

      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="text-[11px] text-[#9ca3af] hover:text-red-500 mt-1.5 transition-colors font-medium"
        >
          Remove Photo
        </button>
      )}
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

        const validFootballSkills = ['Forward', 'Midfielder', 'Defender', 'Goalkeeper'];
        const skillMap = isFootball ? {
          'forward': 'Forward', 'striker': 'Forward', 'attacker': 'Forward',
          'midfielder': 'Midfielder', 'midfield': 'Midfielder', 'mid': 'Midfielder',
          'defender': 'Defender', 'defence': 'Defender', 'defense': 'Defender',
          'goalkeeper': 'Goalkeeper', 'goal keeper': 'Goalkeeper', 'keeper': 'Goalkeeper', 'gk': 'Goalkeeper',
          'winger': 'Forward', 'wing': 'Forward',
          // Gracefully convert cricket roles to football positions if cricket CSV was loaded
          'batsman': 'Forward', 'batting': 'Forward', 'batter': 'Forward',
          'bowler': 'Midfielder', 'bowling': 'Midfielder',
          'all-rounder': 'Defender', 'allrounder': 'Defender', 'fielder': 'Defender', 'fielding': 'Defender',
          'wicketkeeper': 'Goalkeeper', 'wicket keeper': 'Goalkeeper', 'wicket-keeper': 'Goalkeeper',
        } : {
          'batting': 'Batsman', 'batsman': 'Batsman', 'batter': 'Batsman',
          'bowling': 'Bowler', 'bowler': 'Bowler',
          'wicket keeper': 'Wicketkeeper', 'wicketkeeper': 'Wicketkeeper', 'wicket-keeper': 'Wicketkeeper',
          'fielding': 'Fielder', 'fielder': 'Fielder',
        };

        let skills = rawSkills
          .split(/[|,]/)
          .map(s => skillMap[s.trim().toLowerCase()] || (isFootball ? '' : s.trim()))
          .filter(Boolean)
          .filter((v, i, a) => a.indexOf(v) === i);

        if (isFootball) {
          skills = skills.filter(s => validFootballSkills.includes(s));
          if (!skills.length) skills = ['Forward'];
        }

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

  const openAdd = () => {
    const defaultCat = isFootball ? 'Forward' : 'Batsman';
    const defaultStyle = isFootball ? 'Right Footed' : 'Right Hand Bat';
    setForm({
      ...emptyForm,
      category: defaultCat,
      playingStyle: defaultStyle,
      skills: [defaultCat, defaultStyle],
      sport,
    });
    setEditId(null);
    setShowModal(true);
  };

  const openEdit = (player) => {
    const validCats = isFootball ? FOOTBALL_SKILLS : CRICKET_SKILLS;
    const matchedCat = player.skills?.find(s => validCats.includes(s)) || (isFootball ? 'Forward' : 'Batsman');
    const otherSkills = player.skills?.filter(s => s !== matchedCat) || [];
    const initialStyle = otherSkills.join(', ') || (isFootball ? 'Right Footed' : 'Right Hand Bat');

    setForm({
      name: player.name || '',
      photo: player.photo || '',
      category: matchedCat,
      playingStyle: initialStyle,
      skills: player.skills?.length ? player.skills : [matchedCat],
      gender: player.gender || 'Male',
      basePrice: player.basePrice ?? 20,
      status: player.status || 'available',
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
    if (!form.name?.trim()) return toast('Player name is required', 'warning');
    const cat = form.category || (isFootball ? 'Forward' : 'Batsman');
    const style = form.playingStyle?.trim();
    const finalSkills = [cat, style].filter(Boolean);

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      photo: form.photo,
      gender: form.gender || 'Male',
      basePrice: Number(form.basePrice) || 20,
      skills: finalSkills,
      status: form.status || 'available',
      isMysteryPlayer: form.isMysteryPlayer,
      mysteryConfig: form.mysteryConfig,
      sport,
    };
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
    <div className="flex flex-col min-h-screen lg:h-[calc(100vh-48px)] bg-[#f8f6f0]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 lg:px-8 py-5 border-b border-[#e8e2d5] bg-white gap-3 shrink-0">
        <div>
          <h1 className="text-xl font-bold font-serif text-[#111827] flex items-center gap-2">
            {isFootball ? <FootballIcon className="w-5 h-5 text-[#0d3a24]" /> : <CricketIcon className="w-5 h-5 text-[#c59b27]" />}
            <span>{sportLabel} Players</span>
          </h1>
          <p className="text-[#6b7280] text-xs mt-0.5">{total} total {sportLabel.toLowerCase()} players</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <label className={`bg-white border border-[#e8e2d5] hover:border-[#0d3a24] text-[#4b5563] hover:text-[#111827] text-xs font-semibold px-3.5 py-2 rounded-xl shadow-sm transition-colors cursor-pointer flex items-center gap-1.5 ${csvUploading ? 'opacity-40 pointer-events-none' : ''}`}>
            {csvUploading ? <Spinner size="sm" /> : <svg className="w-3.5 h-3.5 text-[#0d3a24]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>}
            Import CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} disabled={csvUploading} />
          </label>
          <button onClick={exportCSV}
            className="bg-white border border-[#e8e2d5] hover:border-[#c59b27] text-[#4b5563] hover:text-[#111827] text-xs font-semibold px-3.5 py-2 rounded-xl shadow-sm transition-colors flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-[#c59b27]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export CSV
          </button>
          <button onClick={() => setDeleteAllConfirm(true)} disabled={players.length === 0}
            className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors disabled:opacity-40">
            Delete All
          </button>
          <button onClick={openAdd}
            className="text-xs font-bold px-4 py-2 rounded-xl transition-all bg-[#0d3a24] hover:bg-[#154d32] text-white shadow-sm flex items-center gap-1.5">
            + Add Player
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="px-4 lg:px-8 py-3.5 border-b border-[#e8e2d5] bg-[#faf8f5] flex flex-col sm:flex-row items-center gap-3 shrink-0">
        <div className="relative flex-1 w-full sm:w-auto">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${sportLabel.toLowerCase()} players...`}
            className="w-full bg-white border border-[#e8e2d5] rounded-xl px-3.5 py-2 text-xs text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:border-[#0d3a24] shadow-sm"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['all', ...STATUSES].map(s => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1); }}
              className={`text-xs px-3.5 py-1.5 rounded-xl capitalize font-semibold transition-all shrink-0 ${
                status === s
                  ? 'bg-[#0d3a24] text-white shadow-sm'
                  : 'bg-white text-[#4b5563] hover:text-[#111827] border border-[#e8e2d5]'
              }`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Players List Table */}
      <div className="flex-1 overflow-hidden p-4 lg:p-8">
        <div className="h-full border border-[#e8e2d5] rounded-2xl overflow-hidden flex flex-col bg-white shadow-sm">
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-48"><Spinner size="lg" /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 text-[#9ca3af] text-sm">
                No {sportLabel.toLowerCase()} players found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[650px]">
                  <thead className="sticky top-0 z-10 bg-[#f4efe6]">
                    <tr className="border-b border-[#e8e2d5] text-left text-[#4b5563] text-xs uppercase tracking-wider font-semibold">
                      <th className="px-4 py-3">Player</th>
                      <th className="px-4 py-3">Role / Skills</th>
                      <th className="px-4 py-3">Base Price</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Sold Info</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e8e2d5]/70">
                    {filtered.map(p => (
                      <tr key={p._id} className="hover:bg-[#faf8f5] transition-colors">
                        <td className="px-4 py-3 flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-[#e8e2d5] shrink-0 bg-[#f4efe6]">
                            <PlayerPhoto src={p.photo} alt={p.name} />
                          </div>
                          <div>
                            <div className="text-[#111827] font-semibold flex items-center gap-2">
                              <span>{p.name}</span>
                              {p.isMysteryPlayer && (
                                <span className="bg-purple-100 text-purple-700 border border-purple-200 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">
                                  Mystery
                                </span>
                              )}
                            </div>
                            <div className="text-[#6b7280] text-xs">{p.gender}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {displaySkills(p.skills).map(s => <SkillBadge key={s} skill={s} />)}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-bold text-[#0d3a24] tabular-nums">{p.basePrice} pts</td>
                        <td className="px-4 py-3">
                          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${STATUS_COLORS[p.status] || 'bg-stone-100 text-stone-600'}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {p.status === 'sold' && p.soldTo ? (
                            <div>
                              <span className="text-[#111827] font-semibold">{p.soldTo.name}</span>
                              <span className="text-[#c59b27] ml-1.5 font-bold">({p.soldPrice} pts)</span>
                            </div>
                          ) : (
                            <span className="text-[#9ca3af]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => openEdit(p)}
                              className="text-xs text-[#0d3a24] hover:bg-[#0d3a24]/10 border border-[#0d3a24]/20 px-3 py-1.5 rounded-lg font-semibold transition-colors">
                              Edit
                            </button>
                            <button onClick={() => setDeleteConfirm(p)}
                              className="text-xs text-red-600 hover:bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg font-semibold transition-colors">
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-gray-100 relative my-8">
            {/* Header */}
            <h2 className="text-xl font-bold text-[#111827] mb-6">
              {editId ? `Edit ${sportLabel} Player` : 'Add New Player'}
            </h2>

            {/* 2-Column Body Layout */}
            <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start">
              {/* Left Column: Circular Avatar & Change Photo */}
              <div className="w-full sm:w-44 shrink-0 flex flex-col items-center justify-center pt-1">
                <PhotoUpload
                  value={form.photo}
                  onChange={url => setForm(f => ({ ...f, photo: url }))}
                  token={token}
                  toast={toast}
                  playerName={form.name}
                />
              </div>

              {/* Right Column: Form Inputs */}
              <div className="flex-1 w-full space-y-3.5">
                {/* Player Name */}
                <div>
                  <label className="text-xs font-semibold text-[#4b5563] mb-1 block">
                    Player Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder={isFootball ? 'e.g. Faisal Siddiqui' : 'e.g. Pravin'}
                    className="w-full bg-white border border-[#e5e7eb] rounded-xl px-3.5 py-2 text-sm text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:border-[#184832] focus:ring-1 focus:ring-[#184832] transition-colors"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="text-xs font-semibold text-[#4b5563] mb-1 block">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={form.category}
                      onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                      className="w-full bg-white border border-[#e5e7eb] rounded-xl px-3.5 py-2 text-sm text-[#111827] focus:outline-none focus:border-[#184832] focus:ring-1 focus:ring-[#184832] transition-colors appearance-none pr-9 cursor-pointer"
                    >
                      {skillsList.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#6b7280]">
                      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor">
                        <path d="M4 6L8 10L12 6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label className="text-xs font-semibold text-[#4b5563] mb-1 block">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={form.gender}
                      onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                      className="w-full bg-white border border-[#e5e7eb] rounded-xl px-3.5 py-2 text-sm text-[#111827] focus:outline-none focus:border-[#184832] focus:ring-1 focus:ring-[#184832] transition-colors appearance-none pr-9 cursor-pointer"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#6b7280]">
                      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor">
                        <path d="M4 6L8 10L12 6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Playing Style */}
                <div>
                  <label className="text-xs font-semibold text-[#4b5563] mb-1 block">
                    Playing Style <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.playingStyle}
                    onChange={e => setForm(f => ({ ...f, playingStyle: e.target.value }))}
                    placeholder={isFootball ? 'e.g. Right Footed' : 'e.g. Right Hand Bat'}
                    className="w-full bg-white border border-[#e5e7eb] rounded-xl px-3.5 py-2 text-sm text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:border-[#184832] focus:ring-1 focus:ring-[#184832] transition-colors"
                  />
                </div>

                {/* Base Price (Points) */}
                <div>
                  <label className="text-xs font-semibold text-[#4b5563] mb-1 block">
                    Base Price (Points) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.basePrice}
                    onChange={e => {
                      const val = e.target.value;
                      setForm(f => ({ ...f, basePrice: val === '' ? '' : Math.max(1, Number(val)) }));
                    }}
                    placeholder="20"
                    className="w-full bg-white border border-[#e5e7eb] rounded-xl px-3.5 py-2 text-sm text-[#111827] focus:outline-none focus:border-[#184832] focus:ring-1 focus:ring-[#184832] transition-colors"
                  />
                </div>

                {/* Mystery Player Toggle */}
                <div className="pt-2 border-t border-gray-100">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isMysteryPlayer}
                      onChange={e => setForm(f => ({ ...f, isMysteryPlayer: e.target.checked }))}
                      className="w-4 h-4 rounded text-purple-600 border-gray-300 focus:ring-0 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-semibold text-[#374151]">Mystery Player</span>
                      <span className="text-[11px] text-[#6b7280] ml-2">Identity hidden until revealed or sold</span>
                    </div>
                  </label>
                  {form.isMysteryPlayer && (
                    <div className="mt-3 p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-2.5">
                      <div>
                        <label className="text-[11px] font-semibold text-purple-900 uppercase tracking-wider block mb-1">Role Hint</label>
                        <input
                          value={form.mysteryConfig.roleHint}
                          onChange={e => setForm(f => ({ ...f, mysteryConfig: { ...f.mysteryConfig, roleHint: e.target.value } }))}
                          placeholder="e.g. Star Batsman / Playmaker"
                          className="w-full bg-white border border-purple-200 rounded-lg px-3 py-1.5 text-xs text-gray-800"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-purple-900 uppercase tracking-wider block mb-1">Rating Range</label>
                        <input
                          value={form.mysteryConfig.ratingRange}
                          onChange={e => setForm(f => ({ ...f, mysteryConfig: { ...f.mysteryConfig, ratingRange: e.target.value } }))}
                          placeholder="e.g. 80-90"
                          className="w-full bg-white border border-purple-200 rounded-lg px-3 py-1.5 text-xs text-gray-800"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => { setShowModal(false); setEditId(null); }}
                className="bg-[#f3f4f6] hover:bg-[#e5e7eb] text-[#374151] font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="bg-[#c59b27] hover:bg-[#d8aa2b] active:scale-[0.99] text-white font-semibold px-6 py-2.5 rounded-xl text-sm shadow-md shadow-[#c59b27]/25 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? <Spinner size="sm" /> : 'Save Player'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Single Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-sm shadow-2xl border border-gray-100">
            <h2 className="text-lg font-bold text-[#111827] mb-2">Delete {deleteConfirm.name}?</h2>
            <p className="text-[#6b7280] text-sm mb-6">Are you sure? This player will be permanently removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 bg-[#f3f4f6] text-[#374151] font-semibold py-2.5 rounded-xl text-sm hover:bg-[#e5e7eb] transition-colors">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm._id)} className="flex-1 bg-red-600 text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-red-700 shadow-sm transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Modal */}
      {deleteAllConfirm && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-sm shadow-2xl border border-gray-100">
            <h2 className="text-lg font-bold text-[#111827] mb-2">Delete All {sportLabel} Players?</h2>
            <p className="text-[#6b7280] text-sm mb-6">This will delete all {sportLabel.toLowerCase()} players and clear them from team rosters.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteAllConfirm(false)} className="flex-1 bg-[#f3f4f6] text-[#374151] font-semibold py-2.5 rounded-xl text-sm hover:bg-[#e5e7eb] transition-colors">Cancel</button>
              <button onClick={handleDeleteAll} className="flex-1 bg-red-600 text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-red-700 shadow-sm transition-colors">Delete All</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
