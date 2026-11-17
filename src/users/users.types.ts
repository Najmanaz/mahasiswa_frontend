export type User = {
  id: number;
  uuid: string;
  email: string;
  nama_mahasiswa: string;
  created_at: string;
  created_by: number | null;
  updated_at: string | null;
  updated_by: number | null;
  deleted_at: string | null;
  deleted_by: number | null;
};

export type FormUser = {
  id: string;
  email: string;
  password: string;
};