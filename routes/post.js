const express = require('express');

const router = express.Router()

const isAuth = require('../middleware/is-auth');

const postController = require('../controllers/post');



router.post('/new-post', isAuth, postController.createPost);

router.get('/posts', postController.getPosts);

router.get('/my-posts', isAuth, postController.myPosts);

router.get('/posts/:postId', isAuth, postController.getPost);

router.delete('/posts/:postId', isAuth, postController.deletePost);

router.put('/posts/:postId', isAuth, postController.updatePost);


router.get('/search-posts', postController.searchPosts);

module.exports = router;