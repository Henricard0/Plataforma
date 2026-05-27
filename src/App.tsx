import { useState, useEffect } from "react";
import { Layout } from "./components/Layout";
import { Auth } from "./components/Auth";
import { Catalog } from "./components/Catalog";
import { Player } from "./components/Player";
import { Admin } from "./components/Admin";
import { UserManagement } from "./components/UserManagement";
import { Analytics } from "./components/Analytics";
import type { User } from "./types";
import { supabase } from "./lib/supabase";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<"auth" | "catalog" | "player" | "admin" | "users" | "analytics">("auth");
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    // Check local storage or existing session
    const stored = localStorage.getItem("lms_session");
    if (stored) {
      setUser(JSON.parse(stored));
      setView("catalog");
    }

    if (supabase) {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session) {
          let role: 'student' | 'teacher' | 'admin' = 'student';
          try {
            const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', session.user.id).single();
            if (profile) role = profile.role;
          } catch (e) {
            console.error('Could not fetch user profile details', e);
          }
          if (session.user.email === 'grecahenrique@gmail.com') {
            role = 'admin';
          }
          const userObj: User = {
            id: session.user.id,
            email: session.user.email!,
            name: session.user.user_metadata?.name,
            role
          };
          setUser(userObj);
          localStorage.setItem("lms_session", JSON.stringify(userObj));
          setView("catalog");
        }
      });
    }
  }, []);

  const handleAuthSuccess = (u: User) => {
    setUser(u);
    localStorage.setItem("lms_session", JSON.stringify(u));
    setView("catalog");
  };

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    localStorage.removeItem("lms_session");
    setUser(null);
    setView("auth");
  };

  const navigateHome = () => {
    setView("catalog");
    setActiveCourseId(null);
  };

  const selectCourse = (id: string) => {
    setActiveCourseId(id);
    setView("player");
  };

  const goToAdmin = (courseId?: string) => {
    if (courseId) {
      setActiveCourseId(courseId);
    } else {
      setActiveCourseId(null);
    }
    setView("admin");
  };

  return (
    <Layout 
      user={user} 
      onLogout={handleLogout} 
      onNavigateHome={navigateHome} 
      onNavigateAdmin={user && (user.role === 'admin' || user.role === 'teacher') ? () => goToAdmin() : undefined}
      onNavigateUsers={user && user.role === 'admin' ? () => setView("users") : undefined}
      onNavigateAnalytics={user && (user.role === 'admin' || user.role === 'teacher') ? () => setView("analytics") : undefined}
      darkMode={darkMode}
      toggleDarkMode={() => setDarkMode(!darkMode)}
    >
      {view === "auth" && <Auth onAuthSuccess={handleAuthSuccess} />}
      {view === "catalog" && <Catalog onSelectCourse={selectCourse} onEditCourse={user && (user.role === 'admin' || user.role === 'teacher') ? goToAdmin : undefined} />}
      {view === "admin" && user && (user.role === 'admin' || user.role === 'teacher') && <Admin onCourseCreated={navigateHome} courseId={activeCourseId || undefined} />}
      {view === "users" && user && user.role === 'admin' && <UserManagement />}
      {view === "analytics" && user && (user.role === 'admin' || user.role === 'teacher') && <Analytics />}
      {view === "player" && activeCourseId && user && (
        <Player courseId={activeCourseId} userId={user.id} />
      )}
    </Layout>
  );
}

