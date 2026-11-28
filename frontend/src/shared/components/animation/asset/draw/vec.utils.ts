import type { Vec3 } from '../asset.types'

/** A vector of the geometry of an asset, made as long as one unit of its frame: the way it points, without how far it reaches. */
export function normalize(vector: Vec3): Vec3 {
  const length = Math.hypot(vector.x, vector.y, vector.z)
  return length === 0
    ? vector
    : { x: vector.x / length, y: vector.y / length, z: vector.z / length }
}

/** The vector that lies across two others. */
export function crossOf(a: Vec3, b: Vec3): Vec3 {
  return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x }
}

/** How far two vectors run along one another. */
export function dotOf(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z
}
