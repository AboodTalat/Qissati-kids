import { useEffect, useLayoutEffect } from 'react';
import { useThree } from '@react-three/fiber';

// For <ThreeCanvas frameloop="never">: apply the camera for this frame, then paint
// explicitly. Without the explicit render, paused and backward Studio seeks keep
// showing a stale WebGL frame (the pattern R18–R24 settled on).
//
// `apply(camera)` receives the Three.js camera; set position/target/fov there.
export function FrameCommit({ frame, apply }) {
  const { camera, scene, gl } = useThree();
  useLayoutEffect(() => {
    apply?.(camera);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);
  }, [apply, camera, frame]);
  useEffect(() => {
    scene.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
    gl.render(scene, camera);
  }, [scene, camera, gl, frame]);
  return null;
}
