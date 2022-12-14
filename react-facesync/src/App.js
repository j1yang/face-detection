import React, { useEffect, useRef, useState } from 'react';
import { Suspense } from "react";

import './App.css';
import Avatar from './components/avatar/Avatar';

import { Canvas } from "@react-three/fiber";
import AnimationBlob from './components/animationBlob/animationBlob';

function App() {
  const videoInput = useRef()
  const preLoad = useRef()
  return (
  <div className="App">
    <div className="extra-info">
      <h1>
        Face Sync App
      </h1>
      <h2 ref={preLoad}>
        Reading your face...
      </h2>
    </div>
    <Canvas className="canvas">
       {/* <OrbitControls enableZoom={false} enablePan={false} /> */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[-2, 5, 2]} intensity={1} />
      <AnimationBlob/>
      <Avatar scale={3} position={[-1, -3, 1]} video={videoInput} preload={preLoad}/>
    </Canvas>
    <video hidden ref={videoInput} width="1920px" height="1080px"></video>

  </div>
  );
}

export default App;