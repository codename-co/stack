import "aframe";
import { useEffect, useRef } from "react";
import { ForceGraph3D } from "react-force-graph";

export const Graph: React.FC<{
  data?: any;
  width?: number;
  height?: number;
}> = ({ data, width, height }) => {
  const fgRef = useRef<any>(undefined);

  const distance = 1400;
  let angle = 0;
  let cam: NodeJS.Timeout;

  const createCamMovement = () => {
    cam = setInterval(() => {
      // next available frame
      requestAnimationFrame(() => {
        fgRef.current?.cameraPosition({
          x: distance * Math.sin(angle),
          y: distance * Math.cos(angle),
          z: distance * Math.cos(angle),
        });
        angle += Math.PI / 5000;
      });
    }, 10);
  };

  // Initialize the camera position
  useEffect(() => {
    fgRef.current?.cameraPosition({ z: distance });

    createCamMovement();
  }, []);

  return (
    <ForceGraph3D
      ref={fgRef}
      width={width}
      height={height}
      graphData={data}
      backgroundColor="#ffffff00"
      nodeResolution={16}
      nodeAutoColorBy={(node: any) => node.license}
      nodeLabel={(node: any) => (
        <div>
          <b>{node.name}</b>: {node.id}
        </div>
      )}
      onNodeHover={(node: any) => {
        if (!node) {
          createCamMovement();
        } else {
          // pause the orbiting
          clearInterval(cam);
        }
      }}
      // nodeVal={(node: any) => node.stars / 1000}
      showNavInfo={false}
    />
  );
};
