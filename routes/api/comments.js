const express = require('express');
const router = express.Router();
const passport = require('passport');

const Post = require('../../models/Post');
const Comment = require('../../models/Comment');

//Adds a comment
router.post('/:postId', passport.authenticate('jwt', { session: false }), (req, res) => {
    Post.findById(req.params.postId)
        .then(post => {
            if (!post) {
                return res.status(404).json({ postnotfound: 'No post found' });
            }

            if (String(post.owner) === String(req.user.id)) {
                return res.status(400).json({ ownpost: 'User cannot comment on their own post' });
            }

            const newComment = new Comment({
                user: req.user.id,
                post: req.params.postId,
                text: req.body.text
            });

            newComment.save()
                .then(comment => res.json(comment))
                .catch(err => res.status(400).json(err));
        })
        .catch(err => res.status(400).json(err));
});

// Gets all comments for a pos
router.get('/:postId', passport.authenticate('jwt', { session: false }), (req, res) => {
    Comment.find({ post: req.params.postId })
        .then(comments => res.json(comments))
        .catch(err => res.status(400).json(err));
});

// Deletes a comment
router.delete('/:commentId', passport.authenticate('jwt', { session: false }), (req, res) => {
    Comment.findById(req.params.commentId)
        .then(comment => {
            if (!comment) {
                return res.status(404).json({ commentnotfound: 'No comment found' });
            }

            // Check if user is authorised to delete comment (i.e the comment creator)
            if (comment.user.toString() !== req.user.id) {
                return res.status(401).json({ notauthorized: 'User not authorized to delete this comment' });
            }

            comment.remove().then(() => res.json({ success: true }));
        })
        .catch(err => res.status(400).json(err));
});

module.exports = router;
