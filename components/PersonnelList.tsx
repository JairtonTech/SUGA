import React from 'react';
import { ViewState } from '../types';

interface PersonnelListProps {
  navigate: (view: ViewState) => void;
}

const sectors = [
  "CPSB", "CEPP", "CENTRO COMUNITÁRIO FAROL", "CENTRO COMUNITÁRIO SÃO VICENTE",
  "CENTRO COMUNITÁRIO SANTA TEREZINHA", "CENTRO COMUNITÁRIO SÃO FRANCISCO", "ESPAÇO VIVA GENTE",
  "ABC SERRINHA", "ABC MONDUBIM", "ABC CAJUEIRO TORTO", "ABC BOM JARDIM", "ABC PALMEIRAS",
  "CIRCO BOM JARDIM", "CIRCO PALMEIRAS"
];

export const PersonnelList: React.FC<PersonnelListProps> = ({ navigate }) => {
  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate('dashboard')}
          className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-600 hover:text-suga-dark hover:shadow-md transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-800 uppercase">Relação do Pessoal</h1>
          <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Selecione Setor</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {sectors.map((sector, index) => (
          <div key={index} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition-all cursor-pointer group h-40 flex flex-col justify-between">
            <h3 className="font-extrabold text-gray-800 text-sm uppercase">{sector}</h3>
            <span className="text-[10px] font-bold text-green-500 uppercase opacity-0 group-hover:opacity-100 transition-opacity">
              Acessar
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};