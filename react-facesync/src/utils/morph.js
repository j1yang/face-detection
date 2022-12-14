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

  leftShoulderBone = nodes.RightArm;
  leftElbowBone = nodes.RightForeArm;
  leftWristBone = nodes.RightHand;

  leftHandBones = [
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

  rightShoulderBone = nodes.LeftArm;
  rightElbowBone = nodes.LeftForeArm;
  rightWristBone = nodes.LeftHand;

  rightHandBones = [
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

    let rightShoulderVis = poseWorldLandmarks[RIGHTSHOULDER].visibility;
    let leftShoulderVis = poseWorldLandmarks[LEFTSHOULDER].visibility;
    let rightHipVis = poseWorldLandmarks[RIGHTHIP].visibility;
    let leftHipVis = poseWorldLandmarks[LEFTHIP].visibility;

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
        smoothRotation(spine, rotX, rotY, rotZ);

        // left arm
        let xAxis = shoulderX.clone();
        let yAxis = shoulderY.clone();
        let zAxis = shoulderZ.clone();
        let basis = new THREE.Matrix3().set(
            xAxis.x, yAxis.x, zAxis.x,
            xAxis.y, yAxis.y, zAxis.y,
            xAxis.z, yAxis.z, zAxis.z
        );

        let rot = rotateBone(userJoints[LEFTSHOULDER], userJoints[LEFTELBOW], leftElbowBone.position, basis);
        leftShoulderBone.quaternion.slerp(rot, SMOOTHING);
        updateBasis(leftShoulderBone.quaternion, xAxis, yAxis, zAxis, basis);

        rot = rotateBone(userJoints[LEFTELBOW], userJoints[LEFTWRIST], leftWristBone.position, basis);
        leftElbowBone.quaternion.slerp(rot, SMOOTHING);
        updateBasis(leftElbowBone.quaternion, xAxis, yAxis, zAxis, basis);

        let leftFingersUser = userJoints[LEFTPINKY].lerp(userJoints[LEFTINDEX], 0.5);
        let leftFingersAvatar = leftHandBones[PINKY1].position.clone().lerp(leftHandBones[INDEX1].position, 0.5);
        rot = rotateBone(userJoints[LEFTWRIST], leftFingersUser, leftFingersAvatar, basis);
        leftWristBone.quaternion.slerp(rot, SMOOTHING);

        // right arm
        xAxis = shoulderX.clone();
        yAxis = shoulderY.clone();
        zAxis = shoulderZ.clone();
        basis = new THREE.Matrix3().set(
            xAxis.x, yAxis.x, zAxis.x,
            xAxis.y, yAxis.y, zAxis.y,
            xAxis.z, yAxis.z, zAxis.z
        );

        rot = rotateBone(userJoints[RIGHTSHOULDER], userJoints[RIGHTELBOW], rightElbowBone.position, basis);
        rightShoulderBone.quaternion.slerp(rot, SMOOTHING);
        updateBasis(rightShoulderBone.quaternion, xAxis, yAxis, zAxis, basis);

        rot = rotateBone(userJoints[RIGHTELBOW], userJoints[RIGHTWRIST], rightWristBone.position, basis);
        rightElbowBone.quaternion.slerp(rot, SMOOTHING);
        updateBasis(rightElbowBone.quaternion, xAxis, yAxis, zAxis, basis);

        let rightFingersUser = userJoints[RIGHTPINKY].lerp(userJoints[RIGHTINDEX], 0.5);
        let rightFingersAvatar = rightHandBones[PINKY1].position.clone().lerp(rightHandBones[INDEX1].position, 0.5);
        rot = rotateBone(userJoints[RIGHTWRIST], rightFingersUser, rightFingersAvatar, basis);
        rightWristBone.quaternion.slerp(rot, SMOOTHING);
    }

    // REQUIRED: both hips must be visible to track lowerbody
    if (rightHipVis > VISTHRESH && leftHipVis > VISTHRESH) {
        // hip local coordinate system
        // positive directions: x - leftHip -> rightHip,
        //                      y - hip -> shoulder,
        //                      z - user -> camera
        let hipX = userJoints[RIGHTHIP].clone().sub(userJoints[LEFTHIP]).normalize();
        let hipY = userJoints[RIGHTSHOULDER].clone().lerp(userJoints[LEFTSHOULDER], 0.5).normalize();   // BUG: using shoulder Y is not accurate, but don't have better way...
        let hipZ = hipX.clone().cross(hipY).normalize();

        // body direction
        let thetaX = Math.acos(hipZ.x);
        let rotY = - thetaX + Math.PI / 2;
        smoothRotation(skeleton, 0, rotY, 0);
        smoothRotation(spine, 0.2 * Math.PI / 2, -rotY, 0);

        // world position
        let LH = new THREE.Vector3(poseLandmarks[LEFTHIP].x * WIDTH, poseLandmarks[LEFTHIP].y * HEIGHT);
        let RH = new THREE.Vector3(poseLandmarks[RIGHTHIP].x * WIDTH, poseLandmarks[RIGHTHIP].y * HEIGHT);

        let percentX = LH.lerp(RH, 0.5).x / WIDTH - 0.5;
        skeleton.position.x = (1 - SMOOTHING) * skeleton.position.x + SMOOTHING * percentX * -1000;

        // TODO: z direction movement
        // let shoulderLen = LH.distanceTo(RH);
        // let angleY = Math.atan2(shoulderX.z, shoulderX.x);
        // shoulderLen /= Math.abs(Math.cos(angleY));  // BUG: division by 0
        // let precentZ = interpolate(shoulderLen, 550, 150);
        // skeleton.position.z = precentZ * -1000;

        // left leg
        let xAxis = hipX.clone();
        let yAxis = hipY.clone();
        let zAxis = hipZ.clone();
        let basis = new THREE.Matrix3().set(
            xAxis.x, yAxis.x, zAxis.x,
            xAxis.y, yAxis.y, zAxis.y,
            xAxis.z, yAxis.z, zAxis.z
        );

        let rot = rotateBone(userJoints[LEFTHIP], userJoints[LEFTKNEE], leftKneeBone.position, basis);
        leftHipBone.quaternion.slerp(rot, SMOOTHING);
        updateBasis(leftHipBone.quaternion, xAxis, yAxis, zAxis, basis);

        rot = rotateBone(userJoints[LEFTKNEE], userJoints[LEFTANKLE], leftAnkleBone.position, basis);
        leftKneeBone.quaternion.slerp(rot, SMOOTHING);
        updateBasis(leftKneeBone.quaternion, xAxis, yAxis, zAxis, basis);

        rot = rotateBone(userJoints[LEFTANKLE], userJoints[LEFTFOOT], leftFootBone.position, basis);
        leftAnkleBone.quaternion.slerp(rot, SMOOTHING);

        // right leg
        xAxis = hipX.clone();
        yAxis = hipY.clone();
        zAxis = hipZ.clone();
        basis = new THREE.Matrix3().set(
            xAxis.x, yAxis.x, zAxis.x,
            xAxis.y, yAxis.y, zAxis.y,
            xAxis.z, yAxis.z, zAxis.z
        );

        rot = rotateBone(userJoints[RIGHTHIP], userJoints[RIGHTKNEE], rightKneeBone.position, basis);
        rightHipBone.quaternion.slerp(rot, SMOOTHING);
        updateBasis(rightHipBone.quaternion, xAxis, yAxis, zAxis, basis);

        rot = rotateBone(userJoints[RIGHTKNEE], userJoints[RIGHTANKLE], rightAnkleBone.position, basis);
        rightKneeBone.quaternion.slerp(rot, SMOOTHING);
        updateBasis(rightKneeBone.quaternion, xAxis, yAxis, zAxis, basis);

        rot = rotateBone(userJoints[RIGHTANKLE], userJoints[RIGHTFOOT], rightFootBone.position, basis);
        rightAnkleBone.quaternion.slerp(rot, SMOOTHING);
    } else {
        // reset legs
        leftHipBone.quaternion.identity();
        leftKneeBone.quaternion.identity();
        leftAnkleBone.quaternion.identity();
        rightHipBone.quaternion.identity();
        rightKneeBone.quaternion.identity();
        rightAnkleBone.quaternion.identity();
    }
}

// Morphing Finger
export function setFingers(handLandmarks, isRight) {
    let avatarBones = (isRight) ? rightHandBones : leftHandBones;

    // hand landmark positions
    let userJoints = [];
    handLandmarks.forEach((landmark) => {
        userJoints.push(new THREE.Vector3(landmark.x * WIDTH, -landmark.y * HEIGHT, landmark.z * WIDTH));
    });

    // hand local coordinate system
    // positive directions: x - fingers -> wrist,
    //                      y - back of hand -> world
    //                      z - pinky -> thumb
    let handX = userJoints[WRIST].clone().sub(userJoints[MIDDLE1]).normalize();
    if (isRight) handX.negate();
    let handZ = userJoints[INDEX1].clone().sub(userJoints[RING1]).normalize();
    let handY = handX.clone().cross(handZ).normalize();
    if (!isRight) handY.negate();

    let handBasis = new THREE.Matrix3().set(
        handX.x, handY.x, handZ.x,
        handX.y, handY.y, handZ.y,
        handX.z, handY.z, handZ.z
    );

    // thumb
    let xAxis = handX.clone();
    let yAxis = handY.clone();
    let zAxis = handZ.clone();
    let basis = handBasis.clone();

    // iterate thumb joints
    for (let i = 1; i < 4; i++) {
        let rot = rotateBone(userJoints[i], userJoints[i + 1], avatarBones[i + 1].position, basis);       
        let angles = new THREE.Euler().setFromQuaternion(rot.normalize());

        // constrain finger rotation to x-axis, range [0, 90] degrees
        let angleX = angles.toVector3().length();
        angleX = Math.max(0, angleX);
        angleX = Math.min(Math.PI / 2, angleX);
        
        if (isRight) smoothRotation(avatarBones[i], angleX - 0.2 * Math.PI, 0, 0);
        else smoothRotation(avatarBones[i], angleX, 0, 0);

        updateBasis(avatarBones[i].quaternion, xAxis, yAxis, zAxis, basis);
    }

    // iterate fingers
    for (let i = 5; i <= 17; i += 4) {
        xAxis = handX.clone();
        yAxis = handY.clone();
        zAxis = handZ.clone();
        basis = handBasis.clone();

        // iterate finger joints
        for (let j = i; j < i + 3; j++) {
            let rot = rotateBone(userJoints[j], userJoints[j + 1], avatarBones[j + 1].position, basis);
            
            // constrain finger rotation to z-axis, range [0, 90] degrees
            let angleZ = new THREE.Euler().setFromQuaternion(rot.normalize()).z;
            angleZ = Math.max(0, angleZ);
            angleZ = Math.min(Math.PI / 2, angleZ)

            if (isRight) smoothRotation(avatarBones[j], 0, 0, -angleZ);
            else smoothRotation(avatarBones[j], 0, 0, angleZ);

            updateBasis(avatarBones[j].quaternion, xAxis, yAxis, zAxis, basis);
        }
    }
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
    smoothRotation(neckBone, rotX, rotY, rotZ);

    // CALCULATE MORPHS

    // eyes
    let eyeRT = facePos[27];
    let eyeRB = facePos[23];
    let eyeLT = facePos[257];
    let eyeLB = facePos[253];

    let min = 0.1;
    let max = 0.12;
    setHeadMorphTarget("eyesWideLeft", interpolate(eyeRT[1] - eyeRB[1], min, max));
    setHeadMorphTarget("eyesWideRight", interpolate(eyeLT[1] - eyeLB[1], min, max));

    max = 0.095;
    setHeadMorphTarget("eyeSquintLeft", interpolate(eyeRT[1] - eyeRB[1], min, max));
    setHeadMorphTarget("eyeSquintRight", interpolate(eyeLT[1] - eyeLB[1], min, max));

    max = 0.09;
    setHeadMorphTarget("eyeBlinkLeft", interpolate(eyeRT[1] - eyeRB[1], min, max));
    setHeadMorphTarget("eyeBlinkRight", interpolate(eyeLT[1] - eyeLB[1], min, max));

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
    setHeadMorphTarget("mouthSmileLeft", interpolate(mouthR[1], min, max));
    setHeadMorphTarget("mouthSmileRight", interpolate(mouthL[1], min, max));

    // nose
    let noseR = facePos[129];
    let noseL = facePos[358];

    min = -0.027;
    max = -0.018;
    setHeadMorphTarget("noseSneerLeft", interpolate(noseR[1], min, max));
    setHeadMorphTarget("noseSneerRight", interpolate(noseL[1], min, max));
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

// applies rotation to basis
function updateBasis(rotation, xAxis, yAxis, zAxis, basis) {
    xAxis.applyQuaternion(rotation);
    yAxis.applyQuaternion(rotation);
    zAxis.applyQuaternion(rotation);
    basis.set(
        xAxis.x, yAxis.x, zAxis.x,
        xAxis.y, yAxis.y, zAxis.y,
        xAxis.z, yAxis.z, zAxis.z
    );
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
