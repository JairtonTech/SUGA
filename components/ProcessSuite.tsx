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
  if (!highlight.trim()) {
    return <>{text}</>;
  }

  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  const regex = new RegExp(`(${escapeRegExp(highlight)})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === highlight.toLowerCase() ? (
          <span key={i} className="bg-yellow-300 text-black font-extrabold px-0.5 rounded-sm shadow-sm border-b-2 border-yellow-500">{part}</span>
        ) : (
          part
        )
      )}
    </>
  );
};

export const ProcessSuite: React.FC<ProcessSuiteProps> = ({ navigate, user }) => {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
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
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Process[];
      setProcesses(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter processes
  const filteredProcesses = processes.filter(p => 
    p.nup.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const parseDate = (val: any): string => {
    if (!val) return new Date().toISOString().split('T')[0];

    if (typeof val === 'number') {
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      date.setHours(12); 
      if (!isNaN(date.getTime())) {
         return date.toISOString().split('T')[0];
      }
    }

    if (typeof val === 'string') {
      const trimmed = val.trim();
      const ptBrMatch = trimmed.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
      if (ptBrMatch) {
        const day = ptBrMatch[1].padStart(2, '0');
        const month = ptBrMatch[2].padStart(2, '0');
        const year = ptBrMatch[3];
        return `${year}-${month}-${day}`;
      }
      const isoMatch = trimmed.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/);
      if (isoMatch) {
         return trimmed; 
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
        const wb = XLSX.read(ab, { type: 'array' });
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
    // If items are selected, export ONLY those. Otherwise, export ALL filtered items.
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
    <div className="animate-fade-in relative max-w-[1600px] mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-5">
          <button 
            onClick={() => navigate('dashboard')}
            className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-gray-400 hover:text-suga-dark hover:shadow-md transition-all shrink-0 border border-transparent hover:border-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div>
            <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tight leading-none mb-1">Processos Suite</h1>
            <div className="flex gap-2 items-center">
              <p className="text-[11px] font-bold text-blue-500 uppercase tracking-[0.2em]">Total: {processes.length}</p>
              {selectedIds.length > 0 && (
                <span className="text-[11px] font-bold text-suga-dark uppercase tracking-[0.2em] bg-emerald-100 px-2 rounded-full">
                  Selecionados: {selectedIds.length}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input 
              type="text" 
              placeholder="Filtrar processos..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 bg-white border border-gray-200 rounded-lg py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent min-w-[280px] shadow-sm transition-all font-medium text-gray-600"
            />
          </div>
          
          {/* Button 1: Export */}
          <button 
            onClick={handleExport}
            className="bg-white border border-gray-300 text-gray-700 hover:border-emerald-600 hover:text-emerald-600 font-bold text-xs px-5 py-2.5 rounded-lg uppercase transition-all shadow-sm flex items-center gap-2.5 whitespace-nowrap"
            title={selectedIds.length > 0 ? "Exportar Selecionados" : "Exportar Todos"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
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
                className="bg-white border border-gray-300 text-gray-700 hover:border-suga-dark hover:text-suga-dark font-bold text-xs px-5 py-2.5 rounded-lg uppercase transition-all shadow-sm flex items-center gap-2.5 whitespace-nowrap"
              >
                {importing ? (
                  <span className="animate-spin h-3.5 w-3.5 border-2 border-suga-dark border-t-transparent rounded-full"></span>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                )}
                Importar
              </button>

              {/* Button 3: Add New */}
              <button 
                onClick={handleOpenNew}
                className="bg-suga-dark hover:bg-emerald-800 text-white font-bold text-xs px-6 py-2.5 rounded-lg uppercase transition-all shadow-lg shadow-emerald-900/20 whitespace-nowrap flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Novo Registro
              </button>
            </>
          )}

          {/* Button 4: Delete (Conditional) */}
          {canDelete && selectedIds.length > 0 && (
             <button 
              onClick={handleBulkDelete}
              className="bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300 font-bold text-xs px-5 py-2.5 rounded-lg uppercase transition-all shadow-sm flex items-center gap-2.5 whitespace-nowrap"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              Excluir ({selectedIds.length})
            </button>
          )}
        </div>
      </div>

      {/* Main Table Area */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-6 px-8 py-5 bg-gray-50/50 border-b border-gray-100 text-[11px] font-extrabold text-gray-400 uppercase tracking-widest select-none">
          {/* Checkbox Column */}
          <div className="col-span-1 flex items-center">
            <input 
              type="checkbox"
              className="w-4 h-4 rounded text-suga-dark focus:ring-suga-dark cursor-pointer accent-suga-dark"
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
          <div className="flex flex-col items-center justify-center h-80">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-100 border-t-suga-dark mb-4"></div>
            <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">Carregando dados...</span>
          </div>
        ) : filteredProcesses.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {filteredProcesses.map((process) => (
              <div key={process.id} className={`grid grid-cols-12 gap-6 px-8 py-6 items-center transition-colors group ${selectedIds.includes(process.id) ? 'bg-emerald-50/60' : 'hover:bg-emerald-50/20'}`}>
                {/* Checkbox Row */}
                <div className="col-span-1 flex items-center">
                   <input 
                    type="checkbox"
                    className="w-4 h-4 rounded text-suga-dark focus:ring-suga-dark cursor-pointer accent-suga-dark"
                    checked={selectedIds.includes(process.id)}
                    onChange={() => handleSelectOne(process.id)}
                  />
                </div>
                <div className="col-span-2">
                   <div className="text-xs font-semibold text-gray-500">
                    {process.data ? new Date(process.data + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}
                   </div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs font-bold text-emerald-700 font-mono tracking-tight" title={process.nup}>
                    <HighlightText text={process.nup || 'Sem NUP'} highlight={searchTerm} />
                  </div>
                </div>
                <div className="col-span-5">
                  <div className="text-sm font-medium text-gray-600 leading-relaxed">
                    <HighlightText text={process.description} highlight={searchTerm} />
                  </div>
                </div>
                <div className={`col-span-2 flex justify-end gap-2 transition-opacity ${selectedIds.includes(process.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  {canWrite && (
                    <button 
                      onClick={() => handleOpenEdit(process)}
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-all"
                      title="Editar"
                      type="button"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                  )}
                  {canDelete && (
                    <button 
                      onClick={() => handleDelete(process.id)}
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                      title="Excluir"
                      type="button"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-80 text-center">
            <div className="bg-gray-50 rounded-full p-6 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
            </div>
            <div className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-1">
              Nenhum registro encontrado
            </div>
            <p className="text-[10px] text-gray-300 font-medium">
              Utilize o botão "Novo Registro" para começar
            </p>
          </div>
        )}
      </div>

      {/* Modal Form (Create/Edit) */}
      {isModalOpen && canWrite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-suga-dark/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-white/50 transform transition-all scale-100">
            <div className="bg-suga-dark px-6 py-5 flex justify-between items-center border-b border-white/10">
              <h2 className="text-white font-bold text-sm uppercase tracking-widest">
                {editingId ? 'Editar Registro' : 'Novo Registro de Processo'}
              </h2>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)} 
                className="text-white/50 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-lg p-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-extrabold text-gray-400 uppercase mb-2 tracking-widest">Data do Registro</label>
                  <input
                    type="date"
                    required
                    value={formData.data}
                    onChange={(e) => setFormData({...formData, data: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-suga-medium/50 focus:border-suga-medium font-semibold text-gray-700 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-gray-400 uppercase mb-2 tracking-widest">Número NUP</label>
                  <input
                    type="text"
                    required
                    placeholder="00000.000000/0000-00"
                    value={formData.nup}
                    onChange={(e) => setFormData({...formData, nup: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-suga-medium/50 focus:border-suga-medium font-semibold text-gray-700 transition-all font-mono"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-extrabold text-gray-400 uppercase mb-2 tracking-widest">Descrição detalhada</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Insira os detalhes do processo aqui..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-suga-medium/50 focus:border-suga-medium font-medium text-gray-700 resize-none transition-all"
                />
              </div>

              <div className="pt-4 flex gap-3 justify-end border-t border-gray-50 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 transition-colors uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 rounded-xl text-xs font-bold text-white bg-suga-dark hover:bg-suga-medium transition-all transform active:scale-95 uppercase tracking-wider shadow-lg shadow-emerald-900/10 flex items-center gap-2"
                >
                  {editingId ? 'Salvar Alterações' : 'Confirmar Registro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};