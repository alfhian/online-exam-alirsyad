# USER GUIDE Aplikasi Online Exam Al Irsyad

Dokumen ini menjelaskan alur penggunaan aplikasi secara **end-to-end**: mulai dari registrasi, login, manajemen data master, pembuatan ujian, pengerjaan ujian oleh siswa, penilaian guru, hingga pelaporan.

---

## 1) Gambaran Umum Aplikasi

Aplikasi memiliki 3 peran utama:

- **ADMIN**: mengelola pengguna, mata pelajaran, ujian, dan laporan.
- **GURU**: mengelola ujian, soal, penilaian hasil ujian siswa, dan laporan.
- **SISWA**: mengerjakan ujian dan melihat hasil ujian yang sudah dikumpulkan.

Menu yang tampil menyesuaikan role akun yang login.

---

## 2) Alur Awal: Register & Login

## 2.1 Register Akun

1. Buka halaman **Register** (`/register`).
2. Isi field:
   - **Name** (nama lengkap)
   - **Role** (SISWA / GURU / ADMIN)
   - **NIS** (jika role = SISWA)
   - **NIK** (jika role = GURU/ADMIN)
   - **Password**
3. Klik tombol **Register**.
4. Jika berhasil:
   - Sistem langsung melakukan login otomatis.
   - Token login disimpan di browser.
   - Pengguna diarahkan ke halaman **Dashboard**.

> Catatan: Jika ada field wajib yang kosong, sistem menampilkan pesan error.

## 2.2 Login

1. Buka halaman login (`/`).
2. Isi:
   - **ID Pengguna / NIS / NIK**
   - **Kata Sandi**
3. Klik **Masuk Sekarang**.
4. Jika sukses, sistem menyimpan token dan masuk ke **Dashboard**.
5. Jika gagal, sistem menampilkan pesan error kredensial.

---

## 3) Navigasi Utama Berdasarkan Role

## 3.1 SISWA

- Dashboard
- Ujian (`/student/exam`)
- Hasil Ujian Siswa (`/exam-submissions`)

## 3.2 GURU

- Dashboard
- Daftar Ujian Sekolah (`/exam`)
- Mata Pelajaran (`/subjects`)
- Skor Ujian (`/teacher-exam`)
- Laporan (`/laporan`)

## 3.3 ADMIN

- Dashboard
- Daftar Ujian Sekolah (`/exam`)
- Mata Pelajaran (`/subjects`)
- Pengelolaan Pengguna (`/user-management`)
- Skor Ujian (`/teacher-exam`)
- Laporan (`/laporan`)

---

## 4) Panduan Fitur untuk ADMIN

## 4.1 Pengelolaan Pengguna

### A. Melihat daftar user

1. Masuk menu **Pengelolaan Pengguna**.
2. Gunakan:
   - **Search** untuk mencari user.
   - **Sort** pada kolom tabel.
   - **Pagination** untuk pindah halaman.

### B. Menambah user baru

1. Klik **Tambah User Baru**.
2. Isi data user:
   - NIK/NIS
   - NISN
   - Nama
   - Gender
   - Role
   - Kelas
   - Password
   - Deskripsi (opsional)
3. Klik **Simpan**.
4. Data user akan masuk ke tabel.

### C. Edit data user

1. Klik menu aksi (ikon titik tiga) pada baris user.
2. Pilih **Edit Data** (atau **Edit Siswa** untuk user SISWA).
3. Ubah data.
4. Simpan perubahan.

### D. Generate ulang token/password siswa

1. Pada halaman user, gunakan fitur **acak token siswa**.
2. Konfirmasi proses.
3. Sistem akan menghasilkan password baru dan menampilkannya.

> Penting: Simpan password hasil generate dan distribusikan ke siswa melalui jalur aman.

---

## 4.2 Pengelolaan Mata Pelajaran

### A. Tambah mapel

1. Masuk menu **Mata Pelajaran**.
2. Klik **+ Tambah Mata Pelajaran**.
3. Isi:
   - Nama mapel
   - Kelas
   - Deskripsi
4. Klik simpan.

### B. Edit mapel

1. Klik aksi pada baris mapel.
2. Pilih **Edit Data**.
3. Perbarui informasi.
4. Simpan.

### C. Cari/sort/paginasi

Gunakan SearchBar, klik header kolom untuk sort, dan Pagination di bawah tabel.

---

## 4.3 Pengelolaan Ujian

### A. Tambah ujian

1. Masuk menu **Daftar Ujian Sekolah**.
2. Klik **+ Tambah Ujian**.
3. Isi form:
   - **Judul ujian**
   - **Mata pelajaran**
   - **Tipe ujian** (Reguler/Remedial)
   - **Tanggal ujian**
   - **Durasi** (menit)
4. Simpan.

### B. Edit ujian

1. Klik aksi pada baris ujian.
2. Pilih **Edit Data**.
3. Ubah informasi ujian.
4. Simpan.

### C. Assign siswa ke ujian remedial

1. Pada ujian bertipe **REMEDIAL**, klik aksi.
2. Pilih **Students**.
3. Di modal Assign Students:
   - Centang siswa yang diikutkan.
   - Gunakan pagination jika data siswa banyak.
4. Klik **Simpan**.

### D. Kelola soal ujian (Questionnaire)

1. Pada baris ujian, klik aksi.
2. Pilih **Questionnaire**.
3. Tambah soal dengan klik **+ Tambah Pertanyaan**.
4. Isi data soal:
   - **Pertanyaan**
   - **Type** (`multiple_choice` atau `essay`)
   - **No urut (index)**
   - **Opsi jawaban** (khusus multiple choice)
   - **Jawaban benar**
5. Simpan.
6. Untuk mengubah soal, gunakan aksi **Edit Data** pada tabel soal.

> Tips: Pastikan nomor urut soal konsisten agar urutan tampil sesuai rencana.

---

## 4.4 Laporan

1. Masuk menu **Laporan**.
2. Atur filter:
   - Rentang tanggal (from–to)
   - Mata pelajaran
   - Tipe ujian
3. Pilih tab report:
   - **Report Ujian**
   - **Report Submission**
   - **Report Mapel**
4. Klik:
   - **Export CSV** untuk file `.csv`
   - **Export Excel** untuk file `.xls`

---

## 5) Panduan Fitur untuk GURU

Sebagian besar alurnya sama dengan ADMIN untuk modul:

- Mata Pelajaran
- Daftar Ujian Sekolah
- Questionnaire
- Laporan

Tambahan khusus guru:

## 5.1 Penilaian Ujian Siswa (Skor Ujian)

### A. Lihat daftar ujian yang sudah dikerjakan siswa

1. Masuk menu **Skor Ujian**.
2. Gunakan search/sort/pagination bila perlu.

### B. Lihat daftar siswa per ujian

1. Pada baris ujian, klik aksi.
2. Pilih **Daftar Siswa**.
3. Sistem menampilkan siswa yang submit ujian tersebut.

### C. Beri nilai per submission

1. Pada daftar siswa submission, klik aksi.
2. Pilih **Beri Nilai**.
3. Di halaman penilaian:
   - Lihat detail ujian & identitas siswa.
   - Periksa jawaban per soal.
   - Tandai setiap soal `Benar` / `Salah`.
4. Klik **Simpan & Selesaikan Penilaian**.

### D. Cara hitung skor akhir

Sistem menghitung nilai otomatis:

- Jika hanya soal **multiple choice**: nilai berdasarkan proporsi benar × 100.
- Jika hanya **essay**: nilai berdasarkan proporsi benar × 100.
- Jika campuran: bobot default
  - Multiple choice = **60%**
  - Essay = **40%**

Nilai akhir dibulatkan ke bilangan bulat.

---

## 6) Panduan Fitur untuk SISWA

## 6.1 Melihat ujian yang tersedia hari ini

