import { Course, Module, Lesson } from '../types';

export const MOCK_COURSES: Course[] = [
  { 
    id: "c1", 
    title: "Introdução à Psicologia Teórico-Prática", 
    description: "Explore as bases teóricas do desenvolvimento humano com foco na psicologia histórico-cultural e prática clínica fundamental.", 
    coverImage: "Psicologia" 
  },
  { 
    id: "c2", 
    title: "Design de Interface e Experiência do Usuário (UI/UX)", 
    description: "Aprenda a criar designs limpos, funcionais e minimalistas focados em conversão e usabilidade sem ruídos visuais.", 
    coverImage: "Design" 
  }
];

export const MOCK_MODULES: Module[] = [
  { id: "m1", course_id: "c1", title: "Módulo 1: Fundamentos Histórico-Culturais", order: 1 },
  { id: "m2", course_id: "c1", title: "Módulo 2: Introdução à Escuta Clínica", order: 2 },
  { id: "m3", course_id: "c2", title: "Módulo 1: Princípios do Minimalismo Aplicado", order: 1 }
];

export const MOCK_LESSONS: Lesson[] = [
  { id: "l1", module_id: "m1", title: "1.1 Vygotsky e a Mediação Semiótica", video_url: "", content_text: "Texto de apoio cobrindo as estruturas de funções psicológicas superiores e sistemas de signos.", order: 1 },
  { id: "l2", module_id: "m1", title: "1.2 Leontiev e a Teoria da Atividade", video_url: "", content_text: "Análise da atividade como categoria central da psicologia e sua relação com a consciência social.", order: 2 },
  { id: "l3", module_id: "m2", title: "2.1 O Enquadre Clínico e a Primeira Entrevista", video_url: "", content_text: "Discussão prática sobre postura, contrato psicológico e acolhimento inicial do paciente.", order: 1 },
  { id: "l4", module_id: "m3", title: "1.1 Uso Inteligente de Espaço Negativo", video_url: "", content_text: "Como guiar o olhar do usuário utilizando espaçamentos matemáticos e tipografia de peso estruturado.", order: 1 }
];
