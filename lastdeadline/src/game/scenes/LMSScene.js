import Phaser from "phaser"
import GameState from "./GameState"

export default class LMSScene extends Phaser.Scene {
  constructor() {
    super("LMSScene")
  }

  create() {
    const { width, height } = this.scale

    this.isTransitioning = false
    this.jawabanListener = null
    this.currentSoal     = null
    this.isLoadingSoal   = false
    this.isNilaiing      = false
    this.jawabanInput    = ""

    this.gameBgm = this.playBgm("gameBgm")
    this.lmsBgm  = this.playBgm("lmsBgm")

    const formW = 900
    const formH = 600
    const formX = width  / 2
    const formY = height / 2 + 10
    const tby   = formY - formH / 2

    this.add.rectangle(formX + 6, formY + 6, formW, formH, 0x000000, 0.5)
    this.add.rectangle(formX, formY, formW, formH, 0xf0f0f0)
    this.add.rectangle(formX, tby,           formW, 4, 0xdddddd).setOrigin(0.5, 0)
    this.add.rectangle(formX, formY + formH / 2 - 4, formW, 4, 0x999999).setOrigin(0.5, 0)
    this.add.rectangle(formX - formW / 2, formY, 4, formH, 0xdddddd).setOrigin(0, 0.5)
    this.add.rectangle(formX + formW / 2 - 4, formY, 4, formH, 0x999999).setOrigin(0, 0.5)

    this.add.rectangle(formX, tby + 28, formW, 56, 0x003399)
    this.add.rectangle(formX, tby + 56, formW, 3, 0x001166)
    this.add.text(formX, tby + 28, "LMS ITK", {
      fontSize: "26px", fontFamily: "minecraft", color: "#ffffff", stroke: "#001166", strokeThickness: 3
    }).setOrigin(0.5)

    this.taskCountText = this.add.text(formX - formW / 2 + 20, tby + 28,
      `Tugas: ${GameState.taskSelesai}/${GameState.nightTarget()}`, {
      fontSize: "14px", fontFamily: "minecraft", color: "#aaddff"
    }).setOrigin(0, 0.5)

    this.poinText = this.add.text(formX + formW / 2 - 20, tby + 28,
      `POIN: ${GameState.poin}`, {
      fontSize: "14px", fontFamily: "minecraft", color: "#ffff88"
    }).setOrigin(1, 0.5)

    const iby = tby + 68
    this.add.text(formX - formW / 2 + 14, iby, "STRESS", {
      fontSize: "11px", fontFamily: "minecraft", color: "#cc0000"
    }).setOrigin(0, 0.5)
    this.add.rectangle(formX - formW / 2 + 100, iby, 200, 10, 0xddaaaa).setOrigin(0, 0.5)
    this.insanityBar = this.add.rectangle(formX - formW / 2 + 100, iby,
      (GameState.insanity / 100) * 200, 10, 0xff0000).setOrigin(0, 0.5)
    this.add.rectangle(formX, tby + 88, formW, 2, 0xcccccc)

    const padX  = formX - formW / 2 + 30
    const padX2 = formX + formW / 2 - 30
    const wrapW = formW - 60

    const y1 = tby + 112
    this.topikLabel = this.add.text(formX, y1, "✦ AI Generated", {
      fontSize: "11px", fontFamily: "minecraft", color: "#7744ff"
    }).setOrigin(0.5, 0)

    const y2 = y1 + 22
    this.soalBg = this.add.rectangle(formX, y2 + 55, formW - 40, 110, 0xe8eeff)
      .setStrokeStyle(2, 0x3333aa).setOrigin(0.5)
    this.soalText = this.add.text(formX, y2 + 55, "Memuat soal...", {
      fontSize: "13px", fontFamily: "minecraft", color: "#001166",
      wordWrap: { width: wrapW - 20 }, align: "center"
    }).setOrigin(0.5)

    const y3 = y2 + 126
    this.add.text(padX, y3, "Jawaban kamu:", {
      fontSize: "12px", fontFamily: "minecraft", color: "#555555"
    }).setOrigin(0, 0)

    const y4 = y3 + 20
    this.inputBg = this.add.rectangle(formX, y4 + 32, formW - 40, 64, 0xffffff)
      .setStrokeStyle(2, 0x3366cc).setOrigin(0.5)
    this.inputText = this.add.text(padX, y4 + 5, "", {
      fontSize: "13px", fontFamily: "minecraft", color: "#003399",
      wordWrap: { width: wrapW - 10 }
    }).setOrigin(0, 0)

    const y5 = y4 + 70
    this.nilaiText = this.add.text(formX, y5, "", {
      fontSize: "15px", fontFamily: "minecraft", color: "#003399",
      wordWrap: { width: wrapW }, align: "center"
    }).setOrigin(0.5, 0).setVisible(false)

    this.feedbackText = this.add.text(formX, y5 + 24, "", {
      fontSize: "11px", fontFamily: "minecraft", color: "#226633",
      wordWrap: { width: wrapW }, align: "center"
    }).setOrigin(0.5, 0).setVisible(false)

    const y6 = y5 + 70
    this.submitBg = this.add.rectangle(formX, y6, 200, 36, 0x003399)
      .setStrokeStyle(2, 0x6688ff).setInteractive({ useHandCursor: true }).setDepth(5)
    this.submitTxt = this.add.text(formX, y6, "[ SUBMIT ]", {
      fontSize: "15px", fontFamily: "minecraft", color: "#aaddff"
    }).setOrigin(0.5).setDepth(6)
    this.submitBg.on("pointerover", () => { this.submitBg.setFillStyle(0x0044cc); this.submitTxt.setStyle({ color: "#ffffff" }) })
    this.submitBg.on("pointerout",  () => { this.submitBg.setFillStyle(0x003399); this.submitTxt.setStyle({ color: "#aaddff" }) })
    this.submitBg.on("pointerdown", () => this.submitJawaban())

    this.nextBg = this.add.rectangle(formX, y6, 240, 36, 0x226633)
      .setStrokeStyle(2, 0x44aa66).setInteractive({ useHandCursor: true }).setDepth(5).setVisible(false)
    this.nextTxt = this.add.text(formX, y6, "[ SOAL BERIKUTNYA ]", {
      fontSize: "13px", fontFamily: "minecraft", color: "#aaffaa"
    }).setOrigin(0.5).setDepth(6).setVisible(false)
    this.nextBg.on("pointerover", () => { this.nextBg.setFillStyle(0x338844); this.nextTxt.setStyle({ color: "#ffffff" }) })
    this.nextBg.on("pointerout",  () => { this.nextBg.setFillStyle(0x226633); this.nextTxt.setStyle({ color: "#aaffaa" }) })
    this.nextBg.on("pointerdown", () => this.loadSoalBaru())

    const bBackY = formY + formH / 2 - 28
    this.add.rectangle(formX + 3, bBackY + 3, 170, 36, 0x000000, 0.4)
    const backBtn = this.add.rectangle(formX, bBackY, 170, 36, 0x003399)
      .setStrokeStyle(2, 0x6688ff).setInteractive({ useHandCursor: true }).setDepth(8)
    const backTxt = this.add.text(formX, bBackY, "[ KEMBALI ]", {
      fontSize: "15px", fontFamily: "minecraft", color: "#aaddff",
      stroke: "#001166", strokeThickness: 2
    }).setOrigin(0.5).setDepth(9)
    backBtn.on("pointerover", () => { backBtn.setFillStyle(0x0044cc); backTxt.setStyle({ color: "#ffffff" }) })
    backBtn.on("pointerout",  () => { backBtn.setFillStyle(0x003399); backTxt.setStyle({ color: "#aaddff" }) })
    backBtn.on("pointerdown", () => {
      this.sound.play("appClickSfx", { volume: 0.6 })
      this.cleanupInput()
      this.goToScene("ComputerScene")
    })

    this.notifBg   = this.add.rectangle(width / 2, height * 0.1, 700, 80, 0x003399, 0.95)
      .setStrokeStyle(2, 0x88aaff).setVisible(false).setDepth(20)
    this.notifText = this.add.text(width / 2, height * 0.1, "", {
      fontSize: "15px", fontFamily: "minecraft", color: "#ffffff", align: "center"
    }).setOrigin(0.5).setVisible(false).setDepth(21)

    this.globalTimeLeft = 900
    this.globalTimer = this.time.addEvent({
      delay: 1000, loop: true,
      callback: () => {
        if (!this.scene.isActive("LMSScene")) return
        this.globalTimeLeft--
        if (this.globalTimeLeft <= 0) this.gameOverTime()
      }
    })

    this.wifiWatcher = this.time.addEvent({
      delay: 5000, loop: true,
      callback: () => {
        if (!this.scene.isActive("LMSScene")) return
        if (!GameState.wifiGanggu) return
        if (this.isNilaiing) return
        if (this.jawabanInput.length > 0) return
        this.triggerWifiInterrupt()
      }
    })

    this.setupKeyboard()
    this.loadSoalBaru()
  }

  setupKeyboard() {
    this.jawabanListener = (e) => {
      if (!this.scene.isActive("LMSScene")) return
      if (e.key === "q" || e.key === "Q") { e.stopPropagation(); return }
      if (this.isLoadingSoal || this.isNilaiing) return
      if (!this.currentSoal) return
      if (this.nextBg.visible) return
      if (e.key === "Enter") {
        this.submitJawaban()
      } else if (e.key === "Backspace") {
        this.jawabanInput = this.jawabanInput.slice(0, -1)
        this.updateInputDisplay()
      } else if (e.key.length === 1 && this.jawabanInput.length < 300) {
        this.jawabanInput += e.key
        this.updateInputDisplay()
      }
    }
    window.addEventListener("keydown", this.jawabanListener)
  }

  updateInputDisplay() {
    if (this.inputText) this.inputText.setText(this.jawabanInput)
  }

  async loadSoalBaru() {
    if (this.isLoadingSoal) return
    this.isLoadingSoal = true
    this.currentSoal   = null
    this.jawabanInput  = ""

    this.soalText.setText("Memuat soal dari AI...")
    this.topikLabel.setText("✦ AI Generated")
    this.inputText.setText("")
    this.feedbackText.setVisible(false)
    this.nilaiText.setVisible(false)
    this.nextBg.setVisible(false)
    this.nextTxt.setVisible(false)
    this.submitBg.setVisible(true)
    this.submitTxt.setVisible(true)

    try {
      const res = await fetch("/api/aiProxy?type=generate-soal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ night: GameState.night }),
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error)
      this.currentSoal = json.soal
      this.soalText.setText(json.soal)
      this.topikLabel.setText(`✦ AI • ${json.topik}`)
    } catch (e) {
      this.soalText.setText("Gagal memuat soal. Coba lagi.")
      this.topikLabel.setText("⚠ Koneksi gagal")
    }

    this.isLoadingSoal = false
  }

  async submitJawaban() {
    if (this.isNilaiing || this.isLoadingSoal) return
    if (!this.currentSoal) return
    if (this.jawabanInput.trim().length === 0) {
      GameState.insanity = Math.min(100, GameState.insanity + 10)
      this.insanityBar.width = (GameState.insanity / 100) * 200
      this.sound.play("insanitySfx", { volume: 0.7 })
      this.nilaiText.setText("✗ NILAI: 0/100  Tidak ada jawaban").setStyle({
        fontSize: "15px", fontFamily: "minecraft", color: "#cc0000", wordWrap: { width: 840 }, align: "center"
      }).setVisible(true)
      this.feedbackText.setText("Kamu tidak menjawab soal!").setStyle({
        fontSize: "11px", fontFamily: "minecraft", color: "#884400", wordWrap: { width: 840 }, align: "center"
      }).setVisible(true)
      this.nextBg.setVisible(true)
      this.nextTxt.setVisible(true)
      this.submitBg.setVisible(false)
      this.submitTxt.setVisible(false)
      return
    }
    if (this.jawabanInput.trim().length < 3) {
      this.feedbackText.setText("Jawaban terlalu pendek!").setStyle({
        fontSize: "11px", fontFamily: "minecraft", color: "#cc0000", wordWrap: { width: 840 }, align: "center"
      }).setVisible(true)
      this.nilaiText.setVisible(false)
      return
    }

    this.isNilaiing = true
    this.feedbackText.setText("AI sedang menilai jawaban...").setStyle({
      fontSize: "12px", fontFamily: "minecraft", color: "#884400", wordWrap: { width: 840 }, align: "center"
    }).setVisible(true)
    this.nilaiText.setVisible(false)
    this.submitBg.setVisible(false)
    this.submitTxt.setVisible(false)

    try {
      const res = await fetch("/api/aiProxy?type=nilai-jawaban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ soal: this.currentSoal, jawaban: this.jawabanInput }),
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error)

      const nilai  = json.nilai
      const benar  = nilai >= 60
      const poin   = benar ? Math.round(nilai / 2) : 0

      if (benar) {
        GameState.poin += poin
        GameState.taskSelesai++
        this.taskCountText.setText(`Tugas: ${GameState.taskSelesai}/${GameState.nightTarget()}`)
        this.poinText.setText(`POIN: ${GameState.poin}`)
        this.sound.play("correctSfx", { volume: 0.7 })
        this.nilaiText.setText(`✓ NILAI: ${nilai}/100  +${poin} POIN`).setStyle({
          fontSize: "15px", fontFamily: "minecraft", color: "#226633", wordWrap: { width: 840 }, align: "center"
        }).setVisible(true)
        this.feedbackText.setText(json.feedback || "Jawaban benar!").setStyle({
          fontSize: "12px", fontFamily: "minecraft", color: "#226633", wordWrap: { width: 840 }, align: "center"
        }).setVisible(true)
        if (GameState.taskSelesai >= GameState.nightTarget()) {
          this.time.delayedCall(1500, () => {
            this.showNotif("Target malam ini tercapai!\nBertahanlah hingga jam 5 !", "#00aa44")
          })
        }
      } else {
        GameState.insanity = Math.min(100, GameState.insanity + 10)
        this.insanityBar.width = (GameState.insanity / 100) * 200
        this.sound.play("insanitySfx", { volume: 0.7 })
        this.nilaiText.setText(`✗ NILAI: ${nilai}/100  Jawaban kurang tepat`).setStyle({
          fontSize: "15px", fontFamily: "minecraft", color: "#cc0000", wordWrap: { width: 840 }, align: "center"
        }).setVisible(true)
        this.feedbackText.setText(json.feedback || "Coba lagi dengan jawaban yang lebih lengkap.").setStyle({
          fontSize: "12px", fontFamily: "minecraft", color: "#884400", wordWrap: { width: 840 }, align: "center"
        }).setVisible(true)
        if (GameState.insanity >= 100) {
          this.goToScene("GameOverScene", { msg: "Kamu menggila dan besoknya\ndilarikan ke rumah sakit karena tipes !" })
          return
        }
      }

      this.nextBg.setVisible(true)
      this.nextTxt.setVisible(true)

    } catch (e) {
      this.feedbackText.setText("Gagal menilai. Coba submit lagi.").setStyle({
        fontSize: "12px", fontFamily: "minecraft", color: "#cc0000", wordWrap: { width: 840 }, align: "center"
      }).setVisible(true)
      this.nilaiText.setVisible(false)
      this.submitBg.setVisible(true)
      this.submitTxt.setVisible(true)
    }

    this.isNilaiing = false
  }

  cleanupInput() {
    if (this.jawabanListener) {
      window.removeEventListener("keydown", this.jawabanListener)
      this.jawabanListener = null
    }
  }

  showNotif(msg, color = "#ffffff") {
    if (!this.notifBg || !this.notifText) return
    this.notifBg.setVisible(true)
    this.notifText.setText(msg).setStyle({ color }).setVisible(true)
    this.time.delayedCall(3000, () => {
      if (this.notifBg)   this.notifBg.setVisible(false)
      if (this.notifText) this.notifText.setVisible(false)
    })
  }

  gameOverTime() {
    if (this.globalTimer) this.globalTimer.remove()
    this.cleanupInput()
    this.goToScene("GameOverScene", { msg: "Waktu habis !\nKamu ketiduran sebelum menyelesaikan semua tugas !" })
  }

  triggerWifiInterrupt() {
    if (this.isTransitioning) return
    this.cleanupInput()
    if (this.globalTimer) this.globalTimer.remove()
    if (this.wifiWatcher) this.wifiWatcher.remove()
    const { width, height } = this.scale
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.75).setDepth(50)
    this.add.text(width / 2, height / 2 - 40, "ERROR 404", {
      fontSize: "52px", fontFamily: "minecraft", color: "#ff2200", stroke: "#440000", strokeThickness: 4
    }).setOrigin(0.5).setDepth(51)
    this.add.text(width / 2, height / 2 + 20, "Koneksi terputus !\nLMS tidak dapat diakses.", {
      fontSize: "18px", fontFamily: "minecraft", color: "#ffffff", align: "center", lineSpacing: 8
    }).setOrigin(0.5).setDepth(51)
    this.add.text(width / 2, height / 2 + 80, "Perbaiki WiFi terlebih dahulu...", {
      fontSize: "13px", fontFamily: "minecraft", color: "#ffaa00"
    }).setOrigin(0.5).setDepth(51)
    this.sound.play("insanitySfx", { volume: 0.5 })
    this.time.delayedCall(2500, () => { this.goToScene("ComputerScene") })
  }

  playBgm(key) {
    if (this.sound.get(key)) {
      const existing = this.sound.get(key)
      if (!existing.isPlaying) existing.play()
      return existing
    }
    const bgm = this.sound.add(key, { loop: true, volume: 0.4 })
    bgm.play()
    return bgm
  }

  shutdown() {
    this.cleanupInput()
    if (this.globalTimer) { this.globalTimer.remove(); this.globalTimer = null }
    if (this.wifiWatcher) { this.wifiWatcher.remove(); this.wifiWatcher = null }
    try { if (this.lmsBgm  && this.lmsBgm.isPlaying)  this.lmsBgm.stop() } catch(e) {}
    try { if (this.gameBgm && this.gameBgm.isPlaying)  this.gameBgm.stop() } catch(e) {}
    try {
      const lms = this.sound.get("lmsBgm")
      const bgm = this.sound.get("gameBgm")
      if (lms && lms.isPlaying) lms.stop()
      if (bgm && bgm.isPlaying) bgm.stop()
    } catch(e) {}
  }

  goToScene(key, data = {}) {
    if (this.isTransitioning) return
    this.isTransitioning = true
    this.cleanupInput()
    if (this.lmsBgm && this.lmsBgm.isPlaying) this.lmsBgm.stop()
    if (key === "ComputerScene") {
      this.scene.stop()
      const cs = this.scene.get("ComputerScene")
      if (cs) cs.resumeFromOverlay()
      return
    }
    if (this.gameBgm && this.gameBgm.isPlaying) this.gameBgm.stop()
    this.scene.stop("ComputerScene")
    this.scene.start(key, data)
  }
}