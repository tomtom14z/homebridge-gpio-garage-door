# Release Notes - v2.1.0

## 🎉 Nouvelle fonctionnalité majeure : Temporisation virtuelle d'ouverture

### ✨ Quoi de neuf ?

**Temporisation virtuelle d'ouverture** - Une fonctionnalité révolutionnaire qui permet de maintenir votre porte de garage ouverte plus longtemps que sa temporisation physique !

### 🔧 Comment ça fonctionne ?

1. **Temporisation physique** : Votre porte se ferme automatiquement après 15 secondes (configurable)
2. **Temporisation virtuelle** : Le plugin maintient la porte ouverte en envoyant périodiquement des signaux d'ouverture
3. **Signaux intelligents** : Toutes les 10 secondes, un signal d'ouverture réinitialise la temporisation physique
4. **Arrêt automatique** : Après la durée configurée, le plugin arrête d'envoyer des signaux

### 📝 Exemple d'utilisation

```json
{
  "autoCloseEnabled": true,
  "autoCloseDelay": 15,        // La porte se ferme physiquement après 15s
  "virtualOpeningDelay": 50    // Le plugin maintient la porte ouverte 50s
}
```

**Résultat** : Votre porte reste ouverte 50 secondes au lieu de 15 !

### 🎯 Cas d'usage

- **Portes avec temporisation courte** : Gardez la porte ouverte plus longtemps
- **Opérations prolongées** : Chargement/déchargement, travaux, etc.
- **Intégration sécurité** : Synchronisation avec systèmes de surveillance
- **Confort utilisateur** : Plus besoin de se précipiter !

### 🛠️ Améliorations techniques

- **Interface simplifiée** : Le pin de fermeture disparaît automatiquement en mode auto-close
- **Gestion des timers** : Nouveaux timers pour la temporisation virtuelle
- **Logs détaillés** : Messages de débogage pour suivre le fonctionnement
- **Performance optimisée** : Impact minimal sur les ressources

### 📚 Documentation

- **README complet** : Exemples détaillés et cas d'usage
- **Documentation technique** : Implémentation et architecture
- **Exemple de configuration** : Fichier de configuration prêt à l'emploi

### 🔗 Liens utiles

- [Documentation complète](https://github.com/tomtom14z/homebridge-gpio-garage-door#readme)
- [Issues GitHub](https://github.com/tomtom14z/homebridge-gpio-garage-door/issues)
- [Changelog complet](https://github.com/tomtom14z/homebridge-gpio-garage-door/blob/master/CHANGELOG.md)

---

**Mettez à jour dès maintenant pour profiter de cette nouvelle fonctionnalité !** 🚀 