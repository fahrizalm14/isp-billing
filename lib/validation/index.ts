import { z } from "zod";

export const profileSchema = z.object({
  userId: z.string().min(1, "User ID wajib diisi"),
  name: z.string().min(1, "Nama wajib diisi"),
  phone: z.string().min(10, "Nomor telepon tidak valid"),
  street: z.string().optional(),
  subDistrict: z.string().min(1, "Kelurahan wajib diisi"),
  district: z.string().min(1, "Kecamatan wajib diisi"),
  city: z.string().min(1, "Kota wajib diisi"),
  province: z.string().min(1, "Provinsi wajib diisi"),
  postalCode: z.string().min(5, "Kode pos tidak valid"),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
