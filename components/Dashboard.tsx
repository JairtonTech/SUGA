import React from 'react';
import { ViewState } from '../types';

interface DashboardProps {
  navigate: (view: ViewState) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ navigate }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-black text-suga-dark uppercase tracking-tight mb-2">
          Painel de Controle
        </h1>
        <h2 className="text-lg md:text-xl font-bold text-slate-600 mb-2">
          BEM-VINDO AO SISTEMA UNIFICADO DE GESTÃO ADMINISTRATIVA
        </h2>
        <p className="text-xs font-bold text-gray-400 tracking-[0.2em] uppercase">
          Escolha uma das opções abaixo para prosseguir
        </p>
      </div>

      <div className="flex gap-4 mb-12">
        <StatusBadge color="bg-emerald-100 text-emerald-700" label="MÓDULO RH ONLINE" />
        <StatusBadge color="bg-orange-100 text-orange-700" label="SUÍTE SINCRONIZADO" />
        <StatusBadge color="bg-blue-100 text-blue-700" label="SERVIDOR ESTÁVEL" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl px-4">
        {/* Card 1: Pessoal */}
        <div 
          onClick={() => navigate('personnel')}
          className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all cursor-pointer group border border-transparent hover:border-emerald-100"
        >
          <div className="bg-emerald-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-suga-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-2xl font-black text-gray-800 uppercase">Relação do Pessoal</h3>
            <span className="bg-suga-dark text-white text-[10px] font-bold px-2 py-0.5 rounded-full">ACESSO TOTAL</span>
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase leading-relaxed max-w-xs">
            Gestão organizacional dos servidores e colaboradores das unidades operacionais CPSB
          </p>
        </div>

        {/* Card 2: Processos */}
        <div 
           onClick={() => navigate('processes')}
           className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all cursor-pointer group border border-transparent hover:border-emerald-100"
        >
          <div className="bg-orange-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-2xl font-black text-gray-800 uppercase">Processos Suite</h3>
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase leading-relaxed">
            Consulta NUP dos processos gerados
          </p>
        </div>
      </div>
    </div>
  );
};

const StatusBadge: React.FC<{color: string, label: string}> = ({color, label}) => (
  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${color}`}>
    <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
    <span className="text-[9px] font-extrabold tracking-wide">{label}</span>
  </div>
);