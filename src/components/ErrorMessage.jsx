import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';

const ErrorMessage = ({ message, onRetry, onDismiss }) => {
  if (!message) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-danger/10 border border-danger/20 text-danger">
        <AlertTriangle size={20} className="mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-medium text-sm">{message}</p>
        </div>
        <div className="flex items-center gap-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="p-1.5 hover:bg-danger/20 rounded-lg transition-colors cursor-pointer"
              title="Retry"
            >
              <RefreshCw size={16} />
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1.5 hover:bg-danger/20 rounded-lg transition-colors cursor-pointer"
              title="Dismiss"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ErrorMessage;
