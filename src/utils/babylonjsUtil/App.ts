import * as TYPES from './type'

export default class App {
  private _scene: BABYLON.Scene;
  private _canvas: HTMLCanvasElement;
  private _engine: BABYLON.Engine;

  //Scene - related
  private _state: number = 0;

  commonUrl: string = `${import.meta.env.VITE_BASE_URL}model/`;
  ALL_SCALE: number = 0.1;

  constructor () {
    console.time()
    const canvas = this._canvas = document.querySelector('#renderCanvas') as HTMLCanvasElement;

    // initialize babylon scene and engine
    var engine = this._engine = new BABYLON.Engine(canvas, true);
    engine.enableOfflineSupport = false // 关闭索引数据库
    engine.doNotHandleContextLost = true // 关闭对上下文丢失恢复的支持
    this._engine.displayLoadingUI(); // loading
    var scene = this._scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.1, 0.1, 0.1, 0);

    var camera: BABYLON.ArcRotateCamera = new BABYLON.ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 2, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);
    camera.minZ = 0.1
    var light1: BABYLON.HemisphericLight = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);

    // hide/show the Inspector
    window.addEventListener("keydown", (ev) => {
        // Shift+Ctrl+I
        if (ev.shiftKey && ev.ctrlKey && ev.keyCode === 73) {
            if (scene.debugLayer.isVisible()) {
                scene.debugLayer.hide();
            } else {
                scene.debugLayer.show();
            }
        }
    });
    window.addEventListener('resize', () => {
        this._engine.resize();
    });

    // run the main render loop
    engine.runRenderLoop(() => {
        scene.render();
    });

    this.main()
  }

  async main () {
    BABYLON.DracoCompression.Configuration = {
      decoder: {
        wasmUrl: `${window.location.origin}${this.commonUrl}babylonFile/draco_wasm_wrapper_gltf.js`,
        wasmBinaryUrl: `${window.location.origin}${this.commonUrl}babylonFile/draco_decoder_gltf.wasm`,
        fallbackUrl: `${window.location.origin}${this.commonUrl}babylonFile/draco_decoder_gltf.js`
      }
    }
    BABYLON.MeshoptCompression.Configuration = {
      decoder: {
        url: `${window.location.origin}${this.commonUrl}babylonFile/meshopt_decoder.js`
      }
    }
    BABYLON.BasisTools.JSModuleURL = `${window.location.origin}${this.commonUrl}babylonFile/basis_transcoder.js`
    BABYLON.BasisTools.WasmModuleURL = `${window.location.origin}${this.commonUrl}babylonFile/basis_transcoder.wasm`
    BABYLON.KhronosTextureContainer2.URLConfig.jsDecoderModule = `${window.location.origin}${this.commonUrl}babylonFile/babylon.ktx2Decoder.js`
    BABYLON.KhronosTextureContainer2.URLConfig.wasmUASTCToASTC = `${window.location.origin}${this.commonUrl}babylonFile/uastc_astc.wasm`
    BABYLON.KhronosTextureContainer2.URLConfig.wasmUASTCToBC7 = `${window.location.origin}${this.commonUrl}babylonFile/uastc_bc7.wasm`
    BABYLON.KhronosTextureContainer2.URLConfig.jsMSCTranscoder = `${window.location.origin}${this.commonUrl}babylonFile/msc_basis_transcoder.js`
    BABYLON.KhronosTextureContainer2.URLConfig.wasmMSCTranscoder = `${window.location.origin}${this.commonUrl}babylonFile/msc_basis_transcoder.wasm`

    this.createSkyBox(`${this.commonUrl}textures/skybox`)
    await this.loadBuilding()

    console.timeEnd()
    this._engine.hideLoadingUI();
  }

  remove() {
    this._scene.dispose()
  }

  loadBuilding () {
    const node = new BABYLON.TransformNode('building')
    return Promise.all([
      this.addModelToScene({ url: 'nightView/map_level8.glb', parent: node }),
      this.addModelToScene({ url: 'nightView/building0616.glb', parent: node, collisions: true }),
      this.addModelToScene({ url: 'nightView/设备.glb', parent: node }),
      this.addModelToScene({ url: 'nightView/道路名字0629.glb', parent: node }),
      this.addModelToScene({ url: 'nightView/road_0701.glb', parent: node })
    ])
    // this.addModelToScene({ url: 'nightView/隧道.glb', parent: node, callback: m => {
    //   m[0].position.y = 5
    // } })
  }

  addModelToScene (data: TYPES.ModelToScene) {
    return new Promise(resolve => {
      const { url, id, callback, parent, collisions } = data || {}
      // if (!node) node = new BABYLON.TransformNode('CloneGroup')
      BABYLON.SceneLoader.ImportMesh('', `${this.commonUrl}`, url, this._scene, (mesh, particleSystems, skeletons) => {
        const model = mesh[0]
        model.id = model.name = id || ''
        // 整体倍率
        model.scaling.z *= this.ALL_SCALE
        model.scaling.y *= this.ALL_SCALE
        model.scaling.x *= this.ALL_SCALE
        // 转左手坐标系
        model.scaling.z *= -1
        model.scaling.x *= -1
  
        model.rotation = new BABYLON.Vector3(0, 0, 0)
        model.isPickable = false;
        setTimeout(() => {
          model.getChildMeshes().forEach(v => {
            v.isPickable = false;
            if (v.material) v.material.freeze();
            if (collisions) v.checkCollisions = true;
          })
        }, 1000);
        if (parent) model.parent = parent
        callback && callback(mesh, particleSystems, skeletons)
        resolve(mesh)
      })
    })
  }

  createSkyBox (path = this.commonUrl, size = 30960) {
    const skybox = BABYLON.MeshBuilder.CreateBox('skyBox', { size: size * this.ALL_SCALE }, this._scene)
    const skyboxMaterial = new BABYLON.StandardMaterial('skyBox', this._scene)
    skyboxMaterial.backFaceCulling = false
    // 消除盒子上的所有光反射
    skyboxMaterial.disableLighting = true
    // 天空盒跟随相机的位置 true：不跟随相机运动，false：根据相机运动
    skybox.infiniteDistance = false
    skybox.isPickable = false
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture(path, this._scene)
    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE
    skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0)
    skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0)
    skyboxMaterial.freeze()
    skybox.material = skyboxMaterial
    skybox.freezeWorldMatrix()
    // Skybox 渲染在其他所有内容之后，skybox 设置为 0， 并将所有其他可渲染对象设置为 大于零
    // skybox.renderingGroupId = 0
    // 显示
    const show = () => {
      skybox.isVisible = true
    }
    // 隐藏
    const hide = () => {
      skybox.isVisible = false
    }
    // 移除
    const remove = () => {
      skybox.dispose()
    }
    return {
      instance: skybox,
      show,
      hide,
      remove
    }
  }
}