export interface ModelToScene {
  url: string
  id?: string
  parent?: BABYLON.TransformNode | BABYLON.Mesh
  callback?: (...r: any[]) => void
  collisions?: boolean
}