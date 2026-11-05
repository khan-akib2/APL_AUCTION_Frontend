'use client';
import { useEffect, useState, useCallback } from 'react';
import { useApi } from '@/hooks/useApi';
import Spinner from '@/components/Spinner';
import { CricketIcon, FootballIcon } from '@/components/SportIcons';

function downloadPDF(teams, sportLabel) {
  Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]).then(([{ default: jsPDF }, { default: autoTable }]) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const gold = [201, 162, 39];
    const dark = [10, 22, 40];
    const W = doc.internal.pageSize.getWidth();

    doc.setFillColor(...dark);
    doc.rect(0, 0, W, 28, 'F');
    doc.setTextColor(...gold);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`APL ${sportLabel.toUpperCase()} AUCTION — FINAL SUMMARY`, W / 2, 12, { align: 'center' });
    doc.setFontSize(9);
    doc.setTextColor(180, 180, 180);
    doc.text(`Generated: ${new Date().toLocaleString()}`, W / 2, 20, { align: 'center' });

    let y = 34;

    teams.forEach((team, idx) => {
      if (y > 260) { doc.addPage(); y = 14; }
      doc.setFillColor(13, 30, 58);
      doc.roundedRect(10, y, W - 20, 10, 2, 2, 'F');
      doc.setTextColor(...gold);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`${idx + 1}. ${team.name}`, 14, y + 6.5);
      doc.setTextColor(180, 180, 180);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Captain: ${team.captainId?.name || 'N/A'}   |   Budget left: ${team.budget} pts   |   Spent: ${team.pointsSpent} pts   |   Players: ${team.playerCount}/7`,
        W - 14, y + 6.5, { align: 'right' }
      );
      y += 13;

      const rows = (team.players || []).map((p, i) => [
        i + 1, p.name, p.skills?.join(', ') || '—', `${p.soldPrice} pts`,
      ]);
      for (let i = rows.length; i < 7; i++) rows.push([i + 1, '— Empty slot —', '', '']);

      autoTable(doc, {
        startY: y,
        head: [['#', 'Player', 'Skills', 'Price']],
        body: rows,
        margin: { left: 10, right: 10 },
        styles: { fontSize: 8, cellPadding: 2.5, textColor: [220, 220, 220], fillColor: [6, 15, 30] },
        headStyles: { fillColor: dark, textColor: gold, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [13, 30, 58] },
        columnStyles: { 0: { cellWidth: 8 }, 3: { cellWidth: 22, halign: 'right' } },
        theme: 'grid',
        tableLineColor: [201, 162, 39, 40],
        tableLineWidth: 0.1,
      });

      y = doc.lastAutoTable.finalY + 8;
    });

    doc.save(`APL_${sportLabel}_Auction_Summary_${new Date().toISOString().slice(0, 10)}.pdf`);
  });
}

export default function SummaryPageView({ sport = 'cricket' }) {
  const { request } = useApi();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  const isFootball = sport === 'football';
  const sportLabel = isFootball ? 'Football' : 'Cricket';

  const load = useCallback(async () => {
    const res = await request(`/api/summary?sport=${sport}`);
    if (res) setTeams(res.teams || []);
    setLoading(false);
  }, [request, sport]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="p-4 lg:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-base font-semibold text-white flex items-center gap-2">
            {isFootball ? <FootballIcon className="w-5 h-5 text-emerald-400" /> : <CricketIcon className="w-5 h-5 text-[#c9a227]" />}
            <span>{sportLabel} Final Summary</span>
          </h1>
          <p className="text-white/40 text-xs mt-0.5">Complete squad rosters and budget breakdown</p>
        </div>
        <button
          onClick={() => downloadPDF(teams, sportLabel)}
          className={`text-xs font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${isFootball ? 'bg-emerald-400 text-slate-950 hover:bg-emerald-300 shadow-md shadow-emerald-500/20' : 'bg-[#c9a227] text-[#0a1628] hover:bg-[#f0c040]'}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Export PDF
        </button>
      </div>

      {teams.length === 0 ? (
        <div className="bg-[#0d1e3a] border border-[#c9a227]/20 rounded-2xl p-12 text-center text-white/30 text-sm">
          No {sportLabel.toLowerCase()} teams registered yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {teams.map(team => (
            <div key={team._id} className="bg-[#0d1e3a] border border-[#c9a227]/20 rounded-2xl p-5 shadow-xl">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">{team.name}</h2>
                  <p className="text-[#c9a227] text-xs">Captain: {team.captainId?.name || '—'}</p>
                </div>
                <div className="text-right">
                  <div className="text-[#c9a227] font-black text-lg">{team.budget} <span className="text-xs font-normal text-white/40">pts left</span></div>
                  <div className="text-white/40 text-xs">{team.pointsSpent} pts spent · {team.playerCount}/7</div>
                </div>
              </div>

              <div className="divide-y divide-[#c9a227]/10">
                {(team.players || []).length === 0 && (
                  <p className="text-white/20 text-xs text-center py-4">No players signed</p>
                )}
                {(team.players || []).map((p, i) => (
                  <div key={p._id} className="py-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-white/20 font-mono w-4">{i + 1}</span>
                      <span className="text-white font-medium">{p.name}</span>
                      <span className="text-white/30">{p.skills?.join(', ')}</span>
                    </div>
                    <span className="text-[#c9a227] font-bold">{p.soldPrice} pts</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
