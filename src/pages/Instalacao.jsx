import React, { useState, useEffect } from 'react';
import { Monitor, Smartphone, Apple, Chrome, Download, CheckCircle2, ArrowRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const steps = {
  chrome: [
    { title: 'Abra o Google Chrome', desc: 'Certifique-se de estar usando Chrome 73 ou superior.' },
    { title: 'Acesse o sistema', desc: 'Navegue atÃ© a URL do Sistema Pericial.' },
    { title: 'Clique no Ã­cone de instalaÃ§Ã£o', desc: 'Na barra de endereÃ§os, clique no Ã­cone "âŠ•" ou "Instalar app" que aparece Ã  direita.' },
    { title: 'Confirme a instalaÃ§Ã£o', desc: 'Clique em "Instalar" na janela de confirmaÃ§Ã£o.' },
    { title: 'Pronto!', desc: 'O sistema serÃ¡ aberto como um aplicativo nativo no seu desktop.' },
  ],
  edge: [
    { title: 'Abra o Microsoft Edge', desc: 'Certifique-se de estar usando Edge baseado em Chromium.' },
    { title: 'Acesse o sistema', desc: 'Navegue atÃ© a URL do Sistema Pericial.' },
    { title: 'Abra o menu (Â·Â·Â·)', desc: 'Clique nos trÃªs pontinhos no canto superior direito.' },
    { title: 'Selecione "Aplicativos"', desc: 'No menu, vÃ¡ em Aplicativos â†’ Instalar este site como aplicativo.' },
    { title: 'Confirme', desc: 'Clique em "Instalar" e um atalho serÃ¡ criado na Ã¡rea de trabalho.' },
  ],
  android: [
    { title: 'Abra o Chrome no Android', desc: 'Use o Google Chrome no seu smartphone Android.' },
    { title: 'Acesse o sistema', desc: 'Navegue atÃ© a URL do Sistema Pericial.' },
    { title: 'Toque no menu (â‹®)', desc: 'Toque nos trÃªs pontinhos no canto superior direito.' },
    { title: 'Selecione "Adicionar Ã  tela inicial"', desc: 'Toque nessa opÃ§Ã£o no menu.' },
    { title: 'Confirme', desc: 'Toque em "Adicionar" â€” o Ã­cone aparecerÃ¡ na tela inicial.' },
  ],
  ios: [
    { title: 'Abra o Safari no iPhone/iPad', desc: 'ObrigatÃ³rio usar o Safari â€” outros navegadores nÃ£o suportam instalaÃ§Ã£o no iOS.' },
    { title: 'Acesse o sistema', desc: 'Navegue atÃ© a URL do Sistema Pericial.' },
    { title: 'Toque no botÃ£o Compartilhar', desc: 'Toque no Ã­cone de compartilhar (â–¡â†‘) na barra inferior do Safari.' },
    { title: 'Selecione "Adicionar Ã  Tela de InÃ­cio"', desc: 'Role a lista e toque nessa opÃ§Ã£o.' },
    { title: 'Confirme o nome e toque em "Adicionar"', desc: 'O Ã­cone do sistema aparecerÃ¡ na sua tela inicial.' },
  ],
};

const platforms = [
  { id: 'chrome', label: 'Chrome (PC)', icon: Chrome, badge: 'Recomendado' },
  { id: 'edge', label: 'Edge (PC)', icon: Monitor, badge: null },
  { id: 'android', label: 'Android', icon: Smartphone, badge: null },
  { id: 'ios', label: 'iPhone / iPad', icon: Apple, badge: null },
];

export default function Instalacao() {
  const [selected, setSelected] = useState('chrome');
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setInstalled(true));
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallNow = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setDeferredPrompt(null);
  };

  const currentSteps = steps[selected] || [];

  return (
    <div className="p-6 lg:p-8 max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">Instalar o Sistema</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Instale como aplicativo nativo para acesso rÃ¡pido, sem precisar abrir o navegador.
        </p>
      </div>

      {/* Banner de instalaÃ§Ã£o automÃ¡tica */}
      {deferredPrompt && !installed && (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/10 border border-primary/20">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Download className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">InstalaÃ§Ã£o disponÃ­vel!</p>
            <p className="text-xs text-muted-foreground">Detectamos que vocÃª pode instalar agora com um clique.</p>
          </div>
          <Button onClick={handleInstallNow} className="flex-shrink-0 gap-1.5">
            <Download className="w-4 h-4" /> Instalar agora
          </Button>
        </div>
      )}

      {installed && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <p className="text-sm font-medium text-green-700">Sistema instalado com sucesso! Procure o Ã­cone na sua Ã¡rea de trabalho.</p>
        </div>
      )}

      {/* BenefÃ­cios */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Star, title: 'Acesso rÃ¡pido', desc: 'Ãcone na Ã¡rea de trabalho ou tela inicial' },
          { icon: Monitor, title: 'Tela cheia', desc: 'Sem barra de navegador, como um app real' },
          { icon: CheckCircle2, title: 'NotificaÃ§Ãµes', desc: 'Receba alertas de novos andamentos' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="bg-card border border-border/50 rounded-xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">{title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Seletor de plataforma */}
      <div>
        <p className="text-sm font-semibold mb-3">Escolha seu dispositivo / navegador:</p>
        <div className="flex flex-wrap gap-2">
          {platforms.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => setSelected(id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all',
                selected === id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card border-border text-foreground hover:bg-muted'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
              {badge && (
                <span className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded-full',
                  selected === id ? 'bg-white/20' : 'bg-accent/20 text-accent'
                )}>
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Passo a passo */}
      <div className="bg-card border border-border/50 rounded-xl p-6 space-y-4">
        <h2 className="text-base font-semibold">Passo a passo â€” {platforms.find(p => p.id === selected)?.label}</h2>
        <ol className="space-y-4">
          {currentSteps.map((step, i) => (
            <li key={i} className="flex gap-4">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                {i + 1}
              </div>
              <div className="pt-0.5">
                <p className="text-sm font-semibold">{step.title}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Nota iOS */}
      {selected === 'ios' && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-800">
          <strong>AtenÃ§Ã£o:</strong> No iOS, apenas o <strong>Safari</strong> suporta a instalaÃ§Ã£o de PWAs. Chrome e outros navegadores no iPhone nÃ£o tÃªm essa funcionalidade.
        </div>
      )}
    </div>
  );
}
