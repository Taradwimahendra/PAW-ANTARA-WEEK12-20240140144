const { Comment } = require('../models');

async function renderCommentPage(req, res) {
  try {
    const comments = await Comment.findAll({ order: [['createdAt', 'DESC']] });
    const successMsg = req.query.success ? 'Komentar berhasil dikirim!' : null;
    res.render('comment', { 
      comments, 
      error: null, 
      success: successMsg,
      oldInput: {}
    });
  } catch (err) {
    res.status(500).send("Database error: " + err.message);
  }
}

async function submitComment(req, res) {
  let { name, message } = req.body;
  
  try {
    const comments = await Comment.findAll({ order: [['createdAt', 'DESC']] });

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

    // 2. Sanitasi input (trim spasi kosong berlebih di awal/akhir)
    // before: "   <script>alert(1)</script>   "
    // after : "<script>alert(1)</script>"
    const sanitizedName = name.trim();
    const sanitizedMessage = message.trim();

    // 3. Simpan ke database dengan parameterized query (menggunakan ORM Sequelize)
    // Parameterized query otomatis ditangani oleh Sequelize Model.create()
    await Comment.create({
      name: sanitizedName,
      message: sanitizedMessage
    });

    res.redirect('/comment?success=1');
  } catch (err) {
    res.render('comment', {
      comments: [],
      error: 'Terjadi kesalahan sistem: ' + err.message,
      success: null,
      oldInput: { name, message }
    });
  }
}

module.exports = { renderCommentPage, submitComment };