1. Login sebagai siswa.
2. Buka menu **Ujian**.
3. Halaman menampilkan daftar ujian hari ini.
4. Gunakan search/sort/pagination jika diperlukan.

## 6.2 Memulai ujian

1. Pada baris ujian, klik aksi.
2. Pilih **Mulai Ujian**.
3. Sistem melakukan pengecekan apakah ujian sudah pernah dikerjakan.
   - Jika sudah submit: muncul peringatan, tidak bisa mengulang.
   - Jika belum: masuk ke halaman ujian.

## 6.3 Tahap sebelum ujian dimulai

1. Baca instruksi pada halaman start.
2. Klik **Mulai Ujian Sekarang**.
3. Sistem akan:
   - Membuat sesi ujian.
   - Meminta izin kamera + mikrofon.
   - Masuk mode fullscreen.
   - Memulai perekaman video pengawasan.

## 6.4 Saat ujian berlangsung

- Timer hitung mundur tampil di kanan atas.
- Soal ditampilkan berurutan.
- Tipe soal:
  - **Pilihan ganda**: pilih salah satu opsi.
  - **Essay**: ketik jawaban di textarea.

### Aturan pengawasan

Sistem memberi peringatan jika:

- Keluar fullscreen.
- Berpindah tab.
- Browser kehilangan fokus.

Pelanggaran ini dicatat ke sesi ujian.

## 6.5 Mengirim jawaban

1. Klik **Kirim Jawaban**.
2. Konfirmasi pengiriman.
3. Sistem akan:
   - Menyimpan jawaban ke server.
   - Menyelesaikan sesi ujian.
   - Menghentikan rekaman video.
   - Keluar fullscreen.
4. Muncul notifikasi sukses.
5. Siswa diarahkan kembali ke daftar ujian.

> Jika waktu habis, sistem otomatis menutup ujian dan kembali ke halaman daftar ujian.

---

## 7) Melihat Hasil Ujian (SISWA)

## 7.1 Daftar hasil ujian

1. Buka menu **Hasil Ujian Siswa**.
2. Tabel menampilkan riwayat submission milik siswa.
3. Gunakan pencarian/sorting/pagination untuk menemukan data.

## 7.2 Detail hasil

1. Klik aksi **Lihat Detail** pada submission.
2. Halaman menampilkan:
   - Informasi ujian (judul, mapel, tanggal, durasi)
   - Daftar soal dan jawaban siswa

---

## 8) Dashboard

Dashboard menampilkan ringkasan dan visual berbeda sesuai role:

- **ADMIN**: statistik user, siswa, mapel, ujian, serta chart ringkasan.
- **GURU**: ringkasan ujian terkait pengajaran + chart.
- **SISWA**: ringkasan aktivitas dan daftar hasil ujian terbaru.

---

## 9) Tips Operasional & Best Practice

1. **Sebelum ujian dimulai**
   - Pastikan data mapel, ujian, dan soal sudah final.
   - Uji coba akun siswa minimal 1–2 akun.
2. **Saat ujian berlangsung**
   - Pastikan siswa menggunakan browser modern.
   - Sarankan koneksi internet stabil.
3. **Setelah ujian**
   - Guru segera lakukan penilaian soal essay.
   - Admin/Guru export laporan untuk arsip.
4. **Keamanan akun**
   - Hindari berbagi password di grup publik.
   - Ubah/generate ulang token siswa bila dibutuhkan.

---

## 10) Ringkasan Alur End-to-End (Singkat)

1. Admin/Guru menyiapkan mapel.
2. Admin/Guru membuat ujian.
3. Admin/Guru mengisi questionnaire (soal + kunci).
4. (Jika remedial) tetapkan siswa peserta.
5. Siswa login dan mengerjakan ujian.
6. Siswa submit jawaban.
7. Guru melakukan scoring (terutama essay).
8. Siswa melihat detail hasil.
9. Admin/Guru generate laporan dan export file.

---

Dokumen ini bisa dijadikan SOP operasional harian untuk pelaksanaan ujian online di sekolah.
