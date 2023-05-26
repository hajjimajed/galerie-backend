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

exports.getPost = (req, res, next) => {
    const postId = req.params.postId;
    Post.findById(postId)
        .then(post => {
            if (!post) {
                const error = new Error('post not found');
                error.statusCode = 404;
                throw error;
            }
            res.status(200).json({ message: 'post fetched', post: post })
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
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


exports.deletePost = (req, res, next) => {

    const postId = req.params.postId;
    Post.findById(postId)
        .then(post => {
            if (!post) {
                const error = new Error('post not found');
                error.statusCode = 403;
                throw error;
            }
            if (post.creator.toString() !== req.userId) {
                const error = new Error('not authorized');
                error.statusCode = 403;
                throw error;
            }
            clearImage(post.imageUrl);
            return Post.findByIdAndRemove(postId);
        })
        .then(result => {
            return User.findById(req.userId);
        })
        .then(user => {
            user.posts.pull(postId);
            return user.save();
        })
        .then(result => {
            res.status(200).json({ message: 'post deleted successfully' });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })

}


exports.updatePost = (req, res, next) => {
    const postId = req.params.postId;

    const title = req.body.title;
    const description = req.body.description;
    const category = req.body.category;
    let imageUrl = req.body.image;

    if (req.file) {
        imageUrl = req.file.path;
    }

    Post.findById(postId)
        .then(post => {
            if (!post) {
                const error = new Error('Post not found');
                error.statusCode = 404;
                throw error;
            }
            if (post.creator.toString() !== req.userId) {
                const error = new Error('Not authorized');
                error.statusCode = 403;
                throw error;
            }

            if (req.file && imageUrl !== post.imageUrl) {
                // Delete the old image if a new one is selected
                if (post.imageUrl) {
                    clearImage(post.imageUrl);
                }
                post.imageUrl = imageUrl;
            }

            post.title = title;
            post.description = description;
            post.category = category;
            return post.save();
        })
        .then(result => {
            res.status(200).json({ message: 'Post updated successfully', post: result });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};


exports.searchPosts = (req, res, next) => {
    const searchQuery = req.query.q; // Assuming the search query is provided as a query parameter with the key 'q'

    let query = Post.find();

    if (searchQuery) {
        // Apply the search filter if a query is provided
        query = query.or([
            { title: { $regex: searchQuery, $options: 'i' } }, // Case-insensitive search on the title
        ]);
    }

    query.populate('creator')
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




const clearImage = filePath => {
    filePath = path.join(__dirname, '..', filePath);
    fs.unlink(filePath, err => console.log(err));
}