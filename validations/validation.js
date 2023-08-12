const Joi = require('joi');

// Registration validation
const registerValidation = (data) => {
    const schema = Joi.object({
        username: Joi.string().min(3).max(30).required(),
        email: Joi.string().min(6).max(255).required().email(),
        password: Joi.string().min(6).max(1024).required()
    });

    return schema.validate(data);
};

// Login validation
const loginValidation = (data) => {
    const schema = Joi.object({
        email: Joi.string().min(6).max(255).required().email(),
        password: Joi.string().min(6).max(1024).required()
    });

    return schema.validate(data);
};

// Post validation
const postValidation = (data) => {
    const schema = Joi.object({
        title: Joi.string().min(3).max(255).required(),
        description: Joi.string().min(3).max(5000).required(),
    });

    return schema.validate(data);
};

module.exports.validateRegistration = registerValidation;
module.exports.validateLogin = loginValidation;
module.exports.validatePost = postValidation;
