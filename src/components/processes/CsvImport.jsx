import React, { useState, useRef } from 'react';
import { peritolexApi } from '@/api/peritolexClient';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Download, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const CSV_TEMPLATE_HEADERS = [
  'numero_processo', 'vara', 'comarca', 'tipo_acao', 'autor', 'reu',
  'advogado_autor', 'advogado_reu', 'valor_causa', 'honorarios',
  'honorarios_status', 'status', 'data_distribuicao', 'data_nomeacao', 'objeto_pericia', 'observacoes'
];

const CSV_EXAMPLE = [
  '0000000-00.2025.8.26.0100', '1Âª Vara CÃ­vel', 'SÃ£o Paulo/SP', 'AÃ§Ã£o Trabalhista',
  'JoÃ£o Silva', 'Empresa XYZ Ltda', 'Dr. Paulo', 'Dra. Ana',
  '150000', '6000', 'pendente', 'em_andamento', '2025-01-10', '2025-03-01',
  'CÃ¡lculo de verbas rescisÃ³rias', ''
];

function downloadTemplate() {
  const csvContent = [
    CSV_TEMPLATE_HEADERS.join(';'),
    CSV_EXAMPLE.join(';')
  ].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'modelo_processos.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if ((ch === ';' || ch === ',') && !inQuotes) { result.push(current.trim()); current = ''; continue; }
    current += ch;
  }
  result.push(current.trim());
  return result;
}

export default function CsvImport({ open, onClose, onImported }) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const parseFile = (file) => {
    setError('');
    setSuccess('');
    setPreview(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result.replace(/^\uFEFF/, '');
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) { setError('Arquivo vazio ou sem dados.'); return; }
      const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase().trim());
      const rows = [];
      for (let i = 1; i < lines.length; i++) {
        const vals = parseCsvLine(lines[i]);
        const row = {};
        headers.forEach((h, idx) => { row[h] = vals[idx] || ''; });
        if (row.numero_processo) rows.push(row);
      }
      if (rows.length === 0) { setError('Nenhum processo encontrado no arquivo.'); return; }
      setPreview(rows);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleFile = (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(ext)) {
      setError('Formato invÃ¡lido. Use CSV, XLSX ou XLS.');
      return;
    }
    if (ext === 'csv') {
      parseFile(file);
    } else {
      // Para XLSX, usar a integraÃ§Ã£o ExtractDataFromUploadedFile
      handleXlsx(file);
    }
  };

  const handleXlsx = async (file) => {
    setLoading(true);
    setError('');
    const { file_url } = await peritolexApi.integrations.Core.UploadFile({ file });
    const result = await peritolexApi.integrations.Core.ExtractDataFromUploadedFile({
      file_url,
      json_schema: {
        type: 'object',
        properties: {
          processos: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                numero_processo: { type: 'string' },
                vara: { type: 'string' },
                comarca: { type: 'string' },
                tipo_acao: { type: 'string' },
                autor: { type: 'string' },
                reu: { type: 'string' },
                advogado_autor: { type: 'string' },
                advogado_reu: { type: 'string' },
                valor_causa: { type: 'number' },
                honorarios: { type: 'number' },
                honorarios_status: { type: 'string' },
                status: { type: 'string' },
                data_distribuicao: { type: 'string' },
                data_nomeacao: { type: 'string' },
                objeto_pericia: { type: 'string' },
                observacoes: { type: 'string' },
              }
            }
          }
        }
      }
    });
    setLoading(false);
    if (result.status === 'success' && result.output?.processos?.length > 0) {
      setPreview(result.output.processos);
    } else {
      setError('NÃ£o foi possÃ­vel extrair dados do arquivo. Verifique o formato.');
    }
  };

  const handleImport = async () => {
    if (!preview || preview.length === 0) return;
    setLoading(true);
    setError('');
    const processos = preview.map(row => ({
      numero_processo: row.numero_processo || '',
      vara: row.vara || '',
      comarca: row.comarca || '',
      tipo_acao: row.tipo_acao || '',
      autor: row.autor || '',
      reu: row.reu || '',
      advogado_autor: row.advogado_autor || '',
      advogado_reu: row.advogado_reu || '',
      valor_causa: row.valor_causa ? Number(row.valor_causa) : undefined,
      honorarios: row.honorarios ? Number(row.honorarios) : undefined,
      honorarios_status: row.honorarios_status || 'pendente',
      status: row.status || 'em_andamento',
      data_distribuicao: row.data_distribuicao || '',
      data_nomeacao: row.data_nomeacao || '',
      objeto_pericia: row.objeto_pericia || '',
      observacoes: row.observacoes || '',
    }));

    await peritolexApi.entities.Process.bulkCreate(processos);
    setLoading(false);
    setSuccess(`${processos.length} processo(s) importado(s) com sucesso!`);
    setPreview(null);
    onImported();
  };

  const handleClose = () => {
    setPreview(null);
    setError('');
    setSuccess('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Importar via CSV / Excel
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Download template */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border/50">
            <div>
              <p className="text-sm font-medium">Modelo de planilha</p>
              <p className="text-xs text-muted-foreground">Baixe e preencha com seus dados</p>
            </div>
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-1.5">
              <Download className="w-3.5 h-3.5" /> Baixar modelo
            </Button>
          </div>

          {/* Drop zone */}
          {!preview && !success && (
            <div
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
                dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              )}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
              onClick={() => fileRef.current.click()}
            >
              <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium">Arraste o arquivo ou clique para selecionar</p>
              <p className="text-xs text-muted-foreground mt-1">CSV, XLSX ou XLS â€” mÃ¡x. 10MB</p>
              <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={e => handleFile(e.target.files[0])} />
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center gap-3 py-6 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Processando arquivo...</span>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-4 bg-green-50 text-green-700 rounded-lg border border-green-200">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">{success}</span>
            </div>
          )}

          {/* Preview */}
          {preview && preview.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">{preview.length} processo(s) encontrado(s) para importar:</p>
              <div className="max-h-48 overflow-y-auto border border-border rounded-lg divide-y divide-border">
                {preview.map((row, i) => (
                  <div key={i} className="px-3 py-2 flex items-center gap-3">
                    <span className="text-[10px] text-muted-foreground w-5">{i + 1}</span>
                    <span className="text-xs font-mono flex-1">{row.numero_processo}</span>
                    <span className="text-xs text-muted-foreground truncate max-w-[200px]">{row.autor}</span>
                    <span className="text-xs text-muted-foreground">x</span>
                    <span className="text-xs text-muted-foreground truncate max-w-[200px]">{row.reu}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={handleClose}>
              {success ? 'Fechar' : 'Cancelar'}
            </Button>
            {preview && !loading && (
              <Button onClick={handleImport} className="gap-2">
                <Upload className="w-4 h-4" /> Importar {preview.length} processo(s)
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
