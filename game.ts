import "@babylonjs/loaders";
import "@babylonjs/core/Materials/Textures/Loaders/envTextureLoader";
import "@babylonjs/core/Helpers/sceneHelpers";
import "@babylonjs/core/Audio/audioEngine";
import "@babylonjs/core/Audio/audioSceneComponent";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { Vector3, Matrix, Color3, Color4 } from "@babylonjs/core/Maths/math";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/ArcRotateCamera";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { CubeTexture } from "@babylonjs/core/Materials/Textures/cubeTexture";
import { Animation } from "@babylonjs/core/Animations/animation";
import { DracoCompression } from "@babylonjs/core/Meshes/Compression/dracoCompression";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import {
    AssetsManager,
    MeshAssetTask,
    BinaryFileAssetTask,
    CubeTextureAssetTask,
    ImageAssetTask,
} from "@babylonjs/core/Misc/assetsManager";

import { ILoadingScreen } from "@babylonjs/core/Loading";
import { displayDom, selectDom, removeClass, addClass, getUrlParms } from "./helper";
import { CustInput } from "./custInput";
import { Sound } from "@babylonjs/core/Audio/sound";

class Game {
    public canvas: HTMLCanvasElement;
    public engine: Engine;
    _scene: Scene;
    _camera: ArcRotateCamera;
    _light: PointLight;
    _hdrTexture: CubeTexture;
    _t1: string;
    _t2: string;
    _t3: string;

    lengthLabel: Mesh;
    widthLabel: Mesh;
    heightLabel: Mesh;
    ground: Mesh;
    currentModelType: string;
    drawingCanvas: HTMLCanvasElement;
    drawingCtx: CanvasRenderingContext2D;
    showType: number = 0;
    label3Dinfo: any = {
        type1: {
            fxgd: "8500m",
            qfhpjl: "不大于1000m",
            zdfxsd: "130-190km/h",
            qfzdzl: "1600kg",
            gzhz: "450kg",
            xhsj: "大于30h",
            jc: {
                fontSize: 32 * 5,
                size: [240 * 5, 75 * 5],
                text: "全机长 8.7m",
            },
            yz: {
                fontSize: 32 * 5,
                size: [210 * 5, 66 * 5],
                text: "翼展  17.6m",
            },
            jg: {
                fontSize: 28 * 5,
                size: [326 * 5, 76 * 5],
                text: "机高（含起落架） 3.2m",
            },
        },
        type2: {
            fxgd: "9000m",
            qfhpjl: "不大于1200m",
            zdfxsd: "80-280km/h",
            qfzdzl: "4200kg",
            gzhz: "480kg",
            xhsj: "大于28h",
            jc: {
                fontSize: 32,
                size: [240, 74],
                text: "全机长 10.9m",
            },
            yz: {
                fontSize: 32,
                size: [210, 66],
                text: "翼展  20.7m",
            },
            jg: {
                fontSize: 28,
                size: [326, 76],
                text: "机高（含起落架）4m",
            },
        },
    };
    isArmTipEnable: boolean;
    isTimeTipEnable: boolean;
    btnSound: Sound;
    uiMap: Map<string, HTMLImageElement> = new Map<string, HTMLImageElement>();
    loadingMap: Map<string, string> = new Map<string, string>();
    timmer: any;
    first: boolean;
    wd1: Mesh;
    wd2: Mesh;
    constructor(canvasElement: string) {
        this.first = true;
        this.currentModelType = "type2";
        this.canvas = document.getElementById(canvasElement) as HTMLCanvasElement;
        this.drawingCanvas = document.getElementById("drawingLayer") as HTMLCanvasElement;
        this.drawingCtx = this.drawingCanvas.getContext("2d");
        DracoCompression.Configuration.decoder = {
            wasmUrl: "js/draco_wasm_wrapper_gltf.js",
            wasmBinaryUrl: "js/draco_decoder_gltf.wasm",
            fallbackUrl: "js/draco_decoder_gltf.js",
        };

        this.engine = new Engine(this.canvas, true, { stencil: true });
        this.engine.loadingScreen = new MyLoadingScreen();
        this.engine.enableOfflineSupport = false;
        // Database.IDBStorageEnabled = true;
        Engine.audioEngine.useCustomUnlockedButton = true;
        //
        if (window.innerWidth > window.innerHeight) {
            //横屏
            (document.querySelector(".view3dContainer") as HTMLElement).style.cssText =
                "width:" + window.innerWidth + "px;height:" + window.innerHeight + "px;";
            this.engine.setSize(window.innerWidth * 2, window.innerHeight * 2);
        } else {
            //竖屏
            this.engine.setSize(window.innerHeight * 2, window.innerWidth * 2);
            this.drawingCanvas.width = window.innerHeight * 2;
            this.drawingCanvas.height = window.innerWidth * 2;
            (document.querySelector(".view3dContainer") as HTMLElement).style.cssText =
                "width:" +
                window.innerHeight +
                "px;height:" +
                window.innerWidth +
                "px;transform-origin: 0px 0px 0px; transform: matrix(0, 1, -1, 0, " +
                window.innerWidth +
                ", 0);z-index:1";
        }

        document.querySelectorAll(".model-type-btn").forEach((item) => {
            item.addEventListener("click", (currentEvent) => {
                let id = (currentEvent.target as HTMLElement).id;
                removeClass(".btn-type1", "active");
                removeClass(".btn-type2", "active");
                addClass("#" + id, "active");

                let key = parseInt(id.replace("model-type", ""));
                this.currentModelType = "type" + key;
                this.updateLabel3DUI("type" + key);
                if (key == 2) {
                    this.switchTexture(key);
                    this.showType = 0;

                    this.wd1.setEnabled(false);
                    this.wd2.setEnabled(true);
                } else {
                    this.wd2.setEnabled(false);
                    this.wd1.setEnabled(true);
                }
                // this.resetCamerAnimation();
                this.clearDrawingLayer();
                this.playSound();
            });
        });

        selectDom("#" + canvasElement).addEventListener("touchmove", () => {
            // this.clearDrawingLayer();
            addClass(".bottom-panel", "hide");
            this.isArmTipEnable = false;
            this.isTimeTipEnable = false;
            this.first = false;
        });

        selectDom(".i-know").addEventListener("click", () => {
            addClass("#show-video-mask", "hide");
        });

        selectDom("#closeVideoBtn").addEventListener("click", () => {
            (selectDom("#video-intro") as HTMLVideoElement).pause();
            addClass("#show-video-player", "hide");
        });

        selectDom("#know-details-btn").addEventListener("click", () => {
            (selectDom("#video-intro") as HTMLVideoElement).play();
            removeClass("#show-video-player", "hide");
        });
    }

