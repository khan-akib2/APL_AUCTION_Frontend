'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import SkillBadge from '@/components/SkillBadge';
import Spinner from '@/components/Spinner';
import { displaySkills } from '@/lib/skills';

const SKILLS = ['Batsman', 'Bowler', 'Wicketkeeper', 'Fielder'];
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

const ROLE_OPTIONS = ['Batsman', 'Bowler', 'All-rounder', 'Wicketkeeper', 'Fielder'];

function RoleSelect({ value, onChange }) {
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
          {ROLE_OPTIONS.map(r => (
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

    // Client-side compression
    const compressed = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX = 800;
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
    <div className="space-y-2">
      {value && (
        <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#c9a227]/20">
          <PlayerPhoto src={value} alt="preview" />
          <button type="button" onClick={() => onChange('')}
            className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full text-white/60 hover:text-white text-xs flex items-center justify-center">
            ×
          </button>
        </div>
      )}
      <label className={`relative flex items-center justify-center gap-2 bg-[#c9a227]/8 border border-[#c9a227]/20 hover:bg-[#c9a227]/12 text-white/50 hover:text-white text-sm px-4 py-2.5 rounded-lg transition-colors w-full cursor-pointer ${uploading ? 'opacity-40 pointer-events-none' : ''}`}>
        {uploading ? <Spinner size="sm" /> : <>{value ? 'Change Photo' : 'Upload Photo'}</>}
        <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFile} disabled={uploading} />
      </label>
    </div>
  );
}

export default function PlayersPage() {
  const { request } = useApi();
  const { token } = useAuth();
  const toast = useToast();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
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
      const players = lines.slice(1).map(line => {
        // Handle quoted CSV values (e.g. "BATTING, BOWLING")
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

        // Map Google Form column names → player fields
        const rawName = obj['name'] || obj['your name'] || '';
        const rawGender = obj['gender'] || 'Male';
        const rawSkills = obj['primary skill'] || obj['primary skills'] || obj['skills'] || '';

        // Normalise skills: split on comma or pipe, map to known skill names
        const skillMap = {
          'batting': 'Batsman', 'batsman': 'Batsman', 'batter': 'Batsman',
          'bowling': 'Bowler', 'bowler': 'Bowler',
          'wicket keeper': 'Wicketkeeper', 'wicketkeeper': 'Wicketkeeper', 'wicket-keeper': 'Wicketkeeper',
          'fielding': 'Fielder', 'fielder': 'Fielder',
        };
        const skills = rawSkills
          .split(/[|,]/)
          .map(s => skillMap[s.trim().toLowerCase()] || s.trim())
          .filter(Boolean)
          .filter((v, i, a) => a.indexOf(v) === i); // dedupe

        // Capitalise gender
        const gender = rawGender.charAt(0).toUpperCase() + rawGender.slice(1).toLowerCase();

        return {
          name: rawName,
          skills,
          gender: ['Male', 'Female'].includes(gender) ? gender : 'Male',
          basePrice: 20,
          status: 'available',
        };
      }).filter(p => p.name);

      let success = 0;
      for (const p of players) {
        const res = await fetch(`${BACKEND_URL}/api/players`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(p),
        });
        if (res.ok) success++;
      }
      toast(`${success}/${players.length} players imported`, 'success');
      load();
    } catch {
      toast('CSV import failed', 'error');
    } finally {
      setCsvUploading(false);
    }
  };

  const load = async () => {
    setLoading(true);
    const res = await request('/api/players?pageSize=500');
    if (res) setPlayers(res.players || []);
    setLoading(false);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  const filtered = players
    .filter(p => filter === 'all' || p.status === filter)
    .filter(p => !search.trim() || p.name.toLowerCase().includes(search.trim().toLowerCase()));

  const toggleSkill = s => setForm(f => {
    const base = ['Batsman', 'Bowler', 'Wicketkeeper', 'Fielder'];
    const current = f.skills.filter(x => x !== 'All-rounder');
    const updated = current.includes(s) ? current.filter(x => x !== s) : [...current, s];
    // If all 4 base skills selected → only show All-rounder
    const allSelected = base.every(b => updated.includes(b));
    return { ...f, skills: allSelected ? ['All-rounder'] : updated };
  });

  const handleSave = async () => {
    if (!form.name.trim()) return toast('Name required', 'warning');
    setSaving(true);
    const res = editId
      ? await request(`/api/players/${editId}`, { method: 'PUT', body: JSON.stringify(form) })
      : await request('/api/players', { method: 'POST', body: JSON.stringify(form) });
    setSaving(false);
    if (res?.error) { toast(res.error, 'error'); return; }
    toast(editId ? 'Updated' : 'Added', 'success');
    setShowForm(false); setForm(emptyForm); setEditId(null);
    load();
  };

  const handleEdit = p => {
    setForm({
      name: p.name, photo: p.photo || '', skills: p.skills || [], gender: p.gender || 'Male', basePrice: p.basePrice,
      status: p.status || 'available',
      isMysteryPlayer: p.isMysteryPlayer || false,
      mysteryConfig: {
        roleHint: p.mysteryConfig?.roleHint || '',
        ratingRange: p.mysteryConfig?.ratingRange || '',
        formStatus: p.mysteryConfig?.formStatus || '',
        region: p.mysteryConfig?.region || '',
        isStar: p.mysteryConfig?.isStar || false,
        isBust: p.mysteryConfig?.isBust || false,
        deceptionLevel: p.mysteryConfig?.deceptionLevel || 'low',
        blurredPhoto: p.mysteryConfig?.blurredPhoto || '',
      },
    });
    setEditId(p._id);
    setShowForm(true);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    const res = await request(`/api/players/${deleteConfirm}`, { method: 'DELETE' });
    setDeleteConfirm(null);
    if (res?.error) toast(res.error, 'error');
    else { toast('Deleted', 'success'); load(); }
  };

  const confirmDeleteAll = async () => {
    const res = await request('/api/players/all', { method: 'DELETE' });
    setDeleteAllConfirm(false);
    if (res?.error) toast(res.error, 'error');
    else { toast('All players deleted', 'success'); load(); }
  };

  return (
    <div className="flex flex-col min-h-screen lg:h-[calc(100vh-48px)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 lg:px-6 py-4 border-b border-[#c9a227]/15 shrink-0">
        <div>
          <h1 className="text-base font-semibold text-white">Players</h1>
          <p className="text-white/40 text-xs mt-0.5">{filtered.length} of {players.length}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setDeleteAllConfirm(true)}
            className="bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors">
            Delete All
          </button>
          <label className={`relative flex items-center gap-1.5 bg-[#0d1e3a] border border-[#c9a227]/20 hover:border-[#c9a227]/40 text-white/50 hover:text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors cursor-pointer ${csvUploading ? 'opacity-40 pointer-events-none' : ''}`}>
            {csvUploading ? <Spinner size="sm" /> : <>📥 CSV</>}
            <input type="file" accept=".csv" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleCsvUpload} disabled={csvUploading} />
          </label>
          <button onClick={() => { setForm(emptyForm); setEditId(null); setShowForm(true); }}
            className="bg-[#c9a227] text-[#0a1628] text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#f0c040] transition-colors">
            + Add
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 px-4 lg:px-6 py-3 border-b border-[#c9a227]/15 shrink-0 overflow-x-auto">
        <div className="relative shrink-0">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search players..."
            className="bg-[#0d1e3a] border border-[#c9a227]/20 rounded-lg pl-7 pr-3 py-1.5 text-white text-xs focus:outline-none focus:border-[#c9a227]/40 placeholder-white/20 w-40" />
        </div>
        {['all', 'available', 'sold', 'unsold', 'resold'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors whitespace-nowrap ${filter === f ? 'bg-[#c9a227]/15 text-[#c9a227] border border-[#c9a227]/20' : 'text-white/30 hover:text-white/60 bg-[#0d1e3a] border border-[#c9a227]/10'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden p-4 lg:p-6">
        <div className="h-full border border-[#c9a227]/20 rounded-xl overflow-hidden bg-[#060f1e] flex flex-col">
          <div className="flex items-center gap-1.5 px-3 py-2 bg-[#0a1628] border-b border-[#c9a227]/15 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#c9a227]/20" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#c9a227]/20" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#c9a227]/20" />
            <span className="ml-2 text-white/20 text-xs">players · {filtered.length} of {players.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-40"><Spinner size="lg" /></div>
            ) : (
              <>
                {/* Mobile list */}
                <div className="lg:hidden divide-y divide-[#c9a227]/10">
                  {filtered.map(p => (
                    <div key={p._id} className="flex items-center gap-3 px-4 py-3">
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-[#0d1e3a] border border-[#c9a227]/15 shrink-0">
                        <PlayerPhoto src={p.photo} alt={p.name} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-medium truncate">{p.name}</div>
                        <div className="flex gap-1 mt-0.5 flex-wrap">{displaySkills(p.skills).slice(0, 2).map(s => <SkillBadge key={s} skill={s} />)}</div>
                        <div className="text-white/30 text-xs mt-0.5 capitalize">
                          {p.status}{p.soldTo?.name ? ` · ${p.soldTo.name}` : ''}{p.soldPrice ? ` · ${p.soldPrice}pts` : ''}
                        </div>
                      </div>
                      <div className="flex gap-3 shrink-0">
                        <button onClick={() => handleEdit(p)} className="text-white/30 hover:text-white text-xs">Edit</button>
                        <button onClick={() => setDeleteConfirm(p._id)} className="text-white/20 hover:text-white/60 text-xs">Del</button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-sm min-w-[600px]">
                    <thead className="sticky top-0 bg-[#0a1628] z-10">
                      <tr className="border-b border-[#c9a227]/15">
                        <th className="text-left px-6 py-3 text-white/40 text-xs uppercase tracking-wider font-medium">Name</th>
                        <th className="text-left px-4 py-3 text-white/40 text-xs uppercase tracking-wider font-medium">Skills</th>
                        <th className="text-left px-4 py-3 text-white/40 text-xs uppercase tracking-wider font-medium">Gender</th>
                        <th className="text-left px-4 py-3 text-white/40 text-xs uppercase tracking-wider font-medium">Base</th>
                        <th className="text-left px-4 py-3 text-white/40 text-xs uppercase tracking-wider font-medium">Status</th>
                        <th className="text-left px-4 py-3 text-white/40 text-xs uppercase tracking-wider font-medium">Team</th>
                        <th className="text-left px-4 py-3 text-white/40 text-xs uppercase tracking-wider font-medium">Price</th>
                        <th className="text-right px-6 py-3 text-white/40 text-xs uppercase tracking-wider font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(p => (
                        <tr key={p._id} className="border-b border-[#c9a227]/8 hover:bg-[#c9a227]/5 transition-colors">
                          <td className="px-6 py-3 text-white font-medium">
                            <div className="flex items-center gap-2">
                              {p.isMysteryPlayer && <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase bg-purple-500/20 text-purple-400 border border-purple-500/30">Mystery</span>}
                              {p.name}
                            </div>
                          </td>
                          <td className="px-4 py-3"><div className="flex flex-wrap gap-1">{displaySkills(p.skills).map(s => <SkillBadge key={s} skill={s} />)}</div></td>
                          <td className="px-4 py-3">
                            {p.gender && <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${p.gender === 'Female' ? 'bg-pink-500/20 text-pink-400' : 'bg-blue-500/20 text-blue-400'}`}>{p.gender}</span>}
                          </td>
                          <td className="px-4 py-3 text-white/40">{p.basePrice}</td>
                          <td className="px-4 py-3 text-white/50 capitalize">{p.status}</td>
                          <td className="px-4 py-3 text-white/30">{p.soldTo?.name || '—'}</td>
                          <td className="px-4 py-3 text-white/50">{p.soldPrice || '—'}</td>
                          <td className="px-6 py-3 text-right space-x-4">
                            <button onClick={() => handleEdit(p)} className="text-white/30 hover:text-white text-xs">Edit</button>
                            <button onClick={() => setDeleteConfirm(p._id)} className="text-white/20 hover:text-white/60 text-xs">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            {!loading && filtered.length === 0 && (
              <p className="text-center text-white/30 py-16 text-sm">No players found</p>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-[#0d1e3a] border border-[#c9a227]/20 rounded-t-2xl sm:rounded-2xl p-5 w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-semibold text-white mb-4">{editId ? 'Edit Player' : 'Add Player'}</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#c9a227]/50 uppercase tracking-wider mb-1.5 block">Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-[#0a1628] border border-[#c9a227]/20 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#c9a227]/50" />
              </div>
              <div>
                <label className="text-xs text-[#c9a227]/50 uppercase tracking-wider mb-1.5 block">Photo</label>
                <PhotoUpload value={form.photo} onChange={url => setForm(f => ({ ...f, photo: url }))} token={token} toast={toast} />
              </div>
              <div>
                <label className="text-xs text-[#c9a227]/50 uppercase tracking-wider mb-2 block">Skills</label>
                <div className="flex flex-wrap gap-2">
                  {SKILLS.map(s => (
                    <button key={s} type="button" onClick={() => toggleSkill(s)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${form.skills.filter(x => x !== 'All-rounder').includes(s) ? 'bg-[#c9a227]/20 text-[#c9a227] border border-[#c9a227]/30' : 'bg-[#0a1628] text-white/30 border border-[#c9a227]/10 hover:text-white/60'}`}>
                      <span className={`w-3 h-3 rounded border flex items-center justify-center shrink-0 ${form.skills.filter(x => x !== 'All-rounder').includes(s) ? 'bg-[#c9a227] border-[#c9a227]' : 'border-white/20'}`}>
                        {form.skills.filter(x => x !== 'All-rounder').includes(s) && <svg className="w-2 h-2 text-[#0a1628]" fill="currentColor" viewBox="0 0 12 12"><path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>}
                      </span>
                      {s}
                    </button>
                  ))}
                </div>
                {form.skills.includes('All-rounder') && (
                  <p className="text-[#c9a227]/50 text-xs mt-1.5">✓ Auto-marked as All-rounder</p>
                )}
              </div>
              <div>
                <label className="text-xs text-[#c9a227]/50 uppercase tracking-wider mb-2 block">Gender</label>
                <div className="flex gap-2">
                  {['Male', 'Female'].map(g => (
                    <button key={g} type="button" onClick={() => setForm(f => ({ ...f, gender: g }))}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors border ${form.gender === g ? 'bg-[#c9a227]/20 text-[#c9a227] border-[#c9a227]/30' : 'bg-[#0a1628] text-white/30 border-[#c9a227]/10 hover:text-white/60'}`}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#c9a227]/50 uppercase tracking-wider mb-1.5 block">Base Price</label>
                <input type="number" value={form.basePrice} onChange={e => setForm(f => ({ ...f, basePrice: Number(e.target.value) }))}
                  className="w-full bg-[#0a1628] border border-[#c9a227]/20 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#c9a227]/50" />
              </div>

              {/* Status — only shown when editing */}
              {editId && (
                <div>
                  <label className="text-xs text-[#c9a227]/50 uppercase tracking-wider mb-2 block">Status</label>
                  <div className="grid grid-cols-2 gap-2">
                    {STATUSES.map(s => (
                      <button key={s} type="button" onClick={() => setForm(f => ({ ...f, status: s }))}
                        className={`py-2 rounded-lg text-xs font-semibold capitalize border transition-colors ${form.status === s ? STATUS_COLORS[s] : 'bg-[#0a1628] text-white/30 border-white/10 hover:text-white/50'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Mystery Player Toggle */}
              <div className="border-t border-[#c9a227]/10 pt-4">
                <button type="button" onClick={() => setForm(f => ({ ...f, isMysteryPlayer: !f.isMysteryPlayer }))}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${form.isMysteryPlayer ? 'bg-purple-500/15 border-purple-500/40 text-purple-300' : 'bg-[#0a1628] border-[#c9a227]/15 text-white/40 hover:text-white/60'}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎭</span>
                    <div className="text-left">
                      <p className="text-sm font-semibold">Mystery Player</p>
                      <p className="text-xs opacity-60">Hide identity during auction</p>
                    </div>
                  </div>
                  <div className={`w-10 h-5 rounded-full transition-colors relative ${form.isMysteryPlayer ? 'bg-purple-500' : 'bg-white/10'}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${form.isMysteryPlayer ? 'left-5' : 'left-0.5'}`} />
                  </div>
                </button>
              </div>

              {/* Mystery Config — only shown when isMysteryPlayer is true */}
              {form.isMysteryPlayer && (
                <div className="bg-purple-500/8 border border-purple-500/20 rounded-xl p-4">
                  <div>
                    <label className="text-xs text-white/30 mb-1.5 block">Role Hint</label>
                    <RoleSelect
                      value={form.mysteryConfig.roleHint}
                      onChange={v => setForm(f => ({ ...f, mysteryConfig: { ...f.mysteryConfig, roleHint: v } }))}
                    />
                    <p className="text-white/20 text-[10px] mt-1">Shown to captains as a clue during bidding</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowForm(false); setEditId(null); }}
                className="flex-1 bg-[#0a1628] border border-[#c9a227]/15 text-white/50 py-2.5 rounded-lg text-sm hover:text-white transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 bg-[#c9a227] text-[#0a1628] font-bold py-2.5 rounded-lg text-sm hover:bg-[#f0c040] disabled:opacity-40 flex items-center justify-center gap-2">
                {saving ? <Spinner size="sm" /> : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Confirm Modal */}
      {deleteAllConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d1e3a] border border-red-500/30 rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold text-white mb-2">Delete ALL Players?</h2>
            <p className="text-white/50 text-sm mb-6">This will permanently delete all players from the database and reset all team squads. This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteAllConfirm(false)}
                className="flex-1 bg-[#0a1628] border border-[#c9a227]/15 text-white/50 py-2.5 rounded-lg text-sm hover:text-white transition-colors">
                Cancel
              </button>
              <button onClick={confirmDeleteAll}
                className="flex-1 bg-red-600 text-white font-bold py-2.5 rounded-lg text-sm hover:bg-red-500 transition-colors">
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d1e3a] border border-[#c9a227]/20 rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold text-white mb-2">Delete this player?</h2>
            <p className="text-white/50 text-sm mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-[#0a1628] border border-[#c9a227]/15 text-white/50 py-2.5 rounded-lg text-sm hover:text-white transition-colors">
                Cancel
              </button>
              <button onClick={confirmDelete}
                className="flex-1 bg-red-600/90 text-white font-medium py-2.5 rounded-lg text-sm hover:bg-red-600 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
