import type { RefObject } from "react";

export default function GroundPlane({
  pointer,
}: {
  pointer: RefObject<{
    x: number;
    y: number;
    isDown: boolean;
    button: number | null;
  }>;
}) {
  return (
    <mesh
      onPointerMove={(e) => {
        pointer.current.x = e.point.x;
        pointer.current.y = e.point.y;
      }}
    >
      <planeGeometry args={[50, 50, 1, 1]} />
      <meshBasicMaterial visible={false} />
    </mesh>
  );
}
