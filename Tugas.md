**Nama:** Tara Dwi Mahendra  
**NIM:** 20240140144  
**Kelas:** B  

---

## Bagian 1 — Eksplorasi Celah Keamanan

### 1. SQL Injection
<img width="1280" height="680" alt="image" src="https://github.com/user-attachments/assets/dc85bc69-2d82-488b-b72b-327c28cdbdfd" />

**Penjelasan:** Payload seperti `' OR '1'='1` bisa tembus karena input dari user digabungkan secara langsung (string concatenation/template literal) ke dalam sintaks SQL tanpa filter atau parameterisasi. Akibatnya, input tersebut mengubah struktur kueri menjadi selalu benar (`WHERE name ILIKE '%' OR '1'='1'`), sehingga seluruh data dalam tabel terekspos (bypass filter).

### 2. XSS Reflected & Escape HTML
<img width="1280" height="680" alt="image" src="https://github.com/user-attachments/assets/f3f18afb-26a2-4b8c-9e75-145d5cb3944c" />
<img width="1280" height="680" alt="image" src="https://github.com/user-attachments/assets/cbdc67cc-2b4c-4dea-baca-9a9f633c7f58" />

**Penjelasan:** Payload seperti `<script>alert(1)</script>` (atau `<img>` dengan `onerror`) berhasil tereksekusi pada browser karena input user langsung ditampilkan ke halaman (di-render) secara mentah tanpa adanya proses HTML Encoding/Escaping (pada EJS menggunakan syntax `<%- %>`). Browser mengira input tersebut adalah kode HTML/JavaScript sah yang berasal dari server, sehingga mengeksekusi script berbahayanya.

### 3. XSS Stored
<img width="1280" height="680" alt="image" src="https://github.com/user-attachments/assets/2edddd11-d59c-47da-9479-61dbb876393f" />
<img width="1280" height="680" alt="image" src="https://github.com/user-attachments/assets/5cc70a09-8a78-4931-9b58-241449cab77c" />

**Penjelasan:** Sama seperti XSS Reflected, bedanya payload script berbahaya ini sudah tersimpan secara permanen di database (melalui seed/input berbahaya yang pernah lolos). Saat data diambil dari database dan di-render mentah-mentah ke halaman web (lagi-lagi tanpa escape), script tersebut tereksekusi ke setiap pengguna yang membuka halaman tersebut.

---

## Bagian 2 — Implementasi Mandiri (Halaman Komentar/Buku Tamu)

### 1. Validasi Server-Side
Jika form disubmit kosong, akan muncul pesan error yang ditolak oleh server (bukan sekadar `required` di HTML).
**Kode:** (`controllers/comment.controller.js`)
```javascript
// 1. Validasi di server-side (Jika invalid, ditolak dengan pesan jelas)
if (!name || name.trim() === '') {
  return res.render('comment', {
    comments,
    error: 'Nama wajib diisi (tidak boleh kosong atau hanya spasi)!',
    success: null,
    oldInput: { name, message }
  });
}

if (!message || message.trim() === '') {
  return res.render('comment', {
    comments,
    error: 'Pesan komentar wajib diisi!',
    success: null,
    oldInput: { name, message }
  });
}
```
<img width="1280" height="680" alt="image" src="https://github.com/user-attachments/assets/43b2097e-d5df-4d35-adac-558c8fc76b37" />

### 2. Sanitasi Input
Sebelum diproses, input disanitasi menggunakan `trim()` untuk menghilangkan spasi kosong berlebih atau bypass spasi yang sering digunakan penyerang untuk menghindari validasi panjang karakter.
**Kode:** (`controllers/comment.controller.js`)
```javascript
// 2. Sanitasi input (trim spasi kosong berlebih di awal/akhir)
// before: "   <script>alert(1)</script>   "
// after : "<script>alert(1)</script>"
const sanitizedName = name.trim();
const sanitizedMessage = message.trim();
```

### 3. Escape Output saat Render (Mencegah XSS)
Data yang diinputkan pengguna dan disimpan ke database di-render kembali menggunakan sintaks `<%= %>` pada template EJS. Ini akan melakukan HTML escape secara otomatis, sehingga script menjadi teks biasa dan tidak tereksekusi.
**Kode:** (`views/comment.ejs`)
```html
<div class="comment-item">
  <!-- Data di-escape otomatis dengan <%= %> untuk mencegah XSS -->
  <h4><%= c.name %></h4>
  <p><%= c.message %></p>
</div>
```
<img width="1280" height="680" alt="image" src="https://github.com/user-attachments/assets/cc2be6ff-9443-443c-9c15-89045896bd15" />

### 4. Parameterized Query / ORM (Mencegah SQL Injection)
Penyimpanan data (query insert) tidak menggunakan penyambungan string manual, melainkan memanfaatkan model ORM Sequelize (`Comment.create()`), yang secara otomatis akan mengubah input user menjadi parameter query yang aman.
**Kode:** (`controllers/comment.controller.js`)
```javascript
// 3. Simpan ke database dengan parameterized query (menggunakan ORM Sequelize)
await Comment.create({
  name: sanitizedName,
  message: sanitizedMessage
});
```
<img width="1280" height="680" alt="image" src="https://github.com/user-attachments/assets/491c8024-01db-4e7e-9a5d-83829575f01a" />

