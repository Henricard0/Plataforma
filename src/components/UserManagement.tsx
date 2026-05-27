import React, { useEffect, useState } from "react";
import { api } from "../lib/api";

type AppUser = {
  id: string;
  email: string;
  name?: string;
  role: string;
};

export function UserManagement() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data as AppUser[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdating(userId);
    try {
      await api.updateUserRole(userId, newRole);
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar papel do usuário.");
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-terra/60 dark:text-perola/60 font-medium z-10 relative">Carregando usuários...</div>;
  }

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-6 py-12 z-10 relative overflow-y-auto">
      <div className="bg-white/90 dark:bg-azul/90 backdrop-blur-md p-10 rounded-3xl border border-terra/10 dark:border-perola/10 shadow-xl transition-colors">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-azul dark:text-perola">Gestão de Usuários</h2>
            <p className="text-terra/60 dark:text-perola/60 mt-1">Gerencie os acessos de alunos, professores e administradores.</p>
          </div>
          <button 
            onClick={fetchUsers}
            className="text-sm px-4 py-2 bg-perola/30 dark:bg-perola/10 text-azul dark:text-perola font-bold rounded-lg hover:bg-perola/50 dark:hover:bg-perola/20 transition-colors"
          >
            Atualizar
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-terra/20 dark:border-perola/20">
                <th className="pb-3 text-sm font-bold text-terra/80 dark:text-perola/80">Nome</th>
                <th className="pb-3 text-sm font-bold text-terra/80 dark:text-perola/80">E-mail</th>
                <th className="pb-3 text-sm font-bold text-terra/80 dark:text-perola/80">Nível de Acesso</th>
                <th className="pb-3 text-sm font-bold text-terra/80 dark:text-perola/80 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-terra/10 dark:border-perola/10 hover:bg-perola/10 dark:hover:bg-perola/5 transition-colors">
                  <td className="py-4 text-sm font-medium text-azul dark:text-perola">{u.name || '-'}</td>
                  <td className="py-4 text-sm text-terra/70 dark:text-perola/70">{u.email}</td>
                  <td className="py-4">
                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md border ${
                      u.role === 'admin' 
                        ? 'bg-laranja/10 text-laranja dark:bg-ambar/10 dark:text-ambar border-laranja/20' 
                        : u.role === 'teacher'
                        ? 'bg-azul/10 text-azul dark:bg-perola/10 dark:text-perola border-azul/20 dark:border-perola/20'
                        : 'bg-terra/5 text-terra/60 dark:bg-perola/5 dark:text-perola/60 border-terra/10 dark:border-perola/10'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <select
                      disabled={updating === u.id}
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="text-xs px-2 py-1.5 border border-terra/20 dark:border-perola/20 rounded-lg bg-white/50 dark:bg-azul/50 text-azul dark:text-perola focus:outline-none focus:ring-1 focus:ring-laranja/50 disabled:opacity-50 cursor-pointer"
                    >
                      <option value="student">Aluno</option>
                      <option value="teacher">Professor</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-terra/50 dark:text-perola/50 text-sm">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="mt-8 p-4 bg-ambar/10 border border-ambar/20 rounded-xl text-xs text-terra dark:text-perola">
          <p className="font-bold mb-1">Como adicionar professores?</p>
          <p>Para adicionar um novo professor, peça para a pessoa criar uma conta normalmente na página de login. Em seguida, acesse este painel e altere o nível de acesso dela para "Professor".</p>
        </div>
      </div>
    </div>
  );
}
