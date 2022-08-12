const Sauce = require("../models/sauce");
const fs = require("fs");
const sauce = require("../models/sauce");

exports.createSauce = (req, res, next) => {
  const sauceObject = JSON.parse(req.body.sauce);
  delete sauceObject._id;
  const sauce = new Sauce({
    ...sauceObject,
    imageUrl: `${req.protocol}://${req.get("host")}/images/${
      req.file.filename
    }`,
  });

  sauce
    .save()
    .then(() => {
      res.status(201).json({ message: "Objet enregistré !" });
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

exports.getOneSauce = (req, res, next) => {
  Sauce.findOne({
    _id: req.params.id,
  })
    .then((sauce) => {
      res.status(200).json(sauce);
    })
    .catch((error) => {
      res.status(404).json({
        error: error,
      });
    });
};

exports.modifySauce = (req, res, next) => {
  const sauceObject = req.file
    ? {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${
          req.file.filename
        }`,
      }
    : { ...req.body };

  delete sauceObject._userId;
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      if (sauce.userId != req.auth.userId) {
        res.status(401).json({ message: "Not authorized" });
      } else {
        Sauce.updateOne(
          { _id: req.params.id },
          { ...sauceObject, _id: req.params.id }
        )
          .then(() => res.status(200).json({ message: "Objet modifié!" }))
          .catch((error) => res.status(401).json({ error }));
      }
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

exports.deleteSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      if (sauce.userId != req.auth.userId) {
        res.status(401).json({ message: "Not authorized" });
      } else {
        const filename = sauce.imageUrl.split("/images/")[1];
        fs.unlink(`images/${filename}`, () => {
          Sauce.deleteOne({ _id: req.params.id })
            .then(() => {
              res.status(200).json({ message: "Objet supprimé !" });
            })
            .catch((error) => res.status(401).json({ error }));
        });
      }
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};

exports.getAllSauces = (req, res, next) => {
  Sauce.find()
    .then((sauces) => {
      res.status(200).json(sauces);
    })
    .catch((error) => {
      res.status(400).json({
        error: error,
      });
    });
};

exports.likeSauce = (req, res, next) => {
  if (req.body.like === 1) {
    console.log("j'aime");
    Sauce.findOne({ _id: req.params.id }).then((sauce) => {
      sauce.likes = sauce.likes + 1;
      // j'augmente le nombre de like
      // ajouter l'id de l'utilisateur à la liste des gens qui aiment
      sauce.usersLiked.push(req.auth.userId);
      sauce
        .save()
        .then(() => {
          res.status(200).json({ message: "Like enregistré" });
        })
        .catch((error) => res.status(401).json({ error }));
    });
  }
  if (req.body.like === -1) {
    console.log("je n'aime pas ");
    Sauce.findOne({ _id: req.params.id }).then((sauce) => {
      sauce.dislikes = sauce.dislikes + 1;
      // j'augmente le nombre de dislike
      // ajouter l'id de l'utilisateur à la liste des gens qui aiment
      sauce.usersDisliked.push(req.auth.userId);
      sauce
        .save()
        .then(() => {
          res.status(200).json({ message: "Dislike enregistré" });
        })
        .catch((error) => res.status(401).json({ error }));
    });
  } else if (req.body.like === 0) {
    console.log("neutre");
    // commencer par savoir ou on était avant : si on était dans les likes OU dislikes
    // obligatoirmeent dans l'un ou dans l'autre

    // pour les likes:
    Sauce.findOne({ _id: req.params.id }).then((result) => {
      if (result.usersLiked.includes(req.body.userId)) {
        Sauce.findOne({ _id: req.params.id }).then((sauce) => {
          sauce.likes = sauce.likes - 1;
          console.log(sauce.usersLiked);
          const deleteId = sauce.usersLiked.filter(
            (el) => el !== req.body.userId
          );
          console.log(deleteId);
          sauce.usersLiked = deleteId;
          sauce
            .save()
            .then(() => {
              res.status(200).json({ message: "Like retiré" });
            })
            .catch((error) => res.status(401).json({ error }));
        });
      }

      // pour les dislikes
      else if (result.usersDisliked.includes(req.body.userId)) {
        Sauce.findOne({ _id: req.params.id }).then((sauce) => {
          sauce.dislikes = sauce.dislikes - 1;
          const deleteId2 = sauce.usersDisliked.filter(
            (el) => el !== req.body.userId
          );
          sauce.usersDisliked = deleteId2;
          sauce
            .save()
            .then(() => {
              res.status(200).json({ message: "Dislike retiré" });
            })
            .catch((error) => res.status(401).json({ error }));
        });
      }
    });
  }
};
