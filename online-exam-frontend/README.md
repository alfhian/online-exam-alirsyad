# Frontend SMK Al-Irsyad (Vite + React)

## Jalankan project

```bash
yarn install
yarn dev
```

## Kebutuhan environment variable

Frontend ini **perlu file `.env`** untuk koneksi API dan Supabase. Variabel yang digunakan saat ini:

- `VITE_API_BASE_URL` → dipakai oleh `src/api/axiosConfig.js`
- `VITE_SUPABASE_URL` → dipakai oleh `supabase/client.js`
- `VITE_SUPABASE_KEY` → dipakai oleh `supabase/client.js`

Langkah setup:

```bash
cp .env.example .env
```

Lalu isi nilai sesuai environment Anda.

## Catatan struktur saat ini

- Folder dan file utama frontend sudah ada (`src/components`, `src/pages`, `src/services`, `src/api`, `supabase`).
- Belum ada test otomatis (unit/integration/e2e) pada repo ini.
- `src/services/authService.js` berisi logika autentikasi client-side yang sebaiknya dipindah ke backend bila digunakan di production.
