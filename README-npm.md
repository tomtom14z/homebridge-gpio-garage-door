# Homebridge GPIO Garage Door with Auto-Close

Plugin Homebridge pour contrôler une porte de garage via GPIO avec fermeture automatique et **temporisation virtuelle d'ouverture**.

## 🆕 Nouveautés v2.1.0

### ✨ Temporisation virtuelle d'ouverture
- **Maintien de la porte ouverte** : Gardez votre porte ouverte plus longtemps que sa temporisation physique
- **Signaux périodiques** : Envoi automatique de signaux d'ouverture toutes les 10 secondes
- **Configuration flexible** : Temporisation virtuelle de 0 à 600 secondes
- **Interface simplifiée** : Le pin de fermeture disparaît automatiquement en mode auto-close

## 🚀 Installation

```bash
npm install -g @tomtom14z/homebridge-gpio-garage-door
```

## ⚙️ Configuration rapide

```json
{
  "accessory": "GpioGarageDoor",
  "name": "Porte de Garage",
  "gpioPinOpen": 7,
  "autoCloseEnabled": true,
  "autoCloseDelay": 15,
  "virtualOpeningDelay": 50
}
```

## 🎯 Fonctionnalités principales

- ✅ **Contrôle GPIO** : Utilise un seul pin pour ouvrir/fermer
- ✅ **Fermeture automatique** : Fermeture après délai configurable
- ✅ **Temporisation virtuelle** : Maintien ouvert plus longtemps que la temporisation physique
- ✅ **Intégration HomeKit** : Contrôle via l'app Maison d'Apple
- ✅ **Webhooks** : Support pour intégrations externes
- ✅ **Entrée GPIO** : Détection d'état de la porte
- ✅ **Persistance** : État sauvegardé entre redémarrages

## 🔧 Exemple avancé

```json
{
  "accessory": "GpioGarageDoor",
  "name": "Porte de Garage Principale",
  "gpioPinOpen": 7,
  "emitTime": 500,
  "executionTime": 10,
  "openingDelay": 10,
  "autoCloseEnabled": true,
  "autoCloseDelay": 15,        // Fermeture physique après 15s
  "virtualOpeningDelay": 50,   // Maintien ouvert pendant 50s
  "allowCommandOverride": false,
  "reverseOutput": false
}
```

## 📖 Documentation complète

- [README complet](https://github.com/tomtom14z/homebridge-gpio-garage-door#readme)
- [Documentation technique](https://github.com/tomtom14z/homebridge-gpio-garage-door/blob/master/TECHNICAL.md)
- [Changelog](https://github.com/tomtom14z/homebridge-gpio-garage-door/blob/master/CHANGELOG.md)

## 🐛 Support

- **Issues** : [GitHub Issues](https://github.com/tomtom14z/homebridge-gpio-garage-door/issues)
- **Repository** : [GitHub](https://github.com/tomtom14z/homebridge-gpio-garage-door)

## 📄 Licence

Apache-2.0 