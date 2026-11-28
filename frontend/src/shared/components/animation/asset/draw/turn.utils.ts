import { assetDragDegrees } from '../asset.constants'
import type { AssetView, Vec3 } from '../asset.types'
import { crossOf, dotOf, normalize } from './vec.utils'

/** A point of the geometry of an asset, turned by the view it is seen from: first about its vertical axis (the yaw), then tipped over about the horizon (the pitch) to show its top. */
export function turnedOf(point: Vec3, view: AssetView): Vec3 {
  const yaw = (view.yaw * Math.PI) / 180
  const pitch = (view.pitch * Math.PI) / 180
  const turnedYaw = {
    x: point.x * Math.cos(yaw) + point.z * Math.sin(yaw),
    y: point.y,
    z: point.z * Math.cos(yaw) - point.x * Math.sin(yaw),
  }
  return {
    x: turnedYaw.x,
    y: turnedYaw.y * Math.cos(pitch) - turnedYaw.z * Math.sin(pitch),
    z: turnedYaw.y * Math.sin(pitch) + turnedYaw.z * Math.cos(pitch),
  }
}

/**
 * The view after a drag turns it: the yaw takes the drag along and wraps around the circle, and the
 * pitch follows it and stops at looking straight down from above or up from below.
 */
export function turnedViewOf(view: AssetView, dx: number, dy: number): AssetView {
  const yaw = view.yaw + dx * assetDragDegrees
  return {
    yaw: ((((yaw + 180) % 360) + 360) % 360) - 180,
    pitch: Math.min(90, Math.max(-90, view.pitch + dy * assetDragDegrees)),
  }
}

/** A point of the space of the view, put back where it stands in the world of the assets: the other way of `turnedOf`, for what faces the one that looks. */
export function unTurnedOf(point: Vec3, view: AssetView): Vec3 {
  const yaw = (view.yaw * Math.PI) / 180
  const pitch = (view.pitch * Math.PI) / 180
  const unPitched = {
    x: point.x,
    y: point.y * Math.cos(pitch) + point.z * Math.sin(pitch),
    z: point.z * Math.cos(pitch) - point.y * Math.sin(pitch),
  }
  return {
    x: unPitched.x * Math.cos(yaw) - unPitched.z * Math.sin(yaw),
    y: unPitched.y,
    z: unPitched.z * Math.cos(yaw) + unPitched.x * Math.sin(yaw),
  }
}

/** A point turned about an axis, by an angle in degrees: how a lid turns about the hinge it hangs on. The axis runs from its origin along its direction. */
export function turnedAbout(
  point: Vec3,
  axis: { origin: Vec3; direction: Vec3 },
  degrees: number,
): Vec3 {
  const angle = (degrees * Math.PI) / 180
  const way = normalize(axis.direction)
  const from = {
    x: point.x - axis.origin.x,
    y: point.y - axis.origin.y,
    z: point.z - axis.origin.z,
  }
  const aside = crossOf(way, from)
  const along = dotOf(way, from)
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return {
    x: axis.origin.x + from.x * cos + aside.x * sin + way.x * along * (1 - cos),
    y: axis.origin.y + from.y * cos + aside.y * sin + way.y * along * (1 - cos),
    z: axis.origin.z + from.z * cos + aside.z * sin + way.z * along * (1 - cos),
  }
}
