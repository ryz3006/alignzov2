import toast from 'react-hot-toast';

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export const useToast = () => {
  return {
    toast: (options: ToastOptions | string) => {
      if (typeof options === 'string') {
        return toast(options);
      }
      
      const { title, description, variant } = options;
      const message = title && description ? `${title}: ${description}` : title || description || '';
      
      if (variant === 'destructive') {
        return toast.error(message);
      }
      
      return toast.success(message);
    },
    dismiss: (toastId?: string) => toast.dismiss(toastId),
  };
};

export { toast }; 