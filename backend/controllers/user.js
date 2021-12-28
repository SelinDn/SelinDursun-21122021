const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cryptoJs = require('crypto-js');
require('dotenv/config');
const User = require('../models/User');

// Mise en place de RegExp
const emailRegexp = /^[^ "<>?*()$][a-zA-Z0-9ÀÁÂÃÄÅàáâãäåÒÓÔÕÖØòóôõöøÈÉÊËèéêëÇçÌÍÎÏìíîïÙÚÛÜùúûüÿÑñ ,.'-_]+[@]{1}[^ "<>?*()$][a-zA-Z0-9ÀÁÂÃÄÅàáâãäåÒÓÔÕÖØòóôõöøÈÉÊËèéêëÇçÌÍÎÏìíîïÙÚÛÜùúûüÿÑñ ,.'-_]+[.]{1}[a-z]{2,20}$/;
const passwordRegexp = /^[^ "<>?*()$.](?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,20}$/;

// Inscription d'un nouvel utilisateur dans la db
exports.signup = (req, res, next) => {
    if (!emailRegexp.test(req.body.email) && !passwordRegexp.test(req.body.password)) {
        return res.status(500).json({ message : 'Veuillez renseignez une adresse mail valide et un mot de passe valide !'})
    };

    // Chiffrement de l'email
    const cryptoEmail = cryptoJs.HmacSHA256(req.body.email, process.env.CRYPTOJS_EMAIL_KEY).toString();

    // Création d'un hash du mot de passe avec un niveau de salage à 10
    bcrypt.hash(req.body.password, 10)
        .then(hash => {

            // Création d'un nouvel utilisateur avec le mot de passe haché
            const user = new User({
                email: cryptoEmail,
                password: hash,
            });

            // Enregistrement de cet utilisateur dans la db 
            user.save()
                .then(() => res.status(201).json({ message : 'Utilisateur créé !'}))
                .catch( error => res.status(400).json({ error }));
        })
        .catch( error => res.status(500).json({ error }));
};

// Connexion d'un utilisateur existant dans la db
exports.login = (req, res, next) => {
    if (!emailRegexp.test(req.body.email) && !passwordRegexp.test(req.body.password)) {
        return res.status(500).json({ message : 'Veuillez renseignez une adresse mail valide et un mot de passe valide !'})
    };
    const cryptoEmail = cryptoJs.HmacSHA256(req.body.email, process.env.CRYPTOJS_EMAIL_KEY).toString();
    // Récupération de l'adresse mail et comparaison de l'adresse d'inscription à l'adresse saisie
    User.findOne({ email: cryptoEmail})
        .then(user => {

            // Dans le cas d'un utilisateur non trouvé
            if (!user) {
                return res.status(401).json({ error : 'Utilisateur introuvable !'});
            }

            // Si trouvé, on compare cette fois-ci le mot de passe saisi avec le mot de passe haché
            bcrypt.compare(req.body.password, user.password)
                .then(valid => {

                    // Si boolean = false, on renvoie une erreur 
                    if (!valid) {
                        return res.status(401).json({ error : 'Mot de passe incorrect !'});
                    }

                    // Si boolean = true, obtention d'un userId et d'un token 
                    res.status(200).json({
                        userId: user._id,
                        token: jwt.sign(
                            { userId: user._id},
                            process.env.RANDOM_TOKEN_SECRET,
                            { expiresIn: '24h'},
                        )
                    });
                })
                .catch( error => res.status(500).json({ error }));
        })
        .catch( error => res.status(500).json({ error }));
};