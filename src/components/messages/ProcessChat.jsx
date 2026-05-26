import React, { useState, useRef, useEffect } from 'react';
import { peritolexApi } from '@/api/peritolexClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Send, Paperclip, MessageSquare, ChevronDown,
  FileText, HelpCircle, Bell, Loader2, X, Reply
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const DESTINATARIO_LABELS = {
  advogado_autor: 'Advogado do Autor',
  advogado_reu: 'Advogado do RÃ©u',
  ambos: 'Ambas as Partes',
  juiz: 'Juiz',
  outro: 'Outro',
};

const TIPO_CONFIG = {
  mensagem: { label: 'Mensagem', icon: MessageSquare, color: 'bg-primary/10 text-primary' },
  solicitacao_documento: { label: 'SolicitaÃ§Ã£o de Documento', icon: FileText, color: 'bg-amber-100 text-amber-700' },
  esclarecimento: { label: 'Esclarecimento', icon: HelpCircle, color: 'bg-blue-100 text-blue-700' },
  notificacao: { label: 'NotificaÃ§Ã£o', icon: Bell, color: 'bg-purple-100 text-purple-700' },
};

const REMETENTE_COLORS = {
  perito: 'bg-primary text-primary-foreground',
  advogado_autor: 'bg-emerald-600 text-white',
  advogado_reu: 'bg-rose-600 text-white',
  juiz: 'bg-purple-600 text-white',
  outro: 'bg-gray-500 text-white',
};

const REMETENTE_LABELS = {
  perito: 'Perito',
  advogado_autor: 'Adv. Autor',
  advogado_reu: 'Adv. RÃ©u',
  juiz: 'Juiz',
  outro: 'Outro',
};

