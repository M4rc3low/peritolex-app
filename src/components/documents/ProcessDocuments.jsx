import React, { useState, useRef } from 'react';
import { peritolexApi } from '@/api/peritolexClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, FileText, Trash2, Download, Link2, Loader2, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const TIPO_CONFIG = {
  peticao:   { label: 'PetiÃ§Ã£o',    color: 'bg-blue-100 text-blue-700' },
  laudo:     { label: 'Laudo',      color: 'bg-purple-100 text-purple-700' },
  contrato:  { label: 'Contrato',   color: 'bg-amber-100 text-amber-700' },
  sentenca:  { label: 'SentenÃ§a',   color: 'bg-red-100 text-red-700' },
  despacho:  { label: 'Despacho',   color: 'bg-orange-100 text-orange-700' },
  procuracao:{ label: 'ProcuraÃ§Ã£o', color: 'bg-teal-100 text-teal-700' },
  outros:    { label: 'Outros',     color: 'bg-gray-100 text-gray-600' },
};

function formatBytes(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ProcessDocuments({ processId, numeroProcesso, movements = [] }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [form, setForm] = useState({ nome: '', tipo: 'peticao', movement_id: '' });

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents', processId],
    queryFn: () => peritolexApi.entities.ProcessDocument.filter({ process_id: processId }, '-created_date', 100),
    enabled: !!processId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => peritolexApi.entities.ProcessDocument.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', processId] });
      toast.success('Documento removido.');
    },
  });

  const handleFile = async (file) => {
    if (!file) return;
    if (!form.nome) {
      // auto-fill name from filename
      setForm(f => ({ ...f, nome: file.name.replace(/\.[^/.]+$/, '') }));
    }

    setUploading(true);
    const { file_url } = await peritolexApi.integrations.Core.UploadFile({ file });
    const user = await peritolexApi.auth.me();

    await peritolexApi.entities.ProcessDocument.create({
      process_id: processId,
      numero_processo: numeroProcesso,
      nome: form.nome || file.name.replace(/\.[^/.]+$/, ''),
      tipo: form.tipo,
      movement_id: form.movement_id || undefined,
      arquivo_url: file_url,
      arquivo_nome: file.name,
      arquivo_tamanho: file.size,
      enviado_por: user?.email,
    });

    queryClient.invalidateQueries({ queryKey: ['documents', processId] });
    setForm(f => ({ ...f, nome: '', movement_id: '' }));
    setUploading(false);
    toast.success('Documento salvo com sucesso!');
  };

  const onInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  // Group by movement
  const grouped = {};
  const noMovement = [];
  for (const doc of documents) {
    if (doc.movement_id) {
      if (!grouped[doc.movement_id]) grouped[doc.movement_id] = [];
      grouped[doc.movement_id].push(doc);
    } else {
      noMovement.push(doc);
    }
  }

  return (
    <div className="space-y-5">
      {/* Upload area */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Input
            placeholder="Nome do documento (opcional)"
            value={form.nome}
            onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
            className="sm:col-span-1"
          />
          <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(TIPO_CONFIG).map(([v, c]) => (
                <SelectItem key={v} value={v}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {movements.length > 0 && (
            <Select value={form.movement_id} onValueChange={v => setForm(f => ({ ...f, movement_id: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Vincular a andamento (opc.)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Sem vÃ­nculo</SelectItem>
                {movements.slice(0, 30).map(m => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.data_movimento} â€“ {m.descricao?.slice(0, 35)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div
          className={cn(
            "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors",
            dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
          )}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          {uploading ? (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" /> Enviando...
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">Arraste um PDF aqui ou <span className="text-primary font-medium">clique para selecionar</span></p>
              <p className="text-xs text-muted-foreground/60 mt-1">PDF, DOC, DOCX, imagens</p>
            </>
          )}
        </div>
        <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={onInputChange} />
      </div>

      {/* Documents list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />)}
        </div>
      ) : documents.length === 0 ? (
        <div className="border border-dashed rounded-xl p-8 text-center">
          <FileCheck className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">Nenhum documento anexado</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Vinculados a andamentos */}
          {Object.entries(grouped).map(([movId, docs]) => {
            const mov = movements.find(m => m.id === movId);
            return (
              <div key={movId}>
                <div className="flex items-center gap-2 mb-2">
                  <Link2 className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-medium">
                    {mov ? `${mov.data_movimento} â€“ ${mov.descricao?.slice(0, 50)}` : 'Andamento vinculado'}
                  </span>
                </div>
                <div className="space-y-1 pl-5">
                  {docs.map(doc => <DocRow key={doc.id} doc={doc} onDelete={() => deleteMutation.mutate(doc.id)} />)}
                </div>
              </div>
            );
          })}

          {/* Sem vÃ­nculo */}
          {noMovement.length > 0 && (
            <div>
              {Object.keys(grouped).length > 0 && (
                <p className="text-xs text-muted-foreground font-medium mb-2">Documentos gerais</p>
              )}
              <div className="space-y-1">
                {noMovement.map(doc => <DocRow key={doc.id} doc={doc} onDelete={() => deleteMutation.mutate(doc.id)} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DocRow({ doc, onDelete }) {
  const tipo = TIPO_CONFIG[doc.tipo] || TIPO_CONFIG.outros;
  return (
    <div className="flex items-center gap-3 p-3 bg-card border border-border/50 rounded-lg hover:border-border transition-colors group">
      <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{doc.nome}</p>
        <p className="text-[10px] text-muted-foreground">
          {doc.arquivo_nome && `${doc.arquivo_nome} Â· `}
          {formatBytes(doc.arquivo_tamanho)}
          {doc.enviado_por && ` Â· ${doc.enviado_por}`}
          {doc.created_date && ` Â· ${format(new Date(doc.created_date), "dd MMM yyyy", { locale: ptBR })}`}
        </p>
      </div>
      <Badge variant="outline" className={cn("text-[10px] border flex-shrink-0", tipo.color)}>
        {tipo.label}
      </Badge>
      <a href={doc.arquivo_url} target="_blank" rel="noopener noreferrer"
        className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-primary transition-colors"
        title="Baixar"
      >
        <Download className="w-3.5 h-3.5" />
      </a>
      <button
        onClick={onDelete}
        className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
        title="Remover"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
