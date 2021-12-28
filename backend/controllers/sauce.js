const Sauce = require('../models/Sauce');
const fs = require('fs');

// Obtention de toutes les sauces (READ)
exports.getAllSauces = (req, res, next) => {
    Sauce.find()
    .then(sauces => res.status(200).json(sauces))
    .catch(error => res.status(400).json({ error}));
};

// Obtention d'une sauce en particulier (READ)
exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id})
    .then(sauce => res.status(200).json(sauce))
    .catch(error => res.status(404).json({ error}));
};

const regExp = /^[^ "<>?*()$][a-zA-Z0-9ÀÁÂÃÄÅàáâãäåÒÓÔÕÖØòóôõöøÈÉÊËèéêëÇçÌÍÎÏìíîïÙÚÛÜùúûüÿÑñ ,.'-_]+$/;

// Création d'une sauce (CREATE)
exports.createSauce = (req, res, next) => {
    // Passage String => JS Object pour pouvoir créer la sauce
    const sauceObject = JSON.parse(req.body.sauce); 
    delete sauceObject._id;
    // Contrôle des champs de saisies
    if (!regExp.test(sauceObject.name) && !regExp.test(sauceObject.manufacturer) && !regExp.test(sauceObject.description) && !regExp.test(sauceObject.mainPepper) && !regExp.test(sauceObject.heat)) {
        return res.status(500).json({ message : 'Les caractères spéciaux ne sont pas autorisés, veillez à bien remplir les champs'})
    }
    const sauce = new Sauce({
        ...sauceObject,
        // Récupérer tout les segments d'URL de l'image
        imageUrl : `${req.protocol}://${req.get('host')}/images/${req.file.filename}` 
    });
    sauce.save()
    .then(() => res.status(201).json({ message: 'Votre sauce est enregistrée !'}))
    .catch(error => res.status(400).json({ error}));
};

// Modification d'une sauce (UPDATE)
exports.modifySauce = (req, res, next) => {
    // Contrôle de l'authentification
    Sauce.findOne({_id: req.params.id})
    .then((sauce) => {
        if (sauce.userId !== req.auth.userId) {
            return res.status(403).json({
                error: new Error('Requête non autorisée !')
            }); 
        }
        // Dans le cas de l'ajout d'une nouvelle image
        const sauceObject = req.file ? 
        {
            ...JSON.parse(req.body.sauce),
            imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
        } : { ...req.body }; 
        // Contrôle des champs de saisies
        if (!regExp.test(sauceObject.name) && !regExp.test(sauceObject.manufacturer) && !regExp.test(sauceObject.description) && !regExp.test(sauceObject.mainPepper) && !regExp.test(sauceObject.heat)) {
            return res.status(500).json({ message : 'Les caractères spéciaux ne sont pas autorisés, veillez à bien remplir les champs'})
        }
        Sauce.updateOne({ _id: req.params.id}, { ...sauceObject, _id: req.params.id})
        .then(() => res.status(200).json({message: 'Votre sauce a bien été modifiée !'}))
        .catch(error => res.status(400).json({ error}));
    })
    .catch(error => res.status(500).json({ error}));
};

// Suppression d'une sauce (DELETE)
exports.deleteSauce = (req, res, next) => {
    // Contrôle de l'authentification
    Sauce.findOne({_id: req.params.id})
    .then(sauce => {
        if (sauce.userId !== req.auth.userId) {
            return res.status(403).json({
                error: new Error('Requête non autorisée !')
            });
        }
        // Chercher l'image afin de la supprimer aussi du dossier images et de la db
        const filename = sauce.imageUrl.split('/images/')[1];
        fs.unlink(`images/${filename}`, () => {
            Sauce.deleteOne({ _id: req.params.id})
            .then(() => res.status(200).json({ message: 'Votre sauce a bien été supprimée !'}))
            .catch(error => res.status(400).json({error}))
        });
    })
    .catch(error => res.status(500).json({ error}));
};

// Ajout de likes/dislikes pour une sauce (CREATE)
exports.likeOrDislikeSauce = (req, res, next) => {
    // Quand le frontend renvoie like:1 (LIKER)
    if (req.body.like === 1) {
        Sauce.updateOne({ _id: req.params.id}, { $inc: { likes: +1 }, $push: { usersLiked: req.body.userId }})
        .then(() => res.status(200).json({ message: 'Like pris en compte !'}))
        .catch((error) => res.status(400).json({ error }));
    }
    // Quand le frontend renvoie like:-1 (DISLIKER)
    else if (req.body.like === -1) {
        Sauce.updateOne({ _id: req.params.id}, { $inc: { dislikes: +1 }, $push: { usersDisliked: req.body.userId }})
        .then(() => res.status(200).json({ message: 'Dislike pris en compte !'}))
        .catch((error) => res.status(400).json({ error }));
    } 
    // Quand le frontend renvoie like:0 (ANNULER)
    else {
        Sauce.findOne({ _id: req.params.id})
        .then((sauce) => {
            // Annuler le like
            if (sauce.usersLiked.includes(req.body.userId)) {
                Sauce.updateOne({ _id: req.params.id}, { $inc: { likes: -1 }, $pull: { usersLiked: req.body.userId }})
                .then(() => res.status(200).json({ message: 'Avis déja pris en compte !'}))
                .catch((error) => res.status(400).json({ error }));
            } 
            // Annuler le dislike
            else if (sauce.usersDisliked.includes(req.body.userId)) {
                Sauce.updateOne({ _id: req.params.id}, { $inc: { dislikes: -1 }, $pull: { usersDisliked: req.body.userId }})
                .then(() => res.status(200).json({ message: 'Avis déja pris en compte !'}))
                .catch((error) => res.status(400).json({ error }));
            }
        })
        .catch((error) => res.status(404).json({ error }));
    }
};