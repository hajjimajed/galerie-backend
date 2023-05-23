const express = require('express');

const authController = require('../controllers/auth');

const router = express.Router();

const { body } = require('express-validator');


router.put('/signup', authController.signup);

module.exports = router;