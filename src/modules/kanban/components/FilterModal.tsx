import React, { useState } from 'react';
import { Modal } from '../../../shared/components/ui/Modal';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Badge } from '../../../shared/components/ui/Badge';
import { X, Check, Filter } from 'lucide-react';
import { Pipeline, PipelineColumn } from '../../clients/types';

export interface FilterState {
  responsible: string[];
  stages: string[];
  priorities: string[];
  origins: string[];
  labels: string[];
  city: string;
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onApplyFilters: (newFilters: FilterState) => void;
  onClearFilters: () => void;
  columns: PipelineColumn[];
  availableResponsibles: string[];
  availableOrigins: string[];
  availableLabels: string[];
}

export function FilterModal({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
  onClearFilters,
  columns = [],
  availableResponsibles = [],
  availableOrigins = [],
  availableLabels = []
}: FilterModalProps) {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  // Sync when opening
  React.useEffect(() => {
    setLocalFilters(filters);
  }, [filters, isOpen]);

  const toggleArrayItem = (key: keyof FilterState, item: string) => {
    const current = localFilters[key] as string[];
    if (current.includes(item)) {
      setLocalFilters({ ...localFilters, [key]: current.filter(i => i !== item) });
    } else {
      setLocalFilters({ ...localFilters, [key]: [...current, item] });
    }
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleClear = () => {
    onClearFilters();
    setLocalFilters({
      responsible: [],
      stages: [],
      priorities: [],
      origins: [],
      labels: [],
      city: ''
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Filtrar Oportunidades">
      <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
        {/* Prioridades */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Prioridade</label>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'urgent', label: 'Urgente' },
              { id: 'high', label: 'Alta' },
              { id: 'medium', label: 'Média' },
              { id: 'low', label: 'Baixa' },
            ].map(p => {
              const selected = localFilters.priorities.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleArrayItem('priorities', p.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    selected 
                      ? 'bg-primary text-primary-foreground border-primary' 
                      : 'bg-card text-muted-foreground border-border hover:border-primary/50'
                  }`}
                >
                  {p.label} {selected && '✓'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Etapas / Colunas */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Etapa do Pipeline</label>
          <div className="flex flex-wrap gap-1.5">
            {columns.map(col => {
              const selected = localFilters.stages.includes(col.id);
              return (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => toggleArrayItem('stages', col.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                    selected 
                      ? 'bg-primary text-primary-foreground border-primary' 
                      : 'bg-card text-muted-foreground border-border hover:border-primary/50'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${col.color}`} />
                  {col.label} {selected && '✓'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Responsáveis */}
        {availableResponsibles.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Responsável</label>
            <div className="flex flex-wrap gap-1.5">
              {availableResponsibles.map(resp => {
                const selected = localFilters.responsible.includes(resp);
                return (
                  <button
                    key={resp}
                    type="button"
                    onClick={() => toggleArrayItem('responsible', resp)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      selected 
                        ? 'bg-primary text-primary-foreground border-primary' 
                        : 'bg-card text-muted-foreground border-border hover:border-primary/50'
                    }`}
                  >
                    {resp} {selected && '✓'}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Origens */}
        {availableOrigins.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Origem / Canal</label>
            <div className="flex flex-wrap gap-1.5">
              {availableOrigins.map(org => {
                const selected = localFilters.origins.includes(org);
                return (
                  <button
                    key={org}
                    type="button"
                    onClick={() => toggleArrayItem('origins', org)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      selected 
                        ? 'bg-primary text-primary-foreground border-primary' 
                        : 'bg-card text-muted-foreground border-border hover:border-primary/50'
                    }`}
                  >
                    {org} {selected && '✓'}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Etiquetas */}
        {availableLabels.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Etiquetas</label>
            <div className="flex flex-wrap gap-1.5">
              {availableLabels.map(label => {
                const selected = localFilters.labels.includes(label);
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => toggleArrayItem('labels', label)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      selected 
                        ? 'bg-primary text-primary-foreground border-primary' 
                        : 'bg-card text-muted-foreground border-border hover:border-primary/50'
                    }`}
                  >
                    {label} {selected && '✓'}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Cidade */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cidade</label>
          <Input 
            placeholder="Filtrar por cidade..."
            value={localFilters.city}
            onChange={e => setLocalFilters({ ...localFilters, city: e.target.value })}
            className="h-9 text-xs bg-background"
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
        <Button type="button" variant="ghost" size="sm" onClick={handleClear} className="text-xs text-danger hover:text-danger/80">
          Limpar Filtros
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
          <Button type="button" size="sm" onClick={handleApply}>Aplicar Filtros</Button>
        </div>
      </div>
    </Modal>
  );
}
