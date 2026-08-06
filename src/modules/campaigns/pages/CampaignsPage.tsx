import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Trash2, 
  Users, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Loader2, 
  UserX,
  MessageSquare,
  FileSpreadsheet,
  Copy,
  PlusCircle,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Send,
  Sliders,
  Check,
  X,
  RefreshCw,
  SlidersHorizontal,
  BarChart3,
  Layers,
  ArrowRight,
  Upload,
  Zap
} from 'lucide-react';
import { useCampaigns } from '../hooks/useCampaigns';
import { CampaignCard } from '../components/CampaignCard';
import { CampaignRepository } from '../repository/CampaignRepository';
import { CSVImporterModal } from '../components/CSVImporterModal';
import { OptOutManagement } from '../components/OptOutManagement';
import { CampaignsDashboard } from '../components/CampaignsDashboard';
import { AutomationTriggersManagement } from '../components/AutomationTriggersManagement';
import { Campaign, CampaignTemplate, CampaignContact } from '../types/campaign.types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';

export function CampaignsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    campaigns,
    optOutList,
    templates,
    loading,
    whatsappInstances,
    createCampaign,
    importContacts,
    scheduleCampaign,
    pauseCampaign,
    resumeCampaign,
    deleteCampaign,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    addOptOut,
    removeOptOut,
    reloadInstances
  } = useCampaigns();

  // Active navigation tab with URL sync
  const [activeTab, setActiveTab] = useState<'dashboard' | 'campaigns' | 'templates' | 'optout' | 'automations'>(() => {
    if (location.pathname.includes('/automations')) return 'automations';
    if (location.pathname.includes('/dashboard/campaigns/dashboard') || location.pathname.endsWith('/dashboard')) return 'dashboard';
    if (location.pathname.includes('/optout')) return 'optout';
    if (location.pathname.includes('/templates')) return 'templates';
    return 'campaigns';
  });

  useEffect(() => {
    if (location.pathname.includes('/automations') && activeTab !== 'automations') {
      setActiveTab('automations');
    } else if (location.pathname.includes('/dashboard/campaigns/dashboard') && activeTab !== 'dashboard') {
      setActiveTab('dashboard');
    } else if (location.pathname.includes('/optout') && activeTab !== 'optout') {
      setActiveTab('optout');
    } else if (location.pathname.includes('/templates') && activeTab !== 'templates') {
      setActiveTab('templates');
    } else if (location.pathname.endsWith('/campaigns') && activeTab !== 'campaigns') {
      setActiveTab('campaigns');
    }
  }, [location.pathname]);

  const handleTabChange = (tab: 'dashboard' | 'campaigns' | 'templates' | 'optout' | 'automations') => {
    setActiveTab(tab);
    if (tab === 'dashboard') {
      navigate('/dashboard/campaigns/dashboard');
    } else if (tab === 'automations') {
      navigate('/dashboard/campaigns/automations');
    } else if (tab === 'optout') {
      navigate('/dashboard/campaigns/optout');
    } else if (tab === 'templates') {
      navigate('/dashboard/campaigns/templates');
    } else {
      navigate('/dashboard/campaigns');
    }
  };

  // CSV Importer Modal State
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);
  
  // Search states
  const [campaignSearch, setCampaignSearch] = useState('');
  const [templateSearch, setTemplateSearch] = useState('');
  const [optOutSearch, setOptOutSearch] = useState('');

  // Creation Modals / Forms toggle states
  const [isNewCampaignOpen, setIsNewCampaignOpen] = useState(false);
  const [isNewTemplateOpen, setIsNewTemplateOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  // Form State: New Campaign
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignDesc, setNewCampaignDesc] = useState('');
  const [newCampaignInstance, setNewCampaignInstance] = useState('primary');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [customTemplateText, setCustomTemplateText] = useState('');
  const [delayMin, setDelayMin] = useState(45);
  const [delayMax, setDelayMax] = useState(120);
  const [scheduleDate, setScheduleDate] = useState('');

  // Form State: New Template
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [newTemplateText, setNewTemplateText] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState<'marketing' | 'alert' | 'billing' | 'accounting'>('accounting');
  const [newTemplateVariations, setNewTemplateVariations] = useState<string[]>([]);
  const [currentVariationText, setCurrentVariationText] = useState('');

  // Form State: Manual Opt-out
  const [newOptOutPhone, setNewOptOutPhone] = useState('');
  const [newOptOutReason, setNewOptOutReason] = useState('');

  // Contact Importer State (within detailed view)
  const [importTab, setImportTab] = useState<'csv' | 'manual'>('csv');
  const [manualInput, setManualInput] = useState('');
  const [parsedContacts, setParsedContacts] = useState<any[]>([]);
  const [csvFileName, setCsvFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detailed view filters
  const [contactSearch, setContactSearch] = useState('');
  const [contactStatusFilter, setContactStatusFilter] = useState<'all' | 'pending' | 'sent' | 'failed' | 'opted_out'>('all');

  // Load selected campaign real-time details from list
  const activeCampaign = campaigns.find(c => c.id === selectedCampaign?.id) || selectedCampaign;

  // Real-time contacts state for active campaign subcollection
  const [campaignContacts, setCampaignContacts] = useState<CampaignContact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<CampaignContact | null>(null);
  const [isDeletingContact, setIsDeletingContact] = useState(false);

  useEffect(() => {
    if (!activeCampaign?.id) {
      setCampaignContacts([]);
      return;
    }

    setLoadingContacts(true);
    const unsubscribe = CampaignRepository.subscribeToContacts(activeCampaign.id, (contacts) => {
      setCampaignContacts(contacts);
      setLoadingContacts(false);
    });

    return () => unsubscribe();
  }, [activeCampaign?.id]);

  // Custom Variable helper chips for building templates
  const HELPER_CHIPS = [
    { label: 'Primeiro Nome', value: '{{nome}}' },
    { label: 'Nome Completo', value: '{{nome_completo}}' },
    { label: 'Nome da Empresa', value: '{{empresa}}' },
    { label: 'Cidade do Contato', value: '{{cidade}}' },
    { label: 'Saudação Randômica', value: '{{saudacao}}' },
    { label: 'Fechamento Randômico', value: '{{fechamento}}' },
    { label: 'Abordagem Contábil', value: '{{angulo}}' }
  ];

  // CSV parsing logic
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split('\n');
      const tempContacts: any[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Auto split comma, semicolon or tab
        const delimiter = line.includes(';') ? ';' : line.includes('\t') ? '\t' : ',';
        const cols = line.split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));

        // Skip headers if matches
        if (i === 0 && (cols[0].toLowerCase().includes('nome') || cols[1]?.toLowerCase().includes('fone') || cols[1]?.toLowerCase().includes('tel'))) {
          continue;
        }

        const name = cols[0] || '';
        const rawPhone = cols[1] || '';
        const phone = rawPhone.replace(/\D/g, '');

        if (phone.length >= 8) {
          tempContacts.push({
            name,
            phone,
            company: cols[2] || '',
            city: cols[3] || '',
            email: cols[4] || ''
          });
        }
      }

      setParsedContacts(tempContacts);
      toast.success(`${tempContacts.length} contatos lidos com sucesso!`);
    };
    reader.readAsText(file);
  };

  const handleManualParse = () => {
    if (!manualInput.trim()) {
      toast.error('Insira a lista de contatos para processar');
      return;
    }

    const lines = manualInput.split('\n');
    const tempContacts: any[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;

      const delimiter = line.includes(';') ? ';' : line.includes(',') ? ',' : '\t';
      const cols = line.split(delimiter).map(c => c.trim());

      const name = cols[0] || 'Cliente';
      const rawPhone = cols[1] || cols[0] || '';
      const phone = rawPhone.replace(/\D/g, '');

      if (phone.length >= 8) {
        tempContacts.push({
          name: cols[1] ? name : 'Cliente',
          phone,
          company: cols[2] || '',
          city: cols[3] || '',
          email: cols[4] || ''
        });
      }
    }

    setParsedContacts(tempContacts);
    toast.success(`${tempContacts.length} contatos parseados da digitação!`);
  };

  const commitImport = async () => {
    if (!activeCampaign || parsedContacts.length === 0) return;

    const success = await importContacts(activeCampaign.id, parsedContacts);
    if (success) {
      setParsedContacts([]);
      setManualInput('');
      setCsvFileName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Create Campaign Action
  const handleCreateCampaignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCampaignName.trim()) {
      toast.error('Digite o nome da campanha.');
      return;
    }

    // Determine template text
    let textToUse = customTemplateText;
    let templateNameRef = 'Personalizado';
    let variationsToUse: string[] = [];

    if (selectedTemplateId) {
      const found = templates.find(t => t.id === selectedTemplateId);
      if (found) {
        textToUse = found.text;
        templateNameRef = found.name;
        variationsToUse = found.variations || [];
      }
    }

    if (!textToUse.trim()) {
      toast.error('Insira o texto do template ou selecione um modelo pronto.');
      return;
    }

    const campaignId = await createCampaign({
      name: newCampaignName,
      description: newCampaignDesc,
      status: 'draft',
      type: 'text',
      instanceId: newCampaignInstance,
      templateText: textToUse,
      templateVariations: variationsToUse,
      delayMinMs: delayMin * 1000,
      delayMaxMs: delayMax * 1000,
      batchSize: 10,
      dailyLimit: 60,
      nativeDelayMs: 3000,
      variables: [],
      scheduledAt: scheduleDate ? new Date(scheduleDate) : null,
      startedAt: null,
      completedAt: null,
      pausedAt: null,
      pauseReason: null
    });

    if (campaignId) {
      setIsNewCampaignOpen(false);
      // Clean form
      setNewCampaignName('');
      setNewCampaignDesc('');
      setCustomTemplateText('');
      setSelectedTemplateId('');
      setScheduleDate('');

      // Open new campaign directly to import contacts!
      const createdCampaignObj = campaigns.find(c => c.id === campaignId) || {
        id: campaignId,
        name: newCampaignName,
        description: newCampaignDesc,
        status: 'draft',
        instanceId: newCampaignInstance,
        templateText: textToUse,
        templateName: templateNameRef,
        templateVariations: variationsToUse,
        delayMinMs: delayMin * 1000,
        delayMaxMs: delayMax * 1000,
        metrics: { total: 0, sent: 0, pending: 0, failed: 0, optedOut: 0 }
      } as any;
      
      setSelectedCampaign(createdCampaignObj);
    }
  };

  // Create Template Action
  const handleCreateTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTemplateName.trim() || !newTemplateText.trim()) {
      toast.error('Nome e Conteúdo do template são obrigatórios.');
      return;
    }

    const mappedCategory = 
      newTemplateCategory === 'accounting' ? 'custom' :
      newTemplateCategory === 'billing' ? 'followup' :
      newTemplateCategory === 'marketing' ? 'prospecting' :
      'announcement';

    const templateId = await addTemplate({
      name: newTemplateName,
      text: newTemplateText,
      category: mappedCategory,
      variables: [],
      variations: newTemplateVariations
    });

    if (templateId) {
      setIsNewTemplateOpen(false);
      setNewTemplateName('');
      setNewTemplateDesc('');
      setNewTemplateText('');
      setNewTemplateVariations([]);
      setCurrentVariationText('');
    }
  };

  const addVariation = () => {
    if (!currentVariationText.trim()) return;
    setNewTemplateVariations([...newTemplateVariations, currentVariationText.trim()]);
    setCurrentVariationText('');
    toast.success('Variação de mensagem adicionada!');
  };

  const removeVariation = (index: number) => {
    setNewTemplateVariations(newTemplateVariations.filter((_, i) => i !== index));
  };

  // Add Opt-Out Submit
  const handleAddOptOutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = newOptOutPhone.replace(/\D/g, '');
    if (cleanPhone.length < 8) {
      toast.error('Telefone inválido');
      return;
    }

    const success = await addOptOut(cleanPhone, newOptOutReason);
    if (success) {
      setNewOptOutPhone('');
      setNewOptOutReason('');
    }
  };

  // Filter Campaigns list
  const filteredCampaigns = campaigns.filter(c => 
    c.name.toLowerCase().includes(campaignSearch.toLowerCase()) ||
    c.description?.toLowerCase().includes(campaignSearch.toLowerCase()) ||
    c.status.toLowerCase().includes(campaignSearch.toLowerCase())
  );

  // Filter Templates
  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
    t.description?.toLowerCase().includes(templateSearch.toLowerCase()) ||
    t.text.toLowerCase().includes(templateSearch.toLowerCase())
  );

  // Filter Opt-Out
  const filteredOptOut = optOutList.filter(o => 
    o.phone.includes(optOutSearch) ||
    o.reason?.toLowerCase().includes(optOutSearch.toLowerCase()) ||
    o.source.toLowerCase().includes(optOutSearch.toLowerCase())
  );

  // Filter Contacts inside detailed drawer
  const loadedContacts = campaignContacts;
  const filteredContacts = loadedContacts.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
      c.phone.includes(contactSearch) ||
      (c.email && c.email.toLowerCase().includes(contactSearch.toLowerCase()));

    const matchesStatus = contactStatusFilter === 'all' || c.status === contactStatusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 flex flex-col h-full bg-slate-50/50 p-6 rounded-2xl" id="campaigns-workspace-container">
      
      {/* Header and Action Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <Send className="w-6 h-6 text-blue-600" /> Disparador de Campanhas
          </h2>
          <p className="text-slate-500 text-sm">
            Crie, programe e gerencie seus envios em lote pelo WhatsApp de forma humanizada e segura.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => reloadInstances()}
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-lg transition-colors inline-flex items-center gap-1.5 text-xs font-semibold shadow-sm"
            title="Sincronizar Conexões"
            id="campaigns-refresh-instances-btn"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Atualizar Canal
          </button>

          {activeTab === 'campaigns' && (
            <div className="flex items-center gap-2">
              <button
                className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 px-3 rounded-lg text-xs transition-all border border-slate-200"
                onClick={() => setIsCSVModalOpen(true)}
                id="open-csv-importer-top-btn"
                title="Abrir Importador CSV / Excel"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                Importar CSV / Excel
              </button>
              <button 
                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm text-sm transition-all hover:shadow hover:scale-[1.01] active:scale-95"
                onClick={() => setIsNewCampaignOpen(true)}
                id="new-campaign-modal-trigger"
              >
                <Plus size={18} />
                Nova Campanha
              </button>
            </div>
          )}

          {activeTab === 'templates' && (
            <button 
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm text-sm transition-all hover:shadow hover:scale-[1.01] active:scale-95"
              onClick={() => setIsNewTemplateOpen(true)}
              id="new-template-modal-trigger"
            >
              <Plus size={18} />
              Criar Template
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 flex items-center gap-6" id="campaigns-tabs-nav">
        <button
          onClick={() => handleTabChange('dashboard')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all inline-flex items-center gap-2 ${
            activeTab === 'dashboard' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700 pb-3'
          }`}
          id="campaigns-tab-dashboard"
        >
          <BarChart3 className="w-4 h-4" /> Dashboard
        </button>

        <button
          onClick={() => handleTabChange('campaigns')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all inline-flex items-center gap-2 ${
            activeTab === 'campaigns' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700 pb-3'
          }`}
          id="campaigns-tab-campaigns"
        >
          <Layers className="w-4 h-4" /> Campanhas
          <span className="bg-slate-100 text-slate-600 text-xs py-0.5 px-2 rounded-full font-medium">
            {campaigns.length}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('templates')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all inline-flex items-center gap-2 ${
            activeTab === 'templates' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700 pb-3'
          }`}
          id="campaigns-tab-templates"
        >
          <MessageSquare className="w-4 h-4" /> Templates
          <span className="bg-slate-100 text-slate-600 text-xs py-0.5 px-2 rounded-full font-medium">
            {templates.length}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('automations')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all inline-flex items-center gap-2 ${
            activeTab === 'automations' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700 pb-3'
          }`}
          id="campaigns-tab-automations"
        >
          <Zap className="w-4 h-4 text-amber-500 fill-amber-500" /> Automações
        </button>

        <button
          onClick={() => handleTabChange('optout')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all inline-flex items-center gap-2 ${
            activeTab === 'optout' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700 pb-3'
          }`}
          id="campaigns-tab-optout"
        >
          <UserX className="w-4 h-4" /> Não-Envio (Opt-Out)
          <span className="bg-slate-100 text-slate-600 text-xs py-0.5 px-2 rounded-full font-medium">
            {optOutList.length}
          </span>
        </button>
      </div>

      {/* TAB CONTENT: DASHBOARD */}
      {activeTab === 'dashboard' && (
        <CampaignsDashboard />
      )}

      {/* TAB CONTENT: AUTOMATIONS */}
      {activeTab === 'automations' && (
        <AutomationTriggersManagement />
      )}

      {/* TAB CONTENT: CAMPAIGNS */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4 flex-1">
          {/* Search Box */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Pesquisar campanhas..." 
              className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm"
              value={campaignSearch}
              onChange={(e) => setCampaignSearch(e.target.value)}
              id="campaigns-search-input"
            />
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-100">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              <p className="text-slate-500 text-sm mt-3 font-medium">Carregando dados das campanhas...</p>
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-slate-100 shadow-sm p-8 flex flex-col items-center justify-center">
              <div className="p-4 bg-blue-50 rounded-full text-blue-600 mb-4">
                <Send className="w-8 h-8" />
              </div>
              <h3 className="font-semibold text-slate-800 text-lg">Nenhuma campanha criada</h3>
              <p className="text-slate-500 text-sm max-w-sm mt-1.5 leading-relaxed">
                Você ainda não criou nenhuma campanha para este escritório. Crie seu primeiro lote de disparos agora mesmo!
              </p>
              <button
                onClick={() => setIsNewCampaignOpen(true)}
                className="mt-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-lg text-sm shadow-sm transition-all hover:shadow active:scale-95 inline-flex items-center gap-2"
                id="create-first-campaign-btn"
              >
                <Plus size={16} /> Criar Minha Primeira Campanha
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="campaigns-grid">
              {filteredCampaigns.map(c => (
                <CampaignCard
                  key={c.id}
                  campaign={c}
                  onStart={scheduleCampaign}
                  onPause={pauseCampaign}
                  onResume={resumeCampaign}
                  onDelete={deleteCampaign}
                  onSelect={setSelectedCampaign}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: TEMPLATES */}
      {activeTab === 'templates' && (
        <div className="space-y-4 flex-1">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Pesquisar templates..." 
              className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm"
              value={templateSearch}
              onChange={(e) => setTemplateSearch(e.target.value)}
              id="templates-search-input"
            />
          </div>

          {filteredTemplates.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-slate-100 shadow-sm">
              <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-800">Nenhum template cadastrado</h3>
              <p className="text-slate-500 text-sm max-w-sm mx-auto mt-1">
                Simplifique o disparo criando templates dinâmicos de cobrança, boas-vindas ou informativos contábeis.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="templates-grid">
              {filteredTemplates.map(t => (
                <div key={t.id} className="bg-white border border-slate-150 rounded-xl p-5 flex flex-col justify-between shadow-sm hover:shadow transition-shadow">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <h4 className="font-bold text-slate-800 text-base">{t.name}</h4>
                      <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full ${
                        t.category === 'accounting' ? 'bg-indigo-50 text-indigo-700 border border-indigo-150' :
                        t.category === 'billing' ? 'bg-amber-50 text-amber-700 border border-amber-150' :
                        t.category === 'marketing' ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' :
                        'bg-slate-50 text-slate-700 border border-slate-150'
                      }`}>
                        {t.category === 'accounting' ? 'Contábil' : t.category === 'billing' ? 'Cobrança' : t.category === 'marketing' ? 'Marketing' : 'Alerta'}
                      </span>
                    </div>
                    {t.description && <p className="text-slate-500 text-xs mb-3">{t.description}</p>}
                    
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 text-xs text-slate-600 mb-4 whitespace-pre-wrap font-mono leading-relaxed">
                      {t.text}
                    </div>

                    {/* Show Variations counter */}
                    {t.variations && t.variations.length > 0 && (
                      <div className="mb-4 space-y-2">
                        <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                          <SlidersHorizontal className="w-3.5 h-3.5" /> Rodízio Anti-Ban: {t.variations.length} variações salvas
                        </div>
                        <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                          {t.variations.map((v, i) => (
                            <div key={i} className="text-[10px] text-slate-500 bg-slate-50/50 p-1.5 rounded border border-slate-100 line-clamp-1 italic">
                              Var {i+1}: {v}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-50 pt-3 text-xs text-slate-400">
                    <span>Usado em campanhas</span>
                    <button
                      onClick={() => deleteTemplate(t.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors"
                      title="Excluir Template"
                      id={`delete-template-btn-${t.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: OPT-OUT */}
      {activeTab === 'optout' && (
        <OptOutManagement
          optOutList={optOutList}
          onAddOptOut={addOptOut}
          onRemoveOptOut={removeOptOut}
        />
      )}


      {/* MODAL: NEW CAMPAIGN */}
      {isNewCampaignOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" id="new-campaign-modal">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-100 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-scale-up">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-blue-600" /> Configurar Nova Campanha
                </h3>
                <p className="text-xs text-slate-500">Defina os parâmetros básicos de envio da sua nova campanha.</p>
              </div>
              <button 
                onClick={() => setIsNewCampaignOpen(false)} 
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                id="close-new-campaign-modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleCreateCampaignSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nome da Campanha *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Cobrança dos Honorários Julho"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={newCampaignName}
                    onChange={(e) => setNewCampaignName(e.target.value)}
                    id="new-campaign-name-field"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Descrição</label>
                  <input
                    type="text"
                    placeholder="Ex: Lembrete com boleto anexo para clientes pendentes"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={newCampaignDesc}
                    onChange={(e) => setNewCampaignDesc(e.target.value)}
                    id="new-campaign-desc-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Canal de Envio WhatsApp *</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                    value={newCampaignInstance}
                    onChange={(e) => setNewCampaignInstance(e.target.value)}
                    id="new-campaign-instance-field"
                  >
                    <option value="primary">Instância Principal (Conectado)</option>
                    {whatsappInstances.filter(i => i.id !== 'primary').map(i => (
                      <option key={i.id} value={i.id}>{i.instanceName} ({i.status === 'connected' ? 'Conectado' : 'Desconectado'})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Selecionar Template Pronto (Opcional)</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-700"
                    value={selectedTemplateId}
                    onChange={(e) => {
                      setSelectedTemplateId(e.target.value);
                      const found = templates.find(t => t.id === e.target.value);
                      if (found) {
                        setCustomTemplateText(found.text);
                      }
                    }}
                    id="new-campaign-template-selector"
                  >
                    <option value="">-- Escrever mensagem personalizada --</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Message text workspace */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">Mensagem da Campanha *</label>
                  <span className="text-[10px] text-blue-600 font-semibold">Suporta variáveis dinâmicas</span>
                </div>
                
                <textarea
                  rows={4}
                  required
                  placeholder="Escreva o texto do disparo. Use as variáveis para humanizar, ex: Olá, {{nome}}!"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono leading-relaxed"
                  value={customTemplateText}
                  onChange={(e) => setCustomTemplateText(e.target.value)}
                  id="new-campaign-text-area"
                />

                {/* Chips wrapper */}
                <div className="mt-2.5">
                  <p className="text-[10px] font-bold text-slate-500 mb-1.5">Variáveis Disponíveis (Clique para inserir):</p>
                  <div className="flex flex-wrap gap-1.5">
                    {HELPER_CHIPS.map(chip => (
                      <button
                        key={chip.value}
                        type="button"
                        onClick={() => setCustomTemplateText(customTemplateText + ' ' + chip.value)}
                        className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-2 py-1 rounded border border-slate-200 transition-colors"
                      >
                        {chip.label} ({chip.value})
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Spacing & Delay controls */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-150 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-blue-600" /> Configurações de Delay de Envio (Anti-Ban)
                </h4>
                <p className="text-[10px] text-slate-500 leading-normal">
                  Intervalo randômico inserido entre as mensagens para evitar o bloqueio da sua conta de WhatsApp pelo algoritmo de spam.
                </p>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Delay Mínimo (Segundos)</label>
                    <input
                      type="number"
                      min={5}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:outline-none"
                      value={delayMin}
                      onChange={(e) => setDelayMin(Number(e.target.value))}
                      id="new-campaign-delay-min"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Delay Máximo (Segundos)</label>
                    <input
                      type="number"
                      min={10}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:outline-none"
                      value={delayMax}
                      onChange={(e) => setDelayMax(Number(e.target.value))}
                      id="new-campaign-delay-max"
                    />
                  </div>
                </div>
              </div>

              {/* Scheduling Trigger date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <CalendarIcon className="w-3.5 h-3.5 text-slate-400" /> Agendar Disparo (Opcional)
                </label>
                <input
                  type="datetime-local"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  id="new-campaign-schedule-date"
                />
                <p className="text-[10px] text-slate-400 mt-1">Deixe em branco para começar a disparar imediatamente assim que contatos forem carregados.</p>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5 mt-2">
                <button
                  type="button"
                  onClick={() => setIsNewCampaignOpen(false)}
                  className="py-2.5 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all shadow-sm"
                  id="new-campaign-submit-btn"
                >
                  Salvar e Importar Contatos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NEW TEMPLATE */}
      {isNewTemplateOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" id="new-template-modal">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-100 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-scale-up">
            
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-blue-600" /> Cadastrar Template Contábil
                </h3>
                <p className="text-xs text-slate-500">Crie modelos dinâmicos para agilizar seus disparos rotineiros.</p>
              </div>
              <button 
                onClick={() => setIsNewTemplateOpen(false)} 
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
                id="close-new-template-modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTemplateSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Template *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Guia de Impostos do Simples"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:outline-none"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    id="new-template-name-field"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Categoria *</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:outline-none font-medium"
                    value={newTemplateCategory}
                    onChange={(e) => setNewTemplateCategory(e.target.value as any)}
                    id="new-template-category-field"
                  >
                    <option value="accounting">Contábil / Consultivo</option>
                    <option value="billing">Cobrança de Honorários</option>
                    <option value="marketing">Marketing de Serviços</option>
                    <option value="alert">Alertas Fiscais / Informativo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descrição</label>
                <input
                  type="text"
                  placeholder="Ex: Mensagem padrão contendo guia fiscal e instruções de pagamento."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:outline-none"
                  value={newTemplateDesc}
                  onChange={(e) => setNewTemplateDesc(e.target.value)}
                  id="new-template-desc-field"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Corpo da Mensagem Principal *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Corpo da mensagem principal com variáveis dinâmicas."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none font-mono"
                  value={newTemplateText}
                  onChange={(e) => setNewTemplateText(e.target.value)}
                  id="new-template-text-field"
                />

                {/* Insert Chips helper */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {HELPER_CHIPS.map(chip => (
                    <button
                      key={chip.value}
                      type="button"
                      onClick={() => setNewTemplateText(newTemplateText + ' ' + chip.value)}
                      className="text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded border border-slate-150"
                    >
                      +{chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic variations (for spin tax or templates dynamic selection) */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" /> Variações de Mensagem (Anti-Spam)
                  </h4>
                  <span className="text-[9px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">Opcional</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Adicione variações completas da mensagem acima. O disparador rotacionará estas variações de forma randômica para cada contato para dificultar a detecção de disparos repetitivos.
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Escreva uma variação alternativa..."
                    className="flex-1 bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none"
                    value={currentVariationText}
                    onChange={(e) => setCurrentVariationText(e.target.value)}
                    id="new-template-variation-text"
                  />
                  <button
                    type="button"
                    onClick={addVariation}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 rounded-lg text-xs"
                    id="new-template-variation-add-btn"
                  >
                    Adicionar
                  </button>
                </div>

                {/* Listed variations */}
                {newTemplateVariations.length > 0 && (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pt-1">
                    {newTemplateVariations.map((v, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white border border-slate-100 rounded p-2 text-xs text-slate-600">
                        <span className="italic font-mono truncate mr-2">Var {idx+1}: {v}</span>
                        <button
                          type="button"
                          onClick={() => removeVariation(idx)}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setIsNewTemplateOpen(false)}
                  className="py-2 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all"
                  id="new-template-submit-btn"
                >
                  Salvar Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* DETAILED VIEW DRAWER / SIDE BAR / FULL WIDTH OVERLAY */}
      {activeCampaign && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-end z-50 animate-fade-in" id="campaign-details-drawer">
          <div className="bg-white max-w-4xl w-full border-l border-slate-100 shadow-2xl h-full flex flex-col overflow-hidden animate-slide-left">
            
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-slate-800 text-lg truncate">{activeCampaign.name}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    activeCampaign.status === 'draft' ? 'bg-slate-100 text-slate-600' :
                    activeCampaign.status === 'running' ? 'bg-green-100 text-green-700 animate-pulse' :
                    activeCampaign.status === 'paused' ? 'bg-amber-100 text-amber-700' :
                    activeCampaign.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {activeCampaign.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 truncate">{activeCampaign.description || 'Sem descrição cadastrada'}</p>
              </div>

              <div className="flex items-center gap-2">
                {activeCampaign.status === 'draft' && (
                  <button
                    onClick={async () => {
                      const success = await scheduleCampaign(activeCampaign.id);
                      if (success) {
                        toast.success('Disparador agendado!');
                      }
                    }}
                    disabled={loadedContacts.length === 0}
                    className={`inline-flex items-center gap-1 text-xs font-bold py-1.5 px-3 rounded-lg text-white shadow-sm transition-all ${
                      loadedContacts.length === 0 ? 'bg-slate-300 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                    title={loadedContacts.length === 0 ? 'Importe contatos primeiro' : 'Iniciar Disparos'}
                  >
                    <Send className="w-3.5 h-3.5" /> Disparar Lote
                  </button>
                )}

                <button 
                  onClick={() => setSelectedCampaign(null)}
                  className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100"
                  id="close-campaign-details"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Top info and Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 border border-slate-150 rounded-xl p-4">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total de Contatos</span>
                  <div className="text-2xl font-black text-slate-700 mt-1">{loadedContacts.length}</div>
                </div>

                <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600">Mensagens Enviadas</span>
                  <div className="text-2xl font-black text-emerald-700 mt-1">
                    {Math.max(0, activeCampaign.metrics?.sent || 0)}
                  </div>
                </div>

                <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600">Respostas / Opt-Outs</span>
                  <div className="text-2xl font-black text-amber-700 mt-1">
                    {Math.max(0, activeCampaign.metrics?.optedOut || 0)}
                  </div>
                </div>

                <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-4">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-rose-600">Falhas no Envio</span>
                  <div className="text-2xl font-black text-rose-700 mt-1">
                    {Math.max(0, activeCampaign.metrics?.failed || 0)}
                  </div>
                </div>
              </div>

              {/* Message Template display inside campaign details */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-150 text-xs">
                <div className="font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600" /> Conteúdo do Disparo Utilizado
                </div>
                <p className="italic font-mono text-slate-600 mt-1.5 whitespace-pre-wrap leading-relaxed bg-white border border-slate-100 p-3 rounded-lg shadow-sm">
                  {activeCampaign.templateText}
                </p>
                {activeCampaign.templateVariations && activeCampaign.templateVariations.length > 0 && (
                  <div className="mt-2.5">
                    <span className="text-[10px] font-bold text-slate-500">Variações Ativas no Rodízio:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {activeCampaign.templateVariations.map((v, i) => (
                        <span key={i} className="text-[9px] bg-slate-100 text-slate-600 border border-slate-200 py-0.5 px-2 rounded max-w-xs truncate" title={v}>
                          V{i+1}: {v}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* IMPORT CONTACTS WORKSPACE (Only show if campaign status is draft) */}
              {activeCampaign.status === 'draft' && (
                <div className="border border-blue-150 bg-blue-50/20 rounded-xl p-5 space-y-4">
                  <div>
                    <h4 className="font-bold text-blue-900 text-sm flex items-center gap-1.5">
                      <Users className="w-4 h-4" /> Importar Novos Contatos para a Campanha
                    </h4>
                    <p className="text-[11px] text-blue-700 leading-relaxed mt-0.5">
                      Faça o upload de uma planilha CSV ou simplesmente cole o nome e o telefone do seu lote.
                    </p>
                  </div>

                  <div className="flex border-b border-slate-200">
                    <button
                      onClick={() => setImportTab('csv')}
                      className={`pb-2 text-xs font-bold border-b-2 mr-4 ${
                        importTab === 'csv' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'
                      }`}
                    >
                      Planilha CSV
                    </button>
                    <button
                      onClick={() => setImportTab('manual')}
                      className={`pb-2 text-xs font-bold border-b-2 ${
                        importTab === 'manual' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'
                      }`}
                    >
                      Copiar & Colar
                    </button>
                  </div>

                  {/* SUBTAB: CSV */}
                  {importTab === 'csv' && (
                    <div className="space-y-3">
                      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
                        <button
                          type="button"
                          onClick={() => setIsCSVModalOpen(true)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg text-xs transition-all shadow-sm flex items-center justify-center gap-2"
                        >
                          <Upload className="w-4 h-4" />
                          Abrir Importador CSV / Excel Completo (Com Mapeamento & Validação)
                        </button>
                        <p className="text-[11px] text-slate-500 text-center">
                          Suporta arquivos .csv, .xlsx, .xls com mapeamento de colunas, validação de números, remoção de duplicatas e filtro de opt-out.
                        </p>
                      </div>

                      <div className="border-2 border-dashed border-slate-200 rounded-lg p-3 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer bg-white relative">
                        <input
                          type="file"
                          accept=".csv"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={handleCsvUpload}
                          ref={fileInputRef}
                        />
                        <FileSpreadsheet className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                        <span className="text-[11px] font-bold text-slate-600 block">
                          {csvFileName || 'Ou clique para seleção simples de arquivo .csv'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* SUBTAB: MANUAL */}
                  {importTab === 'manual' && (
                    <div className="space-y-3 bg-white p-3 rounded-lg border border-slate-150">
                      <textarea
                        rows={3}
                        placeholder="Exemplo:&#10;João;5511999998888;Minha Empresa;São Paulo&#10;Maria;5521988887777;Outra Empresa;Rio de Janeiro"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none font-mono"
                        value={manualInput}
                        onChange={(e) => setManualInput(e.target.value)}
                      />
                      <button
                        onClick={handleManualParse}
                        className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-1.5 px-4 rounded text-xs inline-flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" /> Processar Texto
                      </button>
                    </div>
                  )}

                  {/* Preview of Parsed Contacts before importing */}
                  {parsedContacts.length > 0 && (
                    <div className="bg-white border border-slate-150 rounded-lg p-3 space-y-3 animate-fade-in">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {parsedContacts.length} contatos lidos
                        </span>
                        <button onClick={() => setParsedContacts([])} className="text-rose-500 hover:underline text-[10px]">
                          Limpar tudo
                        </button>
                      </div>

                      {/* Micro list preview */}
                      <div className="max-h-24 overflow-y-auto border border-slate-50 rounded p-1.5 space-y-1 text-[10px] text-slate-600 bg-slate-50/50">
                        {parsedContacts.slice(0, 10).map((c, idx) => (
                          <div key={idx} className="flex justify-between">
                            <strong>{c.name}</strong>
                            <span className="font-mono text-slate-400">{c.phone} {c.company ? `(${c.company})` : ''}</span>
                          </div>
                        ))}
                        {parsedContacts.length > 10 && (
                          <div className="text-[9px] text-slate-400 italic text-center pt-1">
                            e mais {parsedContacts.length - 10} contatos...
                          </div>
                        )}
                      </div>

                      <button
                        onClick={commitImport}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded text-xs transition-colors shadow-sm inline-flex items-center justify-center gap-1.5"
                      >
                        Salvar {parsedContacts.length} Contatos na Campanha <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* LISTED CONTACTS IN CAMPAIGN */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-2">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-blue-600" /> Lista de Contatos da Campanha ({loadedContacts.length})
                  </h4>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {/* Search inside list */}
                    <div className="relative flex-1 sm:flex-initial">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                      <input
                        type="text"
                        placeholder="Pesquisar..."
                        className="bg-slate-50 border border-slate-200 rounded-lg py-1 pl-7 pr-2.5 text-xs focus:outline-none w-full"
                        value={contactSearch}
                        onChange={(e) => setContactSearch(e.target.value)}
                      />
                    </div>

                    {/* Status filter dropdown */}
                    <select
                      className="bg-slate-50 border border-slate-200 rounded-lg py-1 px-2 text-xs focus:outline-none text-slate-600"
                      value={contactStatusFilter}
                      onChange={(e) => setContactStatusFilter(e.target.value as any)}
                    >
                      <option value="all">Todos os status</option>
                      <option value="pending">Pendente</option>
                      <option value="sent">Enviado</option>
                      <option value="failed">Falhou</option>
                      <option value="opted_out">Opt-out</option>
                    </select>
                  </div>
                </div>

                {loadingContacts ? (
                  <div className="flex items-center justify-center py-10 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-500 gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    Carregando contatos da campanha...
                  </div>
                ) : filteredContacts.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-400">
                    Nenhum contato encontrado com os filtros ativos nesta campanha.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-150 bg-white shadow-sm">
                    <table className="w-full border-collapse text-left text-xs" id="campaign-contacts-list-table">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-bold">
                          <th className="py-2 px-3 font-semibold">Contato</th>
                          <th className="py-2 px-3 font-semibold">Telefone</th>
                          <th className="py-2 px-3 font-semibold">Empresa / Cidade</th>
                          <th className="py-2 px-3 font-semibold">Status</th>
                          <th className="py-2 px-3 font-semibold">Registro de Envio</th>
                          <th className="py-2 px-3 font-semibold text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredContacts.map(c => {
                          const sendDate = c.sentAt 
                            ? format(c.sentAt instanceof Date ? c.sentAt : (c.sentAt as any).toDate(), 'dd/MM HH:mm', { locale: ptBR })
                            : c.failedAt
                            ? format(c.failedAt instanceof Date ? c.failedAt : (c.failedAt as any).toDate(), 'dd/MM HH:mm', { locale: ptBR })
                            : '';
                          return (
                            <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                              <td className="py-2 px-3">
                                <div className="font-semibold text-slate-700">{c.name}</div>
                                {c.email && <div className="text-[10px] text-slate-400">{c.email}</div>}
                              </td>
                              <td className="py-2 px-3 font-mono text-slate-600">{c.phone}</td>
                              <td className="py-2 px-3 text-slate-500">
                                <div>{c.company || '-'}</div>
                                {c.city && <div className="text-[10px] text-slate-400">{c.city}</div>}
                              </td>
                              <td className="py-2 px-3">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  c.status === 'pending' ? 'bg-slate-100 text-slate-600' :
                                  c.status === 'sent' ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' :
                                  c.status === 'opted_out' ? 'bg-amber-50 text-amber-700 border border-amber-150' :
                                  'bg-rose-50 text-rose-700 border border-rose-150'
                                }`}>
                                  {c.status === 'pending' ? 'Pendente' :
                                   c.status === 'sent' ? 'Enviado' :
                                   c.status === 'opted_out' ? 'Não enviado (Opt-Out)' :
                                   'Falhou'}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-slate-500">
                                {c.status === 'sent' && (
                                  <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                                    <Check className="w-3.5 h-3.5" /> {sendDate}
                                  </div>
                                )}
                                {c.status === 'failed' && (
                                  <div className="text-[10px] text-rose-600 font-medium leading-tight">
                                    <div>Falha: {sendDate}</div>
                                    <div className="text-[9px] text-rose-400 line-clamp-1 italic" title={c.failReason}>{c.failReason}</div>
                                  </div>
                                )}
                                {c.status === 'pending' && <span className="text-slate-400">-</span>}
                                {c.status === 'opted_out' && <span className="text-amber-500 text-[10px] font-semibold">Excluído (Opt-Out)</span>}
                              </td>
                              <td className="py-2 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => setContactToDelete(c)}
                                  className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                                  title="Excluir contato"
                                  id={`delete-contact-btn-${c.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
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
        </div>
      )}

      {/* MODAL: EXCLUIR CONTATO CONFIRMAÇÃO */}
      {contactToDelete && activeCampaign && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-6 max-w-sm w-full space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-50 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">Remover Contato</h3>
                <p className="text-[11px] text-slate-400">Esta ação não pode ser desfeita</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
              Tem certeza que deseja remover <strong className="text-slate-800">{contactToDelete.name}</strong> (<span className="font-mono text-slate-700">{contactToDelete.phone}</span>) da lista desta campanha?
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                disabled={isDeletingContact}
                onClick={() => setContactToDelete(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeletingContact}
                onClick={async () => {
                  try {
                    setIsDeletingContact(true);
                    await CampaignRepository.deleteContact(activeCampaign.id, contactToDelete.id, contactToDelete.status);
                    toast.success('Contato removido com sucesso!');
                    setContactToDelete(null);
                  } catch (err) {
                    console.error('Erro ao remover contato:', err);
                    toast.error('Erro ao remover contato. Tente novamente.');
                  } finally {
                    setIsDeletingContact(false);
                  }
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDeletingContact ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  'Confirmar Exclusão'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CSV IMPORTER */}
      <CSVImporterModal
        isOpen={isCSVModalOpen}
        onClose={() => setIsCSVModalOpen(false)}
        onImport={async (contacts) => {
          const campaignToUse = activeCampaign || selectedCampaign;
          if (!campaignToUse) {
            toast.error('Nenhuma campanha selecionada para receber os contatos.');
            return false;
          }
          return await importContacts(campaignToUse.id, contacts);
        }}
        optOutList={optOutList}
        campaignName={activeCampaign?.name || selectedCampaign?.name}
      />

    </div>
  );
}
