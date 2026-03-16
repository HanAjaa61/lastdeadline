import GameState from "./GameState"

const CCTVManager = {
  _scene:         null,
  _initialized:   false,
  _anomalyActive: false,
  _anomalyTimer:  null,
  _spawnTimer:    null,
  _anomalyHeldMs: 0,
  _listeners:     [],

  ANOMALY_TIMEOUT_MS: 45000,

  init(scene) {
    this._scene = scene
    if (this._initialized) return
    this._initialized = true
    this._scheduleSpawn()
  },

  destroy() {
    this._stopAll()
    this._initialized = false
    this._scene       = null
    this._listeners   = []
  },

  _scheduleSpawn() {
    if (!this._scene) return
    const delay = this._getSpawnDelay()
    this._spawnTimer = this._scene.time.delayedCall(delay, () => {
      if (!this._initialized) return
      if (this._anomalyActive) { this._scheduleSpawn(); return }
      if (Math.random() < this._getChance()) {
        this._spawnAnomaly()
      } else {
        this._scheduleSpawn()
      }
    })
  },

  _getSpawnDelay() {
    const h   = GameState.gameHour === 12 ? 0 : GameState.gameHour
    const min = h * 60 + GameState.gameMinute
    if (min < 60)  return Phaser.Math.Between(20000, 35000)
    if (min < 120) return Phaser.Math.Between(15000, 25000)
    if (min < 180) return Phaser.Math.Between(8000,  15000)
    return Phaser.Math.Between(4000, 9000)
  },

  _getChance() {
    if (!GameState.isAM) return 0.3
    const h   = GameState.gameHour === 12 ? 0 : GameState.gameHour
    const min = h * 60 + GameState.gameMinute
    if (min < 60)  return 0.35
    if (min < 120) return 0.55
    if (min < 180) return 0.75
    if (min < 240) return 0.90
    return 0.98
  },

  _spawnAnomaly() {
    this._anomalyActive = true
    this._anomalyHeldMs = 0
    this._notify("spawn")
    this._startAnomalyCountdown()
  },

  _startAnomalyCountdown() {
    if (!this._scene) return
    if (this._anomalyTimer) this._anomalyTimer.remove()

    this._anomalyTimer = this._scene.time.addEvent({
      delay: 500, loop: true,
      callback: () => {
        if (!this._anomalyActive) { this._anomalyTimer.remove(); return }
        this._anomalyHeldMs += 500
        this._notify("tick", this._anomalyHeldMs)
        if (this._anomalyHeldMs >= this.ANOMALY_TIMEOUT_MS) {
          this._anomalyTimer.remove()
          this._anomalyTimer = null
          this._triggerJumpscare()
        }
      }
    })
  },

  clearAnomaly() {
    if (!this._anomalyActive) return
    this._anomalyActive = false
    this._anomalyHeldMs = 0
    if (this._anomalyTimer) { this._anomalyTimer.remove(); this._anomalyTimer = null }
    this._notify("clear")
    this._scheduleSpawn()
  },

  isAnomalyActive() { return this._anomalyActive },

  getRemainingMs() { return Math.max(0, this.ANOMALY_TIMEOUT_MS - this._anomalyHeldMs) },

  _triggerJumpscare() {
    if (!this._scene) return
    this._anomalyActive = false
    this._anomalyHeldMs = 0
    this._notify("jumpscare")

    const targets = ["ComputerScene", "GameScene", "Scene2", "CekPintu",
                    "LMSScene", "WiFiScene", "GoputScene"]

    for (const key of targets) {
      if (this._scene.scene.isActive(key)) {
        const sc = this._scene.scene.get(key)
        if (!sc || !sc.cameras) continue
        this._stopAll()
        try {
          const bgm = sc.sound?.get("gameBgm")
          const lms = sc.sound?.get("lmsBgm")
          if (bgm && bgm.isPlaying) bgm.stop()
          if (lms && lms.isPlaying) lms.stop()
        } catch(e) {}
        sc.cameras.main.flash(120, 255, 255, 255)
        sc.time.delayedCall(150, () => {
          sc.scene.start("JumpscareScene", {
            next: "GameOverScene",
            msg: "Kamu terlalu lama mengabaikan CCTV...\nThe Enggang sudah masuk ke kamarmu !"
          })
        })
        return
      }
    }
  },

  on(callback) {
    this._listeners.push(callback)
    return () => { this._listeners = this._listeners.filter(l => l !== callback) }
  },

  _notify(event, data) {
    this._listeners.forEach(l => { try { l(event, data) } catch (e) {} })
  },

  _stopAll() {
    if (this._spawnTimer)   { this._spawnTimer.remove();   this._spawnTimer   = null }
    if (this._anomalyTimer) { this._anomalyTimer.remove(); this._anomalyTimer = null }
  },
}

export default CCTVManager