# Projet d'Études B2 : Automatisation de la Configuration des VLANs

## Problématique

Comment automatiser et simplifier la création de VLAN à l’aide d’une application web sur Windows Server et les équipements Cisco ?

## Plan de la Présentation Orale

### Introduction

- Présentation du groupe
- Exposé de la problématique
- Répartition des tâches

### Partie 1 : Développement du Site Web

- **Technologies** : HTML, CSS, JavaScript, (Base de données optionnelle)
  - Fonctionnalités du découpage VLSM
  - Création des scripts
  - Intégration d'une base de données (optionnel)
  - Intégration avec Excel (optionnel)

### Partie 2 : Scripts de Configuration

- **Technologies** : PowerShell, Python, .txt, Windows Server, Réseau
  - Explication du code de configuration d’un serveur DHCP
  - Explication du code de configuration du routeur

### Partie 3 : Mise en Pratique

- Exécution du script sur Windows Server dans une VM
- Exécution du script sur un routeur physique
- Présentation des données Excel générées (optionnel)

### Conclusion

## Liste des Tâches à Réaliser

### Gestion du Projet

- [x] Créer un dépôt GitHub pour le projet - _Marc_
- [x] Inviter les autres contributeurs à collaborer - _Marc_
- [x] Élaborer un tableau de répartition des tâches - _Marc_
- [x] Mettre en place Linear ou ClickUp pour la gestion de projet - _Marc_

### Développement des Scripts

- [x] Élaborer une maquette du script PowerShell - _Martin_
- [x] Élaborer une maquette du script pour le routeur - _Marc_
- [x] Récupérations des résultats des sous-réseaux dans les variables en mémoire - _Adrien_
- [x] Générer un code pour créer un script PowerShell - _Adrien_
- [x] Générer un script Python pour configurer le routeur à partir du JS - _Marc_
- [x] Générer un code pour créer ou compléter un fichier PDF à partir du découpage VLSM - _Adrien_
- [x] Relier la codebase au fichier script*dhcp.js pour utiliser la création de script DHCP dans le site Web - \_Adrien*
- [x] Relier la codebase au fichier script*router_pyserial.js pour utiliser la création de script Router dans le site Web - \_Marc*

### Infrastructure et Tests

- [x] Créer une VM sur l’ordinateur du présentateur - _Martin_
- [x] Emprunter un routeur physique pour tester les commandes et préparer la démonstration - _Martin_
- [x] Test sur le routeur physique - _Marc_
- [x] Test sur la VM pour vérifier que le script DHCP - _Martin_
- [x] Déploiement du site web grâce à Vercel - _Marc_

### Présentation et Documentation

- [x] Créer et commencer le PowerPoint de présentation - _Adrien_

## Technologies Utilisées

- **Frontend** : HTML, CSS, JavaScript
- **Backend** : PowerShell, Python
- **Base de données** : MySQL | MongoDB (optionnel)
- **Systèmes** : Windows Server, équipements Cisco

<a href="https://www.w3.org/html/" target="_blank" rel="noreferrer">
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/html5/html5-original-wordmark.svg" alt="html5" width="40" height="40" border="0"/>
</a>
<a href="https://www.w3schools.com/css/" target="_blank" rel="noreferrer">
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/css3/css3-original-wordmark.svg" alt="css3" width="40" height="40" border="0"/>
</a>
<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript" target="_blank" rel="noreferrer">
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/javascript/javascript-original.svg" alt="javascript" width="40" height="40" border="0"/>
</a>
<a href="https://www.python.org" target="_blank" rel="noreferrer">
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/python/python-original.svg" alt="python" width="40" height="40" border="0"/>
</a>
<a href="https://docs.microsoft.com/en-us/powershell/" target="_blank" rel="noreferrer">
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/powershell/powershell-original.svg" alt="powershell" width="40" height="40" border="0"/>
</a>
<a href="https://www.microsoft.com/en-us/evalcenter/evaluate-windows-server" target="_blank" rel="noreferrer">
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/windows8/windows8-original.svg" alt="windows server" width="40" height="40" border="0"/>
</a>
<a href="https://www.cisco.com/site/fr/fr/index.html" target="_blank" rel="noreferrer">
  <img src="https://upload.wikimedia.org/wikipedia/commons/0/08/Cisco_logo_blue_2016.svg" alt="cisco" width="40" height="40" border="0"/>
</a>

## Installation et Dépendances

### Prérequis

Avant d’exécuter le projet, assurez-vous d’avoir installé :

- Python 3.x
- pip (gestionnaire de paquets Python)
- Un environnement réseau avec un routeur Cisco (physique ou simulé avec GNS3 ou Packet Tracer)

### Installation du Projet

1. Clonez le dépôt GitHub :

   ```sh
   git clone https://github.com/marc-awad/projet-etude-b2.git
   cd projet-etude-b2
   ```

2. Installez les dépendances requises avec :

   ```sh
   pip install -r requirements.txt
   ```

3. Exécutez le script Python pour configurer le routeur une fois le découpage fait:
   ```sh
   python config-router.py
   ```

## Comment Contribuer ?

1. Forker le dépôt
2. Cloner le projet : `git clone https://github.com/marc-awad/projet-etude-b2`
3. Créer une branche : `git checkout -b feature-name`
4. Ajouter vos modifications : `git add .`
5. Committer vos modifications : `git commit -m "Ajout d'une nouvelle fonctionnalité"`
6. Pousser la branche : `git push origin feature-name`
7. Créer une pull request

## Contact

Pour toute question ou suggestion, merci de contacter le groupe de projet à l'adresse suivante : marc.awad@supdevinci-edu.fr.
