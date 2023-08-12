const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const keys = require('../../config/keys'); 

const User = require('../../models/User');
const { validateLogin, validateRegistration} = require('../../validations/validation');

// User registration
router.post('/register', (req, res) => {
    console.log('Register endpoint hit');
    
    const { error } = validateRegistration(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    User.findOne({ email: req.body.email })
        .then(user => {
            if (user) {
                return res.status(400).json({ email: 'Email already exists' });
            } else {
                const newUser = new User({
                    username: req.body.username,
                    email: req.body.email,
                    password: req.body.password
                });

                // Hash password before storing in the database
                bcrypt.genSalt(10, (err, salt) => {
                    bcrypt.hash(newUser.password, salt, (err, hash) => {
                        if (err) throw err;
                        newUser.password = hash;
                        newUser.save()
                            .then(user => res.json(user))
                            .catch(err => console.log(err));
                    });
                });
            }
        });
});

// User login
router.post('/login', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    const { error } = validateLogin(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    User.findOne({ email })
        .then(user => {
            if (!user) {
                return res.status(404).json({ emailnotfound: 'Email not found' });
            }

            // Check password
            bcrypt.compare(password, user.password).then(isMatch => {
                if (isMatch) {
                    const payload = {
                        id: user.id,
                        name: user.name
                    };

                    // Sign token
                    jwt.sign(
                        payload,
                        keys.jwtSecret,
                        {// 1 year in seconds
                            expiresIn: 31556926 
                        },
                        (err, token) => {
                            if (err) {
                                console.error("Error generating token:", err);
                                return res.status(500).json({ success: false, error: "Token generation failed" });
                            }
                    
                            res.json({
                                success: true,
                                token: 'Bearer ' + token
                            });
                        }
                    );
                } else {
                    return res.status(400).json({ passwordincorrect: 'Password incorrect' });
                }
            });
        });
});

// Current user (protected route)
router.get('/current', passport.authenticate('jwt', { session: false }), (req, res) => {
    res.json({
        id: req.user.id,
        name: req.user.name,
        email: req.user.email
    });
});

module.exports = router;
