const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const passport = require('passport');

const users = require('./routes/api/users');
const posts = require('./routes/api/posts');
const comments = require('./routes/api/comments');
const likes = require('./routes/api/likes');

const db = require('./config/keys').mongoURI;

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

app.use(passport.initialize());
require('./config/passport')(passport);

app.use('/api/users', users);
app.use('/api/posts', posts);
app.use('/api/comments', comments);
app.use('/api/likes', likes);

const port = process.env.PORT || 5000;  // Port number 5000

app.listen(port, () => console.log(`Server running on port ${port}`));

