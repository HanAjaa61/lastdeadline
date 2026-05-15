import GameState from "./GameState"

// Timeout sebelum jumpscare kalau anomali dibiarkan
const ANOMALY_TIMEOUT_MS = 12000

// Delay spawn (ms) berdasarkan jam malam
// 12.00 - 1.30 AM  (min 0–90)  : sangat jarang
// 1.31  - 3.00 AM  (min 91–180): mulai naik
// 3.01  - 5.00 AM  (min 181+)  : sering
function getSpawnDelay() {
  const h   = GameState.gameHour === 12 ? 0 : GameState.gameHour
  const min = h * 60 + GameState.gameMinute
  if (min < 90)  return 40000 + Math.random() * 30000  // 40–70 detik
  if (min < 180) return 15000 + Math.random() * 15000  // 15–30 detik
  return               5000  + Math.random() * 8000    // 5–13 detik
}

// Chance spawn berdasarkan jam malam
function getChance() {
  const h   = GameState.gameHour === 12 ? 0 : GameState.gameHour
  const min = h * 60 + GameState.gameMinute
  if (min < 90)  return 0.35
  if (min < 180) return 0.70
  return 1.00
}

const CCTVManager = {
  _scene:         null,
  _initialized:   false,
  _anomalyActive: false,
  _anomalyHeldMs: 0,
  _listeners:     [],

  // Pakai native setInterval supaya tidak mati saat scene switch
  _spawnIntervalId:   null,
  _anomalyIntervalId: null,

  init(scene) {
    this._scene = scene
    // Selalu reset total supaya malam baru selalu mulai bersih
    this._stopAll()
    this._initialized   = true
    this._anomalyActive = false
    this._anomalyHeldMs = 0
    this._scheduleSpawn()
  },

  destroy() {
    this._stopAll()
    this._initialized = false
    this._scene       = null
    this._listeners   = []
  },

  // Attach scene baru tanpa reset timer — untuk saat scene switch
  attach(scene) {
    this._scene = scene
  },

  _scheduleSpawn() {
    if (this._spawnIntervalId !== null) {
      clearTimeout(this._spawnIntervalId)
      this._spawnIntervalId = null
    }

    const delay = getSpawnDelay()
    this._spawnIntervalId = setTimeout(() => {
      this._spawnIntervalId = null
      if (!this._initialized) return
      if (this._anomalyActive) { this._scheduleSpawn(); return }
      if (Math.random() < getChance()) {
        this._spawnAnomaly()
      } else {
        this._scheduleSpawn()
      }
    }, delay)
  },

  _spawnAnomaly() {
    this._anomalyActive = true
    this._anomalyHeldMs = 0
    GameState.recordAnomaliFound()
    this._notify("spawn")
    this._playGlobalAnomalySfx()
    this._startAnomalyCountdown()
  },

  // Play sfx anomali CCTV secara global di scene manapun yang aktif
  // Dikecualikan: LemariScene, CekPintu (saat anomali pintu aktif), dan scene anomali pintu
  _playGlobalAnomalySfx() {
    if (!this._scene) return
    if (this._paused) return

    const excluded = ["LemariScene", "JumpscareScene", "GameOverScene"]
    for (const key of excluded) {
      try { if (this._scene.scene.isActive(key)) return } catch(e) {}
    }

    // Cek kalau lagi di CekPintu dan anomali pintu sedang aktif — jangan dobel sfx
    try {
      if (this._scene.scene.isActive("CekPintu")) return
    } catch(e) {}

    const targets = [
      "CCTVScene", "GameScene", "Scene2", "ComputerScene",
      "LMSScene", "WIFIScene", "GoputScene"
    ]

    for (const key of targets) {
      try {
        if (!this._scene.scene.isActive(key)) continue
        const sc = this._scene.scene.get(key)
        if (!sc || !sc.sound) continue
        sc.sound.play("anomaliSfx", { volume: 0.6 })
        return
      } catch(e) {}
    }
  },

  _startAnomalyCountdown() {
    if (this._anomalyIntervalId !== null) {
      clearInterval(this._anomalyIntervalId)
    }

    this._anomalyIntervalId = setInterval(() => {
      if (!this._anomalyActive) {
        clearInterval(this._anomalyIntervalId)
        this._anomalyIntervalId = null
        return
      }
      this._anomalyHeldMs += 500
      this._notify("tick", this._anomalyHeldMs)
      if (this._anomalyHeldMs >= ANOMALY_TIMEOUT_MS) {
        clearInterval(this._anomalyIntervalId)
        this._anomalyIntervalId = null
        this._triggerJumpscare()
      }
    }, 500)
  },

  clearAnomaly() {
    if (!this._anomalyActive) return
    this._anomalyActive = false
    this._anomalyHeldMs = 0
    if (this._anomalyIntervalId !== null) {
      clearInterval(this._anomalyIntervalId)
      this._anomalyIntervalId = null
    }
    this._notify("clear")
    this._scheduleSpawn()
  },

  isAnomalyActive() { return this._anomalyActive },

  // Pause — jumpscare tidak akan ditembak (misal saat di LemariScene)
  pause() {
    this._paused = true
  },

  // Resume — jumpscare aktif kembali
  resume() {
    this._paused = false
  },

  getRemainingMs() { return Math.max(0, ANOMALY_TIMEOUT_MS - this._anomalyHeldMs) },

  _triggerJumpscare() {
    if (!this._initialized) return
    if (this._paused) { this._scheduleSpawn(); return }
    this._anomalyActive = false
    this._anomalyHeldMs = 0
    this._notify("jumpscare")

    // Cari scene aktif manapun — termasuk CCTVScene
    const targets = [
      "CCTVScene", "GameScene", "Scene2", "ComputerScene",
      "CekPintu", "LMSScene", "WIFIScene", "GoputScene"
    ]

    if (!this._scene) return

    for (const key of targets) {
      try {
        if (!this._scene.scene.isActive(key)) continue
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
      } catch(e) {}
    }

    // Tidak ada scene aktif yang cocok — jadwal ulang saja
    this._scheduleSpawn()
  },

  on(callback) {
    this._listeners.push(callback)
    return () => { this._listeners = this._listeners.filter(l => l !== callback) }
  },

  _notify(event, data) {
    this._listeners.forEach(l => { try { l(event, data) } catch(e) {} })
  },

  _stopAll() {
    if (this._spawnIntervalId !== null) {
      clearTimeout(this._spawnIntervalId)
      this._spawnIntervalId = null
    }
    if (this._anomalyIntervalId !== null) {
      clearInterval(this._anomalyIntervalId)
      this._anomalyIntervalId = null
    }
  },
}

export default CCTVManager