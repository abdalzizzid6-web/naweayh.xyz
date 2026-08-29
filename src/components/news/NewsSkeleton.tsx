import React from 'react';

export const HeroNewsSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm animate-pulse flex flex-col lg:flex-row">
    <div className="lg:w-7/12 aspect-[16/10] bg-slate-200 dark:bg-slate-800" />
    <div className="lg:w-5/12 p-6 sm:p-8 flex flex-col justify-between space-y-4">
      <div className="space-y-3">
        <div className="flex justify-between">
          <div className="w-24 h-4 bg-slate-200 dark:bg-slate-800 rounded-md" />
          <div className="w-16 h-4 bg-slate-200 dark:bg-slate-800 rounded-md" />
        </div>
        <div className="w-full h-8 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="w-3/4 h-8 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="w-full h-12 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between">
        <div className="w-20 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="w-16 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
      </div>
    </div>
  </div>
);

export const FeaturedNewsSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-pulse flex flex-col justify-between">
    <div className="aspect-[16/10] bg-slate-200 dark:bg-slate-800" />
    <div className="p-4 space-y-3">
      <div className="flex justify-between">
        <div className="w-20 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="w-12 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
      </div>
      <div className="w-full h-5 bg-slate-200 dark:bg-slate-800 rounded-lg" />
      <div className="w-4/5 h-5 bg-slate-200 dark:bg-slate-800 rounded-lg" />
      <div className="w-full h-8 bg-slate-200 dark:bg-slate-800 rounded-lg" />
    </div>
    <div className="p-4 pt-0 flex justify-between border-t border-slate-100 dark:border-slate-800/80 mt-2">
      <div className="w-16 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
      <div className="w-8 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
    </div>
  </div>
);

export const HorizontalNewsSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 animate-pulse flex gap-4 items-center">
    <div className="w-28 sm:w-36 aspect-[4/3] rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="flex justify-between">
        <div className="w-20 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="w-12 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
      </div>
      <div className="w-full h-4 bg-slate-200 dark:bg-slate-800 rounded" />
      <div className="w-3/4 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
      <div className="w-1/2 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
    </div>
  </div>
);

export const CompactNewsSkeleton: React.FC = () => (
  <div className="p-3 rounded-xl animate-pulse flex gap-3 items-start border-b border-slate-100 dark:border-slate-800/60">
    <div className="w-7 h-6 bg-slate-200 dark:bg-slate-800 rounded shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="w-24 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
      <div className="w-full h-4 bg-slate-200 dark:bg-slate-800 rounded" />
    </div>
  </div>
);

export const ArticleDetailSkeleton: React.FC = () => (
  <div dir="rtl" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 animate-pulse">
    <div className="flex gap-2">
      <div className="w-20 h-6 bg-slate-200 dark:bg-slate-800 rounded-full" />
      <div className="w-24 h-6 bg-slate-200 dark:bg-slate-800 rounded-full" />
    </div>
    <div className="w-full h-10 bg-slate-200 dark:bg-slate-800 rounded-xl" />
    <div className="w-3/4 h-10 bg-slate-200 dark:bg-slate-800 rounded-xl" />
    <div className="aspect-video w-full bg-slate-200 dark:bg-slate-800 rounded-3xl" />
    <div className="space-y-4 pt-4">
      <div className="w-full h-4 bg-slate-200 dark:bg-slate-800 rounded" />
      <div className="w-full h-4 bg-slate-200 dark:bg-slate-800 rounded" />
      <div className="w-5/6 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
      <div className="w-full h-4 bg-slate-200 dark:bg-slate-800 rounded" />
    </div>
  </div>
);

