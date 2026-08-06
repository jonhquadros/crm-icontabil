import React, { useState, useMemo } from 'react';
import { 
  UserX, 
  Plus, 
  Search, 
  Download, 
  Trash2, 
  Calendar, 
  Filter, 
  ShieldAlert, 
  Bot, 
  UserCheck, 
  Globe, 
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle, 
  X,
  Check
} from 'lucide-react';
import { OptOut } from '../types/campaign.types';
import { formatPhoneDisplay, normalizePhone } from '../utils/phoneUtils';
import { format, isAfter, subDays, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

interface OptOutManagementProps {
  optOutList: OptOut[];
  onAddOptOut: (phone: string, reason?: string, name?: string) => Promise<string | null>;
  onRemoveOptOut: (optOutId: string) => Promise<void>;
}

export function OptOutManagement({
  optOutList,
  onAddOptOut,
  onRemoveOptOut
}: OptOutManagementProps) {
  // Search & Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [periodFilter, setPeriodFilter] = useState<'all' | '7days' | '30days' | 'this_month'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'automatic' | 'manual'>('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [newName, setNewName] = useState('');
  const [newReason, setNewReason] = useState('');
  const [addPhoneError, setAddPhoneError] = useState('');

  // Delete Confirmation Modal state
  const [itemToRemove, setItemToRemove] = useState<OptOut | null>(null);

  // Filtered List calculation
  const filteredList = useMemo(() => {
    return optOutList.filter(item => {
      // 1. Text Search
      const searchLower = searchTerm.toLowerCase();
      const phoneMatch = item.phone.includes(searchTerm) || formatPhoneDisplay(item.phone).includes(searchTerm);
      const nameMatch = item.name ? item.name.toLowerCase().includes(searchLower) : false;
      const reasonMatch = item.reason ? item.reason.toLowerCase().includes(searchLower) : false;

      const matchesSearch = !searchTerm || phoneMatch || nameMatch || reasonMatch;

      // 2. Source Filter
      let matchesSource = true;
      if (sourceFilter === 'automatic') {
        matchesSource = item.source === 'reply_stop' || item.source === 'webhook';
      } else if (sourceFilter === 'manual') {
        matchesSource = item.source === 'manual';
      }

      // 3. Period Filter
      let matchesPeriod = true;
      if (item.optedOutAt) {
        const itemDate = item.optedOutAt instanceof Date 
          ? item.optedOutAt 
          : item.optedOutAt?.toDate 
          ? item.optedOutAt.toDate() 
          : new Date(item.optedOutAt);

        const now = new Date();
        if (periodFilter === '7days') {
          matchesPeriod = isAfter(itemDate, subDays(now, 7));
        } else if (periodFilter === '30days') {
          matchesPeriod = isAfter(itemDate, subDays(now, 30));
        } else if (periodFilter === 'this_month') {
          matchesPeriod = isAfter(itemDate, startOfMonth(now));
        }
      }

      return matchesSearch && matchesSource && matchesPeriod;
    });
  }, [optOutList, searchTerm, sourceFilter, periodFilter]);

  // Reset pagination on filter change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, periodFilter, sourceFilter]);

  // Paginated Subset
  const totalPages = Math.ceil(filteredList.length / itemsPerPage) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredList.slice(start, start + itemsPerPage);
  }, [filteredList, currentPage]);

  // Export CSV Action
  const handleExportCSV = () => {
    if (filteredList.length === 0) {
      toast.error('Nenhum registro para exportar.');
      return;
    }

    const exportData = filteredList.map(item => {
      const formattedDate = item.optedOutAt
        ? format(
            item.optedOutAt instanceof Date ? item.optedOutAt : item.optedOutAt.toDate ? item.optedOutAt.toDate() : new Date(item.optedOutAt),
            'dd/MM/yyyy HH:mm:ss',
            { locale: ptBR }
          )
        : '-';

      const sourceLabel = 
        item.source === 'reply_stop' ? 'Automático (STOP)' :
        item.source === 'webhook' ? 'Automático (Webhook)' :
        'Manual';

      return {
        'Telefone Normalizado': item.phone,
        'Telefone Formatado': formatPhoneDisplay(item.phone),
        'Nome': item.name || 'Não informado',
        'Data Opt-Out': formattedDate,
        'Origem': sourceLabel,
        'Motivo / Observação': item.reason || '-'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Lista Opt-Out');

    const fileName = `lista_optout_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    XLSX.writeFile(workbook, fileName, { bookType: 'csv' });
    toast.success(`Exportados ${filteredList.length} registros para ${fileName}`);
  };

  // Add Opt-Out Submit
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddPhoneError('');

    const phoneValidation = normalizePhone(newPhone);
    if (!phoneValidation.isValid) {
      setAddPhoneError(phoneValidation.error || 'Número de telefone inválido.');
      return;
    }

    const id = await onAddOptOut(phoneValidation.normalized, newReason, newName);
    if (id) {
      setIsAddModalOpen(false);
      setNewPhone('');
      setNewName('');
      setNewReason('');
      setAddPhoneError('');
    }
  };

  // Delete Confirmation Submit
  const handleConfirmRemove = async () => {
    if (!itemToRemove) return;
    await onRemoveOptOut(itemToRemove.id);
    setItemToRemove(null);
  };

  return (
    <div className="space-y-6 flex flex-col h-full" id="optout-management-container">
      
      {/* Top Banner / Explanation */}
      <div className="bg-amber-500/10 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-slate-800">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-md shrink-0 mt-0.5">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base text-amber-950">Gestão da Lista de Não-Envio (Opt-Out Anti-Ban)</h3>
            <p className="text-xs text-amber-900/80 leading-relaxed mt-0.5 max-w-3xl">
              Os números listados abaixo são bloqueados automaticamente em todos os disparos de campanhas para proteger a sua reputação no WhatsApp.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold py-2 px-3.5 rounded-xl text-xs shadow-sm transition-all hover:border-slate-300"
            id="export-optout-csv-btn"
          >
            <Download className="w-4 h-4 text-slate-600" /> Exportar CSV
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-xl text-xs shadow-sm transition-all hover:shadow"
            id="add-optout-manual-btn"
          >
            <Plus className="w-4 h-4" /> Adicionar Manualmente
          </button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-3 sm:space-y-0 flex flex-col sm:flex-row items-center justify-between gap-3">
        
        {/* Search input */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Pesquisar por número, nome ou motivo..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            id="optout-search-input"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          
          {/* Period filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer"
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value as any)}
              id="optout-period-filter"
            >
              <option value="all">Todo o período</option>
              <option value="7days">Últimos 7 dias</option>
              <option value="30days">Últimos 30 dias</option>
              <option value="this_month">Este mês</option>
            </select>
          </div>

          {/* Source filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as any)}
              id="optout-source-filter"
            >
              <option value="all">Todas as origens</option>
              <option value="automatic">Automático (STOP / Webhook)</option>
              <option value="manual">Adicionado Manualmente</option>
            </select>
          </div>

        </div>
      </div>

      {/* Main Table */}
      {filteredList.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 flex flex-col items-center justify-center">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-full mb-3">
            <UserX className="w-8 h-8" />
          </div>
          <h4 className="font-bold text-slate-800 text-sm">Nenhum número de Opt-Out encontrado</h4>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            Não existem contatos na lista de bloqueio correspondentes aos filtros selecionados.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col flex-1">
          
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs border-collapse" id="optout-list-table">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-150 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Número de Telefone</th>
                  <th className="py-3 px-4">Nome do Contato</th>
                  <th className="py-3 px-4">Data do Bloqueio</th>
                  <th className="py-3 px-4">Origem</th>
                  <th className="py-3 px-4">Motivo / Observação</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedList.map((item) => {
                  const formattedDate = item.optedOutAt
                    ? format(
                        item.optedOutAt instanceof Date ? item.optedOutAt : item.optedOutAt.toDate ? item.optedOutAt.toDate() : new Date(item.optedOutAt),
                        'dd/MM/yyyy HH:mm',
                        { locale: ptBR }
                      )
                    : '-';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      
                      {/* Telefone */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {formatPhoneDisplay(item.phone)}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {item.phone}
                        </span>
                      </td>

                      {/* Nome */}
                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {item.name || '-'}
                      </td>

                      {/* Data */}
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {formattedDate}
                      </td>

                      {/* Origem */}
                      <td className="py-3 px-4">
                        {item.source === 'reply_stop' ? (
                          <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                            <Bot className="w-3 h-3" /> Automático (STOP)
                          </span>
                        ) : item.source === 'webhook' ? (
                          <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                            <Globe className="w-3 h-3" /> Webhook
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                            <UserCheck className="w-3 h-3" /> Manual
                          </span>
                        )}
                      </td>

                      {/* Motivo */}
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate" title={item.reason || ''}>
                        {item.reason || 'Sem motivo registrado'}
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setItemToRemove(item)}
                          className="inline-flex items-center gap-1 p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors font-semibold text-[11px]"
                          title="Remover número da lista"
                          id={`remove-optout-${item.id}`}
                        >
                          <Trash2 className="w-4 h-4" /> Remover
                        </button>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-4 bg-slate-50/50 border-t border-slate-150 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Exibindo contatos <span className="font-bold text-slate-700">{Math.min(filteredList.length, (currentPage - 1) * itemsPerPage + 1)}</span> a <span className="font-bold text-slate-700">{Math.min(filteredList.length, currentPage * itemsPerPage)}</span> de <span className="font-bold text-slate-700">{filteredList.length}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="font-bold text-slate-700 px-2">
                Página {currentPage} de {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      )}

      {/* MODAL 1: ADICIONAR MANUALMENTE */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" id="add-optout-modal">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-150 shadow-2xl overflow-hidden animate-scale-up">
            
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <UserX className="w-5 h-5 text-amber-600" /> Adicionar Número à Lista de Opt-Out
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-5 space-y-4">
              
              {/* Telefone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Número de Telefone (com DDD) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: 11999998888 ou (11) 99999-8888"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  value={newPhone}
                  onChange={(e) => {
                    setNewPhone(e.target.value);
                    setAddPhoneError('');
                  }}
                  required
                  id="new-optout-phone-input"
                />

                {/* Live Normalization Preview */}
                {newPhone && (
                  <div className="mt-1.5 text-[11px] font-mono">
                    {(() => {
                      const res = normalizePhone(newPhone);
                      if (res.isValid) {
                        return (
                          <span className="text-emerald-600 font-semibold flex items-center gap-1">
                            <Check className="w-3 h-3" /> Normalizado: {formatPhoneDisplay(res.normalized)} ({res.normalized})
                          </span>
                        );
                      } else {
                        return (
                          <span className="text-rose-500 font-medium">
                            ⚠️ {res.error}
                          </span>
                        );
                      }
                    })()}
                  </div>
                )}

                {addPhoneError && (
                  <p className="text-xs text-rose-500 mt-1">{addPhoneError}</p>
                )}
              </div>

              {/* Nome (Opcional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome do Contato <span className="text-slate-400 font-normal">(Opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: João da Silva"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  id="new-optout-name-input"
                />
              </div>

              {/* Motivo (Opcional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Motivo / Observação <span className="text-slate-400 font-normal">(Opcional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Solicitou cancelamento por ligação de suporte"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  id="new-optout-reason-input"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition-all"
                  id="save-optout-btn"
                >
                  Adicionar ao Bloqueio
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRMAR REMOÇÃO */}
      {itemToRemove && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" id="remove-optout-modal">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-150 shadow-2xl overflow-hidden p-6 space-y-4 text-center animate-scale-up">
            
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <h4 className="font-bold text-slate-800 text-lg">Remover Número da Lista de Opt-Out?</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Você está prestes a remover o número <strong className="text-slate-800 font-mono">{formatPhoneDisplay(itemToRemove.phone)}</strong> da lista de bloqueio.
              </p>
              <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900 text-left">
                ⚠️ Este número voltará a estar elegível para receber disparos das próximas campanhas publicadas.
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setItemToRemove(null)}
                className="py-2.5 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmRemove}
                className="py-2.5 px-6 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all"
                id="confirm-remove-optout-btn"
              >
                Sim, Remover da Lista
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