    load(): void {
        displayDom(".loadingContainer", "");
        // selectDom(".loading-current").style.cssText = "width:0%";
        // selectDom(".loadingText").innerText = "加载中...";

        this._scene = new Scene(this.engine);
        this._scene.clearColor = new Color4(0.0, 0.0, 0.0, 0);
        this._scene.imageProcessingConfiguration.contrast = 1.0;
        this._scene.imageProcessingConfiguration.exposure = 1.0;
        this._scene.imageProcessingConfiguration.toneMappingEnabled = true;

        let assetsManager: AssetsManager = new AssetsManager(this._scene);

        assetsManager.addImageTask("size-type1-width", "images/type1/width.png");
        assetsManager.addImageTask("size-type1-height", "images/type1/height.png");
        assetsManager.addImageTask("size-type1-length", "images/type1/length.png");
        assetsManager.addImageTask("size-type2-width", "images/type2/width.png");
        assetsManager.addImageTask("size-type2-height", "images/type2/height.png");
        assetsManager.addImageTask("size-type2-length", "images/type2/length.png");

        assetsManager.addCubeTextureTask("env", "textures/environment.env");
        assetsManager.addBinaryFileTask("t1", "models/1.png");
        assetsManager.addBinaryFileTask("t2", "models/2.png");
        assetsManager.addBinaryFileTask("t3", "models/3.png");
        assetsManager.addMeshTask("wd2", "", "models/feiji/", "feiji.gltf");
        assetsManager.addMeshTask("wd1", "", "models/wd1/", "wd.gltf");

        assetsManager.addBinaryFileTask("audio_btn", "media/btn.mp3");
        // assetsManager.addMeshTask("ground", "", "models/ground/", "ground.gltf");
        assetsManager.onFinish = () => {
            // removeClass("#musicAlert", "hide");
            removeClass(".start-btn", "hide");

            // displayDom(".loadingContainer", "none");
            // this.setupScene();
            // this.canvas.classList.add("active");
        };

        assetsManager.onTaskSuccessObservable.add((task) => {
            if (task.name == "wd2") {
                this.wd2 = (task as MeshAssetTask).loadedMeshes[0] as Mesh;
            }

            if (task.name == "wd1") {
                this.wd1 = (task as MeshAssetTask).loadedMeshes[0] as Mesh;
                // this.wd1.rotationQuaternion = null;
                // this.wd1.rotation.y = (Math.PI / 2) * 3;
                this.wd1.setEnabled(false);
            }

            if (task.name == "env") {
                this._hdrTexture = (task as CubeTextureAssetTask).texture;
            }

            if (task.name == "ground") {
                this.ground = (task as MeshAssetTask).loadedMeshes[0] as Mesh;
                this.ground.setEnabled(false);
            }

            if (task.name == "t1") {
                let blob = new Blob([(task as BinaryFileAssetTask).data]);
                var reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = () => {
                    this._t1 = reader.result as string;
                };
            }
            if (task.name == "t2") {
                let blob = new Blob([(task as BinaryFileAssetTask).data]);
                var reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = () => {
                    this._t2 = reader.result as string;
                };
            }
            if (task.name == "t3") {
                let blob = new Blob([(task as BinaryFileAssetTask).data]);
                var reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = () => {
                    this._t3 = reader.result as string;
                };
            }
            if (task.name.indexOf("audio_btn") > -1) {
                const audioTask = task as BinaryFileAssetTask;
                const loop = false;
                this.btnSound = new Sound("btn", audioTask.data, this._scene, null, {
                    loop: loop,
                });
                this.btnSound.setVolume(0.15);
            }

            if (task.name.indexOf("size") > -1) {
                let img = (task as ImageAssetTask).image;
                this.uiMap.set(task.name, img);
                // if (task.name == "loading-1") {
                //     (selectDom(".loading-bg") as HTMLImageElement).src = url;
                //     removeClass(".loading-bg", "hide");
                // }
            }
        });

        assetsManager.onProgress = (remainingCount, totalCount) => {
            if (remainingCount < 7) {
                let all = totalCount - 15;
                let loaded = totalCount - remainingCount - 15;
                let item = Math.round((loaded / all) * 15) + 2;
                // console.log("loading-" + item);
                // let src = this.loadingMap.get("loading-" + item);
                // (selectDom(".loading-bg") as HTMLImageElement).src = src;
            }
            let per = (100 * (totalCount - remainingCount)) / totalCount;
            let percentage = per.toFixed();
            var text = " " + percentage + "%";
            selectDom(".loading-current").style.cssText = "width:" + percentage + "%";
            if (per > 10) {
                selectDom(".loading-fly").style.cssText = "left:" + percentage + "%";
            }

            selectDom(".loadingText").innerText = text;
        };
        assetsManager.load();
    }
    setupScene(): void {
        // this._scene.environmentTexture = this._hdrTexture;
        this._scene.createDefaultCameraOrLight(true);
        this._camera = this._scene.activeCamera as ArcRotateCamera;

        this._light = new PointLight("pointLight", new Vector3(6, 3, -2), this._scene);
        this._light.intensity = 0;
        this._scene.lights[0].setEnabled(false);

        let custMat = new PBRMaterial("mtl", this._scene);
        custMat.albedoColor = Color3.FromHexString("#98a3ad");
        custMat.metallic = 1.0;
        custMat.roughness = 1.0;
        this._scene.getMeshByName("polySurface97").material = custMat;
        this._scene.getMeshByName("polySurface41").material = custMat;
        this._scene.getMeshByName("polySurface55").material = custMat;
        this._scene.getMeshByName("polySurface71").material = custMat;
        this._scene.getMeshByName("polySurface57").material = custMat;

        // if (getUrlParms("debug") == null)
        // this.goVideo();
        // else
        this.enterScene();
        this.switchTexture(2);
        this.doRender();
    }

