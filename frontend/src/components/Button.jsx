import { motion } from 'framer-motion';

const Button = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon: Icon,
  className = '',
  type = 'button',
  id,
  ...props
}) => {
  const baseStyles =
    'relative inline-flex items-center justify-center gap-2 font-semibold rounded-2xl transition-all duration-300 cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary:
      'bg-primary hover:bg-primary-light text-white shadow-lg shadow-primary/20 hover:shadow-primary/30 border border-primary/10',
    secondary:
      'bg-secondary hover:bg-secondary-light text-white shadow-lg shadow-secondary/20 hover:shadow-secondary/30 border border-secondary/10',
    outline:
      'border-2 border-primary/20 text-primary hover:bg-primary/5',
    ghost:
      'text-text-secondary hover:text-primary hover:bg-primary/5',
    danger:
      'bg-danger/10 hover:bg-danger/20 text-danger shadow-sm border border-danger/20',
    youtube:
      'bg-white text-youtube shadow-lg shadow-youtube/10 hover:shadow-youtube/20 border border-youtube/20 hover:bg-youtube/5',
    instagram:
      'bg-white text-instagram shadow-lg shadow-instagram/10 hover:shadow-instagram/20 border border-instagram/20 hover:bg-instagram/5',
    glass:
      'glass text-text-primary hover:bg-white',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
    xl: 'px-10 py-5 text-xl',
  };

  return (
    <motion.button
      id={id}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      whileHover={!disabled ? { scale: 1.02, y: -1 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {Icon && !loading && <Icon size={size === 'sm' ? 16 : size === 'lg' ? 22 : 18} />}
      {children}
    </motion.button>
  );
};

export default Button;
