const passwordValidator = require('password-validator');

const passwordSchema = new passwordValidator();

passwordSchema
.is().min(8)
.is().max(20)
.has().uppercase()
.has().lowercase()
.has().digits(2)
.has().not().spaces()
.is().not().oneOf(['Passw0rd', 'Password123', 'Azerty00']);

// Vérification du password par rapport au schema
module.exports = (req, res, next) => {
    if (!passwordSchema.validate(req.body.password)) {
        return res.status(400).json({ message : 'Mot de passe trop faible !' + passwordSchema.validate('req.body.password', { list:true})})
    } else {
        next();
    }
};