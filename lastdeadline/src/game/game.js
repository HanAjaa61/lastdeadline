import Phaser from "phaser"
import PermissionScene from "./scenes/PermissionScene"
import HeadphoneScene from "./scenes/HeadphoneScene"
import BootScene from "./scenes/BootScene"
import MenuScene from "./scenes/MenuScene"
import GuideScene from "./scenes/GuideScene"
import ClockScene from "./scenes/ClockScene"
import GameScene from "./scenes/GameScene"
import ComputerScene from "./scenes/ComputerScene"
import LMSScene from "./scenes/LMSScene"
import WiFiScene from "./scenes/WIFIScene"
import GoputScene from "./scenes/GoputScene"
import Scene2 from "./scenes/Scene2"
import CekPintu from "./scenes/CekPintu"
import LemariScene from "./scenes/LemariScene"
import CCTVScene from "./scenes/CCTVScene"
import JumpscareScene from "./scenes/JumpscareScene"
import FinalScene from "./scenes/FinalScene"
import GameOverScene from "./scenes/GameOverScene"

export function startGame(containerId) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: containerId,

    scale: {
      mode: Phaser.Scale.ENVELOP,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 1280,
      height: 720
    },

    backgroundColor: "#000000",
    pixelArt: true,
    roundPixels: true,
    scene: [
      PermissionScene, HeadphoneScene, BootScene, MenuScene, GuideScene, ClockScene,
      GameScene, ComputerScene, LMSScene, WiFiScene, GoputScene,
      Scene2, CekPintu, LemariScene, CCTVScene,
      JumpscareScene, FinalScene, GameOverScene
    ]
  })
}