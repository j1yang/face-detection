import * as THREE from 'three';

// device constants
const WIDTH = 1920;
const HEIGHT = 1080;

const SMOOTHING = 0.25;
const VISTHRESH = 0.9;

// pose constants
const LEFTSHOULDER = 11;
const RIGHTSHOULDER = 12;
const LEFTELBOW = 13;
const RIGHTELBOW = 14;
const LEFTWRIST = 15;
const RIGHTWRIST = 16;
const LEFTPINKY = 17;
const RIGHTPINKY = 18;
const LEFTINDEX = 19;
const RIGHTINDEX = 20;
const LEFTHIP = 23;
const RIGHTHIP = 24;
const LEFTKNEE = 25;
const RIGHTKNEE = 26;
const LEFTANKLE = 27;
const RIGHTANKLE = 28;
const LEFTFOOT = 31;
const RIGHTFOOT = 32;

// hand constants
const WRIST = 0;
const INDEX1 = 5;
const MIDDLE1 = 9;
const RING1 = 13;
const PINKY1 = 17;

// face constants
const NOSE = 1;
const NASAL = 4;       // 1 point above nose
const LEFT = 454;      // left most point
const RIGHT = 234;     // right most point
const TOP = 10;        // top most point                       
const BOT = 152;       // bot most point

// Bone constants
let skeleton, spine, neckBone, headMorphTargets, headMorphDict, teethMorphTargets, teethMorphDict;
let leftShoulderBone, leftElbowBone, leftWristBone, rightShoulderBone, rightElbowBone, rightWristBone;
let leftHipBone, leftKneeBone, leftAnkleBone, leftFootBone, rightHipBone, rightKneeBone, rightAnkleBone, rightFootBone;
let leftHandBones, rightHandBones;

//Init Avatar nodes
export async function Avatar(nodes){
  let headSkinnedMesh = nodes.Wolf3D_Head
  // Skinned Mesh
  if (headSkinnedMesh) {
    headMorphTargets = headSkinnedMesh.morphTargetInfluences;
    headMorphDict = headSkinnedMesh.morphTargetDictionary;
  }

  let teethSkinnedMesh = nodes.Wolf3D_Teeth

  if (teethSkinnedMesh) {
    teethMorphTargets = teethSkinnedMesh.morphTargetInfluences;
    teethMorphDict = teethSkinnedMesh.morphTargetDictionary;
  }

  // Skeleton / Bone
  skeleton = nodes.Hips;
  spine = nodes.Spine; 
  neckBone = nodes.Neck;

  rightShoulderBone = nodes.RightArm;
  rightElbowBone = nodes.RightForeArm;
  rightWristBone = nodes.RightHand;

  rightHandBones = [
    rightWristBone,
    nodes.RightHandThumb1,
    nodes.RightHandThumb2,
    nodes.RightHandThumb3,
    nodes.RightHandThumb4,
    nodes.RightHandIndex1,
    nodes.RightHandIndex2,
    nodes.RightHandIndex3,
    nodes.RightHandIndex4,
    nodes.RightHandMiddle1,
    nodes.RightHandMiddle2,
    nodes.RightHandMiddle3,
    nodes.RightHandMiddle4,
    nodes.RightHandRing1,
    nodes.RightHandRing2,
    nodes.RightHandRing3,
    nodes.RightHandRing4,
    nodes.RightHandPinky1,
    nodes.RightHandPinky2,
    nodes.RightHandPinky3,
    nodes.RightHandPinky4
  ]

  leftShoulderBone = nodes.LeftArm;
  leftElbowBone = nodes.LeftForeArm;
  leftWristBone = nodes.LeftHand;

  leftHandBones = [
    leftWristBone,
    nodes.LeftHandThumb1,
    nodes.LeftHandThumb2,
    nodes.LeftHandThumb3,
    nodes.LeftHandThumb4,
    nodes.LeftHandIndex1,
    nodes.LeftHandIndex2,
    nodes.LeftHandIndex3,
    nodes.LeftHandIndex4,
    nodes.LeftHandMiddle1,
    nodes.LeftHandMiddle2,
    nodes.LeftHandMiddle3,
    nodes.LeftHandMiddle4,
    nodes.LeftHandRing1,
    nodes.LeftHandRing2,
    nodes.LeftHandRing3,
    nodes.LeftHandRing4,
    nodes.LeftHandPinky1,
    nodes.LeftHandPinky2,
    nodes.LeftHandPinky3,
    nodes.LeftHandPinky4
  ]

}

// Morphing Pose
export function setPose(poseLandmarks, poseWorldLandmarks) {
    let userJoints = [];
    poseWorldLandmarks.forEach((landmark) => {
        userJoints.push(new THREE.Vector3(landmark.x, landmark.y, landmark.z).negate());
    });

    let leftShoulderVis = poseWorldLandmarks[LEFTSHOULDER].visibility;
    let rightShoulderVis = poseWorldLandmarks[RIGHTSHOULDER].visibility;
    // let rightHipVis = poseWorldLandmarks[RIGHTHIP].visibility;
    // let leftHipVis = poseWorldLandmarks[LEFTHIP].visibility;

    // REQUIRED: both shoulders must be visible to track upperbody
    if (rightShoulderVis > VISTHRESH && leftShoulderVis > VISTHRESH) {
        // shoulder local coordinate system
        // positive directions: x - leftShoulder -> rightShoulder,
        //                      y - hip -> shoulder,
        //                      z - user -> camera
        let shoulderX = userJoints[RIGHTSHOULDER].clone().sub(userJoints[LEFTSHOULDER]).normalize();
        let shoulderY = userJoints[RIGHTSHOULDER].clone().lerp(userJoints[LEFTSHOULDER], 0.5).normalize();
        let shoulderZ = shoulderX.clone().cross(shoulderY).normalize();

        // torso direction
        let thetaX = Math.acos(shoulderZ.x);
        let thetaY = Math.acos(shoulderZ.y);
        let thetaZ = Math.acos(shoulderY.x);
        let rotX = thetaY - 1.2 * Math.PI / 2;
        let rotY = - thetaX + Math.PI / 2;
        let rotZ = thetaZ - Math.PI / 2;
        smoothRotation(spine, rotX, - rotY, rotZ);

        // left arm
        let xAxis = shoulderX.clone();
        let yAxis = shoulderY.clone();
        let zAxis = shoulderZ.clone();
        let basis = new THREE.Matrix3().set(
            xAxis.z, yAxis.z, - zAxis.z,
            xAxis.y, - yAxis.y, zAxis.y,
            - xAxis.x , yAxis.x, - zAxis.x
        );

        let rot = rotateBone(userJoints[LEFTSHOULDER], userJoints[LEFTELBOW], leftElbowBone.position, basis);
        leftShoulderBone.quaternion.slerp(rot, SMOOTHING);
        updateBasis(leftShoulderBone.quaternion, xAxis, yAxis, zAxis, basis);

        rot = rotateBone(userJoints[LEFTELBOW], userJoints[LEFTWRIST], leftWristBone.position, basis);
        leftElbowBone.quaternion.slerp(rot, SMOOTHING);
        updateBasis(leftElbowBone.quaternion, xAxis, yAxis, zAxis, basis);

        let leftFingersUser = userJoints[LEFTPINKY].lerp(userJoints[LEFTINDEX], 0.5);
        let leftFingersAvatar = leftHandBones[PINKY1].position.clone().lerp(leftHandBones[INDEX1].position, 0.5);
        // rot = rotateBone(userJoints[LEFTWRIST], leftFingersUser, leftFingersAvatar, basis);
        // leftWristBone.quaternion.slerp(rot, SMOOTHING);

    }
}



// applies rotation to basis
function updateBasis(rotation, xAxis, yAxis, zAxis, basis) {
    xAxis.applyQuaternion(rotation);
    yAxis.applyQuaternion(rotation);
    zAxis.applyQuaternion(rotation);
    basis.set(
        xAxis.z, yAxis.z, - zAxis.z,
        xAxis.y, - yAxis.y, zAxis.y,
        - xAxis.x , yAxis.x, - zAxis.x
    );
}

