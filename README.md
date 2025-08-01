<p align="center">

<img src="https://github.com/homebridge/branding/raw/master/logos/homebridge-wordmark-logo-vertical.png" width="150">

</p>

[![npm](https://badgen.net/npm/v/@silviokennecke/homebridge-gpio-garage-door/latest?icon=npm&label)](https://www.npmjs.com/package/@silviokennecke/homebridge-gpio-garage-door)
[![npm](https://badgen.net/npm/dt/@silviokennecke/homebridge-gpio-garage-door?label=downloads)](https://www.npmjs.com/package/@silviokennecke/homebridge-gpio-garage-door)
[![release](https://badgen.net/github/release/silviokennecke/homebridge-gpio-garage-door)](https://github.com/silviokennecke/homebridge-gpio-garage-door/releases)
[![license](https://badgen.net/github/license/silviokennecke/homebridge-gpio-garage-door)](https://github.com/silviokennecke/homebridge-gpio-garage-door/blob/main/LICENSE)
[![lint & build](https://github.com/silviokennecke/homebridge-gpio-garage-door/actions/workflows/build.yml/badge.svg)](https://github.com/silviokennecke/homebridge-gpio-garage-door/actions/workflows/build.yml)

# Homebridge GPIO Garage Door with Auto-Close

Un plugin Homebridge pour contrôler une porte de garage via GPIO avec fonctionnalité de fermeture automatique.

## Fonctionnalités

- **Contrôle GPIO** : Utilise un seul pin GPIO pour ouvrir/fermer la porte
- **Fermeture automatique** : Fermeture automatique après un délai configurable
- **Réinitialisation de minuterie** : Chaque impulsion d'ouverture réinitialise la minuterie si la porte est déjà ouverte
- **Support HomeKit** : Intégration complète avec l'écosystème Apple Home
- **Webhook** : Support optionnel pour les webhooks
- **Entrée GPIO** : Lecture optionnelle de l'état de la porte via GPIO

## Installation

```bash
npm install -g @tomtom14z/homebridge-gpio-garage-door
```

## Configuration

Ajoutez la configuration suivante à votre `config.json` de Homebridge :

```json
{
  "accessories": [
    {
      "accessory": "GpioGarageDoor",
      "name": "Porte de Garage",
      "gpioPinOpen": 7,
      "emitTime": 500,
      "executionTime": 10,
      "autoCloseEnabled": true,
      "autoCloseDelay": 15,
      "openingDelay": 10,
      "allowCommandOverride": false,
      "reverseOutput": false
    }
  ]
}
```

## Paramètres de configuration

| Paramètre | Type | Requis | Défaut | Description |
|-----------|------|--------|--------|-------------|
| `name` | string | ✅ | - | Nom de l'accessoire dans HomeKit |
| `gpioPinOpen` | number | ✅ | - | Pin GPIO pour l'impulsion d'ouverture/fermeture |
| `emitTime` | number | ✅ | 500 | Durée de l'impulsion en millisecondes |
| `executionTime` | number | ❌ | 10 | Temps d'exécution de la porte en secondes |
| `autoCloseEnabled` | boolean | ❌ | false | Active la fermeture automatique |
| `autoCloseDelay` | number | ❌ | 15 | Délai avant fermeture automatique (secondes) |
| `openingDelay` | number | ❌ | 10 | Délai d'ouverture de la porte (secondes) |
| `allowCommandOverride` | boolean | ❌ | false | Permet d'ignorer les commandes pendant le mouvement |
| `reverseOutput` | boolean | ❌ | false | Inverse la logique de sortie GPIO |

### Paramètres optionnels avancés

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `gpioStateInputEnabled` | boolean | false | Active la lecture de l'état via GPIO |
| `gpioPinState` | number | - | Pin GPIO pour lire l'état de la porte |
| `gpioStateInputReverse` | boolean | false | Inverse la logique de lecture d'état |
| `webhookEnabled` | boolean | false | Active le support webhook |
| `webhookPort` | number | 8352 | Port du webhook |
| `webhookPath` | string | "/garage-door" | Chemin du webhook |
| `webhookJsonPath` | string | "$.value" | Chemin JSON pour l'état |
| `webhookJsonValueReverse` | boolean | false | Inverse la valeur JSON |

## Fonctionnement

### Fermeture automatique

1. **Ouverture** : Une impulsion sur le pin GPIO ouvre la porte
2. **Minuterie** : Si activée, une minuterie se déclenche après l'ouverture
3. **Réinitialisation** : Chaque nouvelle impulsion d'ouverture réinitialise la minuterie
4. **Fermeture** : Après le délai configuré, la porte se ferme automatiquement

### Logique de contrôle

- **Porte fermée + impulsion** → Ouverture + démarrage minuterie
- **Porte ouverte + impulsion** → Réinitialisation minuterie
- **Minuterie expirée** → Fermeture automatique

## Utilisation avec HomeKit

Une fois configuré, l'accessoire apparaîtra dans l'app Maison d'Apple avec les fonctionnalités suivantes :

- **Ouverture/fermeture** : Contrôle manuel de la porte
- **État** : Affichage de l'état actuel (ouvert/fermé/ouverture/fermeture)
- **Automatisation** : Possibilité de créer des automatisations basées sur l'état

## Développement

### Installation des dépendances

```bash
npm install
```

### Compilation

```bash
npm run build
```

### Développement en mode watch

```bash
npm run watch
```

## Licence

Apache-2.0

## Auteur

tomtom14z - [GitHub](https://github.com/tomtom14z)

## Support

Pour signaler des bugs ou demander des fonctionnalités, utilisez les [issues GitHub](https://github.com/tomtom14z/homebridge-gpio-garage-door/issues).
