const GameState = {
  poin: 0,
  insanity: 0,
  lapar: 100,
  wifiGanggu: false,
  taskSelesai: 0,
  gameHour: 12,
  gameMinute: 0,
  isAM: true,
  night: 1,

  doorCheckTotalChecks: 0,
  doorCheckProgress: { pintu_kiri: 0, pintu_kanan: 0 },
  doorCheckCountdown: 80,
  doorCheckTimerActive: false,

  nightTarget() {
    if (this.night === 1) return 15
    if (this.night === 2) return 20
    return 25
  },

  recordAnomaliFound() {
    this.insanity = Math.min(100, this.insanity + 12)
  },

  resetNight() {
    this.insanity            = 0
    this.lapar               = 100
    this.wifiGanggu          = false
    this.taskSelesai         = 0
    this.gameHour            = 12
    this.gameMinute          = 0
    this.isAM                = true
    this.doorCheckTotalChecks = 0
    this.doorCheckProgress   = { pintu_kiri: 0, pintu_kanan: 0 }
    this.doorCheckCountdown  = 80
    this.doorCheckTimerActive = false
  },

  reset() {
    this.poin  = 0
    this.night = 1
    this.resetNight()
  }
}

export default GameState