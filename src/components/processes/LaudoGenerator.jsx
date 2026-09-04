import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download, Pencil, Eye, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DEFAULT_TEMPLATE = `# LAUDO PERICIAL CONTÃBIL

**Processo nÂº:** {{numero_processo}}
**Vara:** {{vara}}
**Comarca:** {{comarca}}

---

## I â€“ IDENTIFICAÃ‡ÃƒO DAS PARTES

**Autor:** {{autor}}
**RÃ©u:** {{reu}}
**Advogado do Autor:** {{advogado_autor}}
**Advogado do RÃ©u:** {{advogado_reu}}

---

## II â€“ OBJETO DA PERÃCIA

{{objeto_pericia}}

---

## III â€“ QUESITOS DO AUTOR

{{quesitos_autor}}

---

## IV â€“ QUESITOS DO RÃ‰U

{{quesitos_reu}}

---

## V â€“ QUESITOS DO JUÃZO

{{quesitos_juiz}}

---

## VI â€“ DOCUMENTOS ANALISADOS

O perito examinou os documentos e elementos probatÃ³rios constantes dos autos, procedendo Ã  anÃ¡lise contÃ¡bil pertinente ao objeto da perÃ­cia.

---

## VII â€“ ANÃLISE PERICIAL

*(Preencha aqui a anÃ¡lise tÃ©cnica detalhada)*

---

## VIII â€“ CONCLUSÃƒO

Com base nos exames e anÃ¡lises realizados, o Perito Contador conclui:

*(Preencha aqui as conclusÃµes periciais)*

---

**Local e Data:** _________________________, {{data_laudo}}

**Perito Contador**
*(assinatura)*
`;

function applyTemplate(template, process) {
  const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const vars = {
    numero_processo: process.numero_processo || '',
    vara: process.vara || '',
    comarca: process.comarca || '',
    tipo_acao: process.tipo_acao || '',
    autor: process.autor || '',
    reu: process.reu || '',
    advogado_autor: process.advogado_autor || '',
    advogado_reu: process.advogado_reu || '',
    objeto_pericia: process.objeto_pericia || '(nÃ£o informado)',
    quesitos_autor: process.quesitos_autor || '(nÃ£o informado)',
    quesitos_reu: process.quesitos_reu || '(nÃ£o informado)',
    quesitos_juiz: process.quesitos_juiz || '(nÃ£o informado)',
    observacoes: process.observacoes || '',
    honorarios: process.honorarios ? `R$ ${process.honorarios.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '',
    data_distribuicao: process.data_distribuicao ? format(new Date(process.data_distribuicao), 'dd/MM/yyyy') : '',
    data_nomeacao: process.data_nomeacao ? format(new Date(process.data_nomeacao), 'dd/MM/yyyy') : '',
    data_laudo: today,
  };

  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
}

function markdownToHtml(md) {
  return md
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold mt-4 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold mt-6 mb-2 border-b pb-1">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mb-4 text-center">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^---$/gm, '<hr class="my-4 border-gray-300" />')
    .replace(/^(.+)$/gm, (line) => {
      if (line.startsWith('<')) return line;
      if (line.trim() === '') return '<br />';
      return `<p class="my-1 text-sm leading-relaxed">${line}</p>`;
    });
}

export default function LaudoGenerator({ open, onClose, process }) {
  const [tab, setTab] = useState('preview');
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingWord, setLoadingWord] = useState(false);

  const content = applyTemplate(template, process || {});

  const handleDownloadPdf = async () => {
    setLoadingPdf(true);
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    const lines = content.split('\n');
    let y = 20;
    const margin = 20;
    const pageWidth = 210 - margin * 2;
    const pageHeight = 297 - 20;

    const addPage = () => { doc.addPage(); y = 20; };

    for (const rawLine of lines) {
      if (y > pageHeight - 10) addPage();

      const line = rawLine.trim();
      if (!line) { y += 4; continue; }
      if (line.startsWith('---')) { doc.setDrawColor(180); doc.line(margin, y, 210 - margin, y); y += 6; continue; }

      if (line.startsWith('# ')) {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
        const text = line.slice(2);
        doc.text(text, 105, y, { align: 'center' }); y += 10;
      } else if (line.startsWith('## ')) {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
        const text = line.slice(3);
        const wrapped = doc.splitTextToSize(text, pageWidth);
        doc.text(wrapped, margin, y); y += wrapped.length * 6 + 2;
      } else if (line.startsWith('### ')) {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
        const text = line.slice(4);
        doc.text(text, margin, y); y += 7;
      } else {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
        const text = line.replace(/\*\*(.+?)\*\*/g, '$1');
        const wrapped = doc.splitTextToSize(text, pageWidth);
        doc.text(wrapped, margin, y); y += wrapped.length * 5 + 1;
      }
    }

    const filename = `Laudo_${(process?.numero_processo || 'pericial').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    doc.save(filename);
    setLoadingPdf(false);
  };

  const handleDownloadWord = () => {
    setLoadingWord(true);
    // Gera um arquivo .doc simples (HTML dentro de doc wrapper)
    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office'
            xmlns:w='urn:schemas-microsoft-com:office:word'
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Laudo Pericial</title>
      <style>
        body { font-family: 'Times New Roman', serif; font-size: 12pt; margin: 2.5cm; }
        h1 { text-align: center; font-size: 16pt; }
        h2 { font-size: 13pt; border-bottom: 1px solid #999; padding-bottom: 4px; margin-top: 20px; }
        h3 { font-size: 12pt; margin-top: 14px; }
        p { margin: 4px 0; line-height: 1.6; }
        hr { border: none; border-top: 1px solid #999; margin: 12px 0; }
        strong { font-weight: bold; }
      </style>
      </head><body>
      ${markdownToHtml(content)}
      </body></html>`;

    const blob = new Blob([html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Laudo_${(process?.numero_processo || 'pericial').replace(/[^a-zA-Z0-9]/g, '_')}.doc`;
    a.click();
    URL.revokeObjectURL(url);
    setLoadingWord(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Gerar Laudo Pericial
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Processo nÂº {process?.numero_processo} Â· Use {'{{'}variavel{'}}'}  para inserir dados automaticamente
          </p>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between flex-shrink-0">
            <TabsList>
              <TabsTrigger value="preview" className="gap-1.5 text-xs"><Eye className="w-3.5 h-3.5" /> Visualizar</TabsTrigger>
              <TabsTrigger value="template" className="gap-1.5 text-xs"><Pencil className="w-3.5 h-3.5" /> Editar Template</TabsTrigger>
            </TabsList>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleDownloadWord} disabled={loadingWord} className="gap-1.5 text-xs">
                {loadingWord ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                Word (.doc)
              </Button>
              <Button size="sm" onClick={handleDownloadPdf} disabled={loadingPdf} className="gap-1.5 text-xs">
                {loadingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                PDF
              </Button>
            </div>
          </div>

          <TabsContent value="preview" className="flex-1 min-h-0 mt-3">
            <div className="h-full overflow-y-auto border border-border rounded-xl bg-white p-8 shadow-inner">
              <div
                className="max-w-2xl mx-auto prose prose-sm"
                dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }}
              />
            </div>
          </TabsContent>

          <TabsContent value="template" className="flex-1 min-h-0 mt-3 flex flex-col gap-2">
            <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 flex flex-wrap gap-x-4 gap-y-1">
              <span className="font-medium text-foreground">VariÃ¡veis disponÃ­veis:</span>
              {['numero_processo','vara','comarca','autor','reu','advogado_autor','advogado_reu',
                'objeto_pericia','quesitos_autor','quesitos_reu','quesitos_juiz',
                'honorarios','data_distribuicao','data_nomeacao','data_laudo'].map(v => (
                <code key={v} className="bg-card border border-border rounded px-1 text-[10px]">{`{{${v}}}`}</code>
              ))}
            </div>
            <textarea
              value={template}
              onChange={e => setTemplate(e.target.value)}
              className="flex-1 w-full font-mono text-xs border border-input rounded-xl p-4 resize-none focus:outline-none focus:ring-1 focus:ring-ring bg-background"
              spellCheck={false}
            />
            <Button
              variant="outline"
              size="sm"
              className="self-start text-xs"
              onClick={() => setTemplate(DEFAULT_TEMPLATE)}
            >
              Restaurar template padrÃ£o
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
