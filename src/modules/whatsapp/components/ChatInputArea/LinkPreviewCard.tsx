import React from 'react';
import { Globe, X, ExternalLink } from 'lucide-react';

export interface LinkPreviewInfo {
  url: string;
  title: string;
  description: string;
  domain: string;
  imageUrl?: string;
}

interface LinkPreviewCardProps {
  preview: LinkPreviewInfo;
  onRemove: () => void;
}

export function LinkPreviewCard({ preview, onRemove }: LinkPreviewCardProps) {
  return (
    <div className="flex items-center justify-between p-2.5 mb-2 bg-muted/60 border border-border rounded-xl text-xs relative animate-in slide-in-from-bottom-2">
      <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
        <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20 overflow-hidden">
          {preview.imageUrl ? (
            <img src={preview.imageUrl} alt={preview.title} className="w-full h-full object-cover" />
          ) : (
            <Globe size={18} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{preview.domain}</span>
            <ExternalLink size={10} className="text-muted-foreground" />
          </div>
          <h4 className="font-bold text-xs text-foreground truncate mt-0.5">{preview.title}</h4>
          <p className="text-[11px] text-muted-foreground truncate">{preview.description}</p>
        </div>
      </div>

      <button
        onClick={onRemove}
        className="p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors shrink-0"
        title="Remover preview do link"
      >
        <X size={15} />
      </button>
    </div>
  );
}

export function detectUrlInText(text: string): LinkPreviewInfo | null {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
  const match = text.match(urlRegex);
  if (!match) return null;

  let url = match[0];
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  try {
    const parsed = new URL(url);
    const domain = parsed.hostname.replace('www.', '');

    if (domain.includes('icontabil')) {
      return {
        url,
        domain,
        title: 'iContábil CRM - Gestão Contábil Inteligente',
        description: 'Plataforma completa de contabilidade consultiva, certidões e honorários.',
        imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=200&auto=format&fit=crop&q=80'
      };
    }

    if (domain.includes('google') || domain.includes('maps')) {
      return {
        url,
        domain,
        title: 'Google Maps - Localização & Rotas',
        description: 'Veja o endereço no mapa e obtenha direções de navegação.',
        imageUrl: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=200&auto=format&fit=crop&q=80'
      };
    }

    return {
      url,
      domain,
      title: `Link de ${domain}`,
      description: `Acesse ${url} para visualizar mais informações.`,
    };
  } catch {
    return null;
  }
}
