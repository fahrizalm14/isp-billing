import Swal, { SweetAlertIcon } from "sweetalert2";

export const SwalToast = Swal.mixin({
  toast: true,
  position: "bottom-end",
  showConfirmButton: false,
  timer: 2000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  },
});

export const showConfirm = async (
  title: string,
  icon: SweetAlertIcon = "warning",
  isWarning: boolean = false,
  text?: string,
  confirmButtonText = "Ya",
  cancelButtonText = "Batal"
): Promise<boolean> => {
  const result = await Swal.fire({
    title,
    text,
    icon: isWarning ? "warning" : icon,
    showCancelButton: true,
    confirmButtonColor: isWarning ? "#6c757d" : "#d33",
    cancelButtonColor: isWarning ? "#d33" : "#6c757d",
    confirmButtonText,
    cancelButtonText,
    allowOutsideClick: false,
    backdrop: true,
  });

  return result.isConfirmed;
};
