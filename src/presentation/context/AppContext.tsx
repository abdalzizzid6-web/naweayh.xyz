import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../../core';

export type NavTab =
  | 'portal'
  | 'latest'
  | 'topics'
  | 'my_feed'
  | 'saved'
  | 'yemen'
  | 'arab'
  | 'world'
  | 'business'
  | 'tech'
  | 'sports'
  | 'video'
  | 'live'
  | 'mobile'
  | 'ai_aggregator'
  | 'social'
  | 'monetization'
  | 'push'
  | 'seo'
  | 'dashboard'
  | 'admin'
  | 'reports'
  | 'projects';

interface AppContextType {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  currentPath: string;
  navigate: (path: string) => void;
  articleSlug: string | null;
  storySlug: string | null;
  currentUser: UserProfile;
  setCurrentUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  handleRoleChange: (newRole: UserRole) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  notificationsOpen: boolean;
  setNotificationsOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname);
  const [activeTab, setActiveTabState] = useState<NavTab>('portal');
  const [articleSlug, setArticleSlug] = useState<string | null>(null);
  const [storySlug, setStorySlug] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const [currentUser, setCurrentUser] = useState<UserProfile>({
    id: 'u-news-editor-90',
    name: 'Alexander Safara',
    email: 'editor@naweayh.xyz',
    role: 'System Admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    department: 'غرفة الأخبار — Naw3iya News',
  });

  const syncPathToTab = (pathname: string) => {
    setCurrentPath(pathname);
    if (pathname.startsWith('/news/')) {
      const slug = pathname.replace('/news/', '').split('/')[0];
      setArticleSlug(slug || null);
      setStorySlug(null);
      setActiveTabState('portal');
    } else if (pathname.startsWith('/story/')) {
      const slug = pathname.replace('/story/', '').split('/')[0];
      setStorySlug(slug || null);
      setArticleSlug(null);
      setActiveTabState('portal');
    } else if (pathname.startsWith('/topic/')) {
      setActiveTabState('topics');
      setArticleSlug(null);
      setStorySlug(null);
    } else if (pathname.startsWith('/saved')) {
      setActiveTabState('saved');
      setArticleSlug(null);
      setStorySlug(null);
    } else if (pathname.startsWith('/my-feed')) {
      setActiveTabState('my_feed');
      setArticleSlug(null);
      setStorySlug(null);
    } else if (pathname.startsWith('/admin')) {
      setActiveTabState('admin');
      setArticleSlug(null);
      setStorySlug(null);
    } else if (pathname.startsWith('/mobile')) {
      setActiveTabState('mobile');
      setArticleSlug(null);
      setStorySlug(null);
    } else if (pathname.startsWith('/seo')) {
      setActiveTabState('seo');
      setArticleSlug(null);
      setStorySlug(null);
    } else if (pathname.startsWith('/social')) {
      setActiveTabState('social');
      setArticleSlug(null);
      setStorySlug(null);
    } else if (pathname.startsWith('/aggregator')) {
      setActiveTabState('ai_aggregator');
      setArticleSlug(null);
      setStorySlug(null);
    } else if (pathname.startsWith('/reports')) {
      setActiveTabState('reports');
      setArticleSlug(null);
      setStorySlug(null);
    } else if (pathname.startsWith('/projects')) {
      setActiveTabState('projects');
      setArticleSlug(null);
      setStorySlug(null);
    } else {
      setActiveTabState('portal');
      setArticleSlug(null);
      setStorySlug(null);
    }
  };

  useEffect(() => {
    syncPathToTab(window.location.pathname);

    const handlePopState = () => {
      syncPathToTab(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
      syncPathToTab(path);
    }
  };

  const setActiveTab = (tab: NavTab) => {
    setActiveTabState(tab);
    setArticleSlug(null);
    setStorySlug(null);
    let targetPath = '/';
    if (tab === 'saved') targetPath = '/saved';
    else if (tab === 'my_feed') targetPath = '/my-feed';
    else if (tab === 'topics') targetPath = '/topics';
    else if (tab === 'admin') targetPath = '/admin';
    else if (tab === 'mobile') targetPath = '/mobile';
    else if (tab === 'seo') targetPath = '/seo';
    else if (tab === 'social') targetPath = '/social';
    else if (tab === 'ai_aggregator') targetPath = '/aggregator';
    else if (tab === 'reports') targetPath = '/reports';
    else if (tab === 'projects') targetPath = '/projects';

    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
      setCurrentPath(targetPath);
    }
  };

  const handleRoleChange = (newRole: UserRole) => {
    setCurrentUser((prev) => ({
      ...prev,
      role: newRole,
    }));
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        currentPath,
        navigate,
        articleSlug,
        storySlug,
        currentUser,
        setCurrentUser,
        handleRoleChange,
        sidebarOpen,
        setSidebarOpen,
        notificationsOpen,
        setNotificationsOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
