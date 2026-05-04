# mini-panam

Extension GNOME Shell qui affiche les deux prochaines arrivées de métro, RER, tramway, Transilien ou bus du réseau de transports en commun d'Île-de-France, récupérées via l'API PRIM d'Île-de-France Mobilités.

## Fonctionnalités

- Affichage des 2 prochains passages à l'arrêt sélectionné
- Mise à jour automatique (toutes les 10 secondes)
- Menu de configuration intégré (clic sur l'icône)
- Support d'un token API personnel (optionnel)
- Veille automatique après 5 minutes d'inactivité (survol pour réactiver)

## Installation

### GNOME 45-48

``mv mini-panam@monsieur_ouiplala ~/.local/share/gnome-shell/extensions/
sudo cp ~/.local/share/gnome-shell/extensions/mini-panam@monsieur_ouiplala/schemas/*.gschema.xml /usr/share/glib-2.0/schemas/
sudo glib-compile-schemas /usr/share/glib-2.0/schemas/
gnome-extensions enable mini-panam@monsieur_ouiplala``

Redémarrez GNOME Shell (Alt+F2 -> ``r`` -> Entrée sous Xorg) ou déconnectez-vous.

### GNOME 49-50

``mv mini-panam@monsieur_ouiplala ~/.local/share/gnome-shell/extensions/
sudo cp ~/.local/share/gnome-shell/extensions/mini-panam@monsieur_ouiplala/schemas/*.gschema.xml /usr/share/glib-2.0/schemas/
mkdir -p ~/.local/share/glib-2.0/schemas/
cp ~/.local/share/gnome-shell/extensions/mini-panam@monsieur_ouiplala/schemas/*.gschema.xml ~/.local/share/glib-2.0/schemas/
sudo glib-compile-schemas /usr/share/glib-2.0/schemas/
glib-compile-schemas ~/.local/share/glib-2.0/schemas/
gnome-extensions enable mini-panam@monsieur_ouiplala``

Redémarrez GNOME Shell (Alt+F2 -> ``r`` -> Entrée sous Xorg) ou déconnectez-vous.

## Configuration
- Cliquez sur l'icône -- | -- dans la barre supérieure (**l'icône est très transparente, presque invisible en luminosité réduite !**)
- Entrez l'ID de votre arrêt (plus d'informations en cliquant sur l'icône ``?`` à côté du champ de texte)
- (Optionnel) Entrez votre token PRIM personnel

## Token PRIM
L'extension utilise un token public par défaut, limité par l'API. Pour un usage intensif ou plus fiable, créez gratuitement votre propre token sur https://prim.iledefrance-mobilites.fr/.

## Compatibilité
L'extension est normalement compatible sous GNOME 45, 46, 47, 48, 49 et 50.

Testée sous Debian 13 (GNOME 48) et Fedora 44 (GNOME 50).
