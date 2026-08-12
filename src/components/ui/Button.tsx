import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'emerald';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-bold transition-all duration-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap active:scale-[0.98] font-["Tajawal",sans-serif]';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-900 shadow-2xs border border-slate-900/10',
    emerald:
      'bg-emerald-800 text-white hover:bg-emerald-700 focus:ring-emerald-800 shadow-2xs',
    secondary:
      'bg-slate-100 text-slate-800 hover:bg-slate-200 focus:ring-slate-300',
    outline:
      'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 focus:ring-emerald-600',
    danger:
      'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-600 shadow-2xs',
    ghost:
      'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-400',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
