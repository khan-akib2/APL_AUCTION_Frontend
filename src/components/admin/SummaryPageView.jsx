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
    const green = [13, 58, 36];
    const gold = [197, 155, 39];
    const W = doc.internal.pageSize.getWidth();

    doc.setFillColor(...green);
    doc.rect(0, 0, W, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`APL ${sportLabel.toUpperCase()} AUCTION — FINAL SUMMARY`, W / 2, 12, { align: 'center' });
    doc.setFontSize(9);
    doc.setTextColor(...gold);
    doc.text(`Generated: ${new Date().toLocaleString()}`, W / 2, 20, { align: 'center' });

    let y = 34;

    teams.forEach((team, idx) => {
      if (y > 260) { doc.addPage(); y = 14; }
      doc.setFillColor(244, 239, 230);
      doc.roundedRect(10, y, W - 20, 10, 2, 2, 'F');
      doc.setTextColor(...green);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`${idx + 1}. ${team.name}`, 14, y + 6.5);
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Captain: ${team.captainId?.name || 'N/A'}   |   Budget left: ${team.budget} pts   |   Spent: ${team.pointsSpent} pts   |   Players: ${team.playerCount || 0}/${team.teamSize || 7}`,
        W - 14, y + 6.5, { align: 'right' }
      );
      y += 13;

      const rows = (team.players || []).map((p, i) => [
        i + 1, p.name, p.skills?.join(', ') || '—', `${p.soldPrice} pts`,
      ]);
      const maxSquad = team.teamSize || 7;
      for (let i = rows.length; i < maxSquad; i++) rows.push([i + 1, '— Empty slot —', '', '']);

      autoTable(doc, {
        startY: y,
        head: [['#', 'Player', 'Skills', 'Price']],
        body: rows,
        margin: { left: 10, right: 10 },
        styles: { fontSize: 8, cellPadding: 2.5, textColor: [30, 30, 30], fillColor: [255, 255, 255] },
        headStyles: { fillColor: green, textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 246, 240] },
        columnStyles: { 0: { cellWidth: 8 }, 3: { cellWidth: 22, halign: 'right' } },
        theme: 'grid',
        tableLineColor: [232, 226, 213],
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

  if (loading) return (
    <div className="flex items-center justify-center h-64 bg-[#f8f6f0]">
      <Spinner size="lg" />
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-[#f8f6f0] min-h-screen text-[#111827]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-serif text-[#111827] flex items-center gap-2">
            {isFootball ? <FootballIcon className="w-6 h-6 text-[#0d3a24]" /> : <CricketIcon className="w-6 h-6 text-[#c59b27]" />}
            <span>{sportLabel} Final Summary</span>
          </h1>
          <p className="text-[#6b7280] text-xs mt-1">Complete squad rosters, spend totals, and budget breakdown</p>
        </div>
        <button
          onClick={() => downloadPDF(teams, sportLabel)}
          className="text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 bg-[#0d3a24] hover:bg-[#154d32] text-white shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export Official PDF
        </button>
      </div>

      {teams.length === 0 ? (
        <div className="bg-white border border-[#e8e2d5] rounded-3xl p-12 text-center text-[#9ca3af] text-sm shadow-sm">
          No {sportLabel.toLowerCase()} teams registered yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {teams.map(team => (
            <div key={team._id} className="bg-white border border-[#e8e2d5] rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-4 pb-3 border-b border-gray-100">
                <div>
                  <h2 className="text-lg font-bold font-serif text-[#111827]">{team.name}</h2>
                  <p className="text-[#0d3a24] text-xs font-semibold mt-0.5">Captain: {team.captainId?.name || '—'}</p>
                </div>
                <div className="text-right">
                  <div className="text-[#c59b27] font-black text-lg tabular-nums">
                    {team.budget} <span className="text-xs font-normal text-[#6b7280]">pts left</span>
                  </div>
                  <div className="text-[#6b7280] text-xs mt-0.5">{team.pointsSpent} pts spent · {team.playerCount || 0}/{team.teamSize || 7}</div>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {(team.players || []).length === 0 && (
                  <p className="text-[#9ca3af] text-xs text-center py-4">No players signed yet</p>
                )}
                {(team.players || []).map((p, i) => (
                  <div key={p._id} className="py-2.5 flex items-center justify-between text-xs hover:bg-[#faf8f5] px-2 rounded-lg transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-[#9ca3af] font-mono w-4 font-bold">{i + 1}</span>
                      <span className="text-[#111827] font-semibold truncate">{p.name}</span>
                      <span className="text-[#6b7280] text-[11px] truncate">{p.skills?.join(', ')}</span>
                    </div>
                    <span className="text-[#0d3a24] font-black tabular-nums shrink-0">{p.soldPrice} pts</span>
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
