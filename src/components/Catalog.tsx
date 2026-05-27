import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Course } from "../types";

export function Catalog({ onSelectCourse, onEditCourse }: { onSelectCourse: (id: string) => void, onEditCourse?: (id: string) => void }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getCourses()
      .then((data) => {
        setCourses(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erro ao carregar cursos:", err);
        setError(err.message || "Não foi possível carregar os cursos do banco de dados.");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-terra/60 dark:text-perola/60 font-medium z-10 relative">Carregando catálogo...</div>;
  }

  if (error) {
    return (
      <div className="p-12 text-center z-10 relative">
        <div className="inline-block bg-laranja/10 text-laranja dark:bg-laranja/20 dark:text-perola px-6 py-4 rounded-xl border border-laranja/20 shadow-sm max-w-lg">
          <h3 className="font-bold mb-2">Erro de Conexão</h3>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto w-full z-10 relative">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-semibold tracking-tight mb-8">Seus Cursos Disponíveis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course) => (
            <div 
              key={course.id} 
              className="group bg-white/60 dark:bg-azul/50 backdrop-blur-sm border border-terra/10 dark:border-perola/10 rounded-3xl overflow-hidden shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col cursor-pointer"
              onClick={() => onSelectCourse(course.id)}
            >
              <div className="w-full h-48 bg-perola dark:bg-azul/80 flex items-center justify-center text-terra/40 dark:text-perola/40 font-bold text-xl group-hover:bg-perola/80 dark:group-hover:bg-azul/60 transition-colors overflow-hidden relative">
                {course.coverImage?.startsWith('http') ? (
                  <img src={course.coverImage} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  course.coverImage || "Capa"
                )}
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-lg font-semibold text-azul dark:text-perola mb-2">{course.title}</h3>
                <p className="text-sm text-terra/70 dark:text-perola/70 mb-6 flex-grow">{course.description}</p>
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCourse(course.id);
                    }}
                    className="flex-1 py-2.5 bg-laranja hover:bg-laranja/90 text-white font-bold rounded-xl text-sm transition-colors shadow-lg shadow-laranja/20"
                  >
                    Iniciar Curso
                  </button>
                  {onEditCourse && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditCourse(course.id);
                      }}
                      className="px-4 py-2.5 bg-white/50 dark:bg-perola/10 hover:bg-white dark:hover:bg-perola/20 text-azul dark:text-perola font-bold rounded-xl text-sm transition-colors border border-terra/20 dark:border-perola/20"
                    >
                      Editar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
