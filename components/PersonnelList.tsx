
import React from 'react';
import { ViewState } from '../types';

interface PersonnelListProps {
  navigate: (view: ViewState) => void;
  onSelectSector: (sector: string) => void;
}

const sectors = [
  "CPSB", "CEPP", "CENTRO COMUNITÁRIO FAROL", "CENTRO COMUNITÁRIO SÃO VICENTE",
  "CENTRO COMUNITÁRIO SANTA TEREZINHA", "CENTRO COMUNITÁRIO SÃO FRANCISCO", "ESPAÇO VIVA GENTE",
  "ABC SERRINHA", "ABC MONDUBIM", "ABC CAJUEIRO TORTO", "ABC BOM JARDIM", "ABC PALMEIRAS",
  "CIRCO BOM JARDIM", "CIRCO PALMEIRAS"
];

export const PersonnelList: React.FC<PersonnelListProps> = ({ navigate, onSelectSector }) => {
  
  const getSectorType = (name: string) => {
    if (name.includes('CPSB')) return 'COORDENADORIA';
    if (name.includes('CEPP')) return 'CÉLULA';
    return 'UNIDADE';
  };

  const handleSelect = (sector: string) => {
    onSelectSector(sector);
    navigate('personnel-detail');
  };

  return (
    <div className="animate-fade-in pb-10">
      <div className="flex items-center gap-6 mb-10">
        <button 
          onClick={() => navigate('dashboard')}
          className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center text-slate-400 hover:text-white hover:bg-indigo-600 hover:border-indigo-600 hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Relação do Pessoal</h1>
          <p className="text-xs font-bold text-indigo-500 uppercase tracking-[0.2em] mt-1">Selecione a Unidade ou Setor</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sectors.map((sector, index) => (
          <div 
            key={index} 
            onClick={() => handleSelect(sector)}
            className="bg-white p-8 rounded-3xl shadow-card hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer group min-h-[180px] flex flex-col justify-between border border-slate-100 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-slate-50 to-indigo-50 rounded-bl-[4rem] -mr-4 -mt-4 transition-all group-hover:scale-110"></div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                </div>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider group-hover:text-indigo-400 transition-colors">
                  {getSectorType(sector)}
                </span>
              </div>
              <h3 className="font-bold text-slate-700 text-sm uppercase leading-relaxed tracking-wide group-hover:text-indigo-700 transition-colors">{sector}</h3>
            </div>
            
            <div className="flex items-center gap-2 relative z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
                Gerenciar Equipe
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
