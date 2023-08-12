const express = require('express');
const router = express.Router();
const passport = require('passport');

const Post = require('../../models/Post'); 
const Like = require('../../models/Like'); 
const Comment = require('../../models/Comment'); 
const { validatePost } = require('../../validations/validation');

// Creates a new post
router.post('/', passport.authenticate('jwt', { session: false }), (req, res) => {
    
    const { error } = validatePost(req.body); 
    if (error) return res.status(400).json({ error: error.details[0].message });

    const newPost = new Post({
        title: req.body.title,
        description: req.body.description,
        // Wanted to automatically set the owner based on the bearer token
        owner: req.user._id, 
        timestamp: Date.now()
    });

    newPost.save()
        .then(post => res.json(post))
        .catch(err => res.status(400).json(err));
});


// Get all the posts
router.get('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        let posts = await Post.find();

        // Get the likes count
        const postsWithLikeCounts = await Promise.all(posts.map(async (post) => {
            const num_of_likes = await Like.countDocuments({ post: post._id });
            let postObject = post.toObject();
            postObject.num_of_likes = num_of_likes;
            return postObject;
        }));

        // Sort the posts based on likes, then timestamp
        const sortedPosts = postsWithLikeCounts.sort((a, b) => {
            if (a.num_of_likes === b.num_of_likes) {
                return new Date(b.timestamp) - new Date(a.timestamp);
            }
            return b.num_of_likes - a.num_of_likes;
        });


        const postsWithDetails = await Promise.all(sortedPosts.map(async (post) => {
            // Get all the likes for a specific post
            let likesForPost = await Like.find({ post: post._id }).populate('user', 'username');
            
            // Gte a list of users who from the likes
            let userNamesWhoLiked = likesForPost.map(like => like.user.username);

            // Add in the comments for the post
            let commentsForPost = await Comment.find({ post: post._id });
            
            post.usernames_liked = userNamesWhoLiked; 
            post.num_of_comments = commentsForPost.length; 
            post.comments = commentsForPost; 
            
            return post;
        }));

        res.json(postsWithDetails);
    } catch (err) {
        console.error(err);
        res.status(400).json(err);
    }
});

// Get a post by ID
router.get('/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        let post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ postnotfound: 'No post found with that ID' });
        }

        // Get all the likes for a specific post
        let likesForPost = await Like.find({ post: post._id }).populate('user', 'username');

       // Gte a list of users who from the likes
        let usernamesWhoLiked = likesForPost.map(like => like.user.username);

        // Add in the comments for the post
        let commentsForPost = await Comment.find({ post: post._id });

        // Add in the extra fields
        let postObject = post.toObject();  
        postObject.num_of_likes = usernamesWhoLiked.length;
        postObject.usernames_liked = usernamesWhoLiked;
        postObject.comments = commentsForPost;

        res.json(postObject);

    } catch (err) {
        res.status(400).json(err);
    }
});

// Updates a post by ID
router.put('/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
    Post.findById(req.params.id)
        .then(post => {
            if (!post) {
                return res.status(404).json({ notfound: 'Post not found' });
            }
            
            // Checking the user is allowed to update
            if (req.user.id.toString() !== post.owner.toString()) {
                return res.status(401).json({ notauthorized: 'User not authorized' });
            }

            // Makes sure the owner isn't modified
            let updateData = {
                title: req.body.title,
                description: req.body.description
            };

            return Post.findByIdAndUpdate(req.params.id, updateData, { new: true });
        })
        .then(updatedPost => {
            if (updatedPost) {
                res.json(updatedPost);
            }
        })
        .catch(err => res.status(400).json(err));
});


// Deletes a post by ID
router.delete('/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ postnotfound: 'No post found' });
        }

        if (post.owner.toString() !== req.user.id) {
            return res.status(401).json({ notauthorized: 'User not authorized' });
        }

        // Deleting all the likes linked 
        await Like.deleteMany({ post: post._id });

        // Deleting comments linkedt
        await Comment.deleteMany({ post: post._id });

        // Delete the post specified
        const deletedPost = await Post.findByIdAndRemove(req.params.id);
        
        if (!deletedPost) {
            return res.status(404).json({ postnotfound: 'Error deleting post' });
        }

        res.json({ success: true });
    } catch (err) {
        res.status(400).json(err);
    }
});

module.exports = router;
