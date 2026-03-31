import { supabase } from '../../supabase/client';
import bcrypt from 'bcryptjs';

const JWT_SECRET = 'your-secret-key'; // Ganti dengan env var di production
const JWT_EXPIRES_IN = '1d'; // Token berlaku 1 hari

const TABLE_NAME = 'users';

export const registerUser = async ({ userid, password, ...rest }) => {
  try {
    // Cek apakah userid sudah digunakan
    const { data: existing } = await supabase
      .from(TABLE_NAME)
      .select('id')
      .eq('userid', userid)
      .single();

    if (existing) {
      throw new Error('NIS/NIK sudah terdaftar');
    }

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    // Simpan ke Supabase
    const { error } = await supabase
      .from(TABLE_NAME)
      .insert([{ 
        userid, 
        password_hash: hashedPassword, 
        name: rest.name, 
        role: rest.role,
        created_at: new Date().toISOString(),
        created_by: userid,
      }]);

    if (error) throw error;

    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
};

export const loginUser = async ({ userid, password }) => {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select('*')
      .eq('userid', userid)
      .single();

    if (error || !user) {
      throw new Error('NIS/NIK tidak ditemukan');
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      throw new Error('Password salah');
    }

    const token = jwt.sign(
      {
        id: user.id,
        nis_nik: user.nis_nik,
        nama: user.nama,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return { success: true, user, token };
  } catch (err) {
    return { success: false, message: err.message };
  }
};
