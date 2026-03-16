import Phaser from "phaser"

export default class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene")
  }

  preload() {
    this.load.image("logo", "/assets/devlogo.png")
    this.load.audio("menuBgm",      "/assets/bgm.mp3")
    this.load.audio("hoverSfx",     "/assets/hover.mp3")
    this.load.audio("clickSfx",     "/assets/click.mp3")
    this.load.audio("appClickSfx",  "/assets/mouseclick.mp3")
    this.load.audio("clockTick",    "/assets/clock.wav")
    this.load.audio("gameBgm",      "/assets/gamebgm.mp3")
    this.load.audio("wifiSfx",      "/assets/wifi.mp3")
    this.load.audio("buySfx",       "/assets/buy.mp3")
    this.load.audio("adzan",        "/assets/adzan.mp3")
    this.load.audio("gameOverSfx",  "/assets/gameover.mp3")
    this.load.audio("insanitySfx",  "/assets/scream.mp3")
    this.load.audio("chairdragSfx", "/assets/chair.mp3")
    this.load.audio("laparSfx",     "/assets/lapar.mp3")
    this.load.audio("lmsBgm",       "/assets/lmsbgm.mp3")
    this.load.audio("correctSfx",    "/assets/correctsfx.mp3")
    this.load.audio("notifErrorSfx", "/assets/notiferror.mp3")
    this.load.audio("glitchSfx",       "/assets/glitch.mp3")
    this.load.audio("jumpscareAudio",  "/assets/jumpscare.mp3")
    this.load.audio("flashlightSfx",   "/assets/flashlight.mp3")
    this.load.audio("doorCloseSfx",    "/assets/doorclose.mp3")
    this.load.audio("anomaliSfx",      "/assets/anomali.mp3")
    this.load.audio("ambience",        "/assets/ambience.mp3")
    // SFX Lemari
    this.load.audio("heartbeatSfx",  "/assets/heartbeat.mp3")
    this.load.audio("breathSfx",     "/assets/breath.mp3")
    this.load.audio("monsterSfx1",   "/assets/monster1.mp3")
    this.load.audio("monsterSfx2",   "/assets/monster2.mp3")
    this.load.audio("monsterSfx3",   "/assets/monster3.mp3")
    this.load.video("menuVideo",      "/assets/menu.mp4",      "loadeddata", false, true)
    this.load.video("jumpscareVideo", "/assets/jumpscare.mp4", "loadeddata", false, true)
    this.load.image("scene1off",    "/assets/scene1off.jpeg")
    this.load.image("scene1on",     "/assets/scene1on.jpeg")
    this.load.image("computerBg",   "/assets/komputer.png")
    this.load.image("icon1", "/assets/icon1.png")
    this.load.image("icon2", "/assets/icon2.png")
    this.load.image("icon3", "/assets/icon3.png")
    this.load.image("mieAyam",    "/assets/mieayam.png")
    this.load.image("ayamGeprek", "/assets/ayamgeprek.png")
    this.load.image("kopi",       "/assets/kopi.png")
    this.load.image("scene2off",      "/assets/scene2off.png")
    this.load.image("scene2on",       "/assets/scene2on.png")
    this.load.image("cekpintuoff",    "/assets/cekpintuoff.png")
    this.load.image("cekpintuon",     "/assets/cekpintuon.png")
    this.load.image("anomali1",       "/assets/anomali1.png")
    this.load.image("anomali2",       "/assets/anomali2.png")
    this.load.image("anomali3",       "/assets/anomali3.png")
    this.load.image("cctv",        "/assets/cctv.png")
    this.load.image("cam1normal",  "/assets/cam1normal.png")
    this.load.image("cam1dark",    "/assets/cam1dark.png")
    this.load.image("cam1anomali", "/assets/cam1anomali.png")
    this.load.image("cam2normal",  "/assets/cam2normal.png")
    this.load.image("cam2dark",    "/assets/cam2dark.png")
    this.load.image("cam2anomali", "/assets/cam2anomali.png")
    this.load.image("cam3normal",  "/assets/cam3normal.png")
    this.load.image("cam3dark",    "/assets/cam3dark.png")
    this.load.image("cam3anomali", "/assets/cam3anomali.png")
    this.load.audio("spectaSfx",   "/assets/specta.mp3")
    this.load.audio("cctvsfx",     "/assets/cctvnoise.mp3")
    this.load.audio("cctvOpenSfx", "/assets/cctvnoise.mp3")
    this.load.video("cctvNoise",   "/assets/cctvnoise.mp4")
    this.load.image("anomalikanan", "/assets/anomalikanan.png")
    this.load.image("anomalikiri", "/assets/anomalikiri.png")
    this.load.image("lemari",       "/assets/lemari.png")
  }

  create() {
    const { width, height } = this.scale
    this.cameras.main.setBackgroundColor("#000000")
    const logo = this.add.image(width / 2, height / 2, "logo")
    logo.setAlpha(0)
    this.tweens.add({ targets: logo, alpha: 1, duration: 1500 })
    this.input.once("pointerdown", () => {
      if (this.sound.context && this.sound.context.state === "suspended") {
        this.sound.context.resume()
      }
    })
    this.time.delayedCall(2500, () => {
      this.cameras.main.fadeOut(1500, 0, 0, 0)
    })
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("MenuScene")
    })
  }
}