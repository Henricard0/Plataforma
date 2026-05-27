export type User = {
  id: string;
  email: string;
  name?: string;
  role: 'student' | 'teacher' | 'admin';
};

export type Course = {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
};

export type Module = {
  id: string;
  course_id: string;
  title: string;
  order: number;
};

export type Lesson = {
  id: string;
  module_id: string;
  title: string;
  video_url: string;
  content_text: string;
  materials_url?: string;
  order: number;
};

export type UserProgress = {
  user_id: string;
  lesson_id: string;
  completed_at: string;
};
