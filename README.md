<p align="center">

<img src="https://github.com/homebridge/branding/raw/master/logos/homebridge-wordmark-logo-vertical.png" width="150">

</p>

[![npm](https://badgen.net/npm/v/@silviokennecke/homebridge-gpio-garage-door/latest?icon=npm&label)](https://www.npmjs.com/package/@silviokennecke/homebridge-gpio-garage-door)
[![npm](https://badgen.net/npm/dt/@silviokennecke/homebridge-gpio-garage-door?label=downloads)](https://www.npmjs.com/package/@silviokennecke/homebridge-gpio-garage-door)
[![release](https://badgen.net/github/release/silviokennecke/homebridge-gpio-garage-door)](https://github.com/silviokennecke/homebridge-gpio-garage-door/releases)
[![license](https://badgen.net/github/license/silviokennecke/homebridge-gpio-garage-door)](https://github.com/silviokennecke/homebridge-gpio-garage-door/blob/main/LICENSE)
[![lint & build](https://github.com/silviokennecke/homebridge-gpio-garage-door/actions/workflows/build.yml/badge.svg)](https://github.com/silviokennecke/homebridge-gpio-garage-door/actions/workflows/build.yml)

# Homebridge GPIO Garage Door with Auto-Close

Plugin Homebridge pour contrôler une porte de garage via GPIO avec fermeture automatique et temporisation virtuelle.

## Fonctionnalités

- Contrôle d'une porte de garage via GPIO
- Fermeture automatique configurable
- **Nouveau : Temporisation virtuelle d'ouverture** - maintient la porte ouverte en envoyant périodiquement des signaux d'ouverture
- Support des webhooks pour l'intégration externe
- Entrée GPIO pour détecter l'état de la porte
- Persistance de l'état entre les redémarrages

## Installation

```bash
npm install -g @tomtom14z/homebridge-gpio-garage-door
```

## Configuration

### Configuration de base

```json
{
  "accessories": [
    {
      "accessory": "GpioGarageDoor",
      "name": "Porte de Garage",
      "gpioPinOpen": 7,
      "gpioPinClose": 7,
      "emitTime": 500,
      "executionTime": 10,
      "openingDelay": 10
    }
  ]
}
```

### Configuration avec fermeture automatique

```json
{
  "accessories": [
    {
      "accessory": "GpioGarageDoor",
      "name": "Porte de Garage",
      "gpioPinOpen": 7,
      "emitTime": 500,
      "executionTime": 10,
      "openingDelay": 10,
      "autoCloseEnabled": true,
      "autoCloseDelay": 15,
      "virtualOpeningDelay": 50
    }
  ]
}
```

## Paramètres

### Paramètres obligatoires

- `name` : Nom de l'accessoire dans HomeKit
- `gpioPinOpen` : Pin GPIO pour le signal d'ouverture

### Paramètres optionnels

- `gpioPinClose` : Pin GPIO pour le signal de fermeture (masqué si `autoCloseEnabled` est activé)
- `emitTime` : Durée en millisecondes du signal GPIO (défaut: 500)
- `executionTime` : Temps d'exécution de la porte en secondes (défaut: 10)
- `openingDelay` : Délai avant de considérer la porte comme ouverte en secondes (défaut: 10)

### Paramètres de fermeture automatique

- `autoCloseEnabled` : Active la fermeture automatique (défaut: false)
- `autoCloseDelay` : Délai avant fermeture automatique en secondes (défaut: 15, min: 1, max: 300)
- `virtualOpeningDelay` : **Nouveau** - Temporisation virtuelle d'ouverture en secondes (défaut: 0, min: 0, max: 600)

### Paramètres avancés

- `allowCommandOverride` : Permet d'envoyer une nouvelle commande pendant l'exécution (défaut: false)
- `reverseOutput` : Inverse la logique du signal GPIO (défaut: false)
- `gpioStateInputEnabled` : Active la lecture de l'état via GPIO (défaut: false)
- `gpioPinState` : Pin GPIO pour lire l'état de la porte
- `gpioStateInputReverse` : Inverse la logique de lecture d'état (défaut: false)

### Paramètres webhook

- `webhookEnabled` : Active le serveur webhook (défaut: false)
- `webhookPort` : Port du serveur webhook (défaut: 8352)
- `webhookPath` : Chemin du webhook (défaut: "/garage-door")
- `webhookJsonPath` : Chemin JSON pour extraire l'état (défaut: "$.value")
- `webhookJsonValueReverse` : Inverse la valeur JSON (défaut: false)

## Fonctionnalité de temporisation virtuelle

La **temporisation virtuelle d'ouverture** est une fonctionnalité avancée qui permet de maintenir la porte ouverte plus longtemps que la temporisation physique de la porte.

### Comment ça fonctionne

1. **Temporisation physique** : La porte se ferme automatiquement après `autoCloseDelay` secondes (ex: 15 secondes)
2. **Temporisation virtuelle** : Si `virtualOpeningDelay` est supérieur à `autoCloseDelay`, le plugin maintient la porte ouverte en envoyant périodiquement des signaux d'ouverture
3. **Signaux périodiques** : Toutes les 10 secondes, un signal d'ouverture est envoyé pour réinitialiser la temporisation physique
4. **Arrêt automatique** : La temporisation virtuelle s'arrête après `virtualOpeningDelay` secondes

### Exemple d'utilisation

```json
{
  "autoCloseEnabled": true,
  "autoCloseDelay": 15,        // La porte se ferme physiquement après 15s
  "virtualOpeningDelay": 50    // Le plugin maintient la porte ouverte 50s
}
```

Dans cet exemple :
- La porte s'ouvre
- Après 10 secondes, elle est considérée comme ouverte
- Après 15 secondes, elle se fermerait physiquement
- Mais le plugin envoie un signal d'ouverture toutes les 10 secondes pour la maintenir ouverte
- Après 50 secondes, le plugin arrête d'envoyer des signaux et la porte se ferme

### Cas d'usage

Cette fonctionnalité est particulièrement utile pour :
- Les portes de garage avec temporisation physique courte
- Les situations où vous voulez garder la porte ouverte plus longtemps
- L'intégration avec des systèmes de sécurité ou de surveillance
- Les environnements où la porte doit rester ouverte pour des opérations prolongées

## Utilisation

### Via HomeKit

1. Ajoutez l'accessoire à Homebridge
2. La porte apparaîtra dans l'app Maison d'Apple
3. Utilisez l'app pour ouvrir/fermer la porte
4. La fermeture automatique se déclenchera selon la configuration

### Via webhook (si activé)

```bash
curl -X POST http://localhost:8352/garage-door \
  -H "Content-Type: application/json" \
  -d '{"value": true}'
```

## Développement

### Compilation

```bash
npm run build
```

### Développement en mode watch

```bash
npm run watch
```

### Linting

```bash
npm run lint
```

## Licence

Apache-2.0

## Support

Pour signaler des bugs ou demander des fonctionnalités, utilisez les [issues GitHub](https://github.com/tomtom14z/homebridge-gpio-garage-door/issues).
