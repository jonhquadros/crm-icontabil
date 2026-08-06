import React from 'react';
import { 
  Send, 
  CheckCircle2, 
  MessageSquareReply, 
  UserX, 
  Play, 
  Smartphone, 
  RefreshCw, 
  TrendingUp, 
  Activity, 
  Clock, 
  PieChart as PieIcon, 
  BarChart2, 
  LineChart as LineIcon,
  AlertCircle,
  Radio
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import { useCampaignDashboard } from '../hooks/useCampaignDashboard';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function CampaignsDashboard() {
  const {
    metrics,
    isLoading,
    isFetching,
    refetch,
    liveFeed,
    activeCampaigns
  } = useCampaignDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse" id="campaigns-dashboard-skeleton">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 h-28 shadow-sm" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 h-80 shadow-sm" />
          <div className="bg-white border border-slate-200 rounded-xl p-5 h-80 shadow-sm" />
        </div>
      </div>
    );
  }

  const m = metrics || {
    totalSent: 0,
    totalMessages: 0,
    totalReplied: 0,
    totalFailed: 0,
    totalPending: 0,
    totalOptOuts: 0,
    activeCampaignsCount: 0,
    deliveryRate: 0,
    responseRate: 0,
    connectedInstancesCount: 0,
    totalInstancesCount: 0,
    dispatchesByDay: [],
    statusDistribution: [],
    dispatchesByInstance: [],
    responsesByHour: []
  };

  return (
    <div className="space-y-6" id="campaigns-dashboard-container">
      {/* Header & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" /> Dashboard de Métricas & Desempenho
          </h2>
          <p className="text-xs text-slate-500">
            Acompanhe o disparo massivo, taxas de engajamento e a saúde operacional em tempo real.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 px-3.5 rounded-lg text-xs transition-all border border-slate-200 disabled:opacity-50"
            id="refresh-dashboard-btn"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isFetching ? 'animate-spin text-blue-600' : ''}`} />
            {isFetching ? 'Atualizando...' : 'Atualizar Dados'}
          </button>
        </div>
      </div>

      {/* TOP METRIC CARDS (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4" id="kpi-cards-grid">
        {/* Card 1: Mensagens Enviadas */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Total Enviadas</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800">{m.totalSent.toLocaleString()}</div>
          <p className="text-[11px] text-slate-400 mt-1">de {m.totalMessages.toLocaleString()} agendadas</p>
        </div>

        {/* Card 2: Taxa de Entrega */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Taxa de Entrega</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800">{m.deliveryRate}%</div>
          <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-600 font-medium">
            <TrendingUp className="w-3 h-3" /> Sucesso no disparo
          </div>
        </div>

        {/* Card 3: Taxa de Resposta */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Taxa de Resposta</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <MessageSquareReply className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800">{m.responseRate}%</div>
          <p className="text-[11px] text-slate-400 mt-1">{m.totalReplied.toLocaleString()} respostas ativas</p>
        </div>

        {/* Card 4: Opt-Outs */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Opt-Outs</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800">{m.totalOptOuts}</div>
          <p className="text-[11px] text-amber-700 font-medium mt-1">Lista Anti-Ban ativa</p>
        </div>

        {/* Card 5: Campanhas Ativas */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Campanhas Ativas</span>
            <div className="p-2 bg-cyan-50 text-cyan-600 rounded-lg">
              <Play className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800">{m.activeCampaignsCount}</div>
          <p className="text-[11px] text-cyan-600 font-medium mt-1 flex items-center gap-1">
            <Radio className="w-3 h-3 animate-pulse" /> Em execução
          </p>
        </div>

        {/* Card 6: Instâncias Conectadas */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Instâncias WhatsApp</span>
            <div className="p-2 bg-slate-100 text-slate-700 rounded-lg">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800">
            {m.connectedInstancesCount} / {m.totalInstancesCount}
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Conexão operando</p>
        </div>
      </div>

      {/* CHARTS GRID SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="charts-grid-section">
        {/* Chart 1: Envios Por Dia (Linha - Últimos 30 dias) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <LineIcon className="w-4 h-4 text-blue-600" /> Envios por Dia (Últimos 30 dias)
              </h3>
              <p className="text-xs text-slate-400">Volume diário de mensagens enviadas vs falhas</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={m.dispatchesByDay} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
                  itemStyle={{ color: '#38bdf8' }}
                />
                <Line type="monotone" dataKey="sent" name="Enviados" stroke="#2563eb" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="failed" name="Falhas" stroke="#f43f5e" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Status Geral das Campanhas (Pizza) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-emerald-600" /> Distribuição Geral por Status
              </h3>
              <p className="text-xs text-slate-400">Proporção entre enviados, pendentes, falhas e opt-out</p>
            </div>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={m.statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {m.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#475569' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Envios por Instância (Barras) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-indigo-600" /> Envios por Instância WhatsApp
              </h3>
              <p className="text-xs text-slate-400">Carga de disparos distribuída por cada número cadastrado</p>
            </div>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={m.dispatchesByInstance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="instance" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="sent" name="Mensagens Enviadas" fill="#4338ca" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Horário de Maior Resposta (Barras 0h-23h) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" /> Horário de Maior Engajamento
              </h3>
              <p className="text-xs text-slate-400">Distribuição de respostas recebidas por hora do dia (0h-23h)</p>
            </div>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={m.responsesByHour} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="hour" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="count" name="Respostas" fill="#f59e0b" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* REAL-TIME SECTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="realtime-sections-grid">
        {/* ACTIVE CAMPAIGNS LIVE PROGRESS */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
              Campanhas Ativas no Momento
            </h3>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
              Ao Vivo
            </span>
          </div>

          {activeCampaigns.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center border border-dashed border-slate-200 rounded-lg">
              <CheckCircle2 className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-600">Nenhuma campanha em execução agora</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                Inicie ou agende uma nova campanha para ver o progresso atualizado em tempo real.
              </p>
            </div>
          ) : (
            <div className="space-y-4 overflow-y-auto max-h-[320px] pr-1">
              {activeCampaigns.map(campaign => {
                const total = Math.max(0, campaign.metrics?.total || 0);
                const sent = Math.max(0, campaign.metrics?.sent || 0);
                const pending = Math.max(0, campaign.metrics?.pending || 0);
                const pct = total > 0 ? Math.min(100, Math.round((sent / total) * 100)) : 0;
                
                return (
                  <div key={campaign.id} className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-slate-800 truncate" title={campaign.name}>
                        {campaign.name}
                      </span>
                      <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded">
                        {campaign.status === 'running' ? 'Disparando' : 'Agendada'}
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${pct}%` }} 
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span>{sent} de {total} enviados ({pct}%)</span>
                      <span>Pendentes: {pending}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* LIVE DISPATCH FEED (LAST 10 DISPATCHES) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                Feed dos Últimos 10 Envios Realizados
              </h3>
              <p className="text-xs text-slate-400">Atualização instantânea via Firestore Listener</p>
            </div>
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Tempo Real
            </span>
          </div>

          {liveFeed.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-200 rounded-lg text-slate-400 text-xs">
              Nenhum disparo registrado no feed ao vivo até o momento.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs" id="live-feed-table">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/50">
                    <th className="py-2 px-3 font-semibold">Contato</th>
                    <th className="py-2 px-3 font-semibold">Telefone</th>
                    <th className="py-2 px-3 font-semibold">Campanha</th>
                    <th className="py-2 px-3 font-semibold">Horário</th>
                    <th className="py-2 px-3 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {liveFeed.map(item => {
                    const dateText = item.sentAt
                      ? format(item.sentAt, 'HH:mm:ss dd/MM', { locale: ptBR })
                      : item.createdAt
                      ? format(item.createdAt, 'HH:mm:ss dd/MM', { locale: ptBR })
                      : 'Em breve';

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-slate-700 truncate max-w-[130px]">
                          {item.contactName || 'Contato'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                          {item.contactPhone}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 truncate max-w-[140px]">
                          {item.campaignName || 'Campanha'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                          {dateText}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.status === 'sent'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'failed'
                              ? 'bg-rose-100 text-rose-800'
                              : item.status === 'opted_out'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {item.status === 'sent' && 'Enviado'}
                            {item.status === 'failed' && 'Falhou'}
                            {item.status === 'opted_out' && 'Opt-Out'}
                            {item.status === 'pending' && 'Pendente'}
                            {item.status === 'processing' && 'Enviando'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