    playSound() {
        this.btnSound.play();
    }

    setCameraDefaultPos() {
        this._camera.target.set(0, 3, 0);
        // this._camera.setPosition(new Vector3(21.671129976688086, 5.063555890244604, 10.74778938175888));
        this._camera.setPosition(new Vector3(21.671129976688086, 5.063555890244604, -10.74778938175888));
        this._camera.pinchPrecision = 1000 / this._camera.radius;
        this._camera.upperRadiusLimit = this._camera.radius;
        this._camera.lowerRadiusLimit = this._camera.radius;
        this._camera.lowerBetaLimit = this._camera.beta;
        this._camera.upperBetaLimit = this._camera.beta;
    }

    attachInputs() {
        // Attach the camera to the canvas.
        this._camera.attachControl(this.canvas, false);
        this._camera.inputs.removeByType("ArcRotateCameraPointersInput");
        const input = new CustInput();
        input.multiTouchPanning = false;
        input.pinchDeltaPercentage = 0.001;
        this._camera.inputs.add(input);
    }

    setCameraWingPos() {
        this._camera.target.set(-2.7132414696058653, 2.4238207324663135, 5.481179912647704);
        this._camera.setPosition(new Vector3(8.378710303004318, 4.132949830468578, 6.556796614278294));
    }

    resetCamerAnimation() {
        this._camera.animations = [];

        this._camera.upperRadiusLimit = 1000;
        this._camera.lowerRadiusLimit = 0;
        this._camera.lowerBetaLimit = -Math.PI / 2;
        this._camera.upperBetaLimit = Math.PI / 2;

        var animationPosition = new Animation(
            "animation",
            "position",
            30,
            Animation.ANIMATIONTYPE_VECTOR3,
            Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        // Animation keys and values
        const currentPos = this._camera.position.clone();
        const offset = new Vector3(0, -2, 0);
        const to = currentPos.clone().add(offset);

        animationPosition.setKeys([
            { frame: 0, value: this._camera.position.clone() },
            { frame: 35, value: new Vector3(4, 3, -15) },
            { frame: 60, value: new Vector3(21.671129976688086, 5.063555890244604, -10.74778938175888) },
        ]);
        this._camera.animations.push(animationPosition);
        this._scene.beginAnimation(this._camera, 0, 60, false, 1, () => {
            this._camera.upperRadiusLimit = 1.25 * this._camera.radius;
            this._camera.lowerRadiusLimit = 0.5 * this._camera.radius;
            this._camera.lowerBetaLimit = this._camera.beta;
            this._camera.upperBetaLimit = this._camera.beta;
        });
    }

    logoAni() {
        // this._light.includedOnlyMeshes.push(this._scene.getMeshByName("jishen"));
        this._camera.setPosition(new Vector3(6.325033817604099, 2.913999532535243, -4.588253319274687));
        this._camera.target = new Vector3(3.3522732413098466, 1.5342273577344654, 1.53782094527037);
        this._light.animations = [];
        var animationPosition = new Animation(
            "animation",
            "position",
            30,
            Animation.ANIMATIONTYPE_VECTOR3,
            Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        // Animation keys and values
        animationPosition.setKeys([
            { frame: 0, value: new Vector3(7, 3, -2) },
            { frame: 40, value: new Vector3(5, 3, -2) },
        ]);
        this._light.animations.push(animationPosition);

        var animationIntensity = new Animation(
            "animation",
            "intensity",
            30,
            Animation.ANIMATIONTYPE_FLOAT,
            Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        // Animation keys and values
        animationIntensity.setKeys([
            { frame: 0, value: 3 },
            { frame: 40, value: 0 },
        ]);
        this._light.animations.push(animationIntensity);
        this._scene.beginAnimation(this._light, 0, 40, false, 1, () => {
            this.defaultPosAni();
        });
    }

    wingAni() {
        this._light.includedOnlyMeshes = [];
        this.setCameraWingPos();
        this._light.range = 0;
        this._light.animations = [];
        var animationPosition = new Animation(
            "animation",
            "position",
            20,
            Animation.ANIMATIONTYPE_VECTOR3,
            Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        // Animation keys and values
        animationPosition.setKeys([
            { frame: 0, value: new Vector3(0, 4, 10) },
            { frame: 45, value: new Vector3(0, 4, 6) },
        ]);
        this._light.animations.push(animationPosition);

        var animationIntensity = new Animation(
            "animation",
            "intensity",
            20,
            Animation.ANIMATIONTYPE_FLOAT,
            Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        // Animation keys and values
        animationIntensity.setKeys([
            { frame: 0, value: 6 },
            { frame: 45, value: 0 },
        ]);
        this._light.animations.push(animationIntensity);
        this._scene.beginAnimation(this._light, 0, 45, false, 1, () => {
            this.tailAni();
        });
    }

    tailAni() {
        this._camera.target.set(0, 2.0, 0);
        this._camera.setPosition(new Vector3(-15, 6, 0));
        this._light.range = 0;
        this._light.animations = [];
        var animationPosition = new Animation(
            "animation",
            "position",
            20,
            Animation.ANIMATIONTYPE_VECTOR3,
            Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        // Animation keys and values
        animationPosition.setKeys([
            { frame: 0, value: new Vector3(-12, 4, 0) },
            { frame: 40, value: new Vector3(-2, 4, 0) },
        ]);
        this._light.animations.push(animationPosition);

        var animationIntensity = new Animation(
            "animation",
            "intensity",
            20,
            Animation.ANIMATIONTYPE_FLOAT,
            Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        // Animation keys and values
        animationIntensity.setKeys([
            { frame: 0, value: 10 },
            { frame: 40, value: 0 },
        ]);
        this._light.animations.push(animationIntensity);
        this._scene.beginAnimation(this._light, 0, 40, false, 1, () => {
            this.sideAni();
        });
    }

    sideAni() {
        this._camera.target.set(0, 2.0, 0);
        this._camera.setPosition(new Vector3(9.834084877994243, 3.7832664136594376, 9.66080389250078));
        this._light.range = 0;
        this._light.animations = [];
        var animationPosition = new Animation(
            "animation",
            "position",
            20,
            Animation.ANIMATIONTYPE_VECTOR3,
            Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        // Animation keys and values
        animationPosition.setKeys([
            { frame: 0, value: new Vector3(0, 4, 12) },
            { frame: 40, value: new Vector3(0, 4, -12) },
        ]);
        this._light.animations.push(animationPosition);

        var animationIntensity = new Animation(
            "animation",
            "intensity",
            20,
            Animation.ANIMATIONTYPE_FLOAT,
            Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        // Animation keys and values
        animationIntensity.setKeys([
            { frame: 0, value: 10 },
            { frame: 40, value: 0 },
        ]);
        this._light.animations.push(animationIntensity);
        this._scene.beginAnimation(this._light, 0, 40, false, 1, () => {
            this.logoAni();
        });
    }

    defaultPosAni() {
        this._light.includedOnlyMeshes = [];
        this.setCameraDefaultPos();
        this._light.range = 0;
        this._light.animations = [];
        var animationPosition = new Animation(
            "animation",
            "position",
            20,
            Animation.ANIMATIONTYPE_VECTOR3,
            Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        // Animation keys and values
        animationPosition.setKeys([
            { frame: 0, value: new Vector3(0, 50, 0) },
            { frame: 40, value: new Vector3(0, 10, 0) },
        ]);
        this._light.animations.push(animationPosition);

        var animationIntensity = new Animation(
            "animation",
            "intensity",
            20,
            Animation.ANIMATIONTYPE_FLOAT,
            Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        // Animation keys and values
        animationIntensity.setKeys([
            { frame: 0, value: 20 },
            { frame: 40, value: 500 },
        ]);
        this._light.animations.push(animationIntensity);
        this._scene.beginAnimation(this._light, 0, 40, false, 1, () => {
            this.enterScene();
        });
    }

    enterScene() {
        this.setCameraDefaultPos();
        this.attachInputs();
        this._scene.environmentTexture = this._hdrTexture;
        this._scene.lights[0].setEnabled(true);
        this._light.setEnabled(false);
        this.createUI();
        this.changePhone();
        // this.ground.setEnabled(true);
        displayDom(".bg", "");
        document.querySelectorAll(".ui-element").forEach((item) => {
            removeClass("#" + item.id, "hide");
        });

        setTimeout(() => {
            removeClass("#show-video-mask", "hide");
        }, 10000);
    }

    showLength() {
        var animationPosition = new Animation(
            "animation",
            "position",
            50,
            Animation.ANIMATIONTYPE_VECTOR3,
            Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        // Animation keys and values
        animationPosition.setKeys([
            { frame: 0, value: this._camera.position.clone() },
            { frame: 60, value: new Vector3(-0.6903227158661265, 4.795434571897577, -21.838013319267002) },
        ]);
        this._camera.animations.push(animationPosition);
        this._scene.beginAnimation(this._camera, 0, 60, false, 1, () => {
            addClass("#drawingLayer", "active");
            this.drawLength();
        });
    }

    showWidth() {
        var animationPosition = new Animation(
            "animation",
            "position",
            50,
            Animation.ANIMATIONTYPE_VECTOR3,
            Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        // Animation keys and values
        animationPosition.setKeys([
            { frame: 0, value: this._camera.position.clone() },
            { frame: 60, value: new Vector3(21.67799106187782, 5.993997915475348, 0.0702535563059388) },
        ]);
        this._camera.animations.push(animationPosition);
        this._scene.beginAnimation(this._camera, 0, 60, false, 1, () => {
            addClass("#drawingLayer", "active");
            this.drawWidth();
        });
    }

    showHeight() {
        var animationPosition = new Animation(
            "animation",
            "position",
            50,
            Animation.ANIMATIONTYPE_VECTOR3,
            Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        // Animation keys and values
        animationPosition.setKeys([
            { frame: 0, value: this._camera.position.clone() },
            { frame: 60, value: new Vector3(-20.218778644969138, 5.756187808503041, -5.0614833910222239) },
        ]);
        this._camera.animations.push(animationPosition);
        this._scene.beginAnimation(this._camera, 0, 60, false, 1, () => {
            addClass("#drawingLayer", "active");
            this.drawHeight();
        });
    }

    clearDrawingLayer() {
        // this.showType = 0;
        this.drawingCtx.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
        // removeClass("#btn-height", "active");
        // removeClass("#btn-width", "active");
        // removeClass("#btn-length", "active");
        removeClass("#drawingLayer", "active");
    }

    drawLength() {
        this.drawingCtx.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
        const from = this.toDomPos(new Vector3(-13, 7.5, 0));
        const to = this.toDomPos(new Vector3(12, 7.5, 0));
        let start = from.x < to.x ? from : to;
        let img = this.uiMap.get(`size-${this.currentModelType}-length`);
        let scale = Math.abs(from.x - to.x) / img.width;
        this.drawingCtx.drawImage(
            img, //规定要使用的图像、画布或视频。
            0,
            0,
            img.width,
            img.height, //被剪切图像的高度。
            start.x,
            start.y, //开始剪切的 x 坐标位置。//在画布上放置图像的 x 、y坐标位置。
            img.width * scale,
            img.height * scale //要使用的图像的宽度、高度
        );

        // this.drawMainLine(from, to, 15, this.label3Dinfo[this.currentModelType].jc.text, [from.x + 100, from.y - 50]);
        // this.drawSmallLine(from, to, 15, 8);
    }

    drawWidth() {
        this.drawingCtx.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
        let from = this.toDomPos(new Vector3(0, 8, -12.5));
        let to = this.toDomPos(new Vector3(0, 8, 12.5));
        if (this.currentModelType == "type1") {
            from = this.toDomPos(new Vector3(0, 7, -10));
            to = this.toDomPos(new Vector3(0, 7, 10));
        }

        let img = this.uiMap.get(`size-${this.currentModelType}-width`);
        let scale = Math.abs(from.x - to.x) / img.width;
        this.drawingCtx.drawImage(
            img, //规定要使用的图像、画布或视频。
            0,
            0,
            img.width,
            img.height, //被剪切图像的高度。
            from.x,
            from.y, //开始剪切的 x 坐标位置。//在画布上放置图像的 x 、y坐标位置。
            img.width * scale,
            img.height * scale //要使用的图像的宽度、高度
        );
        // this.drawMainLine(from, to, 15, this.label3Dinfo[this.currentModelType].yz.text, [from.x + 260, from.y - 50]);
        // this.drawSmallLine(from, to, 15, 8);
    }

    drawHeight() {
        this.drawingCtx.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
        const to = this.toDomPos(new Vector3(0, 6, -12));
        const from = this.toDomPos(new Vector3(0, 6, 11));
        let img = this.uiMap.get(`size-${this.currentModelType}-height`);
        let scale = Math.abs(from.x - to.x) / img.width;
        this.drawingCtx.drawImage(
            img, //规定要使用的图像、画布或视频。
            0,
            0,
            img.width,
            img.height, //被剪切图像的高度。
            from.x,
            from.y, //开始剪切的 x 坐标位置。//在画布上放置图像的 x 、y坐标位置。
            img.width * scale,
            img.height * scale //要使用的图像的宽度、高度
        );

        // this.drawingCtx.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
        // const from = this.toDomPos(new Vector3(-5, 4, -2));
        // const to = this.toDomPos(new Vector3(-5, 0, -2));

        // let img = this.uiMap.get(`size-${this.currentModelType}-height`);
        // let scale = Math.abs(from.y - to.y) / img.height;
        // this.drawingCtx.drawImage(
        //     img, //规定要使用的图像、画布或视频。
        //     0,
        //     0,
        //     img.width,
        //     img.height, //被剪切图像的高度。
        //     from.x,
        //     from.y, //开始剪切的 x 坐标位置。//在画布上放置图像的 x 、y坐标位置。
        //     img.width * scale,
        //     img.height * scale //要使用的图像的宽度、高度
        // );

        // this.drawMainLine(from, to, 15, this.label3Dinfo[this.currentModelType].jg.text, [from.x - 120, from.y - 60]);
        // this.drawSmallLine(from, to, 15, 4, true);
    }

    drawMainLine(from: Vector3, to: Vector3, endSize: number, text: string, textPos: Array<number>) {
        this.drawingCtx.shadowBlur = 0;
        this.drawingCtx.strokeStyle = "#01caf7";
        this.drawingCtx.font = "48px Arial";
        this.drawingCtx.strokeText(text, textPos[0], textPos[1]);

        this.drawingCtx.shadowBlur = 10;
        this.drawingCtx.shadowColor = "#fff";
        this.drawingCtx.beginPath();
        this.drawingCtx.lineWidth = 4;
        this.drawingCtx.moveTo(from.x, from.y);
        this.drawingCtx.lineTo(to.x, to.y);
        this.drawingCtx.stroke();

        this.drawingCtx.strokeStyle = "#fff";
        this.drawingCtx.lineWidth = 2;
        // this.drawingCtx.beginPath();
        // this.drawingCtx.moveTo(from.x - endSize, from.y);
        // this.drawingCtx.lineTo(from.x, from.y - endSize);
        // this.drawingCtx.lineTo(from.x + endSize, from.y);
        // this.drawingCtx.lineTo(from.x, from.y + endSize);
        // this.drawingCtx.closePath();
        // this.drawingCtx.stroke();

        // this.drawingCtx.beginPath();
        // this.drawingCtx.moveTo(to.x - endSize, to.y);
        // this.drawingCtx.lineTo(to.x, to.y - endSize);
        // this.drawingCtx.lineTo(to.x + endSize, to.y);
        // this.drawingCtx.lineTo(to.x, to.y + endSize);
        // this.drawingCtx.closePath();
        // this.drawingCtx.stroke();
    }

    drawSmallLine(from: Vector3, to: Vector3, endSize: number, slice: number, isHeight?: boolean) {
        // this.drawingCtx.beginPath();
        // const length = isHeight ? from.y - to.y : to.x - from.x;
        // for (let i = 0; i <= slice; i++) {
        //     if (isHeight) {
        //         this.drawingCtx.moveTo(from.x - endSize * 0.7, to.y + (length / slice) * i);
        //         this.drawingCtx.lineTo(from.x + endSize * 0.7, to.y + (length / slice) * i);
        //     } else {
        //         this.drawingCtx.moveTo(from.x + (length / slice) * i, from.y - endSize * 0.7);
        //         this.drawingCtx.lineTo(from.x + (length / slice) * i, from.y + endSize * 0.7);
        //     }
        // }
        // this.drawingCtx.stroke();

        const length = isHeight ? from.y - to.y : to.x - from.x;
        this.drawingCtx.strokeStyle = "#fff";
        this.drawingCtx.beginPath();
        if (isHeight) {
            // this.drawingCtx.moveTo(from.x - endSize * 0.7, from.y);
            // this.drawingCtx.lineTo(from.x + endSize * 0.7, from.y);

            this.drawingCtx.moveTo(from.x - endSize * 0.5, from.y + endSize);
            this.drawingCtx.lineTo(from.x, from.y);
            this.drawingCtx.lineTo(from.x + endSize * 0.5, from.y + endSize);

            // this.drawingCtx.moveTo(to.x - endSize * 0.7, to.y);
            // this.drawingCtx.lineTo(to.x + endSize * 0.7, to.y);

            this.drawingCtx.moveTo(to.x - endSize * 0.5, to.y - endSize);
            this.drawingCtx.lineTo(to.x, to.y);
            this.drawingCtx.lineTo(to.x + endSize * 0.5, to.y - endSize);
        } else {
            // this.drawingCtx.moveTo(from.x, from.y - endSize * 0.7);
            // this.drawingCtx.lineTo(from.x, from.y + endSize * 0.7);

            this.drawingCtx.moveTo(from.x + endSize, from.y + endSize * 0.5);
            this.drawingCtx.lineTo(from.x, from.y);
            this.drawingCtx.lineTo(from.x + endSize, from.y - endSize * 0.5);

            // this.drawingCtx.moveTo(to.x, to.y - endSize * 0.7);
            // this.drawingCtx.lineTo(to.x, to.y + endSize * 0.7);

            this.drawingCtx.moveTo(to.x - endSize, to.y + endSize * 0.5);
            this.drawingCtx.lineTo(to.x, to.y);
            this.drawingCtx.lineTo(to.x - endSize, to.y - endSize * 0.5);
        }
        this.drawingCtx.stroke();
    }

    switchTexture(idx?: number) {
        let targetTexture = this._t1;
        if (idx == 1 || idx == undefined) {
            targetTexture = this._t1;
        } else if (idx == 2) {
            targetTexture = this._t2;
        } else if (idx == 3) {
            targetTexture = this._t3;
        }

        this.setMtl("1", targetTexture);
        this.setMtl("8", targetTexture);
        this.setMtl("9", targetTexture);
        this.setMtl("7", targetTexture);
    }

    setMtl(id: string, targetTexture: string) {
        ((this._scene.getMaterialByName(id) as PBRMaterial).albedoTexture as Texture).updateURL(targetTexture, null);
    }

    changePhone() {
        (this._scene.getMaterialByName("1") as PBRMaterial).metallic = 1.0;
        (this._scene.getMaterialByName("1") as PBRMaterial).roughness = 1.0;

        (this._scene.getMaterialByName("8") as PBRMaterial).metallic = 1.0;
        (this._scene.getMaterialByName("8") as PBRMaterial).roughness = 1.0;

        (this._scene.getMaterialByName("9") as PBRMaterial).metallic = 1.0;
        (this._scene.getMaterialByName("9") as PBRMaterial).roughness = 1.0;

        (this._scene.getMaterialByName("7") as PBRMaterial).metallic = 1.0;
        (this._scene.getMaterialByName("7") as PBRMaterial).roughness = 1.0;

        this._scene.imageProcessingConfiguration.exposure = 0.8;
    }

    updateLabel3DUI(name: string) {
        const ctx = this.drawingCanvas.getContext("2d");
        ctx.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
        removeClass("#drawingLayer", "active");
    }

    selectInfo() {}

    createUI() {
        this.updateLabel3DUI("type1");
    }

    updateCamera() {
        this.syncUI();

        // if (this.showType > 0) {
        //     if (this.showType == 1) {
        //         this.drawLength();
        //     } else if (this.showType == 2) {
        //         this.drawWidth();
        //     } else if (this.showType == 3) {
        //         this.drawHeight();
        //     }
        // }
    }

    syncUI() {
        const showWidthAlpha = Math.abs(this._camera.alpha % (2 * Math.PI)) < Math.PI / 5;
        const showLengthAlpha =
            (Math.abs(this._camera.alpha % (2 * Math.PI)) > 1.15 &&
                Math.abs(this._camera.alpha % (2 * Math.PI)) < 1.85) ||
            (Math.abs(this._camera.alpha % (2 * Math.PI)) > 4 && Math.abs(this._camera.alpha % (2 * Math.PI)) < 4.85);
        const showParmAlpha =
            Math.abs(this._camera.alpha % (2 * Math.PI)) > 2.5 && Math.abs(this._camera.alpha % (2 * Math.PI)) < 3.7;

        if (!this.first && (showWidthAlpha || showLengthAlpha || showParmAlpha)) {
            addClass("#drawingLayer", "active");
            if (showWidthAlpha) {
                this.drawWidth();
            }
            if (showLengthAlpha) {
                this.drawLength();
            }

            if (showParmAlpha) {
                this.drawHeight();
            }
        } else {
            // if (this.timmer) clearTimeout(this.timmer);
            this.clearDrawingLayer();
        }
    }

    toDomPos(pos: Vector3) {
        return Vector3.Project(
            pos,
            Matrix.Identity(),
            this._scene.getTransformMatrix(),
            this._camera.viewport.toGlobal(this.engine.getRenderWidth(), this.engine.getRenderHeight())
        );
    }

    doRender(): void {
        // Run the render loop.
        this.engine.runRenderLoop(() => {
            this._scene.render();
            this.updateCamera();
        });
    }
}

class MyLoadingScreen implements ILoadingScreen {
    public loadingUIText: string;
    public loadingUIBackgroundColor: any;
    constructor() {
        this.loadingUIText = "";
    }

    displayLoadingUI() {
        //document.querySelector(".loadingText").innerHTML = this.loadingUIText;
    }

    hideLoadingUI() {}
}

export default Game;
