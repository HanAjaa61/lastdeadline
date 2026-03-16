import Phaser from "phaser"
import GameState from "./GameState"

export default class WIFIScene extends Phaser.Scene {
  constructor() {
    super("WIFIScene")
  }

  create() {
    const { width, height } = this.scale

    this.isTransitioning = false
    this.mazeCompleted = 0
    this.MAZE_REQUIRED = 3
    this.anxiety       = 0
    this.isDrawing     = false
    this.pathGraphics  = null
    this.mazeGroup     = null

    this.gameBgm = this.playBgm()

    this.input.keyboard.on("keydown-Q", (e) => { e.stopPropagation() })

    this.add.rectangle(0, 0, width, height, 0x0d1a0d).setOrigin(0)

    const formW = 860
    const formH = 580
    const formX = width / 2
    const formY = height / 2 + 10

    this.add.rectangle(formX + 6, formY + 6, formW, formH, 0x000000, 0.5)
    this.add.rectangle(formX, formY, formW, formH, 0xf0f5f0)
    this.add.rectangle(formX, formY - formH / 2,     formW, 4, 0xcceecc).setOrigin(0.5, 0)
    this.add.rectangle(formX, formY + formH / 2 - 4, formW, 4, 0x779977).setOrigin(0.5, 0)
    this.add.rectangle(formX - formW / 2, formY, 4, formH, 0xcceecc).setOrigin(0, 0.5)
    this.add.rectangle(formX + formW / 2 - 4, formY, 4, formH, 0x779977).setOrigin(0, 0.5)

    const tby = formY - formH / 2
    this.add.rectangle(formX, tby + 28, formW, 56, 0x115511)
    this.add.rectangle(formX, tby + 56, formW, 3, 0x003300)

    this.add.text(formX, tby + 28, "WiFi - PERBAIKAN JARINGAN", {
      fontSize: "22px", fontFamily: "minecraft", color: "#ffffff",
      stroke: "#002200", strokeThickness: 3
    }).setOrigin(0.5)

    this.progressText = this.add.text(formX + formW / 2 - 20, tby + 28,
      `Selesai: 0/${this.MAZE_REQUIRED}`, {
      fontSize: "14px", fontFamily: "minecraft", color: "#aaffaa"
    }).setOrigin(1, 0.5)

    const iby = tby + 68
    this.add.text(formX - formW / 2 + 14, iby, "ANXIETY", {
      fontSize: "11px", fontFamily: "minecraft", color: "#cc4400"
    }).setOrigin(0, 0.5)
    this.add.rectangle(formX - formW / 2 + 100, iby, 200, 10, 0xddbbaa).setOrigin(0, 0.5)
    this.anxietyBar = this.add.rectangle(formX - formW / 2 + 100, iby, 0, 10, 0xff5500).setOrigin(0, 0.5)

    this.add.rectangle(formX, tby + 88, formW, 2, 0xbbddbb)
    this.add.text(formX, tby + 106, "Tahan klik lalu ikuti jalur dari  S  ke  F  tanpa melepas !", {
      fontSize: "13px", fontFamily: "minecraft", color: "#224422"
    }).setOrigin(0.5)
    this.add.rectangle(formX, tby + 120, formW - 40, 2, 0xccddcc).setOrigin(0.5)

    const bBackY = formY + formH / 2 - 28
    this.add.rectangle(formX + 3, bBackY + 3, 170, 36, 0x000000, 0.4)
    const backBtn = this.add.rectangle(formX, bBackY, 170, 36, 0x115511)
      .setStrokeStyle(2, 0x44aa44).setInteractive({ useHandCursor: true }).setDepth(8)
    const backTxt = this.add.text(formX, bBackY, "[ KEMBALI ]", {
      fontSize: "15px", fontFamily: "minecraft", color: "#aaffaa",
      stroke: "#002200", strokeThickness: 2
    }).setOrigin(0.5).setDepth(9)

    backBtn.on("pointerover", () => { backBtn.setFillStyle(0x226622); backTxt.setStyle({ color: "#ffffff" }) })
    backBtn.on("pointerout",  () => { backBtn.setFillStyle(0x115511); backTxt.setStyle({ color: "#aaffaa" }) })
    backBtn.on("pointerdown", () => {
      this.sound.play("appClickSfx", { volume: 0.6 })
      this.clearMaze()
      this.goToScene("ComputerScene")
    })

    this.notifBg = this.add.rectangle(formX, formY, 520, 76, 0x000000, 0.92)
      .setVisible(false).setDepth(10)
    this.notifText = this.add.text(formX, formY, "", {
      fontSize: "16px", fontFamily: "minecraft", color: "#ffffff", align: "center"
    }).setOrigin(0.5).setVisible(false).setDepth(11)

    if (!GameState.wifiGanggu) {
      this.add.rectangle(formX, formY - 20, 500, 80, 0xeeffee).setStrokeStyle(2, 0x44aa44)
      this.add.text(formX, formY - 20, "Kondisi jaringan baik", {
        fontSize: "24px", fontFamily: "minecraft", color: "#115511"
      }).setOrigin(0.5)
      return
    }

    this.buildMaze()
  }

  shutdown() {
    this.clearMaze()
  }

  playBgm() {
    if (this.sound.get("gameBgm")) {
      const existing = this.sound.get("gameBgm")
      if (!existing.isPlaying) existing.play()
      return existing
    }
    const bgm = this.sound.add("gameBgm", { loop: true, volume: 0.4 })
    bgm.play()
    return bgm
  }

  buildMaze() {
    const { width, height } = this.scale
    this.clearMaze()
    this.mazeGroup = this.add.group()
    this.isDrawing = false

    const formX = width / 2
    const formY = height / 2 + 10
    const tby   = formY - 580 / 2

    const CELL = 34
    const COLS = 13
    const ROWS = 9
    const ox   = formX - (COLS * CELL) / 2
    const oy   = tby + 130

    this.mazePath = this.generatePath(COLS, ROWS)
    const pathSet = new Set(this.mazePath.map(p => `${p.r},${p.c}`))

    const gfx = this.add.graphics()
    this.mazeGroup.add(gfx)

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const px = ox + c * CELL
        const py = oy + r * CELL
        if (pathSet.has(`${r},${c}`)) {
          gfx.fillStyle(0xddeedd, 1)
          gfx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2)
          gfx.lineStyle(1, 0x88bb88)
          gfx.strokeRect(px + 1, py + 1, CELL - 2, CELL - 2)
        } else {
          gfx.fillStyle(0x334433, 1)
          gfx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2)
        }
      }
    }

    const start  = this.mazePath[0]
    const finish = this.mazePath[this.mazePath.length - 1]
    const sx = ox + start.c  * CELL + CELL / 2
    const sy = oy + start.r  * CELL + CELL / 2
    const fx = ox + finish.c * CELL + CELL / 2
    const fy = oy + finish.r * CELL + CELL / 2

    const sLabel = this.add.text(sx, sy, "S", { fontSize: "16px", fontFamily: "minecraft", color: "#115511" }).setOrigin(0.5)
    const fLabel = this.add.text(fx, fy, "F", { fontSize: "16px", fontFamily: "minecraft", color: "#cc2222" }).setOrigin(0.5)
    this.mazeGroup.add(sLabel)
    this.mazeGroup.add(fLabel)
    if (this.pathGraphics) this.pathGraphics.destroy()
    this.pathGraphics = this.add.graphics()

    this.mazeData = { ox, oy, CELL, COLS, ROWS, pathSet, sx, sy, fx, fy }
    this.bindMazeInput()
  }

  bindMazeInput() {
    this.clearMazeListeners()

    const { sx, sy, fx, fy, ox, oy, CELL, pathSet } = this.mazeData

    this._onDown = (ptr) => {
      if (this.isTransitioning) return
      if (Phaser.Math.Distance.Between(ptr.x, ptr.y, sx, sy) < CELL) {
        this.isDrawing = true
        this.pathGraphics.clear()
        this.pathGraphics.lineStyle(5, 0x22aa44, 1)
        this.pathGraphics.beginPath()
        this.pathGraphics.moveTo(ptr.x, ptr.y)
      }
    }

    this._onMove = (ptr) => {
      if (!this.isDrawing || this.isTransitioning) return
      const col = Math.floor((ptr.x - ox) / CELL)
      const row = Math.floor((ptr.y - oy) / CELL)
      if (!pathSet.has(`${row},${col}`)) {
        this.isDrawing = false
        this.pathGraphics.clear()
        this.wrongPath()
        return
      }
      this.pathGraphics.lineTo(ptr.x, ptr.y)
      this.pathGraphics.strokePath()
      this.pathGraphics.beginPath()
      this.pathGraphics.moveTo(ptr.x, ptr.y)
      if (Phaser.Math.Distance.Between(ptr.x, ptr.y, fx, fy) < CELL) {
        this.isDrawing = false
        this.mazeSolved()
      }
    }

    this._onUp = () => {
      if (!this.isDrawing || this.isTransitioning) return
      this.isDrawing = false
      this.pathGraphics.clear()
      this.wrongPath()
    }

    this.input.on("pointerdown", this._onDown)
    this.input.on("pointermove", this._onMove)
    this.input.on("pointerup",   this._onUp)
  }

  clearMazeListeners() {
    if (this._onDown) { this.input.off("pointerdown", this._onDown); this._onDown = null }
    if (this._onMove) { this.input.off("pointermove", this._onMove); this._onMove = null }
    if (this._onUp)   { this.input.off("pointerup",   this._onUp);   this._onUp   = null }
  }

  generatePath(cols, rows) {
    const path = []
    let r = Phaser.Math.Between(1, rows - 2), c = 0
    path.push({ r, c })
    while (c < cols - 1) {
      const dir = Phaser.Math.Between(0, 2)
      if      (dir === 0 && r > 1)        { r--; path.push({ r, c }) }
      else if (dir === 1 && r < rows - 2) { r++; path.push({ r, c }) }
      else                                { c++; path.push({ r, c }) }
    }
    return path
  }

  mazeSolved() {
    this.mazeCompleted++
    this.progressText.setText(`Selesai: ${this.mazeCompleted}/${this.MAZE_REQUIRED}`)
    this.pathGraphics.clear()
    this.sound.play("correctSfx", { volume: 0.8 })
    if (this.mazeCompleted >= this.MAZE_REQUIRED) {
      GameState.wifiGanggu = false
      this.showNotif("WiFi berhasil diperbaiki !", "#00cc55")
      this.time.delayedCall(2000, () => this.goToScene("ComputerScene"))
    } else {
      this.showNotif(`${this.MAZE_REQUIRED - this.mazeCompleted} labirin lagi !`, "#22aa44")
      this.time.delayedCall(1500, () => this.buildMaze())
    }
  }

  wrongPath() {
    if (this.isTransitioning) return
    this.anxiety = Math.min(100, this.anxiety + 20)
    this.anxietyBar.width = (this.anxiety / 100) * 200
    this.sound.play("insanitySfx", { volume: 0.7 })
    this.showNotif("Jalur terlepas ! Mulai dari awal.", "#ff6600")
    if (this.anxiety >= 100) {
      this.goToScene("GameOverScene", { msg: "Kamu gagal memperbaiki wifi\ndan tugasmu melewati deadline !" })
      return
    }
    this.time.delayedCall(1000, () => {
      if (!this.isTransitioning) this.buildMaze()
    })
  }

  clearMaze() {
    this.clearMazeListeners()
    if (this.mazeGroup) { this.mazeGroup.destroy(true); this.mazeGroup = null }
    if (this.pathGraphics) { this.pathGraphics.destroy(); this.pathGraphics = null }
    this.isDrawing = false
  }

  showNotif(msg, color = "#ffffff") {
    if (!this.notifBg || !this.notifText) return
    this.notifBg.setVisible(true)
    this.notifText.setText(msg).setStyle({ color }).setVisible(true)
    this.time.delayedCall(2500, () => {
      if (this.notifBg)   this.notifBg.setVisible(false)
      if (this.notifText) this.notifText.setVisible(false)
    })
  }

  goToScene(key, data = {}) {
    if (this.isTransitioning) return
    this.isTransitioning = true
    this.clearMaze()

    if (key === "ComputerScene") {
      this.scene.stop("WIFIScene")
      const cs = this.scene.get("ComputerScene")
      if (cs) cs.resumeFromOverlay()
      return
    }
    if (this.gameBgm && this.gameBgm.isPlaying) this.gameBgm.stop()
    this.scene.stop("ComputerScene")
    this.scene.start(key, data)
  }
}