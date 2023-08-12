const express = require('express');
const router = express.Router();
const passport = require('passport');


const Post = require('../../models/Post');
const Like = require('../../models/Like');

// Creates a like for a post
router.post('/:postId', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        let post = await Post.findById(req.params.postId);
        if (!post) {
            return res.status(404).json({ postnotfound: 'No post found' });
        }

        if (String(post.owner) === String(req.user.id)) {
            return res.status(400).json({ alreadyliked: 'User cannot like their own post' });
        }

        let existingLike = await Like.findOne({ user: req.user.id, post: req.params.postId });
        if (existingLike) {
            return res.status(400).json({ alreadyliked: 'User already liked this post' });
        }

        const newLike = new Like({
            user: req.user.id,
            post: req.params.postId
        });

        await newLike.save();

        let likesForPost = await Like.find({ post: req.params.postId }).populate('user', 'username');
        let usernames = likesForPost.map(like => like.user.username);

        let postObject = post.toObject();  
        postObject.num_of_likes = likesForPost.length;
        postObject.usernames_liked = usernames;

        res.json(postObject);

    } catch (err) {
        res.status(400).json(err);
    }
});



// Removes a like 
router.delete('/:postId', passport.authenticate('jwt', { session: false }), (req, res) => {
    Post.findById(req.params.postId)
        .then(post => {
            if (!post) {
                return res.status(404).json({ postnotfound: 'No post found' });
            }

            Like.findOneAndRemove({ user: req.user.id, post: req.params.postId })
                .then(() => {
                    post.likesCount -= 1;
                    post.save().then(post => res.json(post));
                })
                .catch(err => res.status(400).json(err));
        })
        .catch(err => res.status(400).json(err));
});

// Check if user has already liked a post
router.get('/:postId/user', passport.authenticate('jwt', { session: false }), (req, res) => {
    Like.findOne({ user: req.user.id, post: req.params.postId })
        .then(like => {
            if (like) {
                res.json(true);
            } else {
                res.json(false);
            }
        })
        .catch(err => res.status(400).json(err));
});


module.exports = router;
