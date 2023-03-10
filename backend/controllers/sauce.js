const Sauce = require('../models/sauce');
const fs = require('fs');

exports.addSauce = (req, res) => {
    const sauceObject = JSON.parse(req.body.sauce);
    delete sauceObject._userId;
    const sauce = new Sauce({
        ...sauceObject,
        userId: req.auth.userId,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
        likes: 0,
        dislikes: 0,
        usersLiked: [],
        usersDisliked: []
    });
    sauce.save()
        .then(() => { res.status(201).json({ message: "Objet enregistré !" }) })
        .catch(error => { res.status(400).json({ error }) })
};

exports.getOneSauce = (req, res) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => res.status(200).json(sauce))
        .catch(error => res.status(404).json({ error }));
};

exports.updateSauce = (req, res) => {
    const sauceObject = req.file ? {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body };

    if (sauceObject.heat >= 1 && sauceObject.heat <= 10) {
        delete sauceObject._userId;
        Sauce.findOne({ _id: req.params.id })
            .then((sauce) => {
                if (sauce.userId != req.auth.userId) {
                    res.status(403).json({ message: 'Non autorisé' });
                } else {
                    if (req.file != null) {
                        const filename = sauce.imageUrl.split('/images/')[1];
                        fs.unlink(`images/${filename}`, (err => {
                            if (err) console.log(err)
                        }))
                    }
                    Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
                        .then(() => res.status(200).json({ message: 'Objet modifié !' }))
                        .catch(error => res.status(400).json({ error }));
                }
            })
            .catch((error) => { res.status(404).json({ error });
            })
    } else {
        res.status(400).json({ message: "La valeur de heat doit être comprise entre 1 et 10" })
    }
};

exports.deleteSauce = (req, res) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => {
            if (sauce.userId != req.auth.userId) {
                res.status(403).json({ message: "Non autorisé" });
            } else {
                const filename = sauce.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, () => {
                    Sauce.deleteOne({ _id: req.params.id })
                        .then(() => res.status(200).json('Objet supprimé !'))
                        .catch(error => res.status(400).json({ error }));
                });
            }
        })
        .catch(error => { res.status(404).json({ error });
        });
};

exports.getAllSauces = (req, res) => {
    Sauce.find()
        .then(sauces => res.status(200).json(sauces))
        .catch(error => res.status(400).json({ error }));
};

exports.likeSauce = (req, res) => {
    if (req.body.like >= -1 && req.body.like <= 1) {
        if (req.body.like == 1) {
            Sauce.findOne({ _id: req.params.id })
                .then(sauce => {
                    if (sauce.usersLiked.includes(req.body.userId) || sauce.usersDisliked.includes(req.body.userId)) {
                        res.status(403).json({ message: "Non autorisé" });
                    } else {
                        Sauce.updateOne({ _id: req.params.id }, { $push: { usersLiked: req.body.userId }, $inc: { likes: 1 } })
                            .then(() => res.status(200).json({ message: "Appréciation enregistrée !" }))
                            .catch((error) => res.status(400).json({ error }));
                    }
                })
                .catch((error) => res.status(404).json({ error }));
        } else if (req.body.like == 0) {
            Sauce.findOne({ _id: req.params.id })
                .then(sauce => {
                    if (sauce.usersLiked.includes(req.body.userId)) {
                        Sauce.updateOne({ _id: req.params.id }, { $pull: { usersLiked: req.body.userId }, $inc: { likes: -1 } })
                            .then(() => res.status(200).json({ message: "Appréciation supprimée !" }))
                            .catch((error) => res.status(400).json({ error }));
                    }
                    if (sauce.usersDisliked.includes(req.body.userId)) {
                        Sauce.updateOne({ _id: req.params.id }, { $pull: { usersDisliked: req.body.userId }, $inc: { dislikes: -1 } })
                            .then(() => res.status(200).json({ message: "Appréciation supprimée !" }))
                            .catch((error) => res.status(400).json({ error }));
                    }
                })
                .catch((error) => res.status(404).json({ error }));
        } else {
            Sauce.findOne({ _id: req.params.id })
                .then(sauce => {
                    if (sauce.usersLiked.includes(req.body.userId) || sauce.usersDisliked.includes(req.body.userId)) {
                        res.status(403).json({ message: "Non autorisé" });
                    } else {
                        Sauce.updateOne({ _id: req.params.id }, { $push: { usersDisliked: req.body.userId }, $inc: { dislikes: 1 } })
                            .then(() => res.status(200).json({ message: "Appréciation enregistrée !" }))
                            .catch((error) => res.status(400).json({ error }));
                    }
                })
                .catch((error) => res.status(404).json({ error }));
        }
    } else {
        res.status(400).json({ message: "Le nombre de like doit être égal à 1, 0 ou -1" })
    }
};