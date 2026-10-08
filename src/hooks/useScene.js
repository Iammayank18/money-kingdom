import { useEffect, useState } from 'react';
import { createScene } from '../scene/scene.js';

/** Creates the three.js world on the given canvas once, and tears it down on unmount. */
export function useScene(canvasRef) {
  const [scene, setScene] = useState(null);
  useEffect(() => {
    const api = createScene(canvasRef.current);
    setScene(api);
    return () => api.dispose && api.dispose();
  }, [canvasRef]);
  return scene;
}