export default function ProcessChat({ processId, process }) {
  const queryClient = useQueryClient();
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  const [conteudo, setConteudo] = useState('');
  const [destinatario, setDestinatario] = useState('ambos');
  const [tipo, setTipo] = useState('mensagem');
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [filterDest, setFilterDest] = useState('all');

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', processId],
    queryFn: () => peritolexApi.entities.ProcessMessage.filter(
      { process_id: processId }, 'created_date', 200
    ),
    refetchInterval: 15000,
  });

  // Mark unread messages as read on open
  const markReadMutation = useMutation({
    mutationFn: async (msgs) => {
      await Promise.all(
        msgs.filter(m => !m.lida && m.remetente_tipo !== 'perito')
          .map(m => peritolexApi.entities.ProcessMessage.update(m.id, { lida: true }))
      );
    },
  });

  useEffect(() => {
    if (messages.length > 0) markReadMutation.mutate(messages);
  }, [messages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: (data) => peritolexApi.entities.ProcessMessage.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', processId] });
      setConteudo('');
      setAttachments([]);
      setReplyTo(null);
    },
    onError: () => toast.error('Erro ao enviar mensagem.'),
  });

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(
        files.map(async (f) => {
          const { file_url } = await peritolexApi.integrations.Core.UploadFile({ file: f });
          return file_url;
        })
      );
      setAttachments(prev => [...prev, ...urls]);
      toast.success(`${files.length} arquivo(s) anexado(s).`);
    } catch {
      toast.error('Erro ao anexar arquivo.');
    } finally {
      setUploading(false);
    }
  };

  const handleSend = () => {
    if (!conteudo.trim()) return;
    sendMutation.mutate({
      process_id: processId,
      numero_processo: process?.numero_processo,
      remetente_nome: 'Perito',
      remetente_tipo: 'perito',
      destinatario,
      conteudo: conteudo.trim(),
      tipo,
      documentos_urls: attachments,
      lida: false,
      resposta_para: replyTo?.id || null,
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSend();
  };

  const filteredMessages = filterDest === 'all'
    ? messages
    : messages.filter(m => m.destinatario === filterDest || m.remetente_tipo === filterDest);

  const unreadCount = messages.filter(m => !m.lida && m.remetente_tipo !== 'perito').length;

  // Build a map for reply references
  const messageMap = Object.fromEntries(messages.map(m => [m.id, m]));

  return (
    <div className="flex flex-col h-[560px]">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">ComunicaÃ§Ãµes</span>
          {unreadCount > 0 && (
            <Badge className="h-5 px-1.5 text-[10px] bg-primary">{unreadCount} nÃ£o lida{unreadCount > 1 ? 's' : ''}</Badge>
          )}
        </div>
        <Select value={filterDest} onValueChange={setFilterDest}>
          <SelectTrigger className="h-7 w-44 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as mensagens</SelectItem>
            {Object.entries(DESTINATARIO_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground gap-2 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando mensagens...
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare className="w-10 h-10 text-muted-foreground/20 mb-3" />
            <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Envie uma mensagem para iniciar a comunicaÃ§Ã£o.</p>
          </div>
        ) : (
          filteredMessages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              replySource={msg.resposta_para ? messageMap[msg.resposta_para] : null}
              onReply={() => setReplyTo(msg)}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Reply preview */}
      {replyTo && (
        <div className="mt-2 px-3 py-2 bg-muted/50 rounded-lg border-l-4 border-primary flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] text-primary font-semibold">Respondendo a {REMETENTE_LABELS[replyTo.remetente_tipo] || replyTo.remetente_nome}</p>
            <p className="text-xs text-muted-foreground truncate">{replyTo.conteudo}</p>
          </div>
          <button onClick={() => setReplyTo(null)} className="flex-shrink-0 text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {attachments.map((url, i) => (
            <div key={i} className="flex items-center gap-1.5 bg-muted px-2 py-1 rounded text-xs">
              <FileText className="w-3 h-3 text-muted-foreground" />
              <span className="truncate max-w-[120px]">Arquivo {i + 1}</span>
              <button onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))}>
                <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Compose area */}
      <div className="mt-3 border rounded-xl p-3 space-y-2 bg-card">
        <div className="flex gap-2 flex-wrap">
          <Select value={destinatario} onValueChange={setDestinatario}>
            <SelectTrigger className="h-7 w-44 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(DESTINATARIO_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={tipo} onValueChange={setTipo}>
            <SelectTrigger className="h-7 w-48 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TIPO_CONFIG).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Textarea
          value={conteudo}
          onChange={(e) => setConteudo(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua mensagem... (Ctrl+Enter para enviar)"
          className="min-h-[72px] text-sm resize-none border-0 shadow-none focus-visible:ring-0 p-0"
        />
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple />
            <Button
              variant="ghost" size="icon" className="h-7 w-7"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              title="Anexar arquivo"
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />}
            </Button>
          </div>
          <Button
            size="sm" className="h-7 gap-1.5 text-xs"
            onClick={handleSend}
            disabled={!conteudo.trim() || sendMutation.isPending}
          >
            {sendMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Enviar
          </Button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message, replySource, onReply }) {
  const isPerito = message.remetente_tipo === 'perito';
  const tipoConfig = TIPO_CONFIG[message.tipo] || TIPO_CONFIG.mensagem;
  const TipoIcon = tipoConfig.icon;

  return (
    <div className={cn("flex gap-2 group", isPerito ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
      <div className={cn(
        "w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold mt-1",
        REMETENTE_COLORS[message.remetente_tipo] || 'bg-gray-500 text-white'
      )}>
        {(REMETENTE_LABELS[message.remetente_tipo] || 'O').slice(0, 2).toUpperCase()}
      </div>

      <div className={cn("max-w-[75%] space-y-1", isPerito && "items-end flex flex-col")}>
        {/* Meta */}
        <div className={cn("flex items-center gap-1.5 text-[10px] text-muted-foreground", isPerito && "flex-row-reverse")}>
          <span className="font-semibold">{message.remetente_nome || REMETENTE_LABELS[message.remetente_tipo]}</span>
          <span>Â·</span>
          <span>Para: {DESTINATARIO_LABELS[message.destinatario] || message.destinatario}</span>
          <span>Â·</span>
          <span>{message.created_date ? format(parseISO(message.created_date), "dd/MM HH:mm", { locale: ptBR }) : ''}</span>
        </div>

        {/* Reply ref */}
        {replySource && (
          <div className={cn(
            "text-[10px] bg-muted/60 border-l-2 border-muted-foreground/30 px-2 py-1 rounded text-muted-foreground truncate max-w-full",
            isPerito && "border-r-2 border-l-0 text-right"
          )}>
            â†© {replySource.conteudo?.slice(0, 60)}{replySource.conteudo?.length > 60 ? 'â€¦' : ''}
          </div>
        )}

        {/* Bubble */}
        <div className={cn(
          "rounded-2xl px-3.5 py-2.5 text-sm shadow-sm",
          isPerito
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-card border rounded-tl-sm"
        )}>
          {/* Tipo badge */}
          {message.tipo !== 'mensagem' && (
            <div className={cn("inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full mb-1.5", tipoConfig.color)}>
              <TipoIcon className="w-2.5 h-2.5" />
              {tipoConfig.label}
            </div>
          )}
          <p className="whitespace-pre-wrap leading-relaxed">{message.conteudo}</p>

          {/* Attachments */}
          {message.documentos_urls?.length > 0 && (
            <div className="mt-2 space-y-1">
              {message.documentos_urls.map((url, i) => (
                <a
                  key={i} href={url} target="_blank" rel="noopener noreferrer"
                  className={cn(
                    "flex items-center gap-1.5 text-[11px] underline underline-offset-2",
                    isPerito ? "text-primary-foreground/80" : "text-primary"
                  )}
                >
                  <FileText className="w-3 h-3 flex-shrink-0" />
                  Documento {i + 1}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Reply button */}
        <button
          onClick={onReply}
          className={cn(
            "opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground",
            isPerito && "flex-row-reverse"
          )}
        >
          <Reply className="w-3 h-3" /> Responder
        </button>
      </div>
    </div>
  );
}
