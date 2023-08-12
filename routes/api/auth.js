const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');

router.post('/register', (req, res) => {
    let newUser = new User({
        username: req.body.username,
        email: req.body.email,
        password: req.body.password
    });

    User.addUser(newUser, (err, user) => {
        if (err) {
            res.json({ success: false, msg: 'Failed to register user' });
        } else {
            res.json({ success: true, msg: 'User registered' });
        }
    });
});

router.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    User.getUserByUsername(username, (err, user) => {
        if (err) throw err;
        if (!user) {
            return res.json({ success: false, msg: 'User not found' });
        }

        User.comparePassword(password, user.password, (err, isMatch) => {
            if (err) throw err;
            if (isMatch) {
                const token = jwt.sign(user.toJSON(), process.env.JWT_SECRET, {
                    expiresIn: 604800 // 1 week
                });

                res.json({
                    success: true,
                    token: 'JWT ' + token,
                    user: {
                        id: user._id,
                        username: user.username,
                        email: user.email
                    }
                });
            } else {
                return res.json({ success: false, msg: 'Wrong password' });
            }
        });
    });
});

router.get('/profile', passport.authenticate('jwt', { session: false }), (req, res) => {
    res.json({ user: req.user });
});

// Protected route
router.get('/protected', passport.authenticate('jwt', { session: false }), (req, res) => {
    res.json({ message: 'Protected route accessed successfully!', user: req.user });
});


module.exports = router;
