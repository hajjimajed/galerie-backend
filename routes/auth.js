const express = require('express');

const authController = require('../controllers/auth');

const isAuth = require('../middleware/is-auth')

const router = express.Router();

const { body } = require('express-validator');


router.put('/signup', authController.signup);

router.post('/login', authController.login);

router.get('/user-data', isAuth, authController.userData);

module.exports = router;