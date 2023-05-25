const Post = require('../models/post');
const User = require('../models/user');

const fs = require('fs');
const path = require('path');


exports.createPost = (req, res, next) => {

    if (!req.file) {
        const error = new Error('no image provided');
        error.statusCode = 422;
        throw error;
    }

    const imageUrl = req.file.path;
    const title = req.body.title;
    const description = req.body.description;
    const category = req.body.category;
    let creator;

    const post = new Post({
        title: title,
        description: description,
        category: category,
        imageUrl: imageUrl,
        creator: req.userId
    })
    post.save()
        .then(result => {
            return User.findById(req.userId);
        })
        .then(user => {
            creator = user;
            user.posts.push(post);
            return user.save();
        })
        .then(result => {
            res.status(201).json({
                message: 'post created successfully',
                post: post,
                creator: { _id: creator._id, name: creator.name }
            })
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })
}

exports.getPosts = (req, res, next) => {
    Post.find()
        .populate('creator')
        .exec()
        .then(posts => {
            res.status(200).json({ posts })
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500
            }
            next(err);
        })
}

exports.myPosts = (req, res, next) => {
    const userId = req.userId;

    Post.find({ creator: userId })
        .populate('creator')
        .exec()
        .then(posts => {
            res.status(200).json({ posts });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};
