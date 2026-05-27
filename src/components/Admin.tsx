import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';

export function Admin({ onCourseCreated, courseId }: { onCourseCreated: () => void, courseId?: string }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(!!courseId);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modules, setModules] = useState<{
    id: string; title: string; lessons: { id: string; title: string; video_url: string; content_text: string; materials_url: string }[]
  }[]>([
    { id: '1', title: 'Módulo 1', lessons: [{ id: '1', title: 'Aula 1', video_url: '', content_text: '', materials_url: '' }] }
  ]);

  useEffect(() => {
    if (courseId) {
      api.getCourseWithModules(courseId).then(data => {
        setTitle(data.course.title);
        setDescription(data.course.description);
        setCoverImage(data.course.coverImage || '');
        
        if (data.modules && data.modules.length > 0) {
          setModules(data.modules.map(m => ({
            id: m.id,
            title: m.title,
            lessons: data.lessons.filter(l => l.module_id === m.id).map(l => ({
              id: l.id,
              title: l.title,
              video_url: l.video_url || '',
              content_text: l.content_text || '',
              materials_url: l.materials_url || ''
            }))
          })));
        }
        setLoadingData(false);
      }).catch(err => {
        console.error(err);
        setError("Erro ao carregar os dados do curso.");
        setLoadingData(false);
      });
    }
  }, [courseId]);

  const addModule = () => {
    setModules([...modules, { id: Math.random().toString(), title: `Módulo ${modules.length + 1}`, lessons: [] }]);
  };

  const addLesson = (moduleId: string) => {
    setModules(modules.map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          lessons: [...m.lessons, { id: Math.random().toString(), title: `Aula ${m.lessons.length + 1}`, video_url: '', content_text: '', materials_url: '' }]
        };
      }
      return m;
    }));
  };

  const updateModule = (moduleId: string, field: string, value: string) => {
    setModules(modules.map(m => m.id === moduleId ? { ...m, [field]: value } : m));
  };

  const updateLesson = (moduleId: string, lessonId: string, field: string, value: string) => {
    setModules(modules.map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          lessons: m.lessons.map(l => l.id === lessonId ? { ...l, [field]: value } : l)
        };
      }
      return m;
    }));
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!supabase) {
      alert("Conecte-se ao Supabase primeiro para fazer upload de arquivos.");
      return;
    }

    setUploadingFile(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `cover_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      
      const { error } = await supabase.storage.from('lms-files').upload(fileName, file);
      
      if (error) {
        throw error;
      }
      
      const { data: publicUrlData } = supabase.storage.from('lms-files').getPublicUrl(fileName);
      setCoverImage(publicUrlData.publicUrl);
    } catch (err: any) {
      console.error(err);
      alert(`Erro no upload da capa: ${err.message}`);
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, moduleId: string, lessonId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!supabase) {
      alert("Conecte-se ao Supabase primeiro para fazer upload de arquivos.");
      return;
    }

    setUploadingFile(true);
    try {
      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      
      const { error } = await supabase.storage.from('lms-files').upload(fileName, file);
      
      if (error) {
        throw error;
      }
      
      const { data: publicUrlData } = supabase.storage.from('lms-files').getPublicUrl(fileName);
      
      const module = modules.find(m => m.id === moduleId);
      const lesson = module?.lessons.find(l => l.id === lessonId);
      
      if (lesson) {
        const separator = lesson.materials_url && lesson.materials_url.trim() !== '' ? ', ' : '';
        updateLesson(moduleId, lessonId, 'materials_url', lesson.materials_url + separator + publicUrlData.publicUrl);
      }
      
    } catch (err: any) {
      console.error(err);
      alert(`Erro no upload: ${err.message}. Certifique-se de que o bucket 'lms-files' foi criado no Supabase e é público (execute o script SQL de Storage).`);
    } finally {
      setUploadingFile(false);
      e.target.value = ''; // Reset file input
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (courseId) {
        await api.updateCourse(courseId, { title, description, coverImage }, modules);
      } else {
        await api.createCourse({ title, description, coverImage }, modules);
      }
      onCourseCreated();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao salvar o curso. Verifique se seu banco de dados está atualizado (materials_url na tabela lessons).');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!courseId) return;
    if (confirm("Tem certeza que deseja excluir este curso? Esta ação não pode ser desfeita.")) {
      setLoading(true);
      try {
        await api.deleteCourse(courseId);
        onCourseCreated();
      } catch (err: any) {
        console.error(err);
        setError("Erro ao excluir curso.");
        setLoading(false);
      }
    }
  };

  if (loadingData) {
    return (
      <div className="flex-1 w-full max-w-3xl mx-auto px-6 py-12 flex items-center justify-center">
        <div className="text-terra/60 dark:text-perola/60 font-bold">Carregando dados do curso...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-3xl mx-auto px-6 py-12 z-10 relative overflow-y-auto max-h-[90vh] transition-colors">
      <div className="bg-white/90 dark:bg-azul/90 backdrop-blur-md p-10 rounded-3xl border border-terra/10 dark:border-perola/10 shadow-xl transition-colors">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-bold tracking-tight text-azul dark:text-perola">{courseId ? 'Editar Curso' : 'Novo Curso'}</h2>
          {courseId && (
            <button 
              type="button" 
              onClick={handleDelete}
              className="text-sm px-4 py-2 bg-laranja/10 dark:bg-laranja/20 text-laranja dark:text-perola font-bold rounded-lg hover:bg-laranja/20 dark:hover:bg-laranja/30 transition-colors"
            >
              Excluir Curso
            </button>
          )}
        </div>
        <p className="text-terra/60 dark:text-perola/60 mb-8 border-b border-terra/20 dark:border-perola/20 pb-6">{courseId ? 'Altere as informações abaixo e clique em Salvar.' : 'Preencha os dados abaixo para adicionar um curso completo.'}</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-azul dark:text-perola">1. Informações Básicas</h3>
            <div>
              <label className="block text-sm font-semibold text-terra dark:text-perola mb-1.5">Título do Curso</label>
              <input 
                type="text" required value={title} onChange={e => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-terra/20 dark:border-perola/20 rounded-xl text-sm bg-white/50 dark:bg-azul/50 text-azul dark:text-perola focus:bg-white dark:focus:bg-azul focus:outline-none focus:ring-2 focus:ring-laranja/50" 
                placeholder="Ex: Introdução ao React"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-terra dark:text-perola mb-1.5">Descrição</label>
              <textarea 
                required value={description} onChange={e => setDescription(e.target.value)} rows={3}
                className="w-full px-4 py-3 border border-terra/20 dark:border-perola/20 rounded-xl text-sm bg-white/50 dark:bg-azul/50 text-azul dark:text-perola focus:bg-white dark:focus:bg-azul focus:outline-none focus:ring-2 focus:ring-laranja/50 resize-none" 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-terra dark:text-perola mb-1.5">URL da Capa (Opcional)</label>
              <div className="flex gap-2">
                <input 
                  type="text" value={coverImage} onChange={e => setCoverImage(e.target.value)}
                  className="w-full px-4 py-3 border border-terra/20 dark:border-perola/20 rounded-xl text-sm bg-white/50 dark:bg-azul/50 text-azul dark:text-perola focus:bg-white dark:focus:bg-azul focus:outline-none focus:ring-2 focus:ring-laranja/50" 
                  placeholder="https://sua-imagem.com/capa.png"
                />
                <label className={`cursor-pointer px-4 py-3 bg-perola/30 dark:bg-perola/10 hover:bg-perola/50 dark:hover:bg-perola/20 border border-terra/20 dark:border-perola/20 rounded-xl text-sm font-bold text-azul dark:text-perola whitespace-nowrap flex items-center justify-center transition-colors ${uploadingFile ? 'opacity-50 pointer-events-none' : ''}`}>
                    {uploadingFile ? 'Enviando...' : 'Fazer Upload'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-6 pt-6 border-t border-terra/20 dark:border-perola/20">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-azul dark:text-perola">2. Estrutura do Curso</h3>
              <button type="button" onClick={addModule} className="text-sm px-4 py-2 bg-perola/30 dark:bg-perola/10 text-azul dark:text-perola font-bold rounded-lg hover:bg-perola/50 dark:hover:bg-perola/20">+ Módulo</button>
            </div>
            
            {modules.map((module, mIndex) => (
              <div key={module.id} className="p-5 border border-laranja/20 dark:border-ambar/20 bg-laranja/5 dark:bg-ambar/5 rounded-2xl space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-laranja dark:text-ambar mb-1.5">Módulo {mIndex + 1}: Título</label>
                  <input 
                    type="text" required value={module.title} onChange={e => updateModule(module.id, 'title', e.target.value)}
                    className="w-full px-4 py-2 border border-laranja/30 dark:border-ambar/30 rounded-lg text-sm bg-white dark:bg-azul/50 text-azul dark:text-perola focus:bg-white dark:focus:bg-azul focus:outline-none focus:ring-1 focus:ring-laranja/50" 
                  />
                </div>

                <div className="space-y-3 pl-4 border-l-2 border-laranja/30 dark:border-ambar/30">
                  {module.lessons.map((lesson, lIndex) => (
                    <div key={lesson.id} className="p-4 bg-white dark:bg-azul/30 rounded-xl border border-terra/20 dark:border-perola/20 space-y-3 shadow-sm">
                      <div className="font-bold text-sm text-terra/80 dark:text-perola/80 mb-2 border-b border-terra/10 dark:border-perola/10 pb-2">Aula {lIndex + 1}</div>
                      <div>
                        <label className="block text-xs font-semibold text-terra/60 dark:text-perola/60 mb-1">Título da Aula</label>
                        <input 
                          type="text" required value={lesson.title} onChange={e => updateLesson(module.id, lesson.id, 'title', e.target.value)}
                          className="w-full px-3 py-2 border border-terra/20 dark:border-perola/20 rounded-lg text-sm bg-white/50 dark:bg-azul/50 text-azul dark:text-perola focus:bg-white dark:focus:bg-azul focus:outline-none focus:ring-1 focus:ring-laranja/50" 
                        />
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-terra/60 dark:text-perola/60 mb-1">URL do Vídeo (.mp4 ou Youtube/Vimeo)</label>
                          <input 
                            type="text" value={lesson.video_url} onChange={e => updateLesson(module.id, lesson.id, 'video_url', e.target.value)}
                            className="w-full px-3 py-2 border border-terra/20 dark:border-perola/20 rounded-lg text-sm bg-white/50 dark:bg-azul/50 text-azul dark:text-perola focus:bg-white dark:focus:bg-azul focus:outline-none focus:ring-1 focus:ring-laranja/50" placeholder="https://..."
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-terra/60 dark:text-perola/60 mb-1">Materiais (Links divididos por vírgula)</label>
                          <div className="flex gap-2">
                            <input 
                              type="text" value={lesson.materials_url} onChange={e => updateLesson(module.id, lesson.id, 'materials_url', e.target.value)}
                              className="w-full px-3 py-2 border border-terra/20 dark:border-perola/20 rounded-lg text-sm bg-white/50 dark:bg-azul/50 text-azul dark:text-perola focus:bg-white dark:focus:bg-azul focus:outline-none focus:ring-1 focus:ring-laranja/50" placeholder="https://..., https://..."
                            />
                            <label className={`cursor-pointer px-3 py-2 bg-perola/30 dark:bg-perola/10 hover:bg-perola/50 dark:hover:bg-perola/20 border border-terra/20 dark:border-perola/20 rounded-lg text-xs font-bold text-azul dark:text-perola whitespace-nowrap flex items-center justify-center transition-colors ${uploadingFile ? 'opacity-50 pointer-events-none' : ''}`}>
                                {uploadingFile ? 'Enviando...' : 'Anexar Arquivo'}
                                <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, module.id, lesson.id)} />
                            </label>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-terra/60 dark:text-perola/60 mb-1">Texto/Anotações da Aula</label>
                        <textarea 
                           value={lesson.content_text} onChange={e => updateLesson(module.id, lesson.id, 'content_text', e.target.value)} rows={2}
                          className="w-full px-3 py-2 border border-terra/20 dark:border-perola/20 rounded-lg text-sm bg-white/50 dark:bg-azul/50 text-azul dark:text-perola focus:bg-white dark:focus:bg-azul focus:outline-none focus:ring-1 focus:ring-laranja/50 resize-none" 
                        />
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => addLesson(module.id)} className="text-xs px-3 py-1.5 bg-white/50 dark:bg-azul/50 border border-laranja/30 dark:border-ambar/30 text-laranja dark:text-ambar font-bold rounded-lg hover:bg-laranja/10 dark:hover:bg-ambar/10 mx-2 mt-2 transition-colors">
                    + Adicionar Aula
                  </button>
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div className="p-4 bg-laranja/10 text-laranja dark:bg-laranja/20 dark:text-perola rounded-xl border border-laranja/20 text-sm font-medium">
              {error}
            </div>
          )}

          <div className="pt-4 flex gap-4">
            <button type="button" onClick={onCourseCreated} className="flex-1 py-3.5 bg-perola/50 dark:bg-perola/10 hover:bg-perola dark:hover:bg-perola/20 text-azul dark:text-perola font-bold rounded-xl text-sm transition-colors border border-terra/20 dark:border-perola/20">
              Cancelar
            </button>
            <button disabled={loading} type="submit" className="flex-1 py-3.5 bg-laranja hover:bg-laranja/90 dark:bg-ambar dark:hover:bg-ambar/90 text-white dark:text-azul font-bold rounded-xl text-sm transition-colors shadow-lg shadow-laranja/20 dark:shadow-ambar/20">
              {loading ? 'Salvando...' : 'Salvar Curso Completo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