// Morphing Face 
export function setMorphs(faceLandmarks) {
    if (!headMorphTargets) return;

    // PROCESS LANDMARKS

    // center of head
    let pL = new THREE.Vector3(faceLandmarks[LEFT].x * WIDTH, faceLandmarks[LEFT].y * HEIGHT, faceLandmarks[LEFT].z * WIDTH);
    let pR = new THREE.Vector3(faceLandmarks[RIGHT].x * WIDTH, faceLandmarks[RIGHT].y * HEIGHT, faceLandmarks[RIGHT].z * WIDTH);
    let pM = pL.lerp(pR, 0.5);

    // width and height of face
    let pT = new THREE.Vector3(faceLandmarks[TOP].x * WIDTH, faceLandmarks[TOP].y * HEIGHT, faceLandmarks[TOP].z * WIDTH);
    let pB = new THREE.Vector3(faceLandmarks[BOT].x * WIDTH, faceLandmarks[BOT].y * HEIGHT, faceLandmarks[BOT].z * WIDTH);
    let faceLenX = pR.distanceTo(pL);
    let faceLenY = pB.distanceTo(pT);

    // face plane origin
    let pN = new THREE.Vector3(faceLandmarks[NOSE].x * WIDTH, faceLandmarks[NOSE].y * HEIGHT, faceLandmarks[NOSE].z * WIDTH);

    // unit normal, face plane z-axis
    let zAxis = pN.clone().sub(pM);
    zAxis.normalize();

    // project nasal onto face plane
    let pNas = new THREE.Vector3(faceLandmarks[NASAL].x * WIDTH, faceLandmarks[NASAL].y * HEIGHT, faceLandmarks[NASAL].z * WIDTH);
    let v = pNas.clone().sub(pN);
    let dist = zAxis.dot(v);
    pNas.sub(zAxis.clone().multiplyScalar(dist));

    // face plane y-axis
    let yAxis = pNas.sub(pN);
    yAxis.normalize();

    // face plane x-axis
    let xAxis = zAxis.clone().cross(yAxis);
    xAxis.normalize();
    xAxis.negate();

    // face plane local coordinates (pX, pY)
    let facePos = [];
    for (let landmark of faceLandmarks) {
        let p = new THREE.Vector3(landmark.x * WIDTH, landmark.y * HEIGHT, landmark.z * WIDTH);

        // project point onto face plane
        v = p.sub(pN);
        let pX = xAxis.dot(v) / faceLenX;
        let pY = yAxis.dot(v) / faceLenY;
        facePos.push([pX, pY]);
    }

    // gaze direction
    let thetaX = Math.acos(zAxis.x);
    let thetaY = Math.acos(zAxis.y);
    let thetaZ = Math.acos(yAxis.x);
    let rotX = -(thetaY - Math.PI / 2) - (-0.1) * Math.PI;
    let rotY = thetaX - Math.PI / 2;
    let rotZ = -(thetaZ - Math.PI / 2);
    smoothRotation(neckBone, rotX, - rotY, - rotZ);

    // CALCULATE MORPHS

    // eyes
    let eyeRT = facePos[27];
    let eyeRB = facePos[23];
    let eyeLT = facePos[257];
    let eyeLB = facePos[253];

    let min = 0.1;
    let max = 0.12;
    setHeadMorphTarget("eyesWideRight", interpolate(eyeRT[1] - eyeRB[1], min, max));
    setHeadMorphTarget("eyesWideLeft", interpolate(eyeLT[1] - eyeLB[1], min, max));

    max = 0.095;
    setHeadMorphTarget("eyeSquintRight", interpolate(eyeRT[1] - eyeRB[1], min, max));
    setHeadMorphTarget("eyeSquintLeft", interpolate(eyeLT[1] - eyeLB[1], min, max));

    max = 0.09;
    setHeadMorphTarget("eyeBlinkRight", interpolate(eyeRT[1] - eyeRB[1], min, max));
    setHeadMorphTarget("eyeBlinkLeft", interpolate(eyeLT[1] - eyeLB[1], min, max));

    // eyebrows
    // let browR = facePos[66];
    // let browL = facePos[296];

    // ?
    // min = 0.35;
    // max = 0.4;
    // setHeadMorphTarget("browsUp_Left", interpolate(browR[1], min, max));
    // setHeadMorphTarget("browsUp_Right", interpolate(browL[1], min, max));

    // max = 0.33;
    // setHeadMorphTarget("browsDown_Left", interpolate(browR[1], min, max));
    // setHeadMorphTarget("browsDown_Right", interpolate(browL[1], min, max));

    // mouth
    let mouthT = facePos[13];
    let mouthB = facePos[14];
    let mouthL = facePos[308];
    let mouthR = facePos[78];

    min = 0.01;
    max = 0.15;
    setHeadMorphTarget("mouthOpen", interpolate(mouthT[1] - mouthB[1], min, max));

    min = 0.12;
    max = 0.16;
    setHeadMorphTarget("jawOpen", interpolate(mouthT[1] - mouthB[1], min, max));

    min = 0.12;
    max = 0.16;
    setTeethMorphTarget("jawOpen", interpolate(mouthT[1] - mouthB[1], min, max));
    
    // No midmouth targets for the ready player me avatar.
    // min = -0.15;
    // max = -0.11;
    // setHeadMorphTarget("Midmouth_Right", interpolate(mouthR[0], min, max));
    // setHeadMorphTarget("Midmouth_Left", interpolate(mouthL[0], -min, -max));


    // min = -0.22;
    // max = -0.25;
    // No mouthFrown targets for the ready player me avatar.
    // setHeadMorphTarget("mouthFrownLeft", interpolate(mouthR[1], min, max));
    // setHeadMorphTarget("mouthFrownRight", interpolate(mouthL[1], min, max));
    
    min = -0.22;
    max = -0.15;
    setHeadMorphTarget("mouthSmileRight", interpolate(mouthR[1], min, max));
    setHeadMorphTarget("mouthSmileLeft", interpolate(mouthL[1], min, max));

    // nose
    let noseR = facePos[129];
    let noseL = facePos[358];

    min = -0.027;
    max = -0.018;
    setHeadMorphTarget("noseSneerRight", interpolate(noseR[1], min, max));
    setHeadMorphTarget("noseSneerLeft", interpolate(noseL[1], min, max));
}

// motion smoothing rotation of object by x, y, z
function smoothRotation(object, rotX, rotY, rotZ) {
    // interpolate with current values to prevent jittering
    let SMOOTHING = 0.25;
    if (rotX != 0) object.rotation.x = (1 - SMOOTHING) * object.rotation.x + SMOOTHING * rotX;
    if (rotY != 0) object.rotation.y = (1 - SMOOTHING) * object.rotation.y + SMOOTHING * rotY;
    if (rotZ != 0) object.rotation.z = (1 - SMOOTHING) * object.rotation.z + SMOOTHING * rotZ;
}

// userJoint (Vector3) - world position of joint
// userChild (Vector3) - world position of child of joint
// avatarChild (Vector3) - local position of child Bone of joint
// basis (Matrix3) - local axes at joint (in world coordinates)
// returns rotation needed at joing
function rotateBone(userJoint, userChild, avatarChild, basis) {
    // change of basis: world -> local
    let userLimb = userChild.clone().sub(userJoint).applyMatrix3(basis.invert()).normalize();
    let avatarLimb = avatarChild.clone().normalize();
    return new THREE.Quaternion().setFromUnitVectors(avatarLimb, userLimb);
}


// returns linear interpolation of val between min and max
// (percentage that val is between min and max)
function interpolate(val, min, max) {
    let result = (val - min) / (max - min);

    if (result < 0) return 0;
    else if (result > 1) return 1;
    else return result;
}

function setHeadMorphTarget(target, val) {
    // interpolate with previous value to prevent jittering
    let SMOOTHING = 0.25;
    headMorphTargets[headMorphDict[target]] = (1 - SMOOTHING) * headMorphTargets[headMorphDict[target]] + SMOOTHING * val;
}

function setTeethMorphTarget(target, val) {
    // interpolate with previous value to prevent jittering
    let SMOOTHING = 0.25;
    teethMorphTargets[teethMorphDict[target]] = (1 - SMOOTHING) * teethMorphTargets[teethMorphDict[target]] + SMOOTHING * val;
}
