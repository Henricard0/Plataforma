import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { PlayCircle, Check, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { cn } from "../lib/utils";
import type { Course, Module, Lesson, UserProgress } from "../types";
import { motion, AnimatePresence } from "motion/react";

export function Player({ courseId, userId }: { courseId: string; userId: string }) {
  const [data, setData] = useState<{ course: Course; modules: Module[]; lessons: Lesson[] } | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 1024;
    }
    return true;
  });

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const result = await api.getCourseWithModules(courseId);
        const userProgress = await api.getProgress(userId);
        
        setData(result);
        setProgress(userProgress);
        
        if (result.lessons.length > 0) {
          setActiveLessonId(result.lessons[0].id);
        }
      } catch (err) {
        console.error("Failed to load course", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [courseId, userId]);

  const toggleLessonComplete = async (e: React.MouseEvent, lessonId: string) => {
    e.stopPropagation();
    try {
      const newProgress = await api.toggleProgress(userId, lessonId);
      setProgress(newProgress);
    } catch(err) {
      console.error(err);
    }
  };

  if (loading || !data) return <div className="p-12 text-center text-slate-500">Carregando player...</div>;

  const activeLesson = data.lessons.find((l) => l.id === activeLessonId);
  const lessonsInCourse = data.lessons.length;
  const completedInCourse = data.lessons.filter((l) => progress.some((p) => p.lesson_id === l.id)).length;
  const progressPercent = lessonsInCourse === 0 ? 0 : Math.round((completedInCourse / lessonsInCourse) * 100);

  return (
    <div className="w-full h-full flex flex-row overflow-hidden z-10 flex-1 relative bg-transparent">
      
      {/* Mobile Sidebar Backdrop overlay with Motion */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-20 top-16"
          />
        )}
      </AnimatePresence>

      {/* Sidebar: Course Modules with Liquid Glass identity */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 pt-16 lg:pt-0 pb-6 w-80 lg:w-96 flex-shrink-0 border-r border-white/20 dark:border-white/5 liquid-glass-card flex flex-col z-30 lg:z-10 transition-all duration-300 ease-in-out",
        isSidebarOpen 
          ? "translate-x-0 opacity-100" 
          : "-translate-x-full lg:translate-x-0 lg:w-0 lg:overflow-hidden lg:border-r-0 lg:opacity-0"
      )}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="px-2.5 py-0.5 bg-laranja/10 text-laranja dark:bg-ectar/10 dark:text-ectar font-bold text-[10px] rounded-xl uppercase tracking-wider shadow-2xs">Em Andamento</span>
            <motion.button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1.5 border border-terra/15 dark:border-perola/15 text-terra dark:text-perola rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              title="Recolher Módulos"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <X size={16} />
            </motion.button>
          </div>
          <h2 className="text-lg font-bold text-azul dark:text-perola leading-tight mb-4">{data.course.title}</h2>
          <div className="w-full h-1.5 bg-terra/10 dark:bg-perola/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-linear-to-r from-laranja to-ambar rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-terra/60 dark:text-perola/60 mt-2 font-semibold tracking-wider">{progressPercent}% CONCLUÍDO ({completedInCourse}/{lessonsInCourse} AULAS)</p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-6">
          {data.modules.map((module) => {
            const moduleLessons = data.lessons.filter((l) => l.module_id === module.id);
            return (
              <section key={module.id}>
                <h3 className="text-xs font-bold text-terra/40 dark:text-perola/40 uppercase tracking-widest mb-3 px-2">{module.title}</h3>
                <div className="space-y-1">
                  {moduleLessons.map((lesson) => {
                    const isCompleted = progress.some((p) => p.lesson_id === lesson.id);
                    const isActive = activeLessonId === lesson.id;
                    return (
                      <motion.button 
                        key={lesson.id}
                        onClick={() => {
                          setActiveLessonId(lesson.id);
                          // Auto close drawer on mobile for seamless transition
                          if (window.innerWidth < 1024) {
                            setIsSidebarOpen(false);
                          }
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all cursor-pointer relative overflow-hidden",
                          isActive 
                            ? "bg-linear-to-r from-laranja/10 to-ambar/5 dark:from-ambar/15 dark:to-ectar/5 border border-laranja/30 dark:border-ambar/30 shadow-2xs" 
                            : "bg-white/30 dark:bg-white/5 hover:bg-white/50 dark:hover:bg-white/10 opacity-90 hover:opacity-100 border border-white/10"
                        )}
                        whileHover={{ x: 4, scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <motion.div 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLessonComplete(e, lesson.id);
                          }}
                          className={cn(
                            "w-5 h-5 flex-shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-colors cursor-pointer",
                            isCompleted 
                              ? "bg-laranja border-laranja dark:bg-ambar dark:border-ambar text-white dark:text-azul" 
                              : isActive 
                                ? "border-laranja dark:border-ambar text-laranja dark:text-ambar" 
                                : "border-terra/30 dark:border-perola/30 text-terra/40 dark:text-perola/40"
                          )}
                          whileTap={{ scale: 0.8 }}
                          whileHover={{ scale: 1.15 }}
                        >
                          {isCompleted ? "✓" : ""}
                        </motion.div>
                        <span className={cn(
                          "text-sm font-semibold",
                          isActive ? "text-laranja dark:text-ambar font-bold" : "text-terra/80 dark:text-perola/80"
                        )}>
                          {lesson.title}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </aside>

      {/* Main Player Area */}
      <div className="flex-1 flex flex-col bg-perola dark:bg-azul overflow-hidden relative">
        <div className="p-4 sm:p-8 flex-1 flex flex-col overflow-y-auto">
          
          {/* Header Controls inside player space with high contrast Liquid Glass Button */}
          <div className="max-w-5xl w-full mx-auto mb-4 flex items-center justify-between gap-4 z-10">
            <motion.button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="flex items-center gap-2 px-4 py-2 text-azul dark:text-perola font-bold text-xs shadow-xs cursor-pointer rounded-xl border border-white/45 dark:border-white/10 bg-white/30 dark:bg-white/5 backdrop-blur-md"
              title={isSidebarOpen ? "Recolher Módulos" : "Mostrar Módulos"}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
            >
              {isSidebarOpen ? (
                <>
                  <PanelLeftClose size={15} className="text-laranja dark:text-ambar" />
                  <span className="hidden sm:inline">Recolher Tópicos</span>
                </>
              ) : (
                <>
                  <PanelLeftOpen size={15} className="text-laranja dark:text-ambar" />
                  <span>Ver Módulos</span>
                </>
              )}
            </motion.button>

            {activeLesson && (
              <div className="flex-1 text-right truncate">
                <span className="text-[10px] sm:text-xs text-terra/60 dark:text-perola/60 font-semibold uppercase tracking-wider">
                  {!isSidebarOpen ? `Assistindo: ${activeLesson.title}` : ""}
                </span>
              </div>
            )}
          </div>

          <div className="aspect-video w-full max-w-5xl mx-auto bg-azul rounded-3xl shadow-2xl relative overflow-hidden group">
            {activeLesson?.video_url ? (
               activeLesson.video_url.endsWith('.mp4') || activeLesson.video_url.endsWith('.webm') ? (
                 <video src={activeLesson.video_url} controls className="w-full h-full object-cover" />
               ) : (
                 <iframe 
                   src={
                     activeLesson.video_url.includes('youtube.com/watch?v=') 
                       ? activeLesson.video_url.replace('watch?v=', 'embed/').split('&')[0]
                       : activeLesson.video_url.includes('youtu.be/')
                         ? 'https://www.youtube.com/embed/' + activeLesson.video_url.split('youtu.be/')[1]
                         : activeLesson.video_url
                   } 
                   className="w-full h-full"
                   allowFullScreen
                   allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                 />
               )
            ) : (
              // Placeholder
              <>
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/60 to-transparent">
                  <div 
                    className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/30 cursor-pointer hover:bg-white/30 transition-colors"
                    onClick={() => alert("Nenhum vídeo cadastrado para esta aula.")}
                  >
                    <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[20px] border-l-perola border-b-[12px] border-b-transparent translate-x-1"></div>
                  </div>
                </div>
                <div className="absolute bottom-0 inset-x-0 p-6 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="h-1 w-full bg-perola/20 rounded-full overflow-hidden">
                     <div className="h-full bg-laranja dark:bg-ambar w-[0%]"></div>
                  </div>
                  <div className="flex justify-between items-center text-perola text-xs font-medium">
                    <span>00:00 / --:--</span>
                    <div className="flex gap-4">
                      <span>Nenhum vídeo</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          
          <div className="mt-8 max-w-5xl mx-auto w-full">
            <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-azul dark:text-perola">
                  {activeLesson?.title || "Carregando aula..."}
                </h1>
                <div className="text-terra/80 dark:text-perola/80 mt-2 max-w-2xl text-base leading-relaxed">
                  {activeLesson?.content_text || "Selecione uma aula na barra lateral para iniciar o seu aprendizado estruturado."}
                </div>
              </div>
              {activeLesson && (
                <div className="flex flex-wrap gap-3 shrink-0 justify-end">
                  {activeLesson.materials_url && activeLesson.materials_url.split(',').map((url, i) => {
                    const cleanUrl = url.trim();
                    if (!cleanUrl) return null;
                    
                    let label = "Material " + (i + 1);
                    if (cleanUrl.toLowerCase().includes('.pdf')) label = "PDF " + (i + 1);
                    else if (cleanUrl.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)/)) label = "Imagem " + (i + 1);
                    else if (cleanUrl.toLowerCase().match(/\.(ppt|pptx|key)/)) label = "Apresentação " + (i + 1);
                    else if (cleanUrl.toLowerCase().match(/\.(doc|docx|txt)/)) label = "Documento " + (i + 1);

                    return (
                      <motion.a 
                        key={i}
                        href={cleanUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-4 py-2.5 rounded-xl border border-white/20 dark:border-white/5 bg-white/20 dark:bg-white/5 backdrop-blur-md font-semibold text-sm text-laranja dark:text-ambar shadow-2xs hover:bg-white/40 dark:hover:bg-white/10 transition-all flex items-center gap-2 cursor-pointer"
                        whileHover={{ y: -1, scale: 1.02 }}
                        whileTap={{ scale: 0.96 }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                        {label}
                      </motion.a>
                    );
                  })}
                  <motion.button 
                    onClick={(e) => toggleLessonComplete(e, activeLesson.id)}
                    className="px-5 py-3 rounded-2xl bg-linear-to-r from-laranja to-ambar text-white font-bold text-sm shadow-md hover:opacity-95 transition-all cursor-pointer"
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.96 }}
                  >
                    {progress.some(p => p.lesson_id === activeLesson.id) 
                      ? "✓ Desmarcar Conclusão" 
                      : "Marcar como Concluída"}
                  </motion.button>
                </div>
              )}
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
              <div className="p-4 rounded-2xl bg-white/50 dark:bg-azul/50 border border-terra/10 dark:border-perola/10 shadow-sm flex-1">
                <span className="text-[10px] font-bold text-laranja dark:text-ambar uppercase tracking-widest">Status</span>
                <p className="text-sm font-bold text-azul dark:text-perola mt-1">Conectado ao LMS</p>
              </div>
              {activeLesson && (
                <div className="p-4 rounded-2xl bg-white/50 dark:bg-azul/50 border border-terra/10 dark:border-perola/10 shadow-sm flex-1">
                  <span className="text-[10px] font-bold text-laranja dark:text-ambar uppercase tracking-widest">Módulo</span>
                  <p className="text-sm font-bold text-azul dark:text-perola mt-1">
                    {data.modules.find(m => m.id === activeLesson.module_id)?.title}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
