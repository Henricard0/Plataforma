import { supabase } from './supabase';
import { MOCK_COURSES, MOCK_MODULES, MOCK_LESSONS } from './mock';
import type { Course, Module, Lesson, UserProgress } from '../types';

/**
 * API Service
 * Wraps Supabase calls. If Supabase is not configured, it gracefully 
 * falls back to local mock data to keep the prototype functional.
 */

const isSupabaseConfigured = !!supabase;

export const api = {
  async getCourses(): Promise<Course[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('courses').select('*');
      if (error) throw error;
      return data;
    }
    return MOCK_COURSES;
  },

  async getCourseWithModules(courseId: string) {
    if (isSupabaseConfigured) {
      // In a real app, this might be a joined query or multiple queries
      const { data: course, error: cErr } = await supabase.from('courses').select('*').eq('id', courseId).single();
      const { data: modules, error: mErr } = await supabase.from('modules').select('*').eq('course_id', courseId).order('order', { ascending: true });
      const { data: lessons, error: lErr } = await supabase.from('lessons').select('*').in('module_id', modules?.map(m => m.id) || []).order('order', { ascending: true });
      
      if (cErr) throw cErr;
      if (mErr) throw mErr;
      if (lErr) throw lErr;

      return { course, modules, lessons };
    }

    const course = MOCK_COURSES.find(c => c.id === courseId);
    const modules = MOCK_MODULES.filter(m => m.course_id === courseId);
    const lessons = MOCK_LESSONS.filter(l => modules.some(m => m.id === l.module_id));

    if (!course) throw new Error("Course not found");
    return { course, modules, lessons };
  },

  async createCourse(course: Omit<Course, 'id'>, modulesInput: { title: string, lessons: Omit<Lesson, 'id' | 'module_id' | 'order'>[] }[] = []): Promise<Course> {
    if (isSupabaseConfigured) {
      const { data: courseData, error } = await supabase.from('courses').insert([{
        title: course.title,
        description: course.description,
        coverImage: course.coverImage || null
      }]).select().single();
      
      if (error) throw error;

      for (let i = 0; i < modulesInput.length; i++) {
        const mod = modulesInput[i];
        const { data: modData, error: mError } = await supabase.from('modules').insert([{
          course_id: courseData.id,
          title: mod.title,
          order: i + 1
        }]).select().single();

        if (mError) {
          console.error('Failed to create module', mError);
          continue;
        }

        for (let j = 0; j < mod.lessons.length; j++) {
          const les = mod.lessons[j];
          await supabase.from('lessons').insert([{
            module_id: modData.id,
            title: les.title,
            video_url: les.video_url || null,
            content_text: les.content_text || null,
            materials_url: les.materials_url || null,
            order: j + 1
          }]);
        }
      }

      return courseData;
    }
    
    // Fallback
    const newCourse = { 
      ...course, 
      id: 'mock_c_' + Math.random().toString(36).substr(2, 9) 
    };
    MOCK_COURSES.push(newCourse);
    
    modulesInput.forEach((mod, i) => {
      const modId = 'mock_m_' + Math.random().toString(36).substr(2, 9);
      MOCK_MODULES.push({ id: modId, course_id: newCourse.id, title: mod.title, order: i + 1 });
      mod.lessons.forEach((les, j) => {
         MOCK_LESSONS.push({
           ...les,
           id: 'mock_l_' + Math.random().toString(36).substr(2, 9),
           module_id: modId,
           order: j + 1
         });
      });
    });

    return newCourse;
  },

  async updateCourse(courseId: string, course: Omit<Course, 'id' | 'created_at'>, modulesInput: any[]): Promise<Course> {
    if (isSupabaseConfigured) {
      const { data: courseData, error } = await supabase.from('courses').update({
        title: course.title,
        description: course.description,
        coverImage: course.coverImage || null
      }).eq('id', courseId).select().single();
      
      if (error) throw error;

      // Handle modules and lessons
      const { data: existingModules } = await supabase.from('modules').select('id, lessons(id)').eq('course_id', courseId);
      
      const newModuleIds: string[] = [];
      const newLessonIds: string[] = [];

      for (let i = 0; i < modulesInput.length; i++) {
        const mod = modulesInput[i];
        let modId = mod.id;

        if (modId && !modId.toString().includes('mock') && existingModules?.find(m => m.id === modId)) {
          // Update
          await supabase.from('modules').update({
            title: mod.title,
            order: i + 1
          }).eq('id', modId);
        } else {
          // Insert
          const { data: mData, error: mError } = await supabase.from('modules').insert([{
            course_id: courseId,
            title: mod.title,
            order: i + 1
          }]).select().single();
          if (mError) {
            console.error(mError);
            continue;
          }
          modId = mData.id;
        }
        
        newModuleIds.push(modId);

        for (let j = 0; j < mod.lessons.length; j++) {
          const les = mod.lessons[j];
          let lesId = les.id;

          const existingMod = existingModules?.find(m => m.id === modId);

          if (lesId && !lesId.toString().includes('mock') && existingMod?.lessons?.find(l => l.id === lesId)) {
            await supabase.from('lessons').update({
              title: les.title,
              video_url: les.video_url || null,
              content_text: les.content_text || null,
              materials_url: les.materials_url || null,
              order: j + 1
            }).eq('id', lesId);
            newLessonIds.push(lesId);
          } else {
            const { data: lData } = await supabase.from('lessons').insert([{
              module_id: modId,
              title: les.title,
              video_url: les.video_url || null,
              content_text: les.content_text || null,
              materials_url: les.materials_url || null,
              order: j + 1
            }]).select().single();
            if (lData) newLessonIds.push(lData.id);
          }
        }
      }

      // Cleanup
      if (existingModules) {
        for (const em of existingModules) {
          if (!newModuleIds.includes(em.id)) {
            await supabase.from('modules').delete().eq('id', em.id);
          } else {
            for (const el of em.lessons) {
              if (!newLessonIds.includes(el.id)) {
                await supabase.from('lessons').delete().eq('id', el.id);
              }
            }
          }
        }
      }
      return courseData;
    }
    throw new Error('Supabase not configured. Updates to mock data are not supported in this preview.');
  },

  async deleteCourse(courseId: string): Promise<void> {
    if (isSupabaseConfigured) {
      await supabase.from('courses').delete().eq('id', courseId);
    }
  },

  async getProgress(userId: string): Promise<UserProgress[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('user_progress').select('*').eq('user_id', userId);
      if (error) throw error;
      return data;
    }
    
    // Fallback: Read from LocalStorage for mock experience
    try {
      const stored = localStorage.getItem(`progress_${userId}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  async toggleProgress(userId: string, lessonId: string): Promise<UserProgress[]> {
    if (isSupabaseConfigured) {
      // Logic for adding/removing progress in Supabase
      const { data: existing } = await supabase.from('user_progress').select('*').eq('user_id', userId).eq('lesson_id', lessonId).single();
      
      if (existing) {
        await supabase.from('user_progress').delete().eq('user_id', userId).eq('lesson_id', lessonId);
      } else {
        await supabase.from('user_progress').insert({ user_id: userId, lesson_id: lessonId });
      }
      
      return this.getProgress(userId);
    }
    
    // Fallback
    const current = await this.getProgress(userId);
    const exists = current.find(p => p.lesson_id === lessonId);
    
    let updated;
    if (exists) {
      updated = current.filter(p => p.lesson_id !== lessonId);
    } else {
      updated = [...current, { user_id: userId, lesson_id: lessonId, completed_at: new Date().toISOString() }];
    }
    localStorage.setItem(`progress_${userId}`, JSON.stringify(updated));
    return updated;
  },

  async getUsers() {
    if (isSupabaseConfigured) {
      // Fetching from the secure view created in the schema
      const { data, error } = await supabase.from('users_view').select('*');
      if (error) console.error("Error fetching users view. Ensure schema is updated.", error);
      return data || [];
    }
    return [
      { id: '1', role: 'admin', email: 'admin@lumina.com', name: 'Admin User' },
      { id: '2', role: 'teacher', email: 'teacher@lumina.com', name: 'Professor' },
      { id: '3', role: 'student', email: 'student@lumina.com', name: 'Aluno' },
    ];
  },
  
  async updateUserRole(id: string, role: string) {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('user_profiles').update({ role }).eq('id', id);
      if (error) throw error;
      return true;
    }
    return true;
  },

  async getStudentAnalytics() {
    if (isSupabaseConfigured) {
      const { data: usersResponse, error: envError } = await supabase.from('users_view').select('id, name, email, role');
      const users = (usersResponse || []).filter(u => u.role === 'student' || !u.role);
      
      const { data: allProgress } = await supabase.from('user_progress').select('*');
      const { count: totalLessons } = await supabase.from('lessons').select('*', { count: 'exact', head: true });
      
      const total = totalLessons || 0;
      
      return users.map(u => {
        const userProgress = (allProgress || []).filter((p: any) => p.user_id === u.id);
        const completedCount = userProgress.length;
        const pendingCount = Math.max(0, total - completedCount);
        const completedPercent = total > 0 ? Math.round((completedCount / total) * 100) : 0;
        
        let lastInteraction = '-';
        if (userProgress.length > 0) {
          const lastDate = new Date(Math.max(...userProgress.map((p: any) => new Date(p.created_at || 0).getTime())));
          const diffMs = Date.now() - lastDate.getTime();
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          const diffWeeks = Math.floor(diffDays / 7);
          
          if (diffWeeks === 0) lastInteraction = diffDays === 0 ? 'Hoje' : `< 1 semana`;
          else if (diffWeeks === 1) lastInteraction = '1 semana';
          else lastInteraction = `${diffWeeks} semanas`;
        }
        
        return {
          id: u.id,
          name: u.name || u.email,
          completedPercent,
          completedCount,
          pendingCount,
          avgGradePercent: 0,
          avgGradeCount: 0,
          lastInteraction
        };
      });
    }
    
    // Mock response for preview without Supabase
    return [
      { id: '1', name: 'Rosemar Araujo', completedPercent: 75, completedCount: 3, pendingCount: 1, avgGradePercent: 78, avgGradeCount: 3, lastInteraction: '< 1 semana' },
      { id: '2', name: 'Dulce Bach Deves', completedPercent: 100, completedCount: 4, pendingCount: 0, avgGradePercent: 95, avgGradeCount: 4, lastInteraction: 'Hoje' },
      { id: '3', name: 'Liane Berres', completedPercent: 100, completedCount: 4, pendingCount: 0, avgGradePercent: 100, avgGradeCount: 4, lastInteraction: 'Hoje' },
      { id: '4', name: 'Angelita Correa de Oliveira', completedPercent: 75, completedCount: 3, pendingCount: 1, avgGradePercent: 100, avgGradeCount: 3, lastInteraction: '1 semana' },
      { id: '5', name: 'Zenaide Maria Dietz', completedPercent: 100, completedCount: 4, pendingCount: 0, avgGradePercent: 65, avgGradeCount: 4, lastInteraction: '< 1 semana' },
      { id: '6', name: 'Tânia Maria Escher', completedPercent: 75, completedCount: 3, pendingCount: 1, avgGradePercent: 88, avgGradeCount: 3, lastInteraction: '< 1 semana' },
      { id: '7', name: 'Edilamar Fernandes de Lima Pimenta', completedPercent: 0, completedCount: 0, pendingCount: 4, avgGradePercent: 0, avgGradeCount: 0, lastInteraction: '-' },
      { id: '8', name: 'Aparecida G. de Souza', completedPercent: 50, completedCount: 2, pendingCount: 2, avgGradePercent: 84, avgGradeCount: 2, lastInteraction: '< 1 semana' },
      { id: '9', name: 'Joselina Gomes da S. Amaral', completedPercent: 50, completedCount: 2, pendingCount: 2, avgGradePercent: 82, avgGradeCount: 2, lastInteraction: '< 1 semana' },
      { id: '10', name: 'Nelsi Habitzreuther', completedPercent: 100, completedCount: 4, pendingCount: 0, avgGradePercent: 100, avgGradeCount: 4, lastInteraction: '< 1 semana' },
    ];
  }
};
