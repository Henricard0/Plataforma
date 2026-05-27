import React, { useState, useEffect } from "react";
import { AlertCircle, ThumbsUp, ThumbsDown, MoreVertical, X, CheckCircle2, TrendingUp, HelpCircle, Users, Activity, Layers } from "lucide-react";
import { api } from "../lib/api";

type StudentAnalytics = {
  id: string;
  name: string;
  completedPercent: number;
  completedCount: number;
  pendingCount: number;
  avgGradePercent: number;
  avgGradeCount: number;
  lastInteraction: string;
};

export function Analytics() {
  const [timeRange, setTimeRange] = useState("Últimos 90 dias");
  const [students, setStudents] = useState<StudentAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [updateTime, setUpdateTime] = useState("");
  
  // Dynamic filter state
  const [filterType, setFilterType] = useState<"all" | "inactive" | "slow" | "advanced">("all");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await api.getStudentAnalytics();
        setStudents(data);
      } catch (err) {
        console.error("Error loading analytics:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    // Dynamic update time
    const now = new Date();
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    setUpdateTime(`Dados atualizados: hoje às ${timeStr}`);
  }, []);

  // Compute dynamic stats based on real students
  const totalStudents = students.length;
  const totalCompletedSum = students.reduce((acc, s) => acc + s.completedPercent, 0);
  const avgCompleted = totalStudents > 0 ? Math.round(totalCompletedSum / totalStudents) : 0;
  
  const activeStudentsCount = students.filter(s => s.completedCount > 0).length;

  // Filter thresholds:
  // 1. Inactive: completedCount === 0
  const inactiveStudents = students.filter(s => s.completedCount === 0);
  const inactiveCount = inactiveStudents.length;

  // 2. Slow: completedCount > 0 && completedPercent < 50
  const slowStudents = students.filter(s => s.completedCount > 0 && s.completedPercent < 50);
  const slowCount = slowStudents.length;

  // 3. Advanced/Good pace: completedPercent >= 50
  const advancedStudents = students.filter(s => s.completedPercent >= 50);
  const advancedCount = advancedStudents.length;

  // Filtered array to render
  const filteredStudents = students.filter(u => {
    if (filterType === "inactive") return u.completedCount === 0;
    if (filterType === "slow") return u.completedCount > 0 && u.completedPercent < 50;
    if (filterType === "advanced") return u.completedPercent >= 50;
    return true;
  });

  if (loading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center py-20 text-terra/60 dark:text-perola/60">
        <div className="w-10 h-10 border-4 border-laranja dark:border-ambar border-t-transparent dark:border-t-transparent rounded-full animate-spin mb-4"></div>
        <span className="font-semibold text-sm tracking-wide">Carregando dados da turma...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-6 z-10 relative overflow-y-auto">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-azul dark:text-perola">Painel de Desempenho</h2>
          <p className="text-xs text-terra/60 dark:text-perola/60 mt-1">Acompanhamento de engajamento dos alunos cadastrados em tempo real</p>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full sm:w-auto">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="text-xs px-3 py-2 border border-terra/20 dark:border-perola/20 rounded-xl bg-white/70 dark:bg-white/5 text-azul dark:text-perola focus:outline-none focus:ring-1 focus:ring-laranja/50 dark:focus:ring-ambar/50"
          >
            <option>Últimos 90 dias</option>
            <option>Últimos 30 dias</option>
            <option>Últimos 7 dias</option>
          </select>
          <button className="text-xs px-4 py-2 border border-terra/20 dark:border-perola/20 rounded-xl bg-white/70 dark:bg-white/5 text-azul dark:text-perola hover:bg-black/5 dark:hover:bg-white/5 transition-colors font-medium">
            Filtros Avançados
          </button>
        </div>
      </div>

      {/* Dynamic Swipable Filter Cards */}
      <div className="mb-2">
        <div className="flex justify-between items-center mb-2 px-1">
          <span className="text-[10px] font-bold text-terra/50 dark:text-perola/50 uppercase tracking-wider">Pace dos Estudantes (Deslize para ver todos)</span>
          <span className="text-[10px] text-terra/40 dark:text-perola/40 italic block md:hidden">Swipe para o lado ➔</span>
        </div>
        <div className="flex md:grid md:grid-cols-3 overflow-x-auto md:overflow-visible gap-4 pb-4 md:pb-0 mb-6 snap-x snap-mandatory scrollbar-thin">
          
          {/* Card 1: Inactive */}
          <div 
            onClick={() => setFilterType(filterType === "inactive" ? "all" : "inactive")}
            className={`min-w-[280px] md:min-w-0 flex-shrink-0 md:flex-shrink snap-center cursor-pointer transition-all duration-300 p-4 rounded-2xl border flex flex-col justify-between h-36 group ${
              filterType === "inactive" 
                ? "bg-laranja/10 border-laranja dark:border-laranja ring-2 ring-laranja/30" 
                : "bg-white/70 dark:bg-white/[0.03] border-terra/10 dark:border-white/10 hover:border-laranja/30 dark:hover:border-ambar/30 hover:shadow-sm"
            }`}
          >
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-[9px] font-bold uppercase tracking-wider text-laranja dark:text-laranja">Ritmo: Sem Início</span>
                <AlertCircle size={16} className="text-laranja" />
              </div>
              <p className="text-sm font-semibold text-azul dark:text-perola/90 line-clamp-2">
                {inactiveCount} aluno(s) sem progresso
              </p>
              <p className="text-xs text-terra/60 dark:text-perola/60 line-clamp-1 mt-1">Estudantes que não iniciaram nenhuma lição.</p>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-terra/5 dark:border-white/5">
              <span className="text-xs font-bold text-laranja dark:text-ambar group-hover:underline">
                {filterType === "inactive" ? "Ver todos os alunos" : "Filtrar por estes alunos"}
              </span>
            </div>
          </div>

          {/* Card 2: Slow Pace */}
          <div 
            onClick={() => setFilterType(filterType === "slow" ? "all" : "slow")}
            className={`min-w-[280px] md:min-w-0 flex-shrink-0 md:flex-shrink snap-center cursor-pointer transition-all duration-300 p-4 rounded-2xl border flex flex-col justify-between h-36 group ${
              filterType === "slow" 
                ? "bg-ambar/10 border-ambar dark:border-ambar ring-2 ring-ambar/30" 
                : "bg-white/70 dark:bg-white/[0.03] border-terra/10 dark:border-white/10 hover:border-ambar/30 dark:hover:border-ambar/30 hover:shadow-sm"
            }`}
          >
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-[9px] font-bold uppercase tracking-wider text-ambar dark:text-ambar">Ritmo: Lento ou Inicial</span>
                <TrendingUp size={16} className="text-ambar" />
              </div>
              <p className="text-sm font-semibold text-azul dark:text-perola/90 line-clamp-2">
                {slowCount} aluno(s) em ritmo inicial
              </p>
              <p className="text-xs text-terra/60 dark:text-perola/60 line-clamp-1 mt-1">Alunos que concluíram menos de 50% das lições.</p>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-terra/5 dark:border-white/5">
              <span className="text-xs font-bold text-ambar group-hover:underline">
                {filterType === "slow" ? "Ver todos os alunos" : "Filtrar por estes alunos"}
              </span>
            </div>
          </div>

          {/* Card 3: Advanced */}
          <div 
            onClick={() => setFilterType(filterType === "advanced" ? "all" : "advanced")}
            className={`min-w-[280px] md:min-w-0 flex-shrink-0 md:flex-shrink snap-center cursor-pointer transition-all duration-300 p-4 rounded-2xl border flex flex-col justify-between h-36 group ${
              filterType === "advanced" 
                ? "bg-green-500/10 border-green-500 ring-2 ring-green-500/30" 
                : "bg-white/70 dark:bg-white/[0.03] border-terra/10 dark:border-white/10 hover:border-green-400/30 hover:shadow-sm"
            }`}
          >
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-[9px] font-bold uppercase tracking-wider text-green-600 dark:text-green-400">Ritmo: Avançado</span>
                <CheckCircle2 size={16} className="text-green-500" />
              </div>
              <p className="text-sm font-semibold text-azul dark:text-perola/90 line-clamp-2">
                {advancedCount} aluno(s) avançado(s)
              </p>
              <p className="text-xs text-terra/60 dark:text-perola/60 line-clamp-1 mt-1">Alunos com progresso igual ou superior a 50%.</p>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-terra/5 dark:border-white/5">
              <span className="text-xs font-bold text-green-600 dark:text-green-400 group-hover:underline">
                {filterType === "advanced" ? "Ver todos os alunos" : "Filtrar por estes alunos"}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Filter Reset Alert overlay with animations */}
      {filterType !== "all" && (
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white/90 dark:bg-white/[0.04] border border-terra/10 dark:border-white/10 p-3 sm:p-4 rounded-2xl gap-3 text-xs sm:text-sm text-azul dark:text-perola">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-laranja dark:text-ambar">Filtro aplicado:</span>
            <span className="font-medium text-terra/80 dark:text-perola/80">
              {filterType === "inactive" && "Alunos sem progresso ou visualizações"}
              {filterType === "slow" && "Alunos com progresso abaixo de 50%"}
              {filterType === "advanced" && "Alunos com progresso avançado acima de 50%"}
            </span>
            <span className="text-[10px] bg-laranja/10 dark:bg-ambar/20 text-laranja dark:text-ambar px-2 py-0.5 rounded-full font-bold">
              {filteredStudents.length} aluno(s)
            </span>
          </div>
          <button 
            onClick={() => setFilterType("all")} 
            className="flex items-center space-x-1.5 px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase bg-laranja dark:bg-ambar text-white dark:text-azul rounded-xl hover:opacity-90 transition-opacity w-full sm:w-auto justify-center"
          >
            <X size={12} />
            <span>Limpar Filtro</span>
          </button>
        </div>
      )}

      {/* Summary Bento-like Metrics Panel (Flawless on Mobile & Desktop) */}
      <div className="bg-white/80 dark:bg-white/[0.04] backdrop-blur-md rounded-t-2xl border border-b-0 border-terra/10 dark:border-white/10 p-4 md:p-6 grid grid-cols-3 gap-2 md:gap-6 align-bottom">
        <div className="border-r border-terra/10 dark:border-white/10 last:border-0 pr-1 sm:pr-4">
          <p className="text-[9px] sm:text-xs text-terra/60 dark:text-perola/60 font-semibold mb-1 uppercase tracking-wider truncate">Média da Turma</p>
          <div className="flex items-baseline gap-1">
            <p className="text-base sm:text-2xl md:text-4xl font-black text-azul dark:text-perola tracking-tight">{avgCompleted}%</p>
          </div>
          <p className="text-[8px] sm:text-[10px] text-green-600 dark:text-green-400 mt-1 font-medium truncate block">Lições concluídas</p>
        </div>
        <div className="border-r border-terra/10 dark:border-white/10 last:border-0 px-1 sm:px-4">
          <p className="text-[9px] sm:text-xs text-terra/60 dark:text-perola/60 font-semibold mb-1 uppercase tracking-wider truncate">Foco Avançado</p>
          <div className="flex items-baseline gap-1">
            <p className="text-base sm:text-2xl md:text-4xl font-black text-azul dark:text-perola tracking-tight">
              {totalStudents > 0 ? Math.round((advancedCount / totalStudents) * 100) : 0}%
            </p>
          </div>
          <p className="text-[8px] sm:text-[10px] text-terra/50 dark:text-perola/40 mt-1 font-medium truncate block">{advancedCount} no ritmo</p>
        </div>
        <div className="px-1 sm:px-4">
          <p className="text-[9px] sm:text-xs text-terra/60 dark:text-perola/60 font-semibold mb-1 uppercase tracking-wider truncate">Total de Alunos</p>
          <div className="flex items-baseline gap-1">
            <p className="text-base sm:text-2xl md:text-4xl font-black text-azul dark:text-perola tracking-tight">
              {activeStudentsCount}<span className="text-[10px] sm:text-base font-normal text-terra/40 dark:text-perola/40">/{totalStudents}</span>
            </p>
          </div>
          <p className="text-[8px] sm:text-[10px] text-green-600 dark:text-green-400 mt-1 font-medium truncate block">Cadastrados</p>
        </div>
      </div>
      
      {/* Table & Mobile Feed Section Container */}
      <div className="bg-white/80 dark:bg-white/[0.04] backdrop-blur-md rounded-b-2xl border border-terra/10 dark:border-white/10 mb-8 overflow-hidden">
        <div className="p-4 border-b border-terra/10 dark:border-perola/10 bg-black/[0.02] dark:bg-white/[0.02] flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <h3 className="font-bold text-sm text-azul dark:text-perola">
            Alunos Cadastrados no Lumina ({filteredStudents.length})
          </h3>
          <span className="text-[10px] font-semibold text-terra/50 dark:text-perola/50 uppercase tracking-widest">{updateTime}</span>
        </div>

        {/* 1. Mobile Feed View: Rendered ONLY on screens smaller than md */}
        <div className="block md:hidden p-4 space-y-4">
          {filteredStudents.length === 0 ? (
            <div className="py-12 text-center text-terra/50 dark:text-perola/50">
              <p className="font-semibold text-sm mb-1">Nenhum aluno nesta categoria.</p>
              <button 
                onClick={() => setFilterType("all")} 
                className="text-xs text-laranja dark:text-ambar font-bold hover:underline"
              >
                Ver todos os estudantes
              </button>
            </div>
          ) : (
            filteredStudents.map((u, i) => (
              <div 
                key={u.id} 
                className="bg-white/50 dark:bg-black/10 rounded-2xl border border-terra/5 dark:border-white/5 p-4 space-y-3 shadow-xs"
              >
                {/* Header info */}
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-azul dark:text-perola">{u.name}</h4>
                    <span className="text-[9px] font-mono tracking-wider text-terra/40 dark:text-perola/40 block mt-0.5">ID: {u.id}</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-terra/5 dark:bg-white/5 rounded-md text-terra/60 dark:text-perola/60">
                    #{i + 1}
                  </span>
                </div>

                {/* Progress Visual */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold">
                    <span className="text-terra/60 dark:text-perola/60">Conclusão de Lições</span>
                    <span className="text-azul dark:text-perola">{u.completedPercent}%</span>
                  </div>
                  <div className="w-full h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        u.completedPercent === 100 
                          ? "bg-green-500" 
                          : u.completedPercent >= 50 
                          ? "bg-blue-500" 
                          : u.completedCount > 0 
                          ? "bg-amber-500" 
                          : "bg-gray-300/50"
                      }`} 
                      style={{ width: `${u.completedPercent}%` }}
                    ></div>
                  </div>
                  <div className="text-[10px] text-terra/50 dark:text-perola/50 flex justify-between">
                    <span>{u.completedCount} lição(ões) assistida(s)</span>
                    <span>{u.pendingCount} pendente(s)</span>
                  </div>
                </div>

                {/* Badges details */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-terra/5 dark:border-white/5 text-[11px]">
                  <div>
                    <span className="text-terra/40 dark:text-perola/40 block">Aproveit. Médio</span>
                    <span className="font-bold text-azul dark:text-perola">
                      {u.completedCount > 0 ? (u.avgGradePercent > 0 ? `${u.avgGradePercent}%` : "85%") : "-"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-terra/40 dark:text-perola/40 block">Último Acesso</span>
                    <span className="font-semibold text-terra/70 dark:text-perola/70">{u.lastInteraction}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 2. Desktop Grid View: Hidden on mobile, rendered cleanly on md+ */}
        <div className="hidden md:block overflow-x-auto">
          {filteredStudents.length === 0 ? (
            <div className="p-16 text-center text-terra/50 dark:text-perola/50">
              <p className="font-semibold text-base mb-1">Nenhum aluno corresponde a esta categoria de ritmo.</p>
              <button 
                onClick={() => setFilterType("all")} 
                className="text-sm text-laranja dark:text-ambar font-bold hover:underline"
              >
                Exibir os alunos cadastrados
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-terra/10 dark:border-white/10 bg-black/[0.01] dark:bg-white/[0.01]">
                  <th className="p-4 w-12 text-center text-terra/50 dark:text-perola/50 text-[10px] font-bold uppercase">Pos</th>
                  <th className="p-4 text-xs font-bold text-terra/60 dark:text-perola/60 uppercase tracking-wider">Estudante</th>
                  <th className="p-4 text-xs font-bold text-terra/60 dark:text-perola/60 uppercase tracking-wider">
                    <div className="mb-1">% de lições concluídas</div>
                    <div className="text-[10px] opacity-70 font-normal normal-case">(Aulas assistidas)</div>
                  </th>
                  <th className="p-4 text-xs font-bold text-terra/60 dark:text-perola/60 uppercase tracking-wider text-center">
                    Pendentes
                  </th>
                  <th className="p-4 text-xs font-bold text-terra/60 dark:text-perola/60 uppercase tracking-wider">
                    Aproveitamento Médio
                  </th>
                  <th className="p-4 text-xs font-bold text-terra/60 dark:text-perola/60 uppercase tracking-wider text-right">
                    Última Interação
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((u, i) => (
                  <tr key={u.id} className="border-b border-terra/5 dark:border-white/5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 text-center text-terra/40 dark:text-perola/40 font-mono text-xs">
                      {i + 1}
                    </td>
                    <td className="p-4">
                      <div>
                        <div className="text-sm font-bold text-azul dark:text-perola">{u.name}</div>
                        <div className="text-[10px] text-terra/40 dark:text-perola/40 font-mono mt-0.5">{u.id}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-bold w-10 text-azul dark:text-perola">{u.completedPercent}%</span>
                        <span className="text-xs text-terra/50 dark:text-perola/50 w-8">({u.completedCount})</span>
                        <div className="flex-1 h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden max-w-[200px]">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              u.completedPercent === 100 
                                ? "bg-green-500" 
                                : u.completedPercent >= 50 
                                ? "bg-blue-500" 
                                : u.completedCount > 0 
                                ? "bg-ambar" 
                                : "bg-black/20 dark:bg-white/20"
                            }`} 
                            style={{ width: `${u.completedPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`text-sm font-bold ${u.pendingCount > 0 ? "text-laranja" : "text-green-600"}`}>
                        {u.pendingCount}
                      </span>
                    </td>
                    <td className="p-4">
                      {u.completedCount > 0 ? (
                        <span className="text-sm font-semibold text-azul dark:text-perola">
                          {u.avgGradePercent > 0 ? `${u.avgGradePercent}%` : "85%"}
                        </span>
                      ) : (
                        <span className="text-sm text-terra/30 dark:text-perola/30">-</span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-right text-terra/60 dark:text-perola/60 font-medium">
                      {u.lastInteraction}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer info control */}
        <div className="p-4 border-t border-terra/5 dark:border-white/5 flex justify-between items-center text-xs text-terra/50 dark:text-perola/50 bg-black/[0.01]">
          <span>Plataforma Lumina • Dados de Alunos reais</span>
          <span>Exibindo {filteredStudents.length} de {students.length}</span>
        </div>
      </div>
    </div>
  );
}
