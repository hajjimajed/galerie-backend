const User = require('../models/user');
const { validationResult } = require('express-validator')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');



exports.signup = (req, res, next) => {

    if (!req.file) {
        const error = new Error('no image provided');
        error.statusCode = 422;
        throw error;
    }

    const email = req.body.email;
    const password = req.body.password;
    const name = req.body.name;
    const image = req.file.path;
    const role = req.body.role;

    bcrypt.hash(password, 12)
        .then(hashedPassword => {
            const user = new User({
                email: email,
                password: hashedPassword,
                name: name,
                profileImg: image,
                role: role
            })
            return user.save()
        })
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


exports.login = (req, res, next) => {

    const email = req.body.email;
    const password = req.body.password;
    let loadedUser;

    User.findOne({ email: email })
        .then(user => {
            if (!user) {
                const error = new Error('user not exist');
                error.statusCode = 401;
                throw error;
            }
            loadedUser = user;
            return bcrypt.compare(password, user.password);
        })
        .then(isEqual => {
            if (!isEqual) {
                const error = new Error('Wrong password');
                error.statusCode = 401;
                throw error;
            }

            const token = jwt.sign(
                {
                    email: loadedUser.email,
                    userId: loadedUser._id.toString()
                },
                'secretcodegenerator',
                { expiresIn: '2h' }
            )
            res.status(201).json({ token: token, userId: loadedUser._id.toString() })
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })

}

exports.userData = (req, res, next) => {
    const userId = req.userId;

    User.findById(userId)
        .then(user => {
            if (!user) {
                const error = new Error('User not found');
                error.statusCode = 404;
                throw error;
            }
            res.status(200).json({ message: 'data retrieved', user: user })
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
}


exports.update = (req, res, next) => {
    const userId = req.userId;
    const email = req.body.email;
    const name = req.body.name;
    let image = req.body.image;

    User.findById(userId)
        .then(user => {
            if (!user) {
                const error = new Error('user not found');
                error.statusCode = 404;
                throw error;
            }

            // Update email and name
            user.email = email;
            user.name = name;

            if (req.file) {
                // New image is selected
                if (user.profileImg) {
                    // Clear the old image
                    clearImage(user.profileImg);
                }
                user.profileImg = req.file.path;
            }

            return user.save();
        })
        .then(result => {
            res.status(200).json({ message: 'user data updated', user: result });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

const clearImage = filePath => {
    filePath = path.join(__dirname, '..', filePath);
    fs.unlink(filePath, err => console.log(err));
}