# LebensHelper Alltagsbegleitung — site vitrine

Site d'une activité d'accompagnement de seniors à Wuppertal, Solingen, Remscheid
et environs. Offre reconnue au titre du § 45a SGB XI (Rhénanie-du-Nord-Westphalie).

**En ligne :** https://alltagsbegleitunglebenshelper.com

---

## Caractéristiques techniques

Site **statique** — HTML, CSS et JavaScript natif. Aucun framework, aucune
dépendance, aucune étape de compilation. Il suffit de déposer les fichiers chez
un hébergeur.

- **Navigation par pages** : chaque rubrique s'affiche seule, sans défilement.
  Gérée par l'ancre d'URL, le bouton Retour du navigateur fonctionne.
  Sans JavaScript, le site redevient une page longue et reste entièrement lisible.
- **Responsive** : 5 paliers (1200 / 1024 / 768 / 560 / 380 px).
- **Accessibilité** : réglage de la taille du texte, mode contraste élevé,
  mémorisés localement. Repères ARIA, focus géré aux changements de page,
  respect de `prefers-reduced-motion`.
- **Aucun tiers** : polices hébergées localement, pas de Google Fonts, pas de
  cookies, pas d'analyse d'audience, pas de pixel publicitaire. Aucune donnée
  de visiteur ne quitte le serveur.
- **Sécurité** : CSP stricte sans `unsafe-inline`, HSTS, protection contre le
  clickjacking, listage de répertoires désactivé (voir `.htaccess`).

## Structure

```
index.html         page principale (toutes les rubriques)
impressum.html     mentions légales (obligatoire en Allemagne)
datenschutz.html   protection des données (RGPD)
404.html           page d'erreur
style.css          mise en forme + design system
fonts.css          déclaration @font-face des polices locales
fonts/             18 fichiers woff2 (latin, latin-ext)
app.js             navigation, calculateur, formulaire, accessibilité
.htaccess          en-têtes de sécurité, HTTPS, cache (Apache uniquement)
server.ps1         serveur de test local, ne pas déployer
```

## Développement local

```powershell
.\server.ps1
```
puis ouvrir http://localhost:8080

## Maintenance courante

**Montants de la Pflegekasse** — centralisés en haut de `app.js`, dans
`PFLEGE_BETRAEGE`. Modifier les chiffres et le champ `stand` ; toute la page
se met à jour. Le tableau récapitulatif de la page Finanzierung est en dur
dans `index.html` et doit être corrigé en parallèle.

**Coordonnées** — objet `KONTAKT` en haut de `app.js`, et en dur dans le HTML
(pied de page, page contact, pages légales).

**Couleurs** — variables CSS dans `:root`, en tête de `style.css`.

## Déploiement

Le site est hébergé sur **Vercel**, connecté à ce dépôt GitHub.
**Chaque `git push` sur `main` déclenche un redéploiement automatique**
en environ une minute. Aucun transfert FTP n'est nécessaire.

```
git add -A
git commit -m "description du changement"
git push
```

- Domaine : `alltagsbegleitunglebenshelper.com` (registrar : Checkdomain)
- DNS : enregistrement A vers l'IP de Vercel. Les enregistrements **MX
  restent chez Checkdomain** pour la messagerie — ne jamais y toucher.
- Certificat SSL : émis et renouvelé automatiquement par Vercel

### Configuration selon l'hébergeur

| Fichier | Utilisé par | Rôle |
|---|---|---|
| `vercel.json` | **Vercel (actuel)** | en-têtes de sécurité, cache, redirections |
| `.htaccess` | Apache (Checkdomain…) | équivalent, **ignoré par Vercel** |
| `.vercelignore` | Vercel | exclut `server.ps1`, `.htaccess`, `README.md` |

Les deux configurations sont conservées : en cas de retour vers un hébergement
Apache, `.htaccess` reprend son rôle. **Toute modification des en-têtes de
sécurité doit être répercutée dans les deux fichiers.**

⚠️ Sur un hébergement Apache, ne pas déposer `.htaccess` avant que le
certificat SSL soit actif : il force HTTPS et active HSTS.

## Licence

Code et contenus © Serge Raoul Foadjo Fotso. Tous droits réservés.
Les polices Plus Jakarta Sans et Outfit sont sous SIL Open Font License 1.1.
