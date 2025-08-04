# Documentation Technique - Homebridge GPIO Garage Door

## Architecture

Le plugin est composé d'une classe principale `GpioGarageDoorAccessory` qui implémente l'interface `AccessoryPlugin` de Homebridge.

### Structure des fichiers

```
src/
├── accessory.ts      # Classe principale de l'accessoire
├── index.ts         # Point d'entrée du plugin
└── settings.ts      # Constantes et configuration
```

## Implémentation de la temporisation virtuelle

### Nouveaux timers ajoutés

```typescript
private virtualOpeningTimer?: ReturnType<typeof setTimeout>;
private virtualOpeningInterval?: ReturnType<typeof setInterval>;
```

### Logique de fonctionnement

1. **Démarrage de la temporisation virtuelle** : Appelé depuis `startAutoCloseTimer()`
2. **Vérification des conditions** : Seulement si `virtualOpeningDelay > autoCloseDelay`
3. **Timer principal** : `virtualOpeningTimer` pour arrêter la temporisation
4. **Intervalle périodique** : `virtualOpeningInterval` pour envoyer les signaux

### Méthodes implémentées

#### `startVirtualOpeningTimer()`

```typescript
private startVirtualOpeningTimer(): void {
  this.cancelVirtualOpeningTimer();

  const virtualDelay = this.config.virtualOpeningDelay || 0;
  const physicalDelay = this.config.autoCloseDelay || 15;

  if (virtualDelay > 0 && virtualDelay > physicalDelay) {
    const totalVirtualTime = virtualDelay * 1000;
    const intervalTime = 10 * 1000; // 10 secondes entre chaque signal

    // Timer principal pour arrêter la temporisation virtuelle
    this.virtualOpeningTimer = setTimeout(() => {
      this.log.info('Virtual opening timer expired, stopping periodic open signals');
      this.cancelVirtualOpeningInterval();
    }, totalVirtualTime);

    // Intervalle pour envoyer périodiquement le signal d'ouverture
    this.virtualOpeningInterval = setInterval(() => {
      this.log.debug('Sending periodic open signal to maintain door open');
      this.setGpio(this.config.gpioPinOpen, this.pinHigh);
      setTimeout(() => {
        this.setGpio(this.config.gpioPinOpen, !this.pinHigh);
      }, this.config.emitTime);
    }, intervalTime);
  }
}
```

#### `cancelVirtualOpeningTimer()`

```typescript
private cancelVirtualOpeningTimer(): void {
  if (this.virtualOpeningTimer) {
    clearTimeout(this.virtualOpeningTimer);
    this.virtualOpeningTimer = undefined;
    this.log.debug('Virtual opening timer cancelled');
  }
  this.cancelVirtualOpeningInterval();
}
```

#### `cancelVirtualOpeningInterval()`

```typescript
private cancelVirtualOpeningInterval(): void {
  if (this.virtualOpeningInterval) {
    clearInterval(this.virtualOpeningInterval);
    this.virtualOpeningInterval = undefined;
    this.log.debug('Virtual opening interval cancelled');
  }
}
```

## Modifications du schéma de configuration

### Nouveau paramètre ajouté

```json
{
  "virtualOpeningDelay": {
    "title": "Virtual opening delay (seconds)",
    "description": "If set higher than the physical auto-close delay, the door will be kept open by sending periodic open signals. Set to 0 to disable.",
    "type": "number",
    "default": 0,
    "minimum": 0,
    "maximum": 600,
    "condition": {
      "functionBody": "return model.autoCloseEnabled === true;"
    }
  }
}
```

### Condition pour masquer le pin de fermeture

```json
{
  "gpioPinClose": {
    "condition": {
      "functionBody": "return model.autoCloseEnabled !== true;"
    }
  }
}
```

## Gestion des états

### États HomeKit

- `CLOSED` : Porte fermée
- `OPENING` : Porte en cours d'ouverture
- `OPEN` : Porte ouverte
- `CLOSING` : Porte en cours de fermeture

### Transitions d'état

1. **Ouverture** : `CLOSED` → `OPENING` → `OPEN`
2. **Fermeture** : `OPEN` → `CLOSING` → `CLOSED`
3. **Fermeture automatique** : `OPEN` → `CLOSING` → `CLOSED` (après délai)

## Gestion des timers

### Timer d'ouverture (`openingDelayTimeout`)

- Déclenché lors de l'ouverture
- Durée : `openingDelay` secondes
- Action : Change l'état de `OPENING` à `OPEN`

### Timer de fermeture automatique (`autoCloseTimeout`)

- Déclenché quand la porte est ouverte
- Durée : `autoCloseDelay` secondes
- Action : Ferme automatiquement la porte

### Timer de temporisation virtuelle (`virtualOpeningTimer`)

- Déclenché en même temps que le timer de fermeture automatique
- Durée : `virtualOpeningDelay` secondes
- Action : Arrête l'envoi de signaux périodiques

### Intervalle de signaux périodiques (`virtualOpeningInterval`)

- Déclenché en même temps que le timer de temporisation virtuelle
- Fréquence : Toutes les 10 secondes
- Action : Envoie un signal d'ouverture pour maintenir la porte ouverte

## Gestion des événements externes

### `externalStateChange()`

Cette méthode est appelée quand l'état de la porte change via :
- GPIO input (si activé)
- Webhook (si activé)

Elle annule tous les timers appropriés selon le nouvel état.

### `setTargetDoorState()`

Cette méthode gère les commandes d'ouverture/fermeture et :
- Annule les timers de temporisation virtuelle lors de l'ouverture
- Annule les timers de temporisation virtuelle lors de la fermeture
- Démarre les timers appropriés

## Logs et débogage

### Messages de log ajoutés

- `Starting virtual opening timer for Xs`
- `Virtual opening timer expired, stopping periodic open signals`
- `Sending periodic open signal to maintain door open`
- `Virtual opening timer cancelled`
- `Virtual opening interval cancelled`

### Niveaux de log

- `debug` : Informations détaillées pour le débogage
- `info` : Informations importantes sur le fonctionnement
- `error` : Erreurs et problèmes

## Tests et validation

### Scénarios de test

1. **Temporisation virtuelle désactivée** (`virtualOpeningDelay = 0`)
   - Comportement normal avec fermeture automatique

2. **Temporisation virtuelle inférieure à la temporisation physique**
   - Comportement normal avec fermeture automatique

3. **Temporisation virtuelle supérieure à la temporisation physique**
   - Maintien de la porte ouverte avec signaux périodiques

4. **Annulation manuelle de la temporisation**
   - Arrêt des signaux périodiques lors de la fermeture manuelle

### Validation des paramètres

- `virtualOpeningDelay` : 0-600 secondes
- `autoCloseDelay` : 1-300 secondes
- Condition : `virtualOpeningDelay` n'apparaît que si `autoCloseEnabled = true`

## Performance et ressources

### Utilisation mémoire

- Timers : 2 timers maximum (auto-close + virtual opening)
- Intervalles : 1 intervalle maximum (signaux périodiques)
- Nettoyage automatique lors des changements d'état

### Utilisation CPU

- Signaux périodiques : Toutes les 10 secondes
- Impact minimal sur les performances

## Sécurité

### Validation des entrées

- Vérification des valeurs numériques
- Limites min/max sur les délais
- Conditions d'affichage dans l'interface

### Gestion des erreurs

- Try/catch sur les opérations GPIO
- Logs d'erreur appropriés
- Récupération gracieuse en cas de problème 