const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv/config');
const User = require('../models/User');

// Inscription d'un nouvel utilisateur dans la db
exports.signup = (req, res, next) => {

    // Création d'un hash du mot de passe avec un niveau de salage à 10
    bcrypt.hash(req.body.password, 10)
        .then(hash => {

            // Création d'un nouvel utilisateur avec le mot de passe haché
            const user = new User({
                email: req.body.email,
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

    // Récupération de l'adresse mail et comparaison de l'adresse d'inscription à l'adresse saisie
    User.findOne({ email: req.body.email})
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