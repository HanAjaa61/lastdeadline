import GameState from "./GameState"

const QUOTA_PER_DOOR = 5
const TIMER_DURATION = 80

const DoorCheckManager = {
  _transitioning: false,
  _intervalId: null,
  _sceneRef: null,

  init(scene) {
    this._sceneRef = scene

    if (this._intervalId !== null) {
      return
    }

    this._transitioning = false
    GameState.doorCheckTimerActive = true
    GameState.doorCheckCountdown   = TIMER_DURATION
    GameState.doorCheckProgress    = { pintu_kiri: 0, pintu_kanan: 0 }

    this._intervalId = setInterval(() => this._tick(), 1000)
  },

  initNewNight(scene) {
    if (this._intervalId !== null) {
      clearInterval(this._intervalId)
      this._intervalId = null
    }

    this._sceneRef      = scene
    this._transitioning = false

    GameState.doorCheckTimerActive = true
    GameState.doorCheckCountdown   = TIMER_DURATION
    GameState.doorCheckProgress    = { pintu_kiri: 0, pintu_kanan: 0 }

    this._intervalId = setInterval(() => this._tick(), 1000)
  },

  attach(scene) {
    this._sceneRef = scene
    if (this._intervalId === null) {
      this._intervalId = setInterval(() => this._tick(), 1000)
    }
  },

  _tick() {
    if (!GameState.doorCheckTimerActive) return
    if (this._transitioning) return

    GameState.doorCheckCountdown--

    if (GameState.doorCheckCountdown <= 0) {
      GameState.doorCheckCountdown = 0
      this._triggerJumpscare()
    }
  },

  recordCheck(doorId) {
    const p = GameState.doorCheckProgress
    if (!p || p[doorId] === undefined) return

    if (p[doorId] < QUOTA_PER_DOOR) {
      p[doorId]++
    }

    if (p.pintu_kiri >= QUOTA_PER_DOOR && p.pintu_kanan >= QUOTA_PER_DOOR) {
      GameState.doorCheckProgress  = { pintu_kiri: 0, pintu_kanan: 0 }
      GameState.doorCheckCountdown = TIMER_DURATION
    }
  },

  getProgress() {
    const p = GameState.doorCheckProgress || { pintu_kiri: 0, pintu_kanan: 0 }
    return {
      kiri:  Math.min(p.pintu_kiri,  QUOTA_PER_DOOR),
      kanan: Math.min(p.pintu_kanan, QUOTA_PER_DOOR),
      quota: QUOTA_PER_DOOR,
    }
  },

  _triggerJumpscare() {
    this._transitioning = true
    GameState.doorCheckTimerActive = false

    const sceneKeys = [
      "GameScene", "Scene2", "ComputerScene",
      "LMSScene", "WIFIScene", "GoputScene", "CekPintu",
    ]

    let activeScene = null
    for (const key of sceneKeys) {
      try {
        if (this._sceneRef.scene.isActive(key)) {
          activeScene = this._sceneRef.scene.get(key)
          break
        }
      } catch (e) {}
    }

    if (!activeScene) {
      this._transitioning = false
      GameState.doorCheckTimerActive = true
      return
    }

    try {
      if (activeScene.gameBgm  && activeScene.gameBgm.isPlaying)  activeScene.gameBgm.stop()
      if (activeScene.ambience && activeScene.ambience.isPlaying)  activeScene.ambience.stop()
      if (activeScene.lmsBgm   && activeScene.lmsBgm.isPlaying)   activeScene.lmsBgm.stop()
      const lms = activeScene.sound?.get("lmsBgm")
      const bgm = activeScene.sound?.get("gameBgm")
      if (lms && lms.isPlaying) lms.stop()
      if (bgm && bgm.isPlaying) bgm.stop()

      activeScene.cameras.main.flash(100, 255, 255, 255)
      activeScene.time.delayedCall(120, () => {
        activeScene.scene.start("JumpscareScene", {
          next: "GameOverScene",
          msg: "Kamu lupa mengecek pintu...\nThe Enggang sudah masuk !",
        })
        this._reset()
      })
    } catch (e) {
      this._reset()
    }
  },

  _reset() {
    this._transitioning            = false
    GameState.doorCheckProgress    = { pintu_kiri: 0, pintu_kanan: 0 }
    GameState.doorCheckCountdown   = TIMER_DURATION
    GameState.doorCheckTimerActive = true
  },

  destroy() {
    if (this._intervalId !== null) {
      clearInterval(this._intervalId)
      this._intervalId = null
    }
    this._transitioning = false
    this._sceneRef      = null
  },
}

export default DoorCheckManager