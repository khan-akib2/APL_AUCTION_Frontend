'use client';
import { useEffect, useState, useCallback } from 'react';
import { useApi } from '@/hooks/useApi';
import Spinner from '@/components/Spinner';

function downloadPDF(teams) {
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
    doc.text('APL AUCTION — FINAL SUMMARY', W / 2, 12, { align: 'center' });
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

    doc.save(`APL_Auction_Summary_${new Date().toISOString().slice(0, 10)}.pdf`);
  });
}

export default function SummaryPage() {
  const { request } = useApi();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await request('/api/summary');
    if (res) setTeams(res.teams || []);
    setLoading(false);
  }, [request]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="flex flex-col min-h-screen lg:h-[calc(100vh-48px)]">
      <div className="px-4 lg:px-6 py-4 border-b border-[#c9a227]/15 shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-white">Final Summary</h1>
          <p className="text-white/40 text-xs mt-0.5">All teams and their squads</p>
        </div>
        <button
          onClick={() => downloadPDF(teams)}
          disabled={teams.length === 0}
          className="flex items-center gap-2 bg-[#c9a227] hover:bg-[#f0c040] text-[#0a1628] text-xs font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-40">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          Download PDF
        </button>
      </div>
      <div className="flex-1 overflow-hidden p-4 lg:p-6">
        <div className="h-full border border-[#c9a227]/20 rounded-xl overflow-hidden bg-[#060f1e]">
          <div className="flex items-center gap-1.5 px-3 py-2 bg-[#0a1628] border-b border-[#c9a227]/15">
            <span className="w-2.5 h-2.5 rounded-full bg-[#c9a227]/20" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#c9a227]/20" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#c9a227]/20" />
            <span className="ml-2 text-white/20 text-xs">summary · {teams.length} teams</span>
          </div>
          <div className="overflow-y-auto h-[calc(100%-36px)] p-3 space-y-3">
            {teams.map(team => (
              <div key={team._id} className="bg-[#0d1e3a] border border-[#c9a227]/15 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#c9a227]/15">
                  <div>
                    <h2 className="text-sm font-semibold text-white">{team.name}</h2>
                    <p className="text-white/40 text-xs mt-0.5">Captain: {team.captainId?.name || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-[#c9a227] text-sm font-medium">{team.budget} pts left</div>
                    <div className="text-white/40 text-xs">{team.playerCount}/7 · {team.pointsSpent} spent</div>
                  </div>
                </div>
                <div className="p-3 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                  {team.players?.map(p => (
                    <div key={p._id} className="bg-[#0a1628] border border-[#c9a227]/10 rounded-lg p-2 text-center">
                      <div className="text-white/70 text-xs font-medium leading-tight">{p.name}</div>
                      <div className="text-[#c9a227]/60 text-xs mt-1">{p.soldPrice}pts</div>
                    </div>
                  ))}
                  {Array.from({ length: Math.max(0, 7 - (team.players?.length || 0)) }).map((_, i) => (
                    <div key={i} className="border border-dashed border-[#c9a227]/10 rounded-lg p-2 flex items-center justify-center">
                      <span className="text-white/15 text-xs">—</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
