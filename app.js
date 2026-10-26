
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";

import {
  getDatabase,
  ref,
  onValue,
  set,
  update,
  remove
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-database.js";

// Remplace uniquement la valeur de apiKey par ta vraie clé Firebase.
const firebaseConfig = {
  apiKey: "AIzaSyB2Ej_i7FKsgDS9g1b0gQmVe3uRJ96tpTg",
  authDomain: "nos-petites-courses.firebaseapp.com",
  databaseURL: "https://nos-petites-courses-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "nos-petites-courses",
  storageBucket: "nos-petites-courses.firebasestorage.app",
  messagingSenderId: "504632227062",
  appId: "1:504632227062:web:5a2d5b8a043ac7898ee8d7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Seuls vos deux comptes sont autorisés dans l'application.
const utilisateursAutorises = [
  "rQfhSibpAKfleaSvG8P0EhtXxjB2",
  "MZk5r7wP5NTBSTqTwMprUubFVCC3"
];

const formulaire = document.querySelector("#form-course");
const champArticle = document.querySelector("#nom-article");
const champCategorie = document.querySelector("#categorie");
const listeCourses = document.querySelector("#liste-courses");
const compteur = document.querySelector("#compteur");

let articles = [];
let utilisateurConnecte = false;
let arreterEcoute = null;
let migrationFaite = false;

// Conserver les anciennes courses du navigateur pour les récupérer
// si la base Firebase est encore vide.
const anciennesCourses = JSON.parse(
  localStorage.getItem("mes-petites-courses") || "[]"
);

// Créer l'interface de connexion.
const connexion = document.createElement("section");
connexion.id = "connexion-firebase";
connexion.innerHTML = `
  <h2>Nos petites courses 💕</h2>
  <p>Connectez-vous pour retrouver votre liste à deux.</p>
  <form id="form-connexion">
    <label for="email-connexion">Adresse e-mail</label>
    <input id="email-connexion" type="email"
      autocomplete="username" required>
    <label for="mot-de-passe">Mot de passe</label>
    <input id="mot-de-passe" type="password"
      autocomplete="current-password" required>
    <button type="submit">Se connecter</button>
    <p id="message-connexion" role="status"></p>
  </form>
  <button id="bouton-deconnexion" type="button" hidden>
    Se déconnecter
  </button>
`;

connexion.style.cssText =
  "max-width:420px;margin:20px auto;padding:20px;" +
  "border-radius:12px;background:#fff0f5;color:#333;";

connexion.querySelector("form").style.cssText =
  "display:grid;gap:10px;";

connexion.querySelectorAll("input").forEach(input => {
  input.style.cssText =
    "box-sizing:border-box;width:100%;padding:12px;" +
    "border:1px solid #ccc;border-radius:8px;";
});

connexion.querySelectorAll("button").forEach(button => {
  button.style.cssText =
    "padding:12px;border:0;border-radius:8px;" +
    "cursor:pointer;";
});

formulaire.parentNode.insertBefore(connexion, formulaire);

// Cacher la liste tant que la personne n'est pas connectée.
function afficherZoneConnectee(visible) {
  formulaire.hidden = !visible;
  listeCourses.hidden = !visible;
  compteur.hidden = !visible;
}

afficherZoneConnectee(false);

const formulaireConnexion =
  document.querySelector("#form-connexion");
const messageConnexion =
  document.querySelector("#message-connexion");
const boutonDeconnexion =
  document.querySelector("#bouton-deconnexion");

formulaireConnexion.addEventListener("submit", async evenement => {
  evenement.preventDefault();
  messageConnexion.textContent = "Connexion en cours…";

  const email = document.querySelector("#email-connexion").value.trim();
  const motDePasse = document.querySelector("#mot-de-passe").value;

  try {
    await signInWithEmailAndPassword(auth, email, motDePasse);
    messageConnexion.textContent = "";
  } catch (erreur) {
    console.error(erreur);
    messageConnexion.textContent =
      "Connexion impossible. Vérifiez votre e-mail et votre mot de passe.";
  }
});

boutonDeconnexion.addEventListener("click", async () => {
  await signOut(auth);
});

// Enregistrer les données reçues dans le navigateur.
function sauvegarderArticles() {
  localStorage.setItem(
    "mes-petites-courses",
    JSON.stringify(articles)
  );
}

// Afficher les articles, comme dans la version précédente.
function afficherArticles() {
  listeCourses.replaceChildren();

  const categories = [
    ...new Set(articles.map(article => article.categorie))
  ];

  categories.forEach(categorie => {
    const titre = document.createElement("h3");
    titre.className = "categorie";
    titre.textContent = categorie;
    listeCourses.appendChild(titre);

    articles
      .filter(article => article.categorie === categorie)
      .forEach(article => {
        const ligne = document.createElement("div");
        ligne.className = "article";

        if (article.achete) {
          ligne.classList.add("coche");
        }

        const caseCoche = document.createElement("input");
        caseCoche.type = "checkbox";
        caseCoche.checked = article.achete;
        caseCoche.setAttribute(
          "aria-label",
          `Article acheté : ${article.nom}`
        );

        caseCoche.addEventListener("change", async () => {
          try {
            await update(
              ref(db, `courses/${article.id}`),
              { achete: caseCoche.checked }
            );
          } catch (erreur) {
            console.error(erreur);
            alert("Impossible de modifier cet article. Vérifiez votre connexion.");
          }
        });

        const nom = document.createElement("span");
        nom.className = "article-nom";
        nom.textContent = article.nom;

        const boutonSupprimer = document.createElement("button");
        boutonSupprimer.className = "supprimer";
        boutonSupprimer.type = "button";
        boutonSupprimer.textContent = "×";
        boutonSupprimer.setAttribute(
          "aria-label",
          `Supprimer ${article.nom}`
        );

        boutonSupprimer.addEventListener("click", async () => {
          try {
            await remove(ref(db, `courses/${article.id}`));
          } catch (erreur) {
            console.error(erreur);
            alert("Impossible de supprimer cet article.");
          }
        });

        ligne.append(caseCoche, nom, boutonSupprimer);
        listeCourses.appendChild(ligne);
      });
  });

  const total = articles.length;
  const restants = articles.filter(
    article => !article.achete
  ).length;

  compteur.textContent =
    `${total} article${total !== 1 ? "s" : ""} · ` +
    `${restants} restant${restants !== 1 ? "s" : ""}`;
}

// Ajouter un article dans Firebase.
formulaire.addEventListener("submit", async evenement => {
  evenement.preventDefault();

  if (!utilisateurConnecte) return;

  const nom = champArticle.value.trim();
  if (!nom) return;

  const article = {
    id: crypto.randomUUID(),
    nom,
    categorie: champCategorie.value,
    achete: false
  };

  try {
    await set(ref(db, `courses/${article.id}`), article);
    champArticle.value = "";
    champArticle.focus();
  } catch (erreur) {
    console.error(erreur);
    alert("Impossible d'ajouter cet article. Vérifiez votre connexion.");
  }
});

// Suivre les connexions et synchroniser les deux appareils.
onAuthStateChanged(auth, utilisateur => {
  if (arreterEcoute) {
    arreterEcoute();
    arreterEcoute = null;
  }

  utilisateurConnecte = false;
  afficherZoneConnectee(false);
  boutonDeconnexion.hidden = true;

  if (!utilisateur) {
    messageConnexion.textContent = "";
    connexion.hidden = false;
    return;
  }

  if (!utilisateursAutorises.includes(utilisateur.uid)) {
    messageConnexion.textContent =
      "Ce compte n'est pas autorisé à accéder à cette liste.";
    signOut(auth);
    return;
  }

  utilisateurConnecte = true;
  connexion.hidden = false;
  formulaireConnexion.hidden = true;
  boutonDeconnexion.hidden = false;
  afficherZoneConnectee(true);

  messageConnexion.textContent = "Vous êtes connecté(e) 💕";

  arreterEcoute = onValue(
    ref(db, "courses"),
    async instantane => {
      const donnees = instantane.val();

      // Au premier accès, récupérer les articles enregistrés
      // auparavant dans ce navigateur si Firebase est vide.
      if (
        donnees === null &&
        !migrationFaite &&
        anciennesCourses.length > 0
      ) {
        migrationFaite = true;

        const sauvegardes = anciennesCourses.map(article =>
          set(ref(db, `courses/${article.id}`), article)
        );

        try {
          await Promise.all(sauvegardes);
        } catch (erreur) {
          console.error(erreur);
          messageConnexion.textContent =
            "La récupération des anciennes courses a échoué.";
        }

        return;
      }

      migrationFaite = true;
      articles = donnees ? Object.values(donnees) : [];
      sauvegarderArticles();
      afficherArticles();
    },
    erreur => {
      console.error(erreur);
      messageConnexion.textContent =
        "Impossible de lire la liste. Vérifiez les règles Firebase.";
    }
  );
});

