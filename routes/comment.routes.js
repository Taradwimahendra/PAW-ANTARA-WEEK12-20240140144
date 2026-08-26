const express = require('express');
const router = express.Router();
const commentController = require('../controllers/comment.controller');

router.get('/comment', commentController.renderCommentPage);
router.post('/comment', commentController.submitComment);

module.exports = router;
