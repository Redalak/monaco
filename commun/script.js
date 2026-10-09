/* =====================================================================
   MONACO : script commun aux 3 versions (et à la page d'accueil)

   1. CONFIG      -> LE SEUL ENDROIT À MODIFIER (prix, horaires, textes)
   2. Formatage   -> petites fonctions pour écrire "14 €" ou "14h30"
   3. Remplissage -> recopie la config dans la page (data-prix, data-texte)
   4. Statut      -> badge "Ouvert maintenant / Fermé", heure de Paris
   ===================================================================== */


/* ---------------------------------------------------------------------
   1. CONFIG
   Les pages HTML contiennent déjà ces valeurs "en dur" (au cas où le
   JavaScript ne charge pas), mais c'est cette config qui fait foi :
   on change ici, et les 3 versions se mettent à jour d'un coup.
   --------------------------------------------------------------------- */
const CONFIG = {

  // Affiche la petite mention "Prix d'exemple" sous les prix.
  // -> Passer à false quand les vrais prix du Monaco sont saisis.
  prixExemple: true,

  // Prix en euros, par personne. Mettre un nombre : 14 ou 14.5 (= 14,50 €)
  prix: {
    plat:   14, // Plat du jour seul
    deux:   18, // Entrée + plat OU plat + dessert
    trois:  22, // Entrée + plat + dessert
    brunch: 26  // Brunch du dimanche
  },

  // Service du midi (formules)
  midi: {
    jours: "Du lundi au samedi",
    debut: "12:00",
    fin:   "14:30", // heure de fin du service midi (format 24h "HH:MM")
    compris:    "Pain et carafe d'eau compris",
    nonCompris: "Boissons et café en supplément"
  },

  // Brunch du dimanche : ce qui est compris dans le prix
  brunch: {
    compris: "Boisson chaude et jus de fruits compris"
  },

  // Horaires d'ouverture (utilisés par le badge Ouvert / Fermé)
  // "24:00" = minuit
  horaires: {
    semaine:  { ouverture: "07:30", fermeture: "24:00" }, // lundi -> samedi
    dimanche: { ouverture: "10:30", fermeture: "15:00" }, // brunch
    apero: "18:00" // début de l'apéro (frise de la version C)
  },

  // Ta signature dans la barre de démo en bas de page
  proposition: {
    nom: "Reda Lakhledj",
    telephone: "" // <- mets ton numéro ici, ex. "06 12 34 56 78" (vide = nom seul)
  }
};


/* ---------------------------------------------------------------------
   2. FORMATAGE
   --------------------------------------------------------------------- */

// 14 -> "14 €"   14.5 -> "14,50 €"   (  = espace insécable)
function formatPrix(nombre) {
  const texte = Number.isInteger(nombre)
    ? String(nombre)
    : nombre.toFixed(2).replace(".", ",");
  return texte + " €";
}

// "14:30" -> 870 (minutes depuis minuit)
function enMinutes(heure) {
  const morceaux = heure.split(":");
  return Number(morceaux[0]) * 60 + Number(morceaux[1]);
}

// 870 -> "14h30"   720 -> "12h"   1440 -> "minuit"
function formatHeure(minutes) {
  if (minutes === 1440) return "minuit";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h + "h" + (m ? String(m).padStart(2, "0") : "");
}

// Numéro "06 12 34 56 78" -> lien "tel:+33612345678"
function lienTel(numero) {
  const chiffres = numero.replace(/\D/g, "");
  return "tel:" + (chiffres.startsWith("0") ? "+33" + chiffres.slice(1) : chiffres);
}


/* ---------------------------------------------------------------------
   3. REMPLISSAGE DE LA PAGE
   Dans le HTML :
     <span data-prix="deux">18 €</span>        -> prix tiré de CONFIG.prix
     <span data-texte="midiHoraire">…</span>   -> texte calculé ci-dessous
     <p data-mention-exemple>Prix d'exemple</p> -> masqué si prixExemple = false
   --------------------------------------------------------------------- */

function textesCalcules() {
  const midi = CONFIG.midi;
  const dim = CONFIG.horaires.dimanche;
  const sem = CONFIG.horaires.semaine;
  const deux = CONFIG.prix.deux;

  return {
    midiJours:      midi.jours,
    midiHoraire:    "de " + formatHeure(enMinutes(midi.debut)) + " à " + formatHeure(enMinutes(midi.fin)),
    midiDebut:      formatHeure(enMinutes(midi.debut)),
    midiFin:        formatHeure(enMinutes(midi.fin)),
    midiCompris:    midi.compris,
    midiNonCompris: midi.nonCompris,
    brunchHoraire:  "de " + formatHeure(enMinutes(dim.ouverture)) + " à " + formatHeure(enMinutes(dim.fermeture)),
    brunchCompris:  CONFIG.brunch.compris,
    ouverture:      formatHeure(enMinutes(sem.ouverture)),
    apero:          formatHeure(enMinutes(CONFIG.horaires.apero)),
    // L'exemple d'addition : la réponse directe à "pourquoi j'ai payé 100 € ?"
    // (\u00a0 = espace insécable : le calcul ne se coupe pas en deux lignes)
    exemple: "À deux, entrée + plat chacun : 2\u00a0×\u00a0" + formatPrix(deux) +
             "\u00a0=\u00a0" + formatPrix(deux * 2) + ", hors boissons."
  };
}

function remplirPage() {
  // Prix
  document.querySelectorAll("[data-prix]").forEach(function (el) {
    const valeur = CONFIG.prix[el.dataset.prix];
    if (valeur !== undefined) el.textContent = formatPrix(valeur);
  });

  // Textes
  const textes = textesCalcules();
  document.querySelectorAll("[data-texte]").forEach(function (el) {
    const valeur = textes[el.dataset.texte];
    if (valeur !== undefined) el.textContent = valeur;
  });

  // Mention "Prix d'exemple"
  document.querySelectorAll("[data-mention-exemple]").forEach(function (el) {
    el.hidden = !CONFIG.prixExemple;
  });

  // Signature dans la barre de démo
  const p = CONFIG.proposition;
  document.querySelectorAll("[data-proposition]").forEach(function (el) {
    el.textContent = "Proposition de " + p.nom + (p.telephone ? ", " : "");
    if (p.telephone) {
      const lien = document.createElement("a");
      lien.href = lienTel(p.telephone);
      lien.textContent = p.telephone;
      el.appendChild(lien);
    }
  });
}


/* ---------------------------------------------------------------------
   4. STATUT OUVERT / FERMÉ (fuseau Europe/Paris)
   On demande l'heure de Paris à Intl.DateTimeFormat : le badge reste
   juste même si le téléphone est réglé sur un autre fuseau.
   --------------------------------------------------------------------- */

function heureDeParis() {
  const morceaux = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Paris",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(new Date());

  function lire(type) {
    return morceaux.find(function (m) { return m.type === type; }).value;
  }

  const numeroJour = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    jour: numeroJour[lire("weekday")],                         // 0 = dimanche
    minutes: (Number(lire("hour")) % 24) * 60 + Number(lire("minute"))
  };
}

// Plage d'ouverture d'un jour donné, en minutes
function plageDuJour(jour) {
  const h = jour === 0 ? CONFIG.horaires.dimanche : CONFIG.horaires.semaine;
  return { debut: enMinutes(h.ouverture), fin: enMinutes(h.fermeture) };
}

function calculerStatut() {
  const maintenant = heureDeParis();
  const plage = plageDuJour(maintenant.jour);
  const statut = { jour: maintenant.jour, minutes: maintenant.minutes };

  if (maintenant.minutes >= plage.debut && maintenant.minutes < plage.fin) {
    statut.ouvert = true;
    statut.texte = "Ouvert maintenant";
    statut.detail = plage.fin === 1440 ? "Jusqu'à minuit" : "Jusqu'à " + formatHeure(plage.fin);
  } else if (maintenant.minutes < plage.debut) {
    // Pas encore ouvert aujourd'hui (ex. il est 6h)
    statut.ouvert = false;
    statut.texte = "Fermé";
    statut.detail = "Ouverture à " + formatHeure(plage.debut);
  } else {
    // Déjà fermé : on annonce l'ouverture de demain
    const demain = plageDuJour((maintenant.jour + 1) % 7);
    statut.ouvert = false;
    statut.texte = "Fermé";
    statut.detail = "Ouverture demain à " + formatHeure(demain.debut);
  }
  return statut;
}

// Moment de la journée en cours (sert à la frise de la version C)
function periodeEnCours(statut) {
  if (!statut.ouvert) return null;
  if (statut.jour === 0) return "brunch";
  const m = statut.minutes;
  if (m < enMinutes(CONFIG.midi.debut)) return "matin";
  if (m < enMinutes(CONFIG.midi.fin)) return "midi";
  if (m < enMinutes(CONFIG.horaires.apero)) return "apresmidi";
  return "soir";
}

function afficherStatut() {
  const statut = calculerStatut();

  // Tous les badges de la page : <… data-statut> avec
  // <… data-statut-texte> et <… data-statut-detail> à l'intérieur
  document.querySelectorAll("[data-statut]").forEach(function (badge) {
    badge.dataset.etat = statut.ouvert ? "ouvert" : "ferme";
    const texte = badge.querySelector("[data-statut-texte]");
    const detail = badge.querySelector("[data-statut-detail]");
    if (texte) texte.textContent = statut.texte;
    if (detail) detail.textContent = statut.detail;
  });

  // Frise : on marque l'étape en cours avec la classe "est-maintenant"
  const periode = periodeEnCours(statut);
  document.querySelectorAll("[data-periode]").forEach(function (el) {
    const actif = el.dataset.periode === periode;
    el.classList.toggle("est-maintenant", actif);
    if (actif) el.setAttribute("aria-current", "time");
    else el.removeAttribute("aria-current");
  });
}


/* ---------------------------------------------------------------------
   DÉMARRAGE
   (le script est chargé avec "defer" : le HTML est déjà prêt)
   --------------------------------------------------------------------- */
remplirPage();
afficherStatut();

// Mise à jour chaque minute, calée sur le début de la minute suivante
setTimeout(function () {
  afficherStatut();
  setInterval(afficherStatut, 60 * 1000);
}, (60 - new Date().getSeconds()) * 1000);

// Quand on rallume le téléphone ou revient sur l'onglet : on recalcule
document.addEventListener("visibilitychange", function () {
  if (!document.hidden) afficherStatut();
});
