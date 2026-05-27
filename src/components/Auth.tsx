import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export function Auth({ onAuthSuccess }: { onAuthSuccess: (user: any) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Admin bypass without needing Supabase login
      if (email === 'admin@admin.com' && password === 'admin123') {
         onAuthSuccess({
            id: 'admin_master_001',
            email: 'admin@admin.com',
            name: 'Administrador Master',
            role: 'admin'
         });
         return;
      }

      if (supabase) {
        // Use real Supabase Auth
        if (isLogin) {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          
          let role = 'student';
          try {
            const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', data.user.id).single();
            if (profile) role = profile.role;
          } catch (e) {
            console.error('Could not fetch user profile', e);
          }

          if (data.user.email === 'grecahenrique@gmail.com') {
            role = 'admin';
          }

          onAuthSuccess({ id: data.user.id, email: data.user.email, name: data.user.user_metadata?.name, role });
        } else {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { name } }
          });
          if (error) throw error;
          
          if (!data.session && data.user) {
            throw new Error("Cadastro recebido! Porém, é necessário confirmar seu e-mail. Verifique sua caixa de entrada antes de fazer login.");
          }
          
          if (data.session) {
             let initRole = 'student';
             if (data.user?.email === 'grecahenrique@gmail.com') initRole = 'admin';
             onAuthSuccess({ id: data.user!.id, email: data.user!.email, name, role: initRole });
          }
        }
      } else {
        // Mock Auth fallback
        setTimeout(() => {
          let role = 'student';
          // Make grecahenrique@gmail.com an admin by default for local mock test
          if (email === 'grecahenrique@gmail.com') role = 'admin';
          else if (email.includes('teacher')) role = 'teacher';

          onAuthSuccess({
            id: 'mock_usr_' + Math.random().toString(36).substring(7),
            email,
            name: name || email.split('@')[0],
            role
          });
          setLoading(false);
        }, 500);
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro.');
      setLoading(false);
    } finally {
      if (supabase) setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mt-24 mx-auto bg-white/60 dark:bg-azul/50 backdrop-blur-md p-10 rounded-3xl border border-white/40 dark:border-perola/10 shadow-xl relative z-10 transition-colors">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold tracking-tight text-azul dark:text-perola mb-2">
          {isLogin ? 'Entrar na Plataforma' : 'Criar Conta Gratuita'}
        </h2>
        <p className="text-sm text-terra/70 dark:text-perola/70">
          {isLogin ? 'Acesse sua área de aprendizado gratuita' : 'Cadastre-se para ter acesso imediato a todo o catálogo'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <div>
            <label className="block text-sm font-medium text-terra dark:text-perola mb-1">Nome Completo</label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2.5 border border-white/40 dark:border-perola/20 rounded-xl text-sm bg-white/50 dark:bg-azul/50 focus:bg-white dark:focus:bg-azul focus:outline-none focus:border-laranja focus:ring-1 focus:ring-laranja transition-all placeholder:text-terra/40 dark:placeholder:text-perola/40 font-medium text-azul dark:text-perola" 
              placeholder="Seu nome"
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-terra dark:text-perola mb-1">Endereço de E-mail</label>
          <input 
            type="email" 
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 border border-white/40 dark:border-perola/20 rounded-xl text-sm bg-white/50 dark:bg-azul/50 focus:bg-white dark:focus:bg-azul focus:outline-none focus:border-laranja focus:ring-1 focus:ring-laranja transition-all placeholder:text-terra/40 dark:placeholder:text-perola/40 font-medium text-azul dark:text-perola" 
            placeholder="nome@exemplo.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-terra dark:text-perola mb-1">Senha</label>
          <input 
            type="password" 
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 border border-white/40 dark:border-perola/20 rounded-xl text-sm bg-white/50 dark:bg-azul/50 focus:bg-white dark:focus:bg-azul focus:outline-none focus:border-laranja focus:ring-1 focus:ring-laranja transition-all placeholder:text-terra/40 dark:placeholder:text-perola/40 font-medium text-azul dark:text-perola" 
            placeholder="••••••••"
          />
        </div>

        {error && <p className="text-sm text-laranja dark:text-ambar font-medium">{error}</p>}

        <button 
          disabled={loading}
          type="submit" 
          className="w-full py-3 bg-laranja hover:bg-laranja/90 dark:bg-laranja dark:hover:bg-laranja/90 text-white font-bold rounded-xl text-sm transition-colors mt-2 shadow-lg shadow-laranja/20 dark:shadow-ambar/20"
        >
          {loading ? 'Aguarde...' : isLogin ? 'Entrar' : 'Criar Minha Conta'}
        </button>
      </form>

      <div className="text-center mt-6 text-sm text-terra/70 dark:text-perola/70">
        {isLogin ? (
          <p>Não tem uma conta? <span onClick={() => setIsLogin(false)} className="text-laranja dark:text-ambar font-bold cursor-pointer hover:underline">Cadastre-se gratuitamente</span></p>
        ) : (
          <p>Já possui uma conta? <span onClick={() => setIsLogin(true)} className="text-laranja dark:text-ambar font-bold cursor-pointer hover:underline">Fazer Login</span></p>
        )}
      </div>
      
      {!supabase && (
        <div className="mt-8 p-3 bg-ambar/10 border border-ambar/20 rounded-lg text-xs text-terra dark:text-perola text-center">
          <p><strong>Modo de Demonstração Web</strong></p>
          <p>O Supabase não está configurado. O login funcionará localmente sem credenciais reais.</p>
        </div>
      )}
    </div>
  );
}
