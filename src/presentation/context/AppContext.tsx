import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../../core';
import { AuthService } from '../../services/AuthService';

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
  categorySlug: string | null;
  sourceSlug: string | null;
  searchQuery: string | null;
  isNotFound: boolean;
  currentUser: UserProfile | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  handleRoleChange: (newRole: UserRole) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  notificationsOpen: boolean;
  setNotificationsOpen: (open: boolean) => void;
  isAuthLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname);
  const [activeTab, setActiveTabState] = useState<NavTab>('portal');
  const [articleSlug, setArticleSlug] = useState<string | null>(null);
  const [storySlug, setStorySlug] = useState<string | null>(null);
  const [categorySlug, setCategorySlug] = useState<string | null>(null);
  const [sourceSlug, setSourceSlug] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    AuthService.verify().then(user => {
      if (user) {
        setCurrentUser({
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
          department: 'غرفة الأخبار — OmniNews',
        });
      }
      setIsAuthLoading(false);
    });
  }, []);

  const syncPathToTab = (pathname: string) => {
    setCurrentPath(pathname);
    setIsNotFound(false);
    setArticleSlug(null);
    setStorySlug(null);
    setCategorySlug(null);
    setSourceSlug(null);
    setSearchQuery(null);

    if (pathname.startsWith('/news/')) {
      const slug = decodeURIComponent(pathname.replace('/news/', '').split('/')[0]);
      setArticleSlug(slug || null);
      setActiveTabState('portal');
    } else if (pathname.startsWith('/article/')) {
      const slug = decodeURIComponent(pathname.replace('/article/', '').split('/')[0]);
      setArticleSlug(slug || null);
      setActiveTabState('portal');
    } else if (pathname.startsWith('/story/')) {
      const slug = decodeURIComponent(pathname.replace('/story/', '').split('/')[0]);
      setStorySlug(slug || null);
      setActiveTabState('portal');
    } else if (pathname.startsWith('/category/')) {
      const slug = decodeURIComponent(pathname.replace('/category/', '').split('/')[0]);
      setCategorySlug(slug || null);
      setActiveTabState('portal');
    } else if (pathname.startsWith('/source/')) {
      const slug = decodeURIComponent(pathname.replace('/source/', '').split('/')[0]);
      setSourceSlug(slug || null);
      setActiveTabState('portal');
    } else if (pathname.startsWith('/search')) {
      const params = new URLSearchParams(window.location.search);
      setSearchQuery(params.get('q') || '');
      setActiveTabState('portal');
    } else if (pathname.startsWith('/404')) {
      setIsNotFound(true);
      setActiveTabState('portal');
    } else if (pathname.startsWith('/topic/')) {
      setActiveTabState('topics');
    } else if (pathname.startsWith('/saved')) {
      setActiveTabState('saved');
    } else if (pathname.startsWith('/my-feed')) {
      setActiveTabState('my_feed');
    } else if (pathname.startsWith('/admin')) {
      setActiveTabState('admin');
    } else if (pathname.startsWith('/mobile')) {
      setActiveTabState('mobile');
    } else if (pathname.startsWith('/seo')) {
      setActiveTabState('seo');
    } else if (pathname.startsWith('/social')) {
      setActiveTabState('social');
    } else if (pathname.startsWith('/aggregator')) {
      setActiveTabState('ai_aggregator');
    } else if (pathname.startsWith('/reports')) {
      setActiveTabState('reports');
    } else if (pathname.startsWith('/projects')) {
      setActiveTabState('projects');
    } else {
      setActiveTabState('portal');
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const setActiveTab = (tab: NavTab) => {
    setActiveTabState(tab);
    setArticleSlug(null);
    setStorySlug(null);
    setCategorySlug(null);
    setSourceSlug(null);
    setSearchQuery(null);
    setIsNotFound(false);

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
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
        categorySlug,
        sourceSlug,
        searchQuery,
        isNotFound,
        currentUser,
        setCurrentUser,
        handleRoleChange,
        sidebarOpen,
        setSidebarOpen,
        notificationsOpen,
        setNotificationsOpen,
        isAuthLoading,
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
