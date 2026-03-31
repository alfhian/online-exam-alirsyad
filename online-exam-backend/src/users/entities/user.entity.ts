export class User {
  id: string;
  name: string;
  userid: string; // NIS/NIK
  password: string;
  role: string;
  is_active: boolean;
  class_id?: string;
  created_at: Date;
  created_by: string;
  updated_at?: Date;
  updated_by?: string;
  deleted_at?: Date;
  deleted_by?: string;
  class_name: string;
  nisn: string;
  gender: string;
  description: string;
}
