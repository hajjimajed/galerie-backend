const User = require('../models/user');
const { validationResult } = require('express-validator')

const bcrypt = require('bcryptjs');



exports.signup = (req, res, next) => {

    const email = req.body.email;
    const password = req.body.password;
    const name = req.body.name;
    const profileImg = req.body.profileImg;
    const role = req.body.role;

    const user = new User({
        email: email,
        password: password,
        name: name,
        profileImg: profileImg,
        role: role
    })
    user.save()
        .then(result => {
            res.status(201).json({ message: 'user created', userId: result._id })
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })

}