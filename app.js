const formulaire = document.querySelector("#form-course");
const champArticle = document.querySelector("#nom-article");
const champCategorie = document.querySelector("#categorie");
const listeCourses = document.querySelector("#liste-courses");
const compteur = document.querySelector("#compteur");

// Pour commencer, les articles sont conservés en mémoire.
let articles = [];

function afficherArticles() {
  listeCourses.replaceChildren();

  const categories = [...new Set(articles.map(article => article.categorie))];

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
        if (article.achete) ligne.classList.add("coche");

        const caseCoche = document.createElement("input");
        caseCoche.type = "checkbox";
        caseCoche.checked = article.achete;
        caseCoche.setAttribute(
          "aria-label",
          `Article acheté : ${article.nom}`
        );

        caseCoche.addEventListener("change", () => {
          article.achete = caseCoche.checked;
          afficherArticles();
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

        boutonSupprimer.addEventListener("click", () => {
          articles = articles.filter(element => element.id !== article.id);
          afficherArticles();
        });

        ligne.append(caseCoche, nom, boutonSupprimer);
        listeCourses.appendChild(ligne);
      });
  });

  const total = articles.length;
  const restants = articles.filter(article => !article.achete).length;

  compteur.textContent =
    `${total} article${total !== 1 ? "s" : ""} · ${restants} restant${restants !== 1 ? "s" : ""}`;
}

formulaire.addEventListener("submit", evenement => {
  evenement.preventDefault();

  const nom = champArticle.value.trim();
  if (!nom) return;

  articles.push({
    id: crypto.randomUUID(),
    nom: nom,
    categorie: champCategorie.value,
    achete: false
  });

  champArticle.value = "";
  champArticle.focus();

  afficherArticles();
});

afficherArticles();
