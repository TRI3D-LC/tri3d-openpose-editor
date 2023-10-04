'use client';
// pages/HomePage.tsx
import { useState } from 'react';
import { PoseVector } from './types';
import dynamic from 'next/dynamic';
import ImageUpload from './styling/ImageUpload';
import {buttonStyle, imageStyle, defaultImageSrc }from './styling/imageButtonStyles';
import axios from 'axios';

const arrayToString = (coordinateArray: number[][]): string => {
  let result = '';
  coordinateArray.forEach((coordinatePair) => {
    result += `${coordinatePair[0]} ${coordinatePair[1]}\n`;
  });
  return result;
};


const stringToCoordinates = (str: string): number[][] => {
  // Split the string by lines and filter out empty/whitespace-only lines
  const lines = str.split('\n').filter(line => line.trim() !== '');

  // Map each line to an array of numbers
  const coordinates = lines.map(line => {
      const [x, y] = line.split(' ').map(Number);
      return [x, y];
  });

  return coordinates;
};

const resizeKeypoints = (keypoints: number[][], originalWidth: number, originalHeight: number, newWidth: number, newHeight: number): number[][] => {
  return keypoints.map(([x, y]) => {
      // Normalize the original keypoints to [0, 1]
      let normalizedX = x / originalWidth;
      let normalizedY = y / originalHeight;

      // Scale the normalized keypoints to the new width and height
      let newX = normalizedX * newWidth;
      let newY = normalizedY * newHeight;

      return [newX, newY];
  });
};


const OpenPoseEditor = dynamic(
  () => import('./components/OpenPoseEditor'),
  { ssr: false } // This will load the component only on client side
);

const HomePage: React.FC = () => {
  const [ButtonLoading, setButtonLoading] = useState(false);
  const [targetImage,setTargetImage] = useState<string>("");
  const [targetEncoded,setTargetEncoded] = useState("");
  const [poseVector, setPoseVector] = useState<PoseVector>([]);
  const onPoseChange = (newPoseVector: PoseVector) => {
    setPoseVector(newPoseVector);
  };


  
  const extractPose = async () => {
    setButtonLoading(true);
    const formData = {
      target_image: targetEncoded,
    }
    const config = {
      headers: {
        'Content-Type': 'application/json'
      },
      data: formData
    };

    const response = await axios.post(`http://127.0.0.1:5000/generate/extractpose/`, formData,config)
    if(response.data.status === "error"){
      alert(response.data.message);
    }
    else{
      let poseVectorText = response.data.pose_vector_text;
      let poseCoordinates = stringToCoordinates(poseVectorText);
      poseCoordinates = resizeKeypoints(poseCoordinates, 256, 256, 512, 512);
      const updatedPoseVector: PoseVector = poseCoordinates as PoseVector;
      // const updatedPoseVector: PoseVector = [[241,77],[241,120],[191,118],[177,183],[163,252],[298,118],[317,182],[332,245],[225,241],[213,359],[215,454],[270,240],[282,360],[286,456],[232,59],[253,60],[225,70],[260,72]];
      setPoseVector(updatedPoseVector);
    }
    
    setButtonLoading(false);
  };



  const onTargetImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
        setTargetImage(URL.createObjectURL(event.target.files[0]));
        let reader = new FileReader();
        reader.readAsDataURL(event.target.files[0]);
        reader.onload = () => {
            setTargetEncoded(reader.result as string);
        };
    }
  }


  return (
    <div style={{display: 'flex', justifyContent: 'space-between'}}>
      <div style={{flex: '1'}}>
        <div style={{display: 'flex'}}>
          <div style={{marginRight: '5px'}}>
            <ImageUpload label="Upload Target Pose:" name="target_image" onChange={onTargetImageChange} imageSrc={targetImage} alt="Target"/>
            <button style={buttonStyle} onClick={extractPose}>{ButtonLoading ? "Loading..." : "Extract Pose"}</button>
          </div>
          <OpenPoseEditor poseVector={poseVector} onPoseChange={onPoseChange} />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
