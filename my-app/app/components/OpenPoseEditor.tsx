// Assuming we have these types defined

// OpenPoseEditor.tsx

import { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { PoseVector, Keypoint, Line } from '../types';

interface Props {
  poseVector: PoseVector;
  onPoseChange: (newPoseVector: PoseVector) => void;
}

function getPoints(canvas: { getObjects: () => any; }){
  let pointList = [];
  for(let item of canvas.getObjects()){
      if(item.type == "circle"){
          pointList.push([Math.round(item['left']), Math.round(item['top'])])
      }
  }
  return pointList;
}

const OpenPoseEditor: React.FC<Props> = ({ poseVector, onPoseChange }) => {
  const visibleEyes = true;
  const flipped = false;
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);

  // Initialize fabric Canvas
  useEffect(() => {
    const canvas = new fabric.Canvas('canvas');
    canvasRef.current = canvas;
    setFabricCanvas(canvas);

    canvas.on('object:moving', (e) => {
        if (e.target) {
          updateLines(e.target as fabric.Circle, canvas);
        }
      });
    
      canvas.on('object:scaling', () => {
        canvas.renderAll();
      });
    
      canvas.on('object:rotating', () => {
        canvas.renderAll();
      });
    
      canvas.on("object:modified", () => {
        let points = getPoints(canvas); // You will need to implement this function
        onPoseChange(points as PoseVector);
      });
  }, []);

  // Draw stick figure on the canvas
  useEffect(() => {
    if (fabricCanvas && poseVector.length > 0) {
      fabricCanvas.clear();

      // Transform the poseVector to the appropriate format
    //   const keypoints = poseVector.map(([x, y]) => ({ x, y }));

      // Your logic to add the pose (stick figure) to the fabricCanvas
      setPose(fabricCanvas, poseVector);
    }
  }, [poseVector, fabricCanvas]);
  
  const updateLines = (target: fabric.Object | any, fabricCanvas: fabric.Canvas | null) => {
    var p = target;
    if (p["id"] === 0) {
        p.line1 && p.line1.set({ 'x1': p.left, 'y1': p.top });
    }else{
        p.line1 && p.line1.set({ 'x2': p.left, 'y2': p.top });
    }
    p.line2 && p.line2.set({ 'x1': p.left, 'y1': p.top });
    p.line3 && p.line3.set({ 'x1': p.left, 'y1': p.top });
    p.line4 && p.line4.set({ 'x1': p.left, 'y1': p.top });
    p.line5 && p.line5.set({ 'x1': p.left, 'y1': p.top });
    (fabricCanvas as any).renderAll(); 
  }

  const setPose = (canvas: fabric.Canvas, keypoints: Keypoint[]) => {
    canvas.clear()    
    canvas.backgroundColor = "#000"

    const res = [];
    for (let i = 0; i < keypoints.length; i += 18) {
        const chunk = keypoints.slice(i, i + 18);
        res.push(chunk);
    }

    for (let item of res){
        addPose(canvas,item)
        canvas.discardActiveObject();
    }
}
  
  
  // Replace with your logic
  const addPose = (canvas: fabric.Canvas, keypoints: Keypoint[]) => {
    // if (keypoints === undefined){
    //   keypoints = default_keypoints;
    // }

    function makeCircle(
      color: string, 
      left: number, 
      top: number, 
      line1?: fabric.Line, 
      line2?: fabric.Line, 
      line3?: fabric.Line, 
      line4?: fabric.Line, 
      line5?: fabric.Line
    ) {
      const c = new fabric.Circle({
        left: left,
        top: top,
        strokeWidth: 1,
        radius: 5,
        fill: color,
        stroke: color,
        originX: 'center',
        originY: 'center',
      });

      c.hasControls = c.hasBorders = false;

      // The lines are extended properties, not originally in the fabric.Circle type.
      // This would work, but it may make sense to create a subclass of fabric.Circle if this is a common pattern for you.
      (c as any).line1 = line1;
      (c as any).line2 = line2;
      (c as any).line3 = line3;
      (c as any).line4 = line4;
      (c as any).line5 = line5;

      return c;
    }


    const makeLine = (coords: number[], color: string) => {
      return new fabric.Line(coords, {
        fill: color,
        stroke: color,
        strokeWidth: 10,
        selectable: false,
        evented: false,
        originX: 'center',
        originY: 'center',
      });
    }

    const group = new fabric.Group()


    // you need to replace these lines with your logic to generate these values
    const connect_keypoints: number[][] = [[0, 1], [1, 2], [2, 3], [3, 4], [1, 5], [5, 6], [6, 7], [1, 8], [8, 9], [9, 10], [1, 11], [11, 12], [12, 13], [14, 0], [14, 16], [15, 0], [15, 17]]

    ; // array of pairs of indexes. each pair represents a line between two keypoints
    const connect_color: number[][] = [[0, 0, 255], [255, 0, 0], [255, 170, 0], [255, 255, 0], [255, 85, 0], [170, 255, 0], [85, 255, 0], [0, 255, 0],
    [0, 255, 85], [0, 255, 170], [0, 255, 255], [0, 170, 255], [0, 85, 255], [85, 0, 255],
    [170, 0, 255], [255, 0, 255], [255, 0, 170], [255, 0, 85]]; // array of colors for each keypoint

    const lines: fabric.Line[] = [];
    const circles: fabric.Circle[] = [];

    for (let i = 0; i < connect_keypoints.length; i++) {
      const item = connect_keypoints[i];
      const line = makeLine([keypoints[item[0]][0], keypoints[item[0]][1], keypoints[item[1]][0], keypoints[item[1]][1]], `rgba(${connect_color[i].join(", ")}, 0.7)`);
      lines.push(line);
      canvas.add(line);
      (line as any)["id"] = item[0];
    }

    for (let i = 0; i < keypoints.length; i++) {
      let list: fabric.Line[] = [];
      connect_keypoints.filter((item, idx) => {
          if(item.includes(i)){
              list.push(lines[idx]);
              return idx;
          }
      });
      // const linesForThisCircle: fabric.Line[] = lines.filter(line => (line as any)["id"] === i);
      const circle = makeCircle(`rgb(${connect_color[i].join(", ")})`, keypoints[i][0], keypoints[i][1], ...list);
      (circle as any)["id"] = i;
      circles.push(circle);
      group.addWithUpdate(circle);

    }

    // const group = new fabric.Group(circles, {
    //   objectCaching: false
    // });

    canvas.discardActiveObject();
    canvas.setActiveObject(group);
    canvas.add(group);
    group.toActiveSelection();
    
    
    canvas.requestRenderAll();
  };


  return <canvas id="canvas" width={512} height={512}/>;
};

export default OpenPoseEditor;
