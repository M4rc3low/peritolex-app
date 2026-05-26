import React, { useState, useRef } from 'react';
import { peritolexApi } from '@/api/peritolexClient';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Download, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const HEADERS = [
  'titulo', 'data_prazo', 'tipo', 'prioridade', 'numero_processo', 'descricao', 'status'
];

const EXAMPLE = [
  'Entrega do Laudo Pericial', '2025-08-15', 'entrega_laudo', 'alta',
  '0001234-55.2025.8.26.0100', 'Prazo para entrega do laudo ao juÃ­zo', 'pendente'
];

const TIPOS_VALIDOS = ['entrega_laudo', 'manifestacao', 'diligencia', 'audiencia', 'levantamento_honorarios', 'outro'];
const PRIORIDADES_VALIDAS = ['baixa', 'media', 'alta', 'urgente'];

function downloadTemplate() {
  const csvContent = [HEADERS.join(';'), EXAMPLE.join(';')].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'modelo_prazos.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if ((ch === ';' || ch === ',') && !inQuotes) { result.push(current.trim()); current = ''; continue; }
    current += ch;
  }
  result.push(current.trim());
  return result;
}

export default function DeadlineCsvImport({ open, onClose, onImported }) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const reset = () => { setPreview(null); setError(''); setSuccess(''); };

  const parseCsv = (text) => {
    const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) { setError('Arquivo vazio ou sem dados.'); return; }
    const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase().trim());
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const vals = parseCsvLine(lines[i]);
      const row = {};
      headers.forEach((h, idx) => { row[h] = vals[idx] || ''; });
      if (row.titulo && row.data_prazo) rows.push(row);
    }
    if (rows.length === 0) { setError('Nenhum prazo encontrado no arquivo.'); return; }
    setPreview(rows);
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
          prazos: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                titulo: { type: 'string' },
                data_prazo: { type: 'string' },
                tipo: { type: 'string' },
                prioridade: { type: 'string' },
                numero_processo: { type: 'string' },
                descricao: { type: 'string' },
                status: { type: 'string' },
              }
            }
          }
        }
      }
    });
    setLoading(false);
    if (result.status === 'success' && result.output?.prazos?.length > 0) {
      setPreview(result.output.prazos);
    } else {
      setError('NÃ£o foi possÃ­vel extrair dados do arquivo. Verifique o formato.');
    }
  };

  const handleFile = (file) => {
    if (!file) return;
    reset();
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(ext)) { setError('Formato invÃ¡lido. Use CSV, XLSX ou XLS.'); return; }
    if (ext === 'csv') {
      const reader = new FileReader();
      reader.onload = (e) => parseCsv(e.target.result);
      reader.readAsText(file, 'UTF-8');
    } else {
      handleXlsx(file);
    }
  };

  const handleImport = async () => {
    if (!preview || preview.length === 0) return;
    setLoading(true);
    const prazos = preview.map(row => ({
      titulo: row.titulo || '',
      data_prazo: row.data_prazo || '',
      tipo: TIPOS_VALIDOS.includes(row.tipo) ? row.tipo : 'outro',
      prioridade: PRIORIDADES_VALIDAS.includes(row.prioridade) ? row.prioridade : 'media',
      numero_processo: row.numero_processo || '',
      descricao: row.descricao || '',
      status: row.status === 'concluido' ? 'concluido' : 'pendente',
    }));
    await peritolexApi.entities.Deadline.bulkCreate(prazos);
    setLoading(false);
    setSuccess(`${prazos.length} prazo(s) importado(s) com sucesso!`);
    setPreview(null);
    onImported();
  };

  const handleClose = () => { reset(); onClose(); };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Importar Prazos via CSV / Excel
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Campos aceitos */}
          <div className="p-3 bg-muted/50 rounded-lg border border-border/50 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Modelo de planilha</p>
                <p className="text-xs text-muted-foreground">Colunas: titulo, data_prazo (AAAA-MM-DD), tipo, prioridade, numero_processo, descricao, status</p>
              </div>
              <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-1.5 flex-shrink-0">
                <Download className="w-3.5 h-3.5" /> Baixar modelo
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {[
                'entrega_laudo', 'manifestacao', 'diligencia', 'audiencia', 'levantamento_honorarios', 'outro'
              ].map(t => (
                <span key={t} className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded font-mono">{t}</span>
              ))}
              <span className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded mx-1">prioridades:</span>
              {['baixa', 'media', 'alta', 'urgente'].map(p => (
                <span key={p} className="text-[10px] px-1.5 py-0.5 bg-accent/20 text-accent-foreground rounded font-mono">{p}</span>
              ))}
            </div>
          </div>

          {/* Drop zone */}
          {!preview && !success && !loading && (
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
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
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
              <p className="text-sm font-medium">{preview.length} prazo(s) encontrado(s) para importar:</p>
              <div className="max-h-52 overflow-y-auto border border-border rounded-lg divide-y divide-border">
                {preview.map((row, i) => (
                  <div key={i} className="px-3 py-2 flex items-center gap-3">
                    <span className="text-[10px] text-muted-foreground w-5">{i + 1}</span>
                    <span className="text-xs font-medium flex-1 truncate">{row.titulo}</span>
                    <span className="text-xs text-muted-foreground font-mono">{row.data_prazo}</span>
                    {row.numero_processo && (
                      <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono truncate max-w-[140px]">{row.numero_processo}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={handleClose}>{success ? 'Fechar' : 'Cancelar'}</Button>
            {preview && !loading && (
              <Button onClick={handleImport} className="gap-2">
                <Upload className="w-4 h-4" /> Importar {preview.length} prazo(s)
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
