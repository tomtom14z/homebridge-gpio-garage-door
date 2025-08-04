# Changelog

## [2.1.0] - 2024-12-19

### Ajouté
- **Temporisation virtuelle d'ouverture** : Nouvelle fonctionnalité permettant de maintenir la porte ouverte plus longtemps que la temporisation physique en envoyant périodiquement des signaux d'ouverture
- **Paramètre `virtualOpeningDelay`** : Configuration de la durée de la temporisation virtuelle (0-600 secondes)
- **Masquage conditionnel du pin de fermeture** : Le paramètre `gpioPinClose` est masqué dans l'interface quand `autoCloseEnabled` est activé
- **Documentation technique complète** : Fichier `TECHNICAL.md` détaillant l'implémentation
- **Exemple de configuration** : Fichier `example-config.json` montrant l'utilisation des nouvelles fonctionnalités

### Modifié
- **Interface de configuration** : Ajout du paramètre `virtualOpeningDelay` avec conditions d'affichage
- **Logique de temporisation** : Intégration de la temporisation virtuelle avec la fermeture automatique existante
- **Gestion des timers** : Ajout de nouveaux timers pour la temporisation virtuelle
- **Documentation** : Mise à jour complète du README avec exemples et cas d'usage

### Technique
- **Nouveaux timers** : `virtualOpeningTimer` et `virtualOpeningInterval`
- **Nouvelles méthodes** : `startVirtualOpeningTimer()`, `cancelVirtualOpeningTimer()`, `cancelVirtualOpeningInterval()`
- **Gestion des états** : Amélioration de la gestion des transitions d'état avec la temporisation virtuelle
- **Logs** : Ajout de messages de log pour le débogage de la temporisation virtuelle

### Fonctionnement de la temporisation virtuelle
1. **Temporisation physique** : La porte se ferme automatiquement après `autoCloseDelay` secondes
2. **Temporisation virtuelle** : Si `virtualOpeningDelay > autoCloseDelay`, le plugin maintient la porte ouverte
3. **Signaux périodiques** : Envoi d'un signal d'ouverture toutes les 10 secondes pour réinitialiser la temporisation physique
4. **Arrêt automatique** : La temporisation virtuelle s'arrête après `virtualOpeningDelay` secondes

### Exemple d'utilisation
```json
{
  "autoCloseEnabled": true,
  "autoCloseDelay": 15,        // Fermeture physique après 15s
  "virtualOpeningDelay": 50    // Maintien ouvert pendant 50s
}
```

## [2.0.0] - Version précédente

### Fonctionnalités existantes
- Contrôle GPIO d'une porte de garage
- Fermeture automatique configurable
- Support des webhooks
- Entrée GPIO pour détecter l'état
- Persistance de l'état
- Intégration HomeKit complète 