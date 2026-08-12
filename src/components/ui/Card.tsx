import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  subtitle,
  action,
  onClick,
  ...props
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200/90 shadow-2xs transition-all duration-200 hover:border-slate-300 ${onClick ? 'cursor-pointer hover:shadow-xs' : ''} ${className}`}
      {...props}
    >
      {(title || action) && (
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-4">
          <div>
            {typeof title === 'string' ? (
              <h3 className="text-base font-bold text-slate-900 tracking-tight font-['Cairo',sans-serif]">{title}</h3>
            ) : (
              title
            )}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
};
