import {
  AccessoryPlugin,
  API,
  Logger,
} from 'homebridge';
import storage from 'node-persist';
import GPIO from 'rpi-gpio';
import {AccessoryConfig} from 'homebridge/lib/bridgeService';
import * as http from 'node:http';
import * as jp from 'jsonpath-plus';

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class GpioGarageDoorAccessory implements AccessoryPlugin {
  private storage;

  private webhookServer: http.Server | null = null;

  private informationService;
  private garageDoorService;

  private currentDoorStateKey = 'currentDoorState';
  private targetDoorStateKey = 'targetDoorState';
  private currentDoorState = this.api.hap.Characteristic.CurrentDoorState.CLOSED;
  private targetDoorState = this.api.hap.Characteristic.TargetDoorState.CLOSED;
  private obstructionDetected = false;

  private garageDoorMovingTimeout?: ReturnType<typeof setTimeout>;
  private autoCloseTimeout?: ReturnType<typeof setTimeout>;
  private openingDelayTimeout?: ReturnType<typeof setTimeout>;
  private virtualOpeningTimer?: ReturnType<typeof setTimeout>;
  private virtualOpeningInterval?: ReturnType<typeof setInterval>;

  private pinHigh = true;

  constructor(
    public readonly log: Logger,
    public readonly config: AccessoryConfig,
    public readonly api: API,
  ) {
    this.log.debug('Homebridge GPIO garage door loaded.');

    // init storage
    const cacheDir = this.api.user.persistPath();
    this.storage = storage.create();
    this.storage.initSync({dir: cacheDir, forgiveParseErrors: true});

    // add accessory information
    this.informationService = new this.api.hap.Service.AccessoryInformation()
      .setCharacteristic(this.api.hap.Characteristic.Manufacturer, 'Homebridge')
      .setCharacteristic(this.api.hap.Characteristic.Model, 'GPIO garage door');

    // create new garage door accessory
    this.garageDoorService = new this.api.hap.Service.GarageDoorOpener(this.config.name);

    // add characteristics
    this.garageDoorService.getCharacteristic(this.api.hap.Characteristic.CurrentDoorState);
    this.garageDoorService.getCharacteristic(this.api.hap.Characteristic.TargetDoorState);
    this.garageDoorService.getCharacteristic(this.api.hap.Characteristic.ObstructionDetected);

    // restore persisted settings
    this.currentDoorState = this.storage.getItemSync(this.currentDoorStateKey)
      || this.storage.getItemSync(this.targetDoorStateKey)
      || this.currentDoorState;
    this.targetDoorState = this.storage.getItemSync(this.targetDoorStateKey)
      || this.targetDoorState;
    this.garageDoorService.updateCharacteristic(this.api.hap.Characteristic.CurrentDoorState, this.currentDoorState);
    this.garageDoorService.updateCharacteristic(this.api.hap.Characteristic.TargetDoorState, this.targetDoorState);
    this.garageDoorService.updateCharacteristic(this.api.hap.Characteristic.ObstructionDetected, this.obstructionDetected);

    // setup gpio
    this.setupGpio().then(() => {
      // setup events
      this.setupEvents();

      // execute last command
      if (this.currentDoorState !== this.targetDoorState) {
        this.setTargetDoorState(this.targetDoorState);
      }
    });

    // setup webhook server
    if (this.config.webhookEnabled) {
      this.webhookServer = http.createServer((request, response) => {
        let statusCode = 0;

        try {
          if (request.url === this.config.webhookPath) {
            this.log.debug('Received webhook request');

            if (request.method !== 'POST') {
              statusCode = 405;
              throw new Error('Invalid request method');
            }

            if (request.headers['content-type'] !== 'application/json') {
              statusCode = 415;
              throw new Error('Invalid content type');
            }

            let body = '';
            request.on('data', (chunk) => {
              body += chunk;
            });
            request.on('end', () => {
              const json = JSON.parse(body);
              this.log.debug('Received webhook request body:', json);

              const [currentDoorState] = jp.JSONPath({path: this.config.webhookJsonPath, json});
              if (currentDoorState === undefined) {
                throw new Error('Invalid door state');
              }

              const doorOpen = this.config.webhookJsonValueReverse ? !currentDoorState : !!currentDoorState;
              const hkDoorState = doorOpen ?
                this.api.hap.Characteristic.CurrentDoorState.OPEN :
                this.api.hap.Characteristic.CurrentDoorState.CLOSED;

              this.externalStateChange(hkDoorState);
            });

            statusCode = 200;
          } else {
            statusCode = 404;
            throw new Error('Invalid webhook path');
          }
        } catch (e) {
          this.log.debug('Error handling webhook request:', e);
        }

        response.writeHead(statusCode || 500);
        response.end();
      });
      this.webhookServer.listen(this.config.webhookPort);
    }
  }

  getServices() {
    return [
      this.informationService,
      this.garageDoorService,
    ];
  }

  async setupGpio(): Promise<void> {
    this.pinHigh = !this.config.reverseOutput;

    await GPIO.promise.setup(this.config.gpioPinOpen, GPIO.DIR_OUT, GPIO.EDGE_BOTH);
    GPIO.write(this.config.gpioPinOpen, !this.pinHigh);

    // En mode auto-close, on n'utilise que le pin d'ouverture
    if (!this.config.autoCloseEnabled && this.config.gpioPinOpen !== this.config.gpioPinClose) {
      await GPIO.promise.setup(this.config.gpioPinClose, GPIO.DIR_OUT, GPIO.EDGE_BOTH);
      GPIO.write(this.config.gpioPinClose, !this.pinHigh);
    }

    if (this.config.gpioStateInputEnabled) {
      GPIO.on('change', this.gpioInputStateChange.bind(this));
      await GPIO.promise.setup(this.config.gpioPinState, GPIO.DIR_IN, GPIO.EDGE_BOTH);

      this.gpioInputStateChange(this.config.gpioPinState, await GPIO.promise.read(this.config.gpioPinState));
    }
  }

  setupEvents(): void {
    // current state
    this.garageDoorService.getCharacteristic(this.api.hap.Characteristic.CurrentDoorState)
      .onGet(this.getCurrentDoorState.bind(this));

    // target door state
    this.garageDoorService.getCharacteristic(this.api.hap.Characteristic.TargetDoorState)
      .onGet(this.getTargetDoorState.bind(this))
      .onSet(this.setTargetDoorState.bind(this));

    // obstruction
    this.garageDoorService.getCharacteristic(this.api.hap.Characteristic.ObstructionDetected)
      .onGet(this.getObstructionDetected.bind(this));
  }

  gpioInputStateChange(channel: number, pinHighState: boolean): void {
    if (channel !== this.config.gpioPinState) {
      return;
    }

    this.log.debug('Garage door state changed via GPIO input:', pinHighState ? 'HIGH' : 'LOW');

    if (this.config.gpioStateInputReverse) {
      pinHighState = !pinHighState;
    }

    this.externalStateChange(
      pinHighState ?
        this.api.hap.Characteristic.CurrentDoorState.OPEN :
        this.api.hap.Characteristic.CurrentDoorState.CLOSED,
    );
  }

  protected getCurrentDoorState() {
    this.log.debug('getCurrentDoorState:', this.currentDoorState);
    return this.currentDoorState;
  }

  protected getTargetDoorState() {
    this.log.debug('getTargetDoorState:', this.targetDoorState);
    return this.targetDoorState;
  }

  protected setTargetDoorState(targetState) {
    if (!this.config.allowCommandOverride && this.isMoving()) {
      this.log.info('Command ignored, door is currently moving');
      this.garageDoorService.updateCharacteristic(this.api.hap.Characteristic.TargetDoorState, this.targetDoorState);
      return;
    }

    if (this.config.gpioStateInputEnabled && this.currentDoorState === targetState) {
      this.log.info('Command ignored, door is already at desired state');
      // Si la porte est déjà ouverte et qu'on reçoit une impulsion d'ouverture, on réinitialise la minuterie
      if (
        this.config.autoCloseEnabled &&
        this.currentDoorState === this.api.hap.Characteristic.CurrentDoorState.OPEN &&
        targetState === this.api.hap.Characteristic.TargetDoorState.OPEN
      ) {
        this.log.info('Réinitialisation de la minuterie d\'auto-fermeture');
        this.startAutoCloseTimer();
      }
      return;
    }

    this.log.debug('setTargetDoorState:', targetState);
    this.targetDoorState = targetState;

    let targetGpioPin = -1;
    switch (this.targetDoorState) {
      case this.api.hap.Characteristic.TargetDoorState.OPEN:
        this.log.debug('Ouverture de la porte de garage');
        this.currentDoorState = this.api.hap.Characteristic.CurrentDoorState.OPENING;
        this.garageDoorService.updateCharacteristic(this.api.hap.Characteristic.CurrentDoorState, this.currentDoorState);
        targetGpioPin = this.config.gpioPinOpen;
        // On réinitialise la minuterie d'auto-fermeture
        this.cancelAutoCloseTimer();
        this.cancelVirtualOpeningTimer();
        this.openingDelayTimeout = setTimeout(() => {
          this.currentDoorState = this.api.hap.Characteristic.CurrentDoorState.OPEN;
          this.garageDoorService.updateCharacteristic(this.api.hap.Characteristic.CurrentDoorState, this.currentDoorState);
          if (this.config.autoCloseEnabled) {
            this.startAutoCloseTimer();
          }
          this.persistCache();
        }, (this.config.openingDelay || this.config.executionTime) * 1000);
        break;
      case this.api.hap.Characteristic.TargetDoorState.CLOSED:
        this.log.debug('Fermeture de la porte de garage');
        this.currentDoorState = this.api.hap.Characteristic.CurrentDoorState.CLOSING;
        this.garageDoorService.updateCharacteristic(this.api.hap.Characteristic.CurrentDoorState, this.currentDoorState);
        targetGpioPin = this.config.gpioPinOpen; // On utilise le même pin pour fermer
        // Annuler les timers de temporisation virtuelle
        this.cancelVirtualOpeningTimer();
        break;
    }

    this.persistCache();

    if (targetGpioPin > -1) {
      this.setGpio(targetGpioPin, this.pinHigh);
      setTimeout(() => {
        this.setGpio(targetGpioPin, !this.pinHigh);
      }, this.config.emitTime);
      // On ne met le timeout de mouvement que pour la fermeture
      if (this.targetDoorState === this.api.hap.Characteristic.TargetDoorState.CLOSED) {
        this.garageDoorMovingTimeout = setTimeout(() => {
          this.currentDoorState = this.targetDoorState;
          this.garageDoorService.updateCharacteristic(this.api.hap.Characteristic.CurrentDoorState, this.currentDoorState);
          this.persistCache();
        }, this.config.executionTime * 1000);
      }
    }
  }

  protected getObstructionDetected() {
    this.log.debug('getObstructionDetected:', this.obstructionDetected);
    return this.obstructionDetected;
  }

  private isMoving() {
    return this.currentDoorState !== this.targetDoorState;
  }

  private setGpio(pin: number, state: boolean): void {
    this.log.debug('Setting GPIO pin ' + pin + ' to ' + (state ? 'HIGH' : 'LOW'));
    GPIO.write(pin, state);
  }

  private startAutoCloseTimer(): void {
    this.cancelAutoCloseTimer();

    const delay = (this.config.autoCloseDelay || 15) * 1000;
    this.log.debug(`Starting auto-close timer for ${delay}ms`);

    this.autoCloseTimeout = setTimeout(() => {
      this.log.info('Auto-close timer expired, closing garage door');
      this.setTargetDoorState(this.api.hap.Characteristic.TargetDoorState.CLOSED);
    }, delay);

    // Démarrer aussi la temporisation virtuelle si configurée
    this.startVirtualOpeningTimer();
  }

  private cancelAutoCloseTimer(): void {
    if (this.autoCloseTimeout) {
      clearTimeout(this.autoCloseTimeout);
      this.autoCloseTimeout = undefined;
      this.log.debug('Auto-close timer cancelled');
    }
  }

  private startVirtualOpeningTimer(): void {
    this.cancelVirtualOpeningTimer();

    const virtualDelay = this.config.virtualOpeningDelay || 0;
    const physicalDelay = this.config.autoCloseDelay || 15;

    if (virtualDelay > 0 && virtualDelay > physicalDelay) {
      const totalVirtualTime = virtualDelay * 1000;
      const intervalTime = 10 * 1000; // 10 secondes entre chaque signal

      this.log.debug(`Starting virtual opening timer for ${virtualDelay}s (${totalVirtualTime}ms)`);

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

  private cancelVirtualOpeningTimer(): void {
    if (this.virtualOpeningTimer) {
      clearTimeout(this.virtualOpeningTimer);
      this.virtualOpeningTimer = undefined;
      this.log.debug('Virtual opening timer cancelled');
    }
    this.cancelVirtualOpeningInterval();
  }

  private cancelVirtualOpeningInterval(): void {
    if (this.virtualOpeningInterval) {
      clearInterval(this.virtualOpeningInterval);
      this.virtualOpeningInterval = undefined;
      this.log.debug('Virtual opening interval cancelled');
    }
  }

  private externalStateChange(hkDoorState: number): void {
    // update current and target door state
    this.currentDoorState = hkDoorState;
    this.targetDoorState = hkDoorState;

    this.garageDoorService.updateCharacteristic(this.api.hap.Characteristic.CurrentDoorState, this.currentDoorState);
    this.garageDoorService.updateCharacteristic(this.api.hap.Characteristic.TargetDoorState, this.targetDoorState);

    this.persistCache();

    // cancel timeouts
    if (this.garageDoorMovingTimeout) {
      clearTimeout(this.garageDoorMovingTimeout);
      this.garageDoorMovingTimeout = undefined;
    }

    if (this.openingDelayTimeout) {
      clearTimeout(this.openingDelayTimeout);
      this.openingDelayTimeout = undefined;
    }

    // Handle auto-close timer based on new state
    if (hkDoorState === this.api.hap.Characteristic.CurrentDoorState.OPEN) {
      // Door is now open, start auto-close timer if enabled
      if (this.config.autoCloseEnabled) {
        this.startAutoCloseTimer();
      }
    } else if (hkDoorState === this.api.hap.Characteristic.CurrentDoorState.CLOSED) {
      // Door is now closed, cancel auto-close timer and virtual opening timer
      this.cancelAutoCloseTimer();
      this.cancelVirtualOpeningTimer();
    }
  }

  private persistCache(): void {
    this.log.debug('Persisting accessory state');
    this.storage.setItemSync(this.currentDoorStateKey, this.currentDoorState);
    this.storage.setItemSync(this.targetDoorStateKey, this.targetDoorState);
  }
}
