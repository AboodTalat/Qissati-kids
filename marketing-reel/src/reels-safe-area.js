// Conservative production bounds, in the 1080 × 1920 composition.
// 300px top / 690px bottom; equal 180px side margins clear Instagram's
// action rail while keeping the visual axis at the true frame centre, x=540.
// Background decoration may extend outside these.
// Also inside a centred 4:5 feed crop (y=285…1635).
export const REELS_SAFE_AREA = {
  x: 180,
  y: 300,
  width: 720,
  height: 930,
  right: 900,
  bottom: 1230,
};
