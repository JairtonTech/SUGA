import React, { useState, useEffect, useRef } from 'react';
import { ViewState, Process } from '../types';
import { db } from '../firebase';
import { collection, addDoc, query, orderBy, onSnapshot, deleteDoc, doc, Timestamp, updateDoc } from 'firebase/firestore';
import * as XLSX from 'xlsx';

interface ProcessSuiteProps {
  navigate: (view: ViewState) => void;
  user?: any; 
}

// Helper component to highlight text
const HighlightText = ({ text, highlight }: { text: string, highlight: string }) => {
  const val = text || '';
  if (!highlight.trim()) {
    return <span>{val}</span>;
  }

  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  const regex = new RegExp(`(${escapeRegExp(highlight)})`, 'gi');
  const parts = val.split(regex);

  return (
    <span>
      {parts.map((part, i) => 
        part.toLowerCase() === highlight.toLowerCase() ? (
          <span key={i} className="bg-yellow-300 text-black font-extrabold px-0.5 rounded-sm shadow-sm border-b-2 border-yellow-500">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};

export const ProcessSuite: React.FC<ProcessSuiteProps> = ({ navigate, user }) => {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState(''); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Define Permissions
  const role = user?.role;
  const canWrite = role === 'admin' || role === 'operador';
  const canDelete = role === 'admin';

  // Form State
  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    nup: '',
    description: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'processes'), orderBy('data', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(processDoc => ({
        id: processDoc.id,
        ...processDoc.data()
      })) as Process[];
      setProcesses(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Calculate Available Years from data
  const availableYears = Array.from(new Set(processes.map(p => 
    p.data ? p.data.substring(0, 4) : ''
  ))).filter((y: string) => y && /^\d{4}$/.test(y)).sort().reverse();

  // Filter processes (Search Term + Year)
  const filteredProcesses = processes.filter(p => {
    const matchesSearch = p.nup.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const processYear = p.data ? p.data.substring(0, 4) : '';
    const matchesYear = selectedYear === '' || processYear === selectedYear;

    return matchesSearch && matchesYear;
  });

  // Selection Logic
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      // Select all visible items
      setSelectedIds(filteredProcesses.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(itemId => itemId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkDelete = async () => {
    if (!canDelete) return;
    
    const confirmMessage = selectedIds.length === 1 
      ? 'Tem certeza que deseja excluir o registro selecionado?' 
      : `Tem certeza que deseja excluir os ${selectedIds.length} registros selecionados?`;

    if (window.confirm(confirmMessage)) {
      try {
        const deletePromises = selectedIds.map(id => deleteDoc(doc(db, 'processes', id)));
        await Promise.all(deletePromises);
        setSelectedIds([]); // Clear selection after delete
        alert('Registros excluídos com sucesso.');
      } catch (error) {
        console.error("Error deleting documents: ", error);
        alert("Erro ao excluir registros. Verifique suas permissões.");
      }
    }
  };

  const handleOpenNew = () => {
    setEditingId(null);
    setFormData({
      data: new Date().toISOString().split('T')[0],
      nup: '',
      description: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (process: Process) => {
    setEditingId(process.id);
    setFormData({
      data: process.data,
      nup: process.nup,
      description: process.description
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        const docRef = doc(db, 'processes', editingId);
        await updateDoc(docRef, {
          data: formData.data,
          nup: formData.nup,
          description: formData.description
        });
      } else {
        await addDoc(collection(db, 'processes'), {
          data: formData.data,
          nup: formData.nup,
          description: formData.description,
          createdAt: Timestamp.now()
        });
      }
      setIsModalOpen(false);
      setFormData({
        data: new Date().toISOString().split('T')[0],
        nup: '',
        description: ''
      });
    } catch (error) {
      console.error("Error saving document: ", error);
      alert("Erro ao salvar o registro.");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este registro?')) {
      try {
        await deleteDoc(doc(db, 'processes', id));
        // Also remove from selection if present
        if (selectedIds.includes(id)) {
          setSelectedIds(selectedIds.filter(itemId => itemId !== id));
        }
      } catch (error) {
        console.error("Error deleting document: ", error);
        alert("Erro ao excluir o registro. Verifique suas permissões.");
      }
    }
  };

  // Robust Date Parser
  const parseDate = (val: any): string => {
    if (!val) return new Date().toISOString().split('T')[0];

    // 1. Handle JS Date Objects (from cellDates: true)
    if (val instanceof Date) {
      const year = val.getFullYear();
      const month = String(val.getMonth() + 1).padStart(2, '0');
      const day = String(val.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    // 2. Handle Excel Serial Numbers (fallback)
    if (typeof val === 'number') {
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      date.setHours(12);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      if (!isNaN(date.getTime())) {
         return `${year}-${month}-${day}`;
      }
    }

    // 3. Handle Strings
    if (typeof val === 'string') {
      const trimmed = val.trim();
      const ptBrMatch = trimmed.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
      if (ptBrMatch) {
        const day = ptBrMatch[1].padStart(2, '0');
        const month = ptBrMatch[2].padStart(2, '0');
        let year = ptBrMatch[3];
        if (year.length === 2) year = '20' + year; 
        return `${year}-${month}-${day}`;
      }
      const isoMatch = trimmed.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/);
      if (isoMatch) {
         const year = isoMatch[1];
         const month = isoMatch[2].padStart(2, '0');
         const day = isoMatch[3].padStart(2, '0');
         return `${year}-${month}-${day}`;
      }
      const date = new Date(val);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    
    return new Date().toISOString().split('T')[0];
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    
    reader.onload = async (evt) => {
      try {
        const ab = evt.target?.result;
        const wb = XLSX.read(ab, { type: 'array', cellDates: true });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        
        let importedCount = 0;
        const batchPromises = [];

        for (let i = 1; i < data.length; i++) {
          const row: any = data[i];
          if (row && row.length > 0) {
            const dateStr = parseDate(row[0]);
            const nupStr = String(row[1] || '').trim();
            const descriptionStr = String(row[2] || '').trim();

            if (nupStr || descriptionStr) {
               const processData = {
                 data: dateStr,
                 nup: nupStr,
                 description: descriptionStr,
                 createdAt: Timestamp.now()
               };
               batchPromises.push(addDoc(collection(db, 'processes'), processData));
               importedCount++;
            }
          }
        }
        
        await Promise.all(batchPromises);
        alert(`${importedCount} registros importados com sucesso!`);
      } catch (error) {
        console.error("Import error:", error);
        alert("Erro ao processar arquivo. Verifique o formato.");
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExport = () => {
    const itemsToExport = selectedIds.length > 0 
      ? filteredProcesses.filter(p => selectedIds.includes(p.id))
      : filteredProcesses;

    const dataToExport = itemsToExport.map(p => ({
      'Data': p.data ? new Date(p.data + 'T12:00:00').toLocaleDateString('pt-BR') : '',
      'NUP': p.nup,
      'Descrição': p.description
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Processos");
    const dateStr = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    
    const fileName = selectedIds.length > 0 
      ? `SUGA_Processos_Selecionados_${dateStr}.xlsx`
      : `SUGA_Processos_Geral_${dateStr}.xlsx`;

    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="relative max-w-[1600px] mx-auto pb-12">
      {/* Wrapper animado para o conteúdo (Header e Tabela) */}
      <div className="animate-fade-in">
        
        {/* Header Bar */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate('dashboard')}
              className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center text-slate-400 hover:text-white hover:bg-indigo-600 hover:border-indigo-600 hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight leading-none mb-1">Processos Suite</h1>
              <div className="flex gap-3 items-center mt-1">
                <p className="text-xs font-bold text-indigo-500 uppercase tracking-[0.2em] bg-indigo-50 px-3 py-1 rounded-full">Total: {filteredProcesses.length}</p>
                {selectedIds.length > 0 && (
                  <span className="text-xs font-bold text-white uppercase tracking-[0.2em] bg-emerald-500 px-3 py-1 rounded-full shadow-md shadow-emerald-500/20">
                    Selecionados: {selectedIds.length}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            
            {/* Year Filter */}
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="appearance-none bg-white border border-slate-200 rounded-xl py-3 pl-4 pr-10 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-sm font-bold text-slate-600 cursor-pointer h-[48px] hover:border-indigo-400 transition-colors"
              >
                <option value="">Todos os Anos</option>
                {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input 
                type="text" 
                placeholder="Filtrar processos..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 bg-white border border-slate-200 rounded-xl py-3 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 min-w-[300px] shadow-sm transition-all font-medium text-slate-600 h-[48px]"
              />
            </div>
            
            {/* Button 1: Export */}
            <button 
              onClick={handleExport}
              className="bg-white border border-slate-200 text-slate-600 hover:border-indigo-600 hover:text-indigo-600 font-bold text-xs px-6 py-3 rounded-xl uppercase transition-all shadow-sm flex items-center gap-2.5 whitespace-nowrap h-[48px]"
              title={selectedIds.length > 0 ? "Exportar Selecionados" : "Exportar Todos"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              {selectedIds.length > 0 ? `Exportar (${selectedIds.length})` : "Exportar"}
            </button>

            {canWrite && (
              <>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".xlsx,.xls,.ods,.csv,.xlsb,.xlsm,.xml,.fods"
                  className="hidden"
                />
                
                {/* Button 2: Import */}
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importing}
                  className="bg-white border border-slate-200 text-slate-600 hover:border-violet-600 hover:text-violet-600 font-bold text-xs px-6 py-3 rounded-xl uppercase transition-all shadow-sm flex items-center gap-2.5 whitespace-nowrap h-[48px]"
                >
                  {importing ? (
                    <span className="animate-spin h-4 w-4 border-2 border-violet-600 border-t-transparent rounded-full"></span>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  )}
                  Importar
                </button>

                {/* Button 3: Add New */}
                <button 
                  type="button"
                  onClick={handleOpenNew}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-8 py-3 rounded-xl uppercase transition-all shadow-lg shadow-indigo-600/20 whitespace-nowrap flex items-center gap-2 h-[48px] transform active:scale-95"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Novo Registro
                </button>
              </>
            )}

            {/* Button 4: Delete (Conditional) */}
            {canDelete && selectedIds.length > 0 && (
              <button 
                onClick={handleBulkDelete}
                className="bg-red-50 border border-red-200 text-red-600 hover:bg-red-600 hover:text-white font-bold text-xs px-6 py-3 rounded-xl uppercase transition-all shadow-sm flex items-center gap-2.5 whitespace-nowrap h-[48px]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                Excluir ({selectedIds.length})
              </button>
            )}
          </div>
        </div>

        {/* Main Table Area */}
        <div className="bg-white rounded-[2.5rem] shadow-card border border-slate-100 overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-6 px-10 py-6 bg-slate-50/80 border-b border-slate-100 text-xs font-extrabold text-slate-400 uppercase tracking-widest select-none">
            {/* Checkbox Column */}
            <div className="col-span-1 flex items-center">
              <input 
                type="checkbox"
                className="w-5 h-5 rounded-md text-indigo-600 focus:ring-indigo-600 cursor-pointer border-gray-300"
                onChange={handleSelectAll}
                checked={filteredProcesses.length > 0 && selectedIds.length === filteredProcesses.length}
              />
            </div>
            <div className="col-span-2">Data</div>
            <div className="col-span-2">NUP</div>
            <div className="col-span-5">Descrição do Fluxo</div>
            <div className="col-span-2 text-right">Ações</div>
          </div>

          {/* Table Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-100 border-t-indigo-600 mb-6"></div>
              <span className="text-sm font-bold text-slate-300 uppercase tracking-widest">Carregando dados...</span>
            </div>
          ) : filteredProcesses.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {filteredProcesses.map((process) => (
                <div key={process.id} className={`grid grid-cols-12 gap-6 px-10 py-5 items-center transition-all duration-200 group ${selectedIds.includes(process.id) ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}`}>
                  {/* Checkbox Row */}
                  <div className="col-span-1 flex items-center">
                    <input 
                      type="checkbox"
                      className="w-5 h-5 rounded-md text-indigo-600 focus:ring-indigo-600 cursor-pointer border-gray-300"
                      checked={selectedIds.includes(process.id)}
                      onChange={() => handleSelectOne(process.id)}
                    />
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm font-bold text-slate-500">
                      {process.data ? new Date(process.data + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <a 
                      href="https://suite.ce.gov.br/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={(e) => {
                          if (process.nup) {
                              navigator.clipboard.writeText(process.nup);
                          }
                      }}
                      className="text-sm font-bold text-indigo-600 font-mono tracking-tight bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-800 inline-flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors cursor-pointer group/link" 
                      title="Abrir no SUITE e Copiar NUP"
                    >
                      <HighlightText text={process.nup || 'Sem NUP'} highlight={searchTerm} />
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-hover/link:opacity-100 transition-opacity"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    </a>
                  </div>
                  <div className="col-span-5">
                    <div className="text-base font-medium text-slate-700 leading-relaxed">
                      <HighlightText text={process.description} highlight={searchTerm} />
                    </div>
                  </div>
                  <div className={`col-span-2 flex justify-end gap-3 transition-opacity ${selectedIds.includes(process.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    {canWrite && (
                      <button 
                        onClick={() => handleOpenEdit(process)}
                        className="h-10 w-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100 shadow-sm"
                        title="Editar"
                        type="button"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                    )}
                    {canDelete && (
                      <button 
                        onClick={() => handleDelete(process.id)}
                        className="h-10 w-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all border border-transparent hover:border-red-100 shadow-sm"
                        title="Excluir"
                        type="button"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-96 text-center">
              <div className="bg-slate-50 rounded-full p-8 mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
              </div>
              <div className="text-slate-400 font-bold text-sm uppercase tracking-widest mb-1">
                Nenhum registro encontrado
              </div>
              <p className="text-xs text-slate-300 font-medium">
                {searchTerm || selectedYear ? 'Tente ajustar os filtros' : 'Utilize o botão "Novo Registro" para começar'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Form (Create/Edit) - MOVED OUTSIDE THE ANIMATED CONTAINER */}
      {isModalOpen && canWrite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden border border-white/50 transform transition-all scale-100">
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-6 flex justify-between items-center shadow-lg">
              <h2 className="text-white font-bold text-base uppercase tracking-widest flex items-center gap-2">
                 {editingId ? (
                   <>
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                     Editar Registro
                   </>
                 ) : (
                   <>
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                     Novo Registro
                   </>
                 )}
              </h2>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)} 
                className="text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-xl p-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-10 space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-3 tracking-widest">Data do Registro</label>
                  <input
                    type="date"
                    required
                    value={formData.data}
                    onChange={(e) => setFormData({...formData, data: e.target.value})}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-bold text-slate-700 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-3 tracking-widest">Número NUP</label>
                  <input
                    type="text"
                    required
                    placeholder="00000.000000/0000-00"
                    value={formData.nup}
                    onChange={(e) => setFormData({...formData, nup: e.target.value})}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-bold text-slate-700 transition-all font-mono"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-3 tracking-widest">Descrição detalhada</label>
                <textarea
                  required
                  rows={5}
                  placeholder="Insira os detalhes do processo aqui..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 text-base focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-medium text-slate-700 resize-none transition-all"
                />
              </div>

              <div className="pt-6 flex gap-4 justify-end border-t border-slate-50 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-4 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-10 py-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 transition-all transform active:scale-95 uppercase tracking-wider shadow-xl shadow-indigo-600/20 flex items-center gap-3"
                >
                  {editingId ? 'Salvar Alterações' : 'Confirmar Registro'}
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};