import React, { useRef, useEffect, useState } from "react";
import "./styles.css";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Sky } from "@react-three/drei";
import { Physics, useBox, usePlane } from "@react-three/cannon";
import Webcam from "react-webcam";
import * as facemesh from "@tensorflow-models/facemesh";
import * as tf from "@tensorflow/tfjs";

export default function App() {
  const webcamref = useRef(null);
  const boxPosition = [0, 2, 0];
  const spotlightPosition = [
    boxPosition[0] + 3,
    boxPosition[1] + 5,
    boxPosition[2],
  ];

  async function init() {
    await tf.setBackend("webgl");
    // Now you can use TensorFlow.js functionality
  }

  const [cameraRotation, setCameraRotation] = useState([0, 0, 0]);

  const runFacemesh = async () => {
    const net = await facemesh.load({
      inputResolution: { width: 640, height: 480 },
      scale: 0.8,
    });
    setInterval(() => {
      detect(net);
    }, 500);
  };

  const detect = async (net) => {
    if (
      typeof webcamref.current !== "undefined" &&
      webcamref.current !== null &&
      webcamref.current.video.readyState === 4
    ) {
      const video = webcamref.current.video;
      const faces = await net.estimateFaces(video);

      if (faces && faces.length > 0) {
        const face = faces[0];
        const rotationY = face.annotations.midwayBetweenEyes[0][0];
        const rotationX = face.annotations.midwayBetweenEyes[0][1];
        setCameraRotation([rotationX, rotationY, 0]);
        console.log(cameraRotation);
      }
    }
  };

  const Box = () => {
    const [ref, api] = useBox(() => ({ mass: 1, position: boxPosition }));
    return (
      <mesh
        onClick={() => {
          api.velocity.set(0, 0, 2);
        }}
        ref={ref}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="hotpink" />
      </mesh>
    );
  };

  const Plane = () => {
    const [ref] = usePlane(() => ({
      position: [0, 0, 0],
      rotation: [-Math.PI / 2, 0, 0],
    }));
    return (
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry attach="geometry" args={[100, 100]} />
        <meshLambertMaterial attach="material" color="brown" />
      </mesh>
    );
  };

  useEffect(() => {
    init();
    runFacemesh();
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Webcam
        ref={webcamref}
        style={{
          position: "absolute",
          marginLeft: "auto",
          marginRight: "auto",
          left: 0,
          right: 0,
          width: 640,
          height: 480,
          zIndex: -9,
        }}
      />
      <Canvas colorManagement={false}>
        <OrbitControls />
        <Sky />
        <ambientLight intensity={1.5} />
        <spotLight
          position={spotlightPosition}
          angle={0.3}
          penumbra={1}
          intensity={10}
          castShadow
        />
        <Physics>
          <Box />
          <Plane />
        </Physics>
      </Canvas>
    </div>
  );
}
