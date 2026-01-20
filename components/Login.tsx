import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error(err);
      setError('Credenciais inválidas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header Block */}
        <div className="bg-suga-dark p-8 pb-10 text-center flex flex-col items-center">
          <div className="w-16 h-16 border-2 border-white/20 rounded-xl flex items-center justify-center mb-4 bg-white/5 backdrop-blur-sm">
            <span className="text-white font-black text-xl tracking-tighter">SUGA</span>
          </div>
          <h1 className="text-white font-bold text-lg tracking-wide uppercase">
            Sistema Unificado de Gestão Administrativa
          </h1>
        </div>

        {/* Form Block */}
        <div className="p-8 pt-6">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">Usuário</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@suga.com"
                className="w-full bg-suga-accent text-gray-800 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-suga-dark/50 font-medium"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="•••••"
                className="w-full bg-suga-accent text-gray-800 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-suga-dark/50 font-medium tracking-widest"
                required
              />
            </div>

            {error && (
              <p className="text-red-500 text-xs text-center font-semibold">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-suga-dark hover:bg-suga-medium text-white font-bold py-3 px-4 rounded-lg uppercase text-xs tracking-wider transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-70 mt-4"
            >
              {loading ? 'Autenticando...' : 'Autenticar'}
            </button>
          </form>

          <div className="flex justify-between mt-8 text-[10px] font-bold text-gray-400 uppercase">
            <button className="hover:text-suga-dark transition-colors">Solicitar Registro</button>
            <button className="hover:text-suga-dark transition-colors">Recuperar Acesso</button>
          </div>

          <div className="mt-8 pt-4 border-t border-gray-100 flex justify-between items-center">
            <div className="flex gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              <span className="h-1.5 w-1.5 rounded-full bg-gray-200"></span>
              <span className="h-1.5 w-1.5 rounded-full bg-gray-200"></span>
            </div>
            <span className="text-[9px] text-gray-300 font-bold">SUGA V4.9 STABLE</span>
          </div>
        </div>
      </div>
    </div>
  );
};