const mongoose = require('mongoose');
const Joi = require('joi');
const timestamps = require('mongoose-timestamp');

// Post Schema
const PostSchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
});


PostSchema.plugin(timestamps);

module.exports = Post = mongoose.model('Post', PostSchema);