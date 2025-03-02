import "aframe";
import { useEffect, useRef } from "react";
import { ForceGraph3D } from "react-force-graph";
import { iconOf } from "~helpers/icon";

const { CSS3DRenderer, CSS3DObject } = await import(
  "three/examples/jsm/renderers/CSS3DRenderer.js"
);

type GraphNode = {
  id: string;
  type: string;
  name: string;
  icon?: string;
  path: string;
  val?: number;
  license?: string;
  date?: string;
};

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
      backgroundColor="#ffffff00"
      extraRenderers={[new CSS3DRenderer()]}
      nodeThreeObjectExtend={true}
      nodeThreeObject={(node: GraphNode) => {
        const slug = node.id.split("-").slice(-1).join("-");
        const icon = iconOf(slug) ?? iconOf(node.icon);

        // const nodeEl = document.createElement("div");
        // nodeEl.innerHTML = 'icon?.svg ?? ""';
        // nodeEl.style.color = icon?.hex;
        // nodeEl.className = "node-label";
        const nodeEl = document.createElement("div");
        nodeEl.style.width = "20px";
        nodeEl.style.height = "20px";
        nodeEl.style.borderRadius = "50%";
        console.log(nodeEl);

        const i = document.createElement("div");
        i.innerHTML = icon?.svg ?? node.name[0] ?? "";
        i.style.color = "#fff";
        // i.style.stroke = "#fff";
        i.style.fill = "#fff";
        i.style.width = "20px";
        i.style.height = "20px";
        nodeEl.appendChild(i);

        return new CSS3DObject(nodeEl);

        // const sprite = new SpriteText(icon?.svg);
        // sprite.color = node.color;
        // sprite.textHeight = 8;
        // return sprite;
      }}
      nodeColor={(node: GraphNode) => {
        switch (node.type) {
          case "stack":
            const slug = node.id.replace(/^[^-]+-/, "");
            const icon = iconOf(slug);
            return icon?.hex ?? "#177";
          case "alt":
            return "#c40";
          case "tag":
            return "#38c";
          default:
            return "#739";
        }
      }}
      nodeResolution={16}
      // // nodeAutoColorBy={(node: any) => node.license}
      nodeLabel={(node: any) => (
        <div>
          <b>{node.name}</b>
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
