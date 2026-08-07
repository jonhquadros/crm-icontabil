import React, { useState, useRef, useId } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  UserX, 
  ArrowRight, 
  RefreshCw, 
  Loader2, 
  FileCheck,
  Filter,
  Check
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { normalizePhone, formatPhoneDisplay } from '../utils/phoneUtils';
import { OptOut, CampaignContact } from '../types/campaign.types';
import toast from 'react-hot-toast';

interface CSVImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (
    contacts: Omit<
      CampaignContact, 
      'id' | 'campaignId' | 'companyId' | 'active' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'status' | 'sentAt' | 'failedAt' | 'failReason' | 'retries' | 'messageId' | 'optedOutAt'
    >[]
  ) => Promise<boolean>;
  optOutList: OptOut[];
  campaignName?: string;
}

interface ColumnMapping {
  phoneCol: string;
  nameCol: string;
  companyCol: string;
  cityCol: string;
  emailCol: string;
  socialCapitalCol: string;
}

interface ProcessedRow {
  rawRowIndex: number;
  rawPhone: string;
  name: string;
  company: string;
  city: string;
  email: string;
  taxRegime?: string;
  socialCapital: string;

  normalizedPhone: string;
  isValid: boolean;
  validationError?: string;

  isDuplicate: boolean;
  isOptOut: boolean;
}

export function CSVImporterModal({
  isOpen,
  onClose,
  onImport,
  optOutList,
  campaignName
}: CSVImporterModalProps) {
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Flow step state: 1 = File Upload, 2 = Mapping & Preview, 3 = Importing Progress, 4 = Final Report
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // File & Parsing state
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);

  // Column Mapping State
  const [mapping, setMapping] = useState<ColumnMapping>({
    phoneCol: '',
    nameCol: '',
    companyCol: '',
    cityCol: '',
    emailCol: '',
    socialCapitalCol: ''
  });

  // Processed Rows State
  const [processedRows, setProcessedRows] = useState<ProcessedRow[]>([]);
  const [internalDuplicatesCount, setInternalDuplicatesCount] = useState(0);
  const [optOutCount, setOptOutCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [validContacts, setValidContacts] = useState<ProcessedRow[]>([]);

  // Import Execution state
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [finalReport, setFinalReport] = useState<{
    successCount: number;
    optOutCount: number;
    errorCount: number;
    duplicatesCount: number;
  } | null>(null);

  if (!isOpen) return null;

  const resetAll = () => {
    setStep(1);
    setFileName('');
    setHeaders([]);
    setRawRows([]);
    setMapping({ phoneCol: '', nameCol: '', companyCol: '', cityCol: '', emailCol: '', socialCapitalCol: '' });
    setProcessedRows([]);
    setInternalDuplicatesCount(0);
    setOptOutCount(0);
    setErrorCount(0);
    setValidContacts([]);
    setImportProgress(0);
    setIsImporting(false);
    setFinalReport(null);
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  // Step 1: Handle File Read via XLSX
  const processFile = (file: File) => {
    if (!file) return;

    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!['.csv', '.xlsx', '.xls'].includes(ext)) {
      toast.error('Formato inválido. Por favor envie um arquivo .csv, .xlsx ou .xls');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const json: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (json.length === 0) {
          toast.error('O arquivo importado está vazio.');
          return;
        }

        const detectedHeaders = Object.keys(json[0] || {});
        setHeaders(detectedHeaders);
        setRawRows(json);

        // Auto-detect columns
        const autoMapping: ColumnMapping = {
          phoneCol: '',
          nameCol: '',
          companyCol: '',
          cityCol: '',
          emailCol: '',
          socialCapitalCol: ''
        };

        detectedHeaders.forEach((h) => {
          const lower = h.toLowerCase().trim();
          if (!autoMapping.phoneCol && (lower.includes('telef') || lower.includes('cel') || lower.includes('whats') || lower.includes('phone') || lower.includes('contato'))) {
            autoMapping.phoneCol = h;
          } else if (!autoMapping.nameCol && (lower.includes('nome') || lower.includes('name') || lower.includes('cliente'))) {
            autoMapping.nameCol = h;
          } else if (!autoMapping.companyCol && (lower.includes('empresa') || lower.includes('company') || lower.includes('razao') || lower.includes('razão') || lower.includes('cnae'))) {
            autoMapping.companyCol = h;
          } else if (!autoMapping.cityCol && (lower.includes('cidade') || lower.includes('city') || lower.includes('municipio'))) {
            autoMapping.cityCol = h;
          } else if (!autoMapping.emailCol && (lower.includes('email') || lower.includes('e-mail') || lower.includes('mail'))) {
            autoMapping.emailCol = h;
          } else if (!autoMapping.socialCapitalCol && (lower.includes('capital') || lower.includes('cap. social') || lower.includes('capsocial'))) {
            autoMapping.socialCapitalCol = h;
          }
        });

        // Fallback: if phoneCol not detected, pick the first column
        if (!autoMapping.phoneCol && detectedHeaders.length > 0) {
          autoMapping.phoneCol = detectedHeaders[0];
        }

        setMapping(autoMapping);
        setStep(2);
        // Automatically process rows with initial mapping
        evaluateRows(json, autoMapping);
      } catch (err: any) {
        console.error('Erro ao ler planilha:', err);
        toast.error('Falha ao processar arquivo: ' + err.message);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Step 2: Evaluate and validate all rows based on current mapping
  const evaluateRows = (rowsData = rawRows, currentMapping = mapping) => {
    if (!currentMapping.phoneCol) return;

    // Build Set of active opt-out phones for instant lookup
    const optOutPhoneSet = new Set<string>();
    optOutList.forEach(o => {
      if (o.phone) {
        optOutPhoneSet.add(o.phone.replace(/\D/g, ''));
      }
    });

    const seenPhonesInFile = new Set<string>();
    const processed: ProcessedRow[] = [];
    let dupsCount = 0;
    let optOuts = 0;
    let errors = 0;
    const valids: ProcessedRow[] = [];

    rowsData.forEach((row, idx) => {
      const rawPhoneVal = row[currentMapping.phoneCol];
      const nameVal = currentMapping.nameCol ? String(row[currentMapping.nameCol] || '').trim() : '';
      const companyVal = currentMapping.companyCol ? String(row[currentMapping.companyCol] || '').trim() : '';
      const cityVal = currentMapping.cityCol ? String(row[currentMapping.cityCol] || '').trim() : '';
      const emailVal = currentMapping.emailCol ? String(row[currentMapping.emailCol] || '').trim() : '';
      const socialCapitalVal = currentMapping.socialCapitalCol ? String(row[currentMapping.socialCapitalCol] || '').trim() : '';

      const phoneValidation = normalizePhone(rawPhoneVal);

      let isDuplicate = false;
      let isOptOut = false;
      let isValid = phoneValidation.isValid;
      let validationError = phoneValidation.error;

      if (isValid) {
        // Check for internal duplication
        if (seenPhonesInFile.has(phoneValidation.normalized)) {
          isDuplicate = true;
          isValid = false;
          validationError = 'Duplicado dentro do próprio arquivo';
          dupsCount++;
        } else {
          seenPhonesInFile.add(phoneValidation.normalized);

          // Check for Opt-Out list match
          if (optOutPhoneSet.has(phoneValidation.normalized)) {
            isOptOut = true;
            isValid = false;
            validationError = 'Número cadastrado na lista de Opt-Out (Não-envio)';
            optOuts++;
          }
        }
      } else {
        errors++;
      }

      const processedItem: ProcessedRow = {
        rawRowIndex: idx + 1,
        rawPhone: String(rawPhoneVal || ''),
        name: nameVal || `Contato ${idx + 1}`,
        company: companyVal,
        city: cityVal,
        email: emailVal,
        socialCapital: socialCapitalVal,
        normalizedPhone: phoneValidation.normalized,
        isValid,
        validationError,
        isDuplicate,
        isOptOut
      };

      processed.push(processedItem);
      if (isValid) {
        valids.push(processedItem);
      }
    });

    setProcessedRows(processed);
    setInternalDuplicatesCount(dupsCount);
    setOptOutCount(optOuts);
    setErrorCount(errors);
    setValidContacts(valids);
  };

  const handleMappingChange = (field: keyof ColumnMapping, value: string) => {
    const updated = { ...mapping, [field]: value };
    setMapping(updated);
    evaluateRows(rawRows, updated);
  };

  // Step 3: Start Import Execution
  const executeImport = async () => {
    if (validContacts.length === 0) {
      toast.error('Nenhum contato válido para importar.');
      return;
    }

    setStep(3);
    setIsImporting(true);
    setImportProgress(10);

    const formattedContacts = validContacts.map(c => ({
      phone: c.normalizedPhone || '',
      name: c.name || '',
      company: c.company || '',
      city: c.city || '',
      email: c.email || '',
      taxRegime: c.taxRegime || '',
      socialCapital: c.socialCapital || ''
    }));

    // Chunk progress simulation for UI responsiveness
    const total = formattedContacts.length;
    let loaded = 0;
    const chunkSize = 150;

    try {
      for (let i = 0; i < total; i += chunkSize) {
        const chunk = formattedContacts.slice(i, i + chunkSize);
        await onImport(chunk);
        loaded += chunk.length;
        const pct = Math.min(100, Math.round((loaded / total) * 100));
        setImportProgress(pct);
      }

      setFinalReport({
        successCount: validContacts.length,
        optOutCount,
        errorCount,
        duplicatesCount: internalDuplicatesCount
      });

      setIsImporting(false);
      setStep(4);
    } catch (err: any) {
      console.error('Error during import execution:', err);
      toast.error('Erro na importação: ' + err.message);
      setIsImporting(false);
      setStep(2);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" id="csv-importer-modal">
      <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-150 shadow-2xl flex flex-col overflow-hidden max-h-[90vh] animate-scale-up">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-100/80 text-blue-600 rounded-xl">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Importador CSV / Excel Completo</h3>
              <p className="text-xs text-slate-500">
                {campaignName ? `Importando contatos para "${campaignName}"` : 'Validação linha a linha, normalização 55+DDD e filtro de Opt-out'}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors"
            id="close-csv-modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* STEP 1: UPLOAD ZONE */}
          {step === 1 && (
            <div className="space-y-6">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-4 ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-50/50 scale-[0.99]' 
                    : 'border-slate-200 bg-slate-50/40 hover:border-blue-400 hover:bg-blue-50/20'
                }`}
                id="csv-dropzone"
              >
                <input
                  id={fileInputId}
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  className="hidden"
                  onChange={handleFileInputChange}
                  ref={fileInputRef}
                />

                <div className="w-16 h-16 rounded-2xl bg-white border border-slate-150 shadow-sm flex items-center justify-center text-blue-600">
                  <Upload className="w-8 h-8" />
                </div>

                <div>
                  <span className="text-sm font-bold text-slate-800 block">
                    Arraste seu arquivo CSV ou Excel aqui, ou clique para navegar
                  </span>
                  <span className="text-xs text-slate-500 mt-1 block">
                    Suporta arquivos nos formatos <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-blue-600">.csv</code>, <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-blue-600">.xlsx</code> e <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-blue-600">.xls</code>
                  </span>
                </div>

                <div className="flex items-center gap-4 text-[11px] text-slate-400 border-t border-slate-200/60 pt-4 mt-2">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Normalização automática 55+DDD
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Remoção de duplicatas
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Cruzamento com Opt-Out
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: COLUMN MAPPING & VALIDATION PREVIEW */}
          {step === 2 && (
            <div className="space-y-6">
              
              {/* File details bar */}
              <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-blue-600" />
                  <div>
                    <span className="font-bold text-slate-800">{fileName}</span>
                    <span className="text-slate-500 ml-2">({rawRows.length} linhas lidas)</span>
                  </div>
                </div>

                <button
                  onClick={() => setStep(1)}
                  className="text-blue-600 hover:text-blue-800 font-bold inline-flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Alterar Arquivo
                </button>
              </div>

              {/* Column Mapping Selectors */}
              <div className="bg-white border border-slate-150 rounded-xl p-5 space-y-4 shadow-sm">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Filter className="w-4 h-4 text-blue-600" /> Mapeamento de Colunas do Arquivo
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  
                  {/* Telefone (Required) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Telefone <span className="text-rose-500">* (Obrigatório)</span>
                    </label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      value={mapping.phoneCol}
                      onChange={(e) => handleMappingChange('phoneCol', e.target.value)}
                      id="map-phone-col"
                    >
                      <option value="">Selecione a coluna de Telefone</option>
                      {headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Nome (Optional) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nome do Contato
                    </label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium focus:outline-none"
                      value={mapping.nameCol}
                      onChange={(e) => handleMappingChange('nameCol', e.target.value)}
                      id="map-name-col"
                    >
                      <option value="">Ignorar / Não Mapear</option>
                      {headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* CNAE Principal (Optional) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      CNAE Principal
                    </label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium focus:outline-none"
                      value={mapping.companyCol}
                      onChange={(e) => handleMappingChange('companyCol', e.target.value)}
                      id="map-company-col"
                    >
                      <option value="">Ignorar / Não Mapear</option>
                      {headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Cidade (Optional) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Cidade
                    </label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium focus:outline-none"
                      value={mapping.cityCol}
                      onChange={(e) => handleMappingChange('cityCol', e.target.value)}
                      id="map-city-col"
                    >
                      <option value="">Ignorar / Não Mapear</option>
                      {headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Email (Optional) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      E-mail
                    </label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium focus:outline-none"
                      value={mapping.emailCol}
                      onChange={(e) => handleMappingChange('emailCol', e.target.value)}
                      id="map-email-col"
                    >
                      <option value="">Ignorar / Não Mapear</option>
                      {headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Capital Social da Empresa (Optional) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Capital Social da Empresa
                    </label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      value={mapping.socialCapitalCol}
                      onChange={(e) => handleMappingChange('socialCapitalCol', e.target.value)}
                      id="map-socialcapital-col"
                    >
                      <option value="">Ignorar / Não Mapear</option>
                      {headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                </div>
              </div>

              {/* STATS SUMMARY CARDS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-emerald-50 border border-emerald-150 rounded-xl p-3 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
                    Válidos p/ Importar
                  </span>
                  <span className="text-xl font-black text-emerald-700 mt-0.5 block">
                    {validContacts.length}
                  </span>
                </div>

                <div className="bg-amber-50 border border-amber-150 rounded-xl p-3 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block">
                    Ignorados (Opt-Out)
                  </span>
                  <span className="text-xl font-black text-amber-700 mt-0.5 block">
                    {optOutCount}
                  </span>
                </div>

                <div className="bg-rose-50 border border-rose-150 rounded-xl p-3 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block">
                    Erros no Telefone
                  </span>
                  <span className="text-xl font-black text-rose-700 mt-0.5 block">
                    {errorCount}
                  </span>
                </div>

                <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                    Duplicatas no Arquivo
                  </span>
                  <span className="text-xl font-black text-slate-700 mt-0.5 block">
                    {internalDuplicatesCount}
                  </span>
                </div>
              </div>

              {/* PREVIEW TABLE OF FIRST 10 CONTACTS */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">
                    Preview dos Primeiros 10 Contatos (Linha a Linha)
                  </span>
                  <span className="text-slate-400">
                    Exibindo 10 de {processedRows.length} linhas lidas
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 font-bold">
                        <th className="py-2.5 px-3">Linha</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Telefone Lido</th>
                        <th className="py-2.5 px-3">Telefone Normalizado (55+)</th>
                        <th className="py-2.5 px-3">Nome</th>
                        <th className="py-2.5 px-3">CNAE Principal / Cidade</th>
                        <th className="py-2.5 px-3">Cap. Social</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processedRows.slice(0, 10).map((row) => (
                        <tr
                          key={row.rawRowIndex}
                          className={`border-b border-slate-100 transition-colors ${
                            !row.isValid && !row.isOptOut && !row.isDuplicate 
                              ? 'bg-rose-50/60 hover:bg-rose-50' 
                              : row.isOptOut 
                              ? 'bg-amber-50/60 hover:bg-amber-50'
                              : row.isDuplicate
                              ? 'bg-slate-100/60 hover:bg-slate-100'
                              : 'hover:bg-slate-50/50'
                          }`}
                        >
                          <td className="py-2.5 px-3 font-mono text-slate-400">#{row.rawRowIndex}</td>

                          <td className="py-2.5 px-3">
                            {row.isValid ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                <Check className="w-3 h-3" /> Válido
                              </span>
                            ) : row.isOptOut ? (
                              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-[10px] font-bold" title={row.validationError}>
                                <UserX className="w-3 h-3" /> Opt-Out
                              </span>
                            ) : row.isDuplicate ? (
                              <span className="inline-flex items-center gap-1 bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-[10px] font-bold" title={row.validationError}>
                                Duplicado
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full text-[10px] font-bold" title={row.validationError}>
                                <AlertCircle className="w-3 h-3" /> {row.validationError || 'Erro'}
                              </span>
                            )}
                          </td>

                          <td className="py-2.5 px-3 font-mono text-slate-600">{row.rawPhone || '-'}</td>

                          <td className={`py-2.5 px-3 font-mono font-bold ${row.isValid ? 'text-emerald-700' : 'text-slate-500'}`}>
                            {row.normalizedPhone ? formatPhoneDisplay(row.normalizedPhone) : '-'}
                          </td>

                          <td className="py-2.5 px-3 font-semibold text-slate-700">{row.name}</td>

                          <td className="py-2.5 px-3 text-slate-500">
                            <div>{row.company || '-'}</div>
                            {row.city && <div className="text-[10px] text-slate-400">{row.city}</div>}
                          </td>

                          <td className="py-2.5 px-3 text-slate-500">
                            {row.socialCapital && <div className="text-xs font-semibold text-slate-700">{row.socialCapital}</div>}
                            {!row.socialCapital && <span className="text-slate-300">-</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* STEP 3: PROGRESS BAR DURING IMPORT */}
          {step === 3 && (
            <div className="py-12 flex flex-col items-center justify-center space-y-6 text-center">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />

              <div>
                <h4 className="text-lg font-bold text-slate-800">Importando contatos para a campanha...</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Salvando lote de {validContacts.length} contatos no banco de dados com segurança.
                </p>
              </div>

              {/* Progress Bar Container */}
              <div className="w-full max-w-md bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200 p-0.5">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-300 shadow-sm"
                  style={{ width: `${importProgress}%` }}
                />
              </div>

              <span className="text-xs font-mono font-bold text-blue-600">
                {importProgress}% Concluído
              </span>
            </div>
          )}

          {/* STEP 4: FINAL SUMMARY REPORT */}
          {step === 4 && finalReport && (
            <div className="py-6 space-y-6 text-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h4 className="text-xl font-bold text-slate-800">Relatório de Importação Concluído!</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Seu lote foi processado e adicionado à campanha com sucesso.
                </p>
              </div>

              {/* Summary Badges Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto text-left">
                <div className="bg-emerald-50 border border-emerald-150 p-4 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-emerald-600">Importados com Sucesso</span>
                  <div className="text-2xl font-black text-emerald-700 mt-1">{finalReport.successCount}</div>
                </div>

                <div className="bg-amber-50 border border-amber-150 p-4 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-amber-600">Ignorados (Opt-Out)</span>
                  <div className="text-2xl font-black text-amber-700 mt-1">{finalReport.optOutCount}</div>
                </div>

                <div className="bg-rose-50 border border-rose-150 p-4 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-rose-600">Ignorados (Erro no nº)</span>
                  <div className="text-2xl font-black text-rose-700 mt-1">{finalReport.errorCount}</div>
                </div>

                <div className="bg-slate-100 border border-slate-200 p-4 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-600">Duplicatas Filtradas</span>
                  <div className="text-2xl font-black text-slate-700 mt-1">{finalReport.duplicatesCount}</div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <button
            type="button"
            onClick={handleClose}
            className="py-2 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            {step === 4 ? 'Fechar' : 'Cancelar'}
          </button>

          {step === 2 && (
            <button
              type="button"
              onClick={executeImport}
              disabled={validContacts.length === 0}
              className={`py-2.5 px-6 rounded-lg text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-all ${
                validContacts.length === 0 ? 'bg-slate-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow'
              }`}
              id="confirm-import-btn"
            >
              Confirmar Importação de {validContacts.length} Contatos <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {step === 4 && (
            <button
              type="button"
              onClick={handleClose}
              className="py-2.5 px-6 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
            >
              Concluir
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
