
import React, { useState, useEffect } from 'react';
import { ViewState, Personnel } from '../types';
import { db } from '../firebase';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, Timestamp } from 'firebase/firestore';

interface PersonnelDetailProps {
  navigate: (view: ViewState) => void;
  sector: string;
  user?: any;
}

export const PersonnelDetail: React.FC<PersonnelDetailProps> = ({ navigate, sector, user }) => {
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    registration: '',
    status: 'Ativo'
  });

  const getSectorSubtitle = (name: string) => {
    if (name.includes('CPSB')) return 'COORDENADORIA';
    if (name.includes('CEPP')) return 'CÉLULA';
    return 'UNIDADE OPERACIONAL';
  };

  useEffect(() => {
    if (!sector) return;

    // Query personnel where sector == current sector
    const q = query(collection(db, 'personnel'), where('sector', '==', sector));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Personnel[];
      // Sort alphabetically by name client-side
      docs.sort((a, b) => a.name.localeCompare(b.name));
      setPersonnel(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [sector]);

  const filteredPersonnel = personnel.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'personnel'), {
        ...formData,
        sector: sector,
        createdAt: Timestamp.now()
      });
      setIsModalOpen(false);
      setFormData({ name: '', role: '', registration: '', status: 'Ativo' });
    } catch (error) {
      console.error("Error adding personnel:", error);
      alert("Erro ao adicionar funcionário.");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja remover este funcionário?')) {
      try {
        await deleteDoc(doc(db, 'personnel', id));
      } catch (error) {
        console.error("Error deleting personnel:", error);
      }
    }
  };

  return (
    <div className="animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('personnel')}
            className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center text-slate-400 hover:text-white hover:bg-indigo-600 hover:border-indigo-600 hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <div>
            <div className="flex items-center gap-3">
               <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight leading-none">{sector}</h1>
               <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider">{getSectorSubtitle(sector)}</span>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Gestão de Equipe e Colaboradores</p>
          </div>
        </div>

        <div className="flex gap-3">
           <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input 
                type="text" 
                placeholder="Buscar funcionário..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 bg-white border border-slate-200 rounded-xl py-3 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 min-w-[300px] shadow-sm transition-all font-medium text-slate-600 h-[48px]"
              />
            </div>

            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 py-3 rounded-xl uppercase transition-all shadow-lg shadow-indigo-600/20 whitespace-nowrap flex items-center gap-2 h-[48px] transform active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Adicionar Membro
            </button>
        </div>
      </div>

      {/* Grid List */}
      {loading ? (
         <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-100 border-t-indigo-600 mb-4"></div>
            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Carregando equipe...</span>
         </div>
      ) : filteredPersonnel.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPersonnel.map((p) => (
            <div key={p.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleDelete(p.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                  </button>
               </div>
               
               <div className="flex items-center gap-4 mb-4">
                 <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 font-black text-lg border border-slate-100">
                    {p.name.charAt(0).toUpperCase()}
                 </div>
                 <div>
                   <h3 className="font-bold text-slate-800 text-base leading-tight">{p.name}</h3>
                   <p className="text-xs font-medium text-indigo-500 mt-1 uppercase tracking-wide">{p.role}</p>
                 </div>
               </div>
               
               <div className="space-y-2 pt-4 border-t border-slate-50">
                 <div className="flex justify-between items-center text-xs">
                   <span className="text-slate-400 font-medium">Matrícula</span>
                   <span className="font-bold text-slate-600 font-mono">{p.registration || '---'}</span>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                   <span className="text-slate-400 font-medium">Status</span>
                   <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider ${
                     p.status === 'Ativo' ? 'bg-emerald-50 text-emerald-600' : 
                     p.status === 'Férias' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'
                   }`}>
                     {p.status}
                   </span>
                 </div>
               </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-center bg-white rounded-3xl border border-slate-100 border-dashed">
          <div className="bg-slate-50 rounded-full p-6 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div className="text-slate-400 font-bold text-sm uppercase tracking-widest mb-1">
            Nenhum membro encontrado
          </div>
          <p className="text-xs text-slate-300 font-medium">
            Adicione colaboradores para gerenciar esta unidade
          </p>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/50 transform transition-all scale-100">
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-6 flex justify-between items-center">
              <h2 className="text-white font-bold text-base uppercase tracking-widest flex items-center gap-2">
                 Adicionar Membro
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-xl p-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-bold text-slate-700 transition-all"
                  placeholder="Ex: João da Silva"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">Cargo / Função</label>
                  <input
                    type="text"
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-medium text-slate-700 transition-all"
                    placeholder="Ex: Assistente Administrativo"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">Matrícula</label>
                  <input
                    type="text"
                    value={formData.registration}
                    onChange={(e) => setFormData({...formData, registration: e.target.value})}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-mono font-medium text-slate-700 transition-all"
                    placeholder="000000-0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">Status</label>
                <div className="grid grid-cols-3 gap-3">
                  {['Ativo', 'Férias', 'Licença'].map((statusOption) => (
                    <button
                      key={statusOption}
                      type="button"
                      onClick={() => setFormData({...formData, status: statusOption})}
                      className={`py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border-2 ${
                        formData.status === statusOption 
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                        : 'border-slate-100 bg-white text-slate-400 hover:border-indigo-200'
                      }`}
                    >
                      {statusOption}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex gap-3 justify-end border-t border-slate-50 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 uppercase tracking-wider"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
