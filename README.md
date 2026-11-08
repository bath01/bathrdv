# BATHRDV

Application simple de prise de rendez-vous en ligne, inspirée de Cal.com.

- Types de rendez-vous (durée, lieu, lien public `/mon-lien`)
- Horaires hebdomadaires et jours fermés (congés, jours fériés)
- Règles : délai minimum, pause entre deux RDV, réservation jusqu'à N jours
- Page de réservation avec calendrier et créneaux libres en temps réel
- Page de confirmation : ajout à Google Agenda ou .ics, annulation par le client
- Tableau de bord admin : statistiques, prochain RDV, appel et WhatsApp en un clic
- Espace admin protégé par mot de passe (un seul utilisateur)

Adapté à la Côte d'Ivoire :

- Prix en FCFA et acompte par Mobile Money (Wave, Orange Money, MTN MoMo, Moov Money)
- Rappels et récapitulatifs WhatsApp en un clic (messages pré-remplis)
- Pause déjeuner dans les horaires
- Jours fériés ivoiriens ajoutés en un clic
- Rendez-vous à domicile avec commune d'Abidjan et quartier / repère
- Suivi des présences et absences, fiche clients avec clients fidèles

Stack : Next.js 16, Prisma 7, PostgreSQL, Tailwind CSS 4.

## Démarrer en local

Prérequis : Node.js 20+, Docker.

```bash
cp .env.example .env          # puis remplir les valeurs
docker compose up -d          # PostgreSQL (port 5434)
npm install
npm run db:migrate            # crée les tables
npm run db:seed               # données minimales
npm run db:demo               # OU démo complète (efface toutes les données !)
npm run dev
```

- Site : http://localhost:3000
- Admin : http://localhost:3000/admin (mot de passe = `ADMIN_PASSWORD`)

## Structure

```
prisma/schema.prisma        Modèles : EventType, Availability, Booking
src/lib/slots.ts            Calcul des créneaux libres
src/lib/auth.ts             Connexion admin (cookie signé)
src/lib/settings.ts         Règles de réservation
src/app/[slug]/             Page de réservation publique
src/app/admin/              Espace admin
```

## Personnaliser

- Couleurs : variables CSS dans `src/app/globals.css` (`--blue`, `--slate`, etc.)
- Logo : `public/logo.png`, `public/logo-icon.png`, `src/app/icon.png`
- Fuseau horaire : `APP_TIMEZONE` dans `.env`

## Production avec Docker

L'application, les migrations et PostgreSQL tournent dans des conteneurs.

```bash
cp .env.docker.example .env.docker   # puis mettre des mots de passe forts
docker compose -f docker-compose.prod.yml --env-file .env.docker up -d --build
```

- Le service `migrate` applique les migrations, puis l'app démarre.
- Le cookie admin est `Secure` en production : en ligne, servez le site en HTTPS (sinon la connexion admin échoue). `localhost` fonctionne sans HTTPS.
- Données de démo (efface tout !) : `docker compose -f docker-compose.prod.yml --env-file .env.docker run --rm migrate npm run db:demo`
