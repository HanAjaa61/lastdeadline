import Phaser from "phaser"
import GameState from "./GameState"

const SAFE_DURATION    = 15000
const MONSTER_SFX_MIN  = 4000
const MONSTER_SFX_MAX  = 12000
const MONSTER_SFX_KEYS = ["monsterSfx1", "monsterSfx2", "monsterSfx3"]
const MAX_LOUD_COUNT   = 3

const BAR_W          = 400
const THUMB_W        = 36
const SAFE_ZONE_W    = 80
const SAFE_ZONE_SPEED_MIN = 40
const SAFE_ZONE_SPEED_MAX = 280
const FILL_RATE      = 0.0015
const DRAIN_RATE     = 0.001
const DRAIN_RATE_MAX = 0.006

export default class LemariScene extends Phaser.Scene {
  constructor() {
    super("LemariScene")
  }

  init(data) {
    this.fromScene   = data.from        || "Scene2"
    this.anomalyType = data.anomalyType || "kiri"
  }

  create() {
    const { width, height } = this.scale

    this.isTransitioning = false
    this.isSafe          = false
    this.safeProgress    = 0
    this.monsterTimer    = null
    this.safeTimer       = null

    this._thumbX       = BAR_W / 2
    this._safeZoneX    = BAR_W / 2
    this._safeZoneDir  = 1
    this._safeZoneSpd  = Phaser.Math.Between(SAFE_ZONE_SPEED_MIN, SAFE_ZONE_SPEED_MAX)
    this._holdProgress = 0.5
    this._isDead       = false
    this._keys         = null

    GameState.doorCheckTimerActive = false

    this.cameras.main.setBackgroundColor("#0a0a0a")
    this.cameras.main.fadeIn(300)

    this.bgImage = null
    if (this.textures.exists("lemari")) {
      this.bgImage = this.add.image(width / 2, height / 2, "lemari")
        .setOrigin(0.5).setDisplaySize(width, height).setDepth(0)
    } else {
      this.add.rectangle(width / 2, height / 2, width, height, 0x111111).setDepth(0)
      this.add.text(width / 2, height / 2, "[Lemari]", {
        fontSize: "32px", fontFamily: "minecraft", color: "#444444"
      }).setOrigin(0.5).setDepth(1)
    }

    this._startShake()

    const vgfx = this.add.graphics().setDepth(2)
    vgfx.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.7, 0.7, 0, 0)
    vgfx.fillRect(0, 0, width, height / 3)
    vgfx.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.7, 0.7)
    vgfx.fillRect(0, height * 2/3, width, height / 3)

    this.add.text(width / 2, height * 0.10, "Diam... jangan sampai terdengar.", {
      fontSize: "18px", fontFamily: "minecraft", color: "#cccccc",
      stroke: "#000000", strokeThickness: 3, align: "center"
    }).setOrigin(0.5).setDepth(5)

    const barY    = height * 0.70
    const barLeft = width / 2 - BAR_W / 2

    this.add.rectangle(width / 2, barY, BAR_W + 6, 28, 0x111111).setDepth(5)
    this.add.rectangle(width / 2, barY, BAR_W,     22, 0x333333).setDepth(5)

    this._safeGfx  = this.add.graphics().setDepth(6)
    this._thumbGfx = this.add.graphics().setDepth(8)

    this._barLeft = barLeft
    this._barY    = barY

    const holdBarY = barY + 48
    this.add.rectangle(width / 2, holdBarY, BAR_W + 6, 18, 0x111111).setDepth(5)
    this.add.rectangle(width / 2 - BAR_W / 2, holdBarY, BAR_W, 14, 0x222222)
      .setOrigin(0, 0.5).setDepth(5)
    this._holdBar = this.add.rectangle(width / 2 - BAR_W / 2, holdBarY, 0, 14, 0xcc4400)
      .setOrigin(0, 0.5).setDepth(6)

    this._holdLabel = this.add.text(width / 2, holdBarY - 20, "Tahan napas...", {
      fontSize: "13px", fontFamily: "minecraft", color: "#aaaaaa"
    }).setOrigin(0.5).setDepth(6)

    this.add.text(width / 2, barY - 26, "drag kotak putih ke zona hijau", {
      fontSize: "12px", fontFamily: "minecraft", color: "#888888",
      stroke: "#000000", strokeThickness: 2,
    }).setOrigin(0.5).setDepth(6)

    this.hintText = this.add.text(width / 2, height * 0.91, "[ Q ] Keluar dari lemari", {
      fontSize: "13px", fontFamily: "minecraft", color: "#555555"
    }).setOrigin(0.5).setDepth(5)

    const allHb = this.sound.getAll("heartbeatSfx")
    allHb.forEach((s, i) => { if (i > 0) s.destroy() })
    this.heartbeat = allHb[0] || this.sound.add("heartbeatSfx", { loop: true, volume: 0.6 })
    this.heartbeat.setVolume(0.6)
    if (!this.heartbeat.isPlaying) this.heartbeat.play()

    const allBr = this.sound.getAll("breathSfx")
    allBr.forEach((s, i) => { if (i > 0) s.destroy() })
    this.breath = allBr[0] || this.sound.add("breathSfx", { loop: true, volume: 0.4 })
    this.breath.setVolume(0.4)
    if (!this.breath.isPlaying) this.breath.play()

    this._dragging  = false
    this._dragOffsetX = 0

    this._keys = this.input.keyboard.addKeys({
      q: Phaser.Input.Keyboard.KeyCodes.Q,
    })

    this.input.on("pointerdown", (p) => {
      const thumbScreenX = this._barLeft + this._thumbX
      if (Math.abs(p.x - thumbScreenX) < THUMB_W + 10) {
        this._dragging    = true
        this._dragOffsetX = p.x - thumbScreenX
      }
    })

    this.input.on("pointermove", (p) => {
      if (!this._dragging) return
      const newX = p.x - this._barLeft - this._dragOffsetX
      this._thumbX = Phaser.Math.Clamp(newX, THUMB_W / 2, BAR_W - THUMB_W / 2)
    })

    this.input.on("pointerup", () => {
      this._dragging = false
    })

    this.input.keyboard.on("keydown-Q", () => {
      if (this.isTransitioning) return
      if (!this.isSafe) {
        this._doRedFlash(() => this._triggerCaught("Belum aman untuk keluar sekarang bro !"))
        return
      }
      this._exitLemari()
    })

    this._scheduleMonsterSfx()
    this._drawBar()


  }

  update(time, delta) {
    if (this.isTransitioning || this.isSafe || this._isDead) return

    const dt = delta / 1000

    this._safeZoneX += this._safeZoneDir * this._safeZoneSpd * dt

    if (this._safeZoneX + SAFE_ZONE_W / 2 >= BAR_W) {
      this._safeZoneX = BAR_W - SAFE_ZONE_W / 2
      this._safeZoneDir = -1
      this._safeZoneSpd = Phaser.Math.Between(SAFE_ZONE_SPEED_MIN, SAFE_ZONE_SPEED_MAX)
    } else if (this._safeZoneX - SAFE_ZONE_W / 2 <= 0) {
      this._safeZoneX = SAFE_ZONE_W / 2
      this._safeZoneDir = 1
      this._safeZoneSpd = Phaser.Math.Between(SAFE_ZONE_SPEED_MIN, SAFE_ZONE_SPEED_MAX)
    } else if (Math.random() < 0.004) {
      this._safeZoneDir *= -1
      this._safeZoneSpd = Phaser.Math.Between(SAFE_ZONE_SPEED_MIN, SAFE_ZONE_SPEED_MAX)
    } else if (Math.random() < 0.003) {
      this._safeZoneSpd = Phaser.Math.Between(SAFE_ZONE_SPEED_MIN, SAFE_ZONE_SPEED_MAX)
    }

    const inZone = this._thumbX >= this._safeZoneX - SAFE_ZONE_W / 2 &&
                   this._thumbX <= this._safeZoneX + SAFE_ZONE_W / 2

    if (inZone) {
      this._holdProgress = Math.min(1, this._holdProgress + FILL_RATE)
    } else {
      const drain = DRAIN_RATE + (DRAIN_RATE_MAX - DRAIN_RATE) * this._holdProgress
      this._holdProgress = Math.max(0, this._holdProgress - drain)
    }

    if (this.heartbeat && this.heartbeat.isPlaying) {
      const rate = 1.5 - this._holdProgress * 0.7
      this.heartbeat.setRate(rate)
    }

    const pct = this._holdProgress
    this._holdBar.width = pct * BAR_W
    if (pct < 0.5)      this._holdBar.setFillStyle(0xcc4400)
    else if (pct < 0.8) this._holdBar.setFillStyle(0xccaa00)
    else                this._holdBar.setFillStyle(0x00cc44)

    if (this._holdProgress <= 0 && !this._isDead) {
      this._isDead = true
      this._doRedFlash(() => this._triggerCaught())
    }

    if (this._holdProgress >= 1) {
      this._onSafe()
    }

    this._drawBar()
  }

  _drawBar() {
    const L = this._barLeft
    const Y = this._barY

    this._safeGfx.clear()
    this._safeGfx.fillStyle(0x00cc44, 0.45)
    this._safeGfx.fillRect(L + this._safeZoneX - SAFE_ZONE_W / 2, Y - 11, SAFE_ZONE_W, 22)

    this._thumbGfx.clear()
    this._thumbGfx.fillStyle(0xffffff, 1)
    this._thumbGfx.fillRect(L + this._thumbX - THUMB_W / 2, Y - 13, THUMB_W, 26)
    this._thumbGfx.fillStyle(0x000000, 0.3)
    this._thumbGfx.fillRect(L + this._thumbX - 2, Y - 8, 4, 16)
  }

  _startShake() {
    if (!this.bgImage) return
    const { width, height } = this.scale
    const baseX = width / 2
    const baseY = height / 2

    const doShake = () => {
      if (!this.scene.isActive("LemariScene")) return
      if (this.isSafe) {
        this.bgImage.setPosition(baseX, baseY)
        return
      }
      const intensity = 2 + this._holdProgress * 3
      const rx = baseX + Phaser.Math.FloatBetween(-intensity, intensity)
      const ry = baseY + Phaser.Math.FloatBetween(-intensity, intensity)
      this.bgImage.setPosition(rx, ry)
      this.time.delayedCall(40, doShake)
    }
    this.time.delayedCall(200, doShake)
  }

  _doRedFlash(onDone) {
    let count = 0
    const doFlash = () => {
      if (count >= 6) {
        if (onDone) onDone()
        return
      }
      this.cameras.main.flash(120, 255, 0, 0, false)
      this.cameras.main.shake(100, 0.02)
      count++
      this.time.delayedCall(150, doFlash)
    }
    doFlash()
  }

  _triggerCaught(msg = "Suaramu terdengar...\nThe Enggang menemukanmu di dalam lemari !") {
    if (this.isTransitioning) return
    this.isTransitioning = true
    this._stopTimers()
    this._stopSfx()
    GameState.doorCheckTimerActive = true

    this.cameras.main.flash(120, 255, 255, 255)
    this.time.delayedCall(150, () => {
      this.scene.start("JumpscareScene", { next: "GameOverScene", msg })
    })
  }

  _onSafe() {
    this.isSafe = true
    this._holdLabel.setText("Aman ! Tekan Q untuk keluar.")
      .setStyle({ color: "#00ff88", fontSize: "13px", fontFamily: "minecraft" })
    this.hintText.setStyle({ color: "#00ff88", fontSize: "13px", fontFamily: "minecraft" })
    if (this.heartbeat && this.heartbeat.isPlaying) this.heartbeat.stop()
    if (this.breath    && this.breath.isPlaying)    this.breath.stop()
    if (this.bgImage) this.bgImage.setPosition(this.scale.width / 2, this.scale.height / 2)
    this.sound.play("correctSfx", { volume: 0.5 })
  }

  _scheduleMonsterSfx() {
    const delay = Phaser.Math.Between(MONSTER_SFX_MIN, MONSTER_SFX_MAX)
    this.monsterTimer = this.time.delayedCall(delay, () => {
      if (!this.scene.isActive("LemariScene")) return
      if (this.isSafe) return
      const keys = MONSTER_SFX_KEYS.filter(k => this.cache.audio.has(k))
      if (keys.length > 0) {
        const key = keys[Phaser.Math.Between(0, keys.length - 1)]
        try { this.sound.play(key, { volume: 0.8 }) } catch (e) {}
      }
      this._scheduleMonsterSfx()
    })
  }

  _exitLemari() {
    if (this.isTransitioning) return
    this.isTransitioning = true
    this._stopTimers()
    this._stopSfx()
    GameState.doorCheckTimerActive = true

    this.cameras.main.fadeOut(400)
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start(this.fromScene)
    })
  }

  _stopTimers() {
    if (this.safeTimer)    { this.safeTimer.remove();    this.safeTimer    = null }
    if (this.monsterTimer) { this.monsterTimer.remove(); this.monsterTimer = null }
  }

  _stopSfx() {
    if (this.heartbeat && this.heartbeat.isPlaying) this.heartbeat.stop()
    if (this.breath    && this.breath.isPlaying)    this.breath.stop()
  }

  shutdown() {
    this._stopTimers()
    this._stopSfx()
    GameState.doorCheckTimerActive = true
  }
}