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
