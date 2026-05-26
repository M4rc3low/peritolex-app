import React, { useState } from 'react';
import { peritolexApi } from '@/api/peritolexClient';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileDown, Loader2, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { jsPDF } from 'jspdf';

const STATUS_LABELS = {
  em_andamento: 'Em Andamento', aguardando_pericia: 'Aguard. PerÃ­cia',
  pericia_realizada: 'PerÃ­cia Realizada', laudo_entregue: 'Laudo Entregue',
  encerrado: 'Encerrado', suspenso: 'Suspenso',
};

const TIPO_DEADLINE = {
  entrega_laudo: 'Entrega Laudo', manifestacao: 'ManifestaÃ§Ã£o',
  diligencia: 'DiligÃªncia', audiencia: 'AudiÃªncia',
  levantamento_honorarios: 'Levant. HonorÃ¡rios', outro: 'Outro',
};

export default function MonthlyReport({ open, onClose }) {
  const [refDate, setRefDate] = useState(new Date());
  const [generating, setGenerating] = useState(false);

  const monthStart = startOfMonth(refDate);
  const monthEnd = endOfMonth(refDate);
  const monthLabel = format(refDate, 'MMMM yyyy', { locale: ptBR });

  const { data: processes = [] } = useQuery({
    queryKey: ['processes'],
    queryFn: () => peritolexApi.entities.Process.list('-created_date', 200),
  });
  const { data: deadlines = [] } = useQuery({
    queryKey: ['deadlines'],
    queryFn: () => peritolexApi.entities.Deadline.list('-data_prazo', 500),
  });
  const { data: movements = [] } = useQuery({
    queryKey: ['movements-all'],
    queryFn: () => peritolexApi.entities.ProcessMovement.list('-data_movimento', 500),
  });

  // Filter by month
  const inMonth = (dateStr) => {
    if (!dateStr) return false;
    try {
      return isWithinInterval(parseISO(dateStr), { start: monthStart, end: monthEnd });
    } catch { return false; }
  };

  const monthDeadlines = deadlines.filter(d => inMonth(d.data_prazo));
  const monthMovements = movements.filter(m => inMonth(m.data_movimento));
  const activeProcesses = processes.filter(p => !['encerrado', 'suspenso'].includes(p.status));
  const completedThisMonth = processes.filter(p => p.status === 'laudo_entregue');
  const totalHonorarios = processes.reduce((s, p) => s + (p.honorarios || 0), 0);

  const navMonth = (dir) => {
    const d = new Date(refDate);
    d.setMonth(d.getMonth() + dir);
    setRefDate(d);
  };

  const generatePDF = async () => {
    setGenerating(true);
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210;
    const margin = 18;
    let y = 0;

    const addPage = () => { doc.addPage(); y = 20; };
    const checkPage = (needed = 15) => { if (y + needed > 280) addPage(); };

    // â”€â”€â”€ Capa â”€â”€â”€
    doc.setFillColor(30, 58, 95);
    doc.rect(0, 0, W, 60, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('RelatÃ³rio Mensal Pericial', W / 2, 25, { align: 'center' });
    doc.setFontSize(13);
    doc.setFont('helvetica', 'normal');
    doc.text(monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1), W / 2, 38, { align: 'center' });
    doc.setFontSize(9);
    doc.text(`Gerado em ${format(new Date(), "dd/MM/yyyy 'Ã s' HH:mm")}`, W / 2, 50, { align: 'center' });

    // â”€â”€â”€ SumÃ¡rio Executivo â”€â”€â”€
    y = 75;
    doc.setTextColor(30, 58, 95);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('1. SumÃ¡rio Executivo', margin, y); y += 8;
    doc.setDrawColor(212, 160, 23);
    doc.setLineWidth(0.5);
    doc.line(margin, y, W - margin, y); y += 7;

    const stats = [
      ['Total de Processos', processes.length.toString()],
      ['Processos Ativos', activeProcesses.length.toString()],
      ['Laudos Entregues', completedThisMonth.length.toString()],
      ['Prazos no MÃªs', monthDeadlines.length.toString()],
      ['Movimentos Registrados', monthMovements.length.toString()],
      ['HonorÃ¡rios Totais', `R$ ${totalHonorarios.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
    ];

    doc.setFontSize(9);
    stats.forEach(([label, value], i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = margin + col * 87;
      const yy = y + row * 14;
      doc.setFillColor(247, 248, 250);
      doc.roundedRect(x, yy, 84, 11, 2, 2, 'F');
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.text(label, x + 4, yy + 4.5);
      doc.setTextColor(30, 58, 95);
      doc.setFont('helvetica', 'bold');
      doc.text(value, x + 4, yy + 9);
    });
    y += Math.ceil(stats.length / 2) * 14 + 10;

    // â”€â”€â”€ Processos por Status â”€â”€â”€
    checkPage(20);
    doc.setTextColor(30, 58, 95);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('2. Processos por Status', margin, y); y += 8;
    doc.setDrawColor(212, 160, 23);
    doc.line(margin, y, W - margin, y); y += 6;

    const byStatus = {};
    processes.forEach(p => { byStatus[p.status] = (byStatus[p.status] || 0) + 1; });
    Object.entries(byStatus).forEach(([status, count]) => {
      checkPage(8);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      doc.text(`${STATUS_LABELS[status] || status}:`, margin + 2, y);
      doc.setFont('helvetica', 'bold');
      doc.text(count.toString(), margin + 60, y);
      y += 7;
    });
    y += 4;

    // â”€â”€â”€ Prazos do MÃªs â”€â”€â”€
    checkPage(20);
    doc.setTextColor(30, 58, 95);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`3. Prazos de ${monthLabel}`, margin, y); y += 8;
    doc.setDrawColor(212, 160, 23);
    doc.line(margin, y, W - margin, y); y += 6;

    if (monthDeadlines.length === 0) {
      doc.setFontSize(9); doc.setTextColor(100, 116, 139); doc.setFont('helvetica', 'italic');
      doc.text('Nenhum prazo neste mÃªs.', margin + 2, y); y += 10;
    } else {
      // Table header
      doc.setFillColor(30, 58, 95);
      doc.rect(margin, y, W - margin * 2, 7, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('Prazo', margin + 2, y + 4.5);
      doc.text('Tipo', margin + 70, y + 4.5);
      doc.text('Vencimento', margin + 115, y + 4.5);
      doc.text('Status', margin + 150, y + 4.5);
      y += 7;

      monthDeadlines.sort((a, b) => a.data_prazo.localeCompare(b.data_prazo))
        .forEach((d, idx) => {
          checkPage(7);
          if (idx % 2 === 0) { doc.setFillColor(247, 248, 250); doc.rect(margin, y, W - margin * 2, 6.5, 'F'); }
          doc.setTextColor(40, 40, 40);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          const titulo = d.titulo?.length > 30 ? d.titulo.slice(0, 28) + 'â€¦' : (d.titulo || '-');
          doc.text(titulo, margin + 2, y + 4.2);
          doc.text(TIPO_DEADLINE[d.tipo] || d.tipo || '-', margin + 70, y + 4.2);
          doc.text(d.data_prazo ? format(parseISO(d.data_prazo), 'dd/MM/yyyy') : '-', margin + 115, y + 4.2);
          doc.setTextColor(d.status === 'atrasado' ? 180 : 60, d.status === 'concluido' ? 140 : 60, 60);
          doc.text(d.status || '-', margin + 150, y + 4.2);
          y += 6.5;
        });
      y += 6;
    }

    // â”€â”€â”€ Movimentos â”€â”€â”€
    checkPage(20);
    doc.setTextColor(30, 58, 95);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`4. Andamentos Registrados (${monthMovements.length})`, margin, y); y += 8;
    doc.setDrawColor(212, 160, 23);
    doc.line(margin, y, W - margin, y); y += 6;

    if (monthMovements.length === 0) {
      doc.setFontSize(9); doc.setTextColor(100, 116, 139); doc.setFont('helvetica', 'italic');
      doc.text('Nenhum andamento no mÃªs.', margin + 2, y); y += 10;
    } else {
      monthMovements.slice(0, 30).forEach((m, idx) => {
        checkPage(10);
        if (idx % 2 === 0) { doc.setFillColor(247, 248, 250); doc.rect(margin, y, W - margin * 2, 9, 'F'); }
        doc.setTextColor(40, 40, 40);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(m.numero_processo || '-', margin + 2, y + 3.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        const desc = m.descricao?.length > 90 ? m.descricao.slice(0, 88) + 'â€¦' : (m.descricao || '-');
        doc.text(desc, margin + 2, y + 7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(m.data_movimento ? format(parseISO(m.data_movimento), 'dd/MM/yyyy') : '-', W - margin - 18, y + 3.5);
        y += 9;
      });
      if (monthMovements.length > 30) {
        doc.setFontSize(8); doc.setTextColor(100, 116, 139);
        doc.text(`... e mais ${monthMovements.length - 30} andamentos.`, margin + 2, y + 5); y += 10;
      }
      y += 4;
    }

    // â”€â”€â”€ RodapÃ© em todas as pÃ¡ginas â”€â”€â”€
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(margin, 287, W - margin, 287);
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.setFont('helvetica', 'normal');
      doc.text('Sistema de GestÃ£o Pericial', margin, 291);
      doc.text(`PÃ¡gina ${i} de ${pageCount}`, W - margin, 291, { align: 'right' });
    }

    const filename = `relatorio-pericial-${format(refDate, 'yyyy-MM')}.pdf`;
    doc.save(filename);
    setGenerating(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <FileDown className="w-5 h-5 text-primary" /> RelatÃ³rio Mensal
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Month selector */}
          <div className="flex items-center justify-between bg-muted/50 rounded-xl px-4 py-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navMonth(-1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold capitalize text-sm">{monthLabel}</span>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navMonth(1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Preview stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Processos Ativos', value: activeProcesses.length },
              { label: 'Prazos no MÃªs', value: monthDeadlines.length },
              { label: 'Andamentos', value: monthMovements.length },
              { label: 'Laudos Entregues', value: completedThisMonth.length },
            ].map(({ label, value }) => (
              <div key={label} className="bg-muted/40 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-primary">{value}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
            O PDF incluirÃ¡ sumÃ¡rio executivo, processos por status, todos os prazos e andamentos do mÃªs selecionado.
          </p>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button className="flex-1 gap-2" onClick={generatePDF} disabled={generating}>
              {generating
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando...</>
                : <><FileDown className="w-4 h-4" /> Gerar PDF</>}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
