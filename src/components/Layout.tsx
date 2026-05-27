import React, { useState } from 'react';
import { PlayCircle, Moon, Sun, Menu, X, Users, BarChart3, PlusCircle, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LayoutProps {
  children: React.ReactNode;
  user: any;
  onLogout: () => void;
  onNavigateHome: () => void;
  onNavigateAdmin?: () => void;
  onNavigateUsers?: () => void;
  onNavigateAnalytics?: () => void;
  darkMode?: boolean;
  toggleDarkMode?: () => void;
}

export function Layout({ children, user, onLogout, onNavigateHome, onNavigateAdmin, onNavigateUsers, onNavigateAnalytics, darkMode, toggleDarkMode }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMobileNav = (action: () => void) => {
    action();
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col text-azul dark:text-perola font-sans relative overflow-hidden bg-perola dark:bg-azul transition-colors duration-300">
      
      {/* Liquid Glass Ambient Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[8%] left-[-10%] w-[350px] h-[350px] rounded-full bg-linear-to-tr from-laranja/10 to-ectar/10 dark:from-laranja/15 dark:to-ectar/15 blur-[95px] animate-blob-1 opacity-70"></div>
        <div className="absolute bottom-[20%] right-[-10%] w-[420px] h-[420px] rounded-full bg-linear-to-tr from-ambar/10 to-laranja/10 dark:from-ectar/10 dark:to-laranja/15 blur-[115px] animate-blob-2 opacity-80"></div>
        <div className="absolute top-[45%] left-[45%] w-[290px] h-[290px] rounded-full bg-linear-to-tr from-blue-500/10 to-ectar/5 dark:from-blue-600/10 dark:to-ectar/10 blur-[85px] animate-blob-3 opacity-60"></div>
      </div>

      {user && (
        <>
          <header className="h-16 border-b border-white/20 dark:border-white/10 bg-white/40 dark:bg-azul/45 backdrop-blur-md flex items-center justify-between px-4 sm:px-8 z-30 sticky top-0 shadow-xs">
            <motion.div 
              className="flex items-center gap-2 cursor-pointer group"
              onClick={onNavigateHome}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
            >
              <div className="w-8 h-8 bg-laranja dark:bg-ambar rounded-lg flex items-center justify-center transition-colors shadow-xs">
                <div className="w-4 h-4 border-2 border-white dark:border-azul rotate-45 group-hover:rotate-90 transition-transform duration-300"></div>
              </div>
              <span className="font-bold text-azul dark:text-perola text-xl tracking-tight">Lumina</span>
            </motion.div>

            {/* Desktop Navigation Group */}
            <div className="hidden lg:flex items-center gap-4">
              {toggleDarkMode && (
                <motion.button
                  onClick={toggleDarkMode}
                  className="p-2 border border-white/45 dark:border-white/10 text-terra dark:text-perola rounded-xl hover:bg-white/50 dark:hover:bg-white/10 transition-colors shadow-2xs"
                  title="Alternar tema"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {darkMode ? <Sun size={18} className="text-ectar animate-pulse" /> : <Moon size={18} />}
                </motion.button>
              )}

              {user.role && user.role !== 'student' && (
                <span className="text-[10px] uppercase font-bold px-2.5 py-1 bg-laranja/10 text-laranja dark:bg-ambar/10 dark:text-ambar rounded-xl border border-laranja/20 mr-1 shadow-2xs">
                  {user.role === 'admin' ? 'Administrador' : 'Professor'}
                </span>
              )}
              
              {onNavigateUsers && (
                <motion.button 
                  onClick={onNavigateUsers}
                  className="text-xs px-4 py-2 border border-white/40 bg-white/40 backdrop-blur-sm dark:border-white/10 dark:bg-white/5 text-laranja dark:text-ambar rounded-xl hover:bg-white/60 dark:hover:bg-white/10 transition-colors font-bold shadow-2xs"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.96 }}
                >
                  Usuários
                </motion.button>
              )}
              
              {onNavigateAnalytics && (
                <motion.button 
                  onClick={onNavigateAnalytics}
                  className="text-xs px-4 py-2 border border-blue-500/30 bg-blue-500/10 backdrop-blur-sm text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-500/25 transition-colors font-bold shadow-2xs"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.96 }}
                >
                  Análises
                </motion.button>
              )}
              
              {onNavigateAdmin && (
                <motion.button 
                  onClick={onNavigateAdmin}
                  className="text-xs px-4 py-2 border border-white/40 bg-linear-to-r from-laranja to-ambar text-white rounded-xl hover:opacity-95 transition-opacity font-bold shadow-xs mr-2"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.96 }}
                >
                  + Criar Curso
                </motion.button>
              )}
              
              <div className="flex flex-col items-end">
                <span className="text-xs font-semibold text-terra/60 dark:text-perola/60 uppercase tracking-wider scale-95">Bem-vindo</span>
                <span className="text-sm font-bold text-azul dark:text-perola">{user.name || user.email}</span>
              </div>

              <div className="w-10 h-10 bg-laranja/10 dark:bg-ambar/10 rounded-full border-2 border-laranja/20 dark:border-ambar/20 shadow-xs flex items-center justify-center font-bold text-laranja dark:text-ambar">
                {(user.name || user.email || 'A').charAt(0).toUpperCase()}
              </div>

              <motion.button 
                onClick={onLogout}
                className="ml-2 text-xs px-4 py-2 border border-red-500/20 bg-red-500/5 text-red-600 rounded-xl hover:bg-red-500/10 transition-colors font-bold shadow-2xs"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
              >
                Sair
              </motion.button>
            </div>

            {/* Mobile Actions Header */}
            <div className="flex lg:hidden items-center gap-2">
              {toggleDarkMode && (
                <motion.button
                  onClick={toggleDarkMode}
                  className="p-2 border border-white/45 dark:border-white/10 text-terra dark:text-perola rounded-xl hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
                  title="Alternar tema"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {darkMode ? <Sun size={18} className="text-ectar animate-pulse" /> : <Moon size={18} />}
                </motion.button>
              )}

              {/* Hamburger Button */}
              <motion.button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 border border-white/45 dark:border-white/10 text-terra dark:text-perola rounded-xl hover:bg-white/50 dark:hover:bg-white/10 transition-colors relative z-40"
                aria-label="Abrir menu"
                whileTap={{ scale: 0.92 }}
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </motion.button>
            </div>
          </header>

          {/* Mobile Slide-out Navigation Drawer */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <>
                {/* Backdrop with Motion */}
                <motion.div 
                  className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 lg:hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsMobileMenuOpen(false)}
                />

                {/* Drawer Container */}
                <motion.div 
                  className="fixed right-0 top-0 h-full w-[85%] max-w-sm bg-perola/95 dark:bg-azul/95 backdrop-blur-lg border-l border-white/10 p-6 shadow-2xl flex flex-col justify-between z-40 lg:hidden"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                >
                  <div>
                    <div className="flex items-center gap-3 pb-6 border-b border-terra/10 dark:border-perola/10 mb-6">
                      <div className="w-10 h-10 bg-laranja/10 dark:bg-ambar/10 rounded-full border border-laranja/20 dark:border-ambar/20 flex items-center justify-center font-bold text-laranja dark:text-ambar">
                        {(user.name || user.email || 'A').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-azul dark:text-perola truncate text-left">{user.name || user.email}</span>
                        {user.role && user.role !== 'student' && (
                          <span className="text-[9px] uppercase font-bold text-laranja dark:text-ambar mt-0.5 text-left">
                            {user.role === 'admin' ? 'Administrador' : 'Professor'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <motion.button
                        onClick={() => handleMobileNav(onNavigateHome)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/40 dark:border-white/10 hover:bg-white/50 dark:hover:bg-white/5 text-sm font-medium transition-colors text-left bg-white/20 dark:bg-white/5"
                        whileTap={{ scale: 0.97 }}
                      >
                        <PlayCircle size={18} className="text-laranja dark:text-ambar" />
                        <span>Catálogo de Cursos</span>
                      </motion.button>

                      {onNavigateAnalytics && (
                        <motion.button
                          onClick={() => handleMobileNav(onNavigateAnalytics)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl border border-blue-500/30 bg-blue-500/5 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 text-sm font-semibold transition-colors text-left"
                          whileTap={{ scale: 0.97 }}
                        >
                          <BarChart3 size={18} />
                          <span>Análises (Pace & Progresso)</span>
                        </motion.button>
                      )}

                      {onNavigateUsers && (
                        <motion.button
                          onClick={() => handleMobileNav(onNavigateUsers)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 text-laranja dark:text-ambar hover:bg-amber-500/10 text-sm font-semibold transition-colors text-left"
                          whileTap={{ scale: 0.97 }}
                        >
                          <Users size={18} />
                          <span>Gerenciar Usuários</span>
                        </motion.button>
                      )}

                      {onNavigateAdmin && (
                        <motion.button
                          onClick={() => handleMobileNav(onNavigateAdmin)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl border border-laranja/30 hover:bg-laranja/10 text-sm font-semibold transition-colors text-left text-laranja dark:text-ambar"
                          whileTap={{ scale: 0.97 }}
                        >
                          <PlusCircle size={18} />
                          <span>Criar Novo Curso</span>
                        </motion.button>
                      )}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-terra/10 dark:border-perola/10">
                    <motion.button
                      onClick={() => handleMobileNav(onLogout)}
                      className="w-full flex items-center justify-center gap-2 p-3 border border-red-500/20 bg-red-500/5 text-red-600 rounded-xl hover:bg-red-500/10 transition-colors text-sm font-bold shadow-sm"
                      whileTap={{ scale: 0.95 }}
                    >
                      <LogOut size={16} />
                      <span>Sair da Conta</span>
                    </motion.button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}
      <main className="flex-1 flex flex-col z-10 relative min-h-0">
        {children}
      </main>

      {/* Decorative Background Elements */}
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-ambar/20 dark:bg-ambar/5 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-laranja/10 dark:bg-laranja/5 rounded-full blur-[100px] pointer-events-none z-0"></div>
    </div>
  );
}
