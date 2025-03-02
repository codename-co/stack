import "aframe";
import { useEffect, useRef } from "react";
import { ForceGraph3D } from "react-force-graph";
import SpriteText from "https://esm.sh/three-spritetext";
import Logo from "./Logo";

export const Graph: React.FC<{
  data?: any;
  width?: number;
  height?: number;
}> = ({ data, width, height }) => {
  const fgRef = useRef<any>(undefined);

  let angle = 0;
  let cam: NodeJS.Timeout;

  const createCamMovement = () => {
    cam = setInterval(() => {
      // next available frame
      requestAnimationFrame(() => {
        const pos = fgRef.current.cameraPosition();
        // find the distance from the current camera position, taking into account the angle
        const distance = pos.z ?? 1400;

        // const distance = fgRef.current?.distance;
        fgRef.current?.cameraPosition({
          x: distance * Math.sin(angle),
          y: distance * Math.cos(angle),
          z: distance,
          distance,
        });
        angle += Math.PI / 5000;
      });
    }, 10);
  };

  // Initialize the camera position
  useEffect(() => {
    fgRef.current?.cameraPosition({ z: 1400 });

    createCamMovement();
  }, []);

  return (
    <ForceGraph3D
      ref={fgRef}
      width={width}
      height={height}
      graphData={data}
      nodeThreeObject={(node) => {
        const sprite = new SpriteText(<Logo slug={node.slug} />);
        sprite.color = node.color;
        sprite.textHeight = 8;
        return sprite;
      }}
      backgroundColor="#ffffff00"
      // nodeColor={(node: any) => node.color}
      nodeResolution={16}
      nodeAutoColorBy={(node: any) => node.license}
      nodeLabel={(node: any) => (
        <div>
          <b>{node.name}</b>: {node.id}
          {JSON.stringify(node)}
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
      onNodeClick={(node: any) => {
        location.href = node.path;
      }}
      // nodeVal={(node: any) => node.stars / 1000}
      showNavInfo={false}
    />
  );
};
