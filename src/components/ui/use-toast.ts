import { toast } from "sonner";

export { toast };

// Function to dismiss all toasts or a specific toast by ID
export const dismissToast = (toastId?: string | number) => {
  if (toastId) {
    toast.dismiss(toastId);
  } else {
    toast.dismiss();
  }
};

// Alternative: Export dismiss directly from toast object
export const { dismiss } = toast;
