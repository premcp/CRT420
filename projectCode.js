import {
  PoseLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "https://cdn.skypack.dev/@mediapipe/tasks-vision@0.10.0";

let birdsChirping;
let poseLandmarker;
let runningMode = "VIDEO";
let video = null;
let lastVideoTime = -1;
let landMarks = [];
let worldLandmarks = [];
let captureEvent;
let loadedCamera;

// Variables for interactive application
let state;
let previousState = -1;

let circleX = 320;
let circleY = 240;
let circleRadius = 50;

let button0X = window.innerWidth/2;
let button0Y = window.innerHeight/3 + window.innerHeight/3;

let button1X = 330;
let button1Y = 450;

let button2X = 305;
let button2Y = 345;

let button3X = 278;
let button3Y = 240;

let buttonSize = 100;
let buttonOpacity = 100;
let buttonHovered = false;
let buttonClicked = false;
let loadingAngle0 = 0;
let loadingAngle1 = 0;
let loadingAngle2 = 0;
let loadingAngle3 = 0;

let easedWristX = 0;
let easedWristY = 0;
const easing = 0.3;

let shoulderWidth = 0;

let currentTime;
let interval = 4000;

let currentBackgroundOpacity = 255;
let targetBackgroundOpacity = 255;
let opacityTransitionSpeed = 5;

let gif;
let userHand;
let firstPicture;
let secondPicture;
let thirdPicture;
let thirdInfo;
let secondInfo;
let firstInfo;

let firstInfoVisible = false;
let secondInfoVisible = false;
let thirdInfoVisible = false;

let isPerson = false;

const createPoseLandmarker = async () => {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
  );
  poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
      delegate: "GPU",
    },
    runningMode: runningMode,
    numPoses: 1,
  });
};
createPoseLandmarker();

new p5((p5) => {
  p5.preload = () => {
    birdsChirping = p5.loadSound("birds-chirping-75156.mp3");
    gif = p5.loadImage("asset/tittle_screen_bg.gif");
    userHand = p5.loadImage("asset/user_hand.png"); // Load the user hand sprite
    thirdPicture = p5.loadImage("https://i.postimg.cc/q7swzPKV/third-bg.png");
    secondPicture = p5.loadImage("https://i.postimg.cc/t43VKfMY/second-bg.jpg");
    firstPicture = p5.loadImage(
      "https://i.postimg.cc/Y0WhSH4Q/Mac-Ritchie-first-picture.png"
    );
    firstInfo = p5.loadImage("https://i.postimg.cc/CKXbFYJs/first-Info.png");
    secondInfo = p5.loadImage("https://i.postimg.cc/W4YtVnpR/second-Info.png");
    thirdInfo = p5.loadImage("https://i.postimg.cc/vTFY82pK/third-Info.png");
  };

  p5.setup = () => {
    birdsChirping.loop();
    p5.createCanvas(window.innerWidth, window.innerHeight);
    captureWebcam(p5);
  };

  p5.draw = () => {
    if (landMarks.length > 0) {
      if (!isPerson){
              p5.noFill();
              p5.stroke(255);
              p5.strokeWeight(3);
              p5.arc(
                button0X,
                button0Y,
                buttonSize - 10,
                buttonSize - 10,
                0,
                loadingAngle0
              );
              loadingAngle0 += 0.046;
      }
      if (p5.millis() - currentTime > interval) {
        const pose = landMarks[0];
        console.log("timer triggered");
        currentTime = 0;
        isPerson = true;

        // Apply transformations only for the video and pose tracking
        p5.push();
        p5.translate(p5.width, 0); // Move to the far corner
        p5.scale(-1, 1); // Scale x-axis by -1 (mirror horizontally)

        let wristX = pose[20].x * p5.width; // Right index finger
        let wristY = pose[20].y * p5.height; // Right index finger

        // Apply easing to smooth the wrist coordinates
        easedWristX += (wristX - easedWristX) * easing;
        easedWristY += (wristY - easedWristY) * easing;

        // Check if eased wrist is inside the interactive circle
        let d = p5.dist(easedWristX, easedWristY, circleX, circleY);
        if (d < circleRadius) {
          p5.fill(0, 255, 0); // Change color to green if wrist is inside the circle
        } else {
          p5.fill(255, 0, 0); // Default color is red
        }

        let distance = pose[0].z;

        let leftShoulder = pose[11];
        let rightShoulder = pose[12];
        shoulderWidth = (leftShoulder.x - rightShoulder.x) * p5.width;
        if (shoulderWidth < 150) {
          state = 1;
        } else if (shoulderWidth > 150 && shoulderWidth < 200) {
          state = 2;
        } else if (shoulderWidth > 200) {
          state = 3;
        }

        if (previousState !== state) {
          previousState = state;
          currentBackgroundOpacity = 0; // Reset opacity for the transition
        }

        currentBackgroundOpacity = p5.lerp(
          currentBackgroundOpacity,
          targetBackgroundOpacity,
          0.04
        );

        // console.log(distance);

        switch (state) {
          case 1:
            loadingAngle2 = 0;
            loadingAngle3 = 0;
            thirdInfoVisible = false;
            secondInfoVisible = false;
            p5.background(firstPicture, currentBackgroundOpacity);
            p5.fill(255, 255, 255, buttonOpacity);
            p5.ellipse(button1X, button1Y, buttonSize);
            buttonPress(button1X, button1Y, p5);
            if (buttonClicked) {
              p5.noFill();
              p5.stroke(255);
              p5.strokeWeight(3);
              p5.arc(
                button1X,
                button1Y,
                buttonSize - 10,
                buttonSize - 10,
                0,
                loadingAngle1
              );
              loadingAngle1 += 0.1;
              if (loadingAngle1 >= p5.TWO_PI) {
                firstInfoVisible = true;
              }
            }
            
            if (firstInfoVisible){
              p5.image(firstInfo, 0, button1Y - 200, window.innerWidth/2, window.innerHeight/3 + 150);
            }
            
            if (buttonHovered) {
              buttonOpacity = 200;
            } else {
              buttonOpacity = 100;
            }
            break;
          case 2:
            firstInfoVisible = false;
            thirdInfoVisible = false;
            loadingAngle1 = 0;
            loadingAngle3 = 0;
            p5.background(secondPicture, currentBackgroundOpacity);
            p5.fill(255, 255, 255, buttonOpacity);
            p5.ellipse(button2X, button2Y, buttonSize);
            buttonPress(button2X, button2Y, p5);
            if (buttonClicked) {
              p5.noFill();
              p5.stroke(255);
              p5.strokeWeight(3);
              p5.arc(
                button2X,
                button2Y,
                buttonSize - 10,
                buttonSize - 10,
                0,
                loadingAngle2
              );
              loadingAngle2 += 0.1;
              if (loadingAngle2 >= p5.TWO_PI) {
                secondInfoVisible = true;
              }
            }
            
            if (secondInfoVisible){
              p5.image(secondInfo, window.innerWidth - window.innerWidth/3 - 125, button1Y - 200, window.innerWidth/3 + 125, window.innerHeight/3 + 150);
            }
            
            if (buttonHovered) {
              buttonOpacity = 200;
            } else {
              buttonOpacity = 100;
            }
            break;
          case 3:
            loadingAngle1 = 0;
            loadingAngle2 = 0;
            firstInfoVisible = false;
            secondInfoVisible = false;
            p5.background(thirdPicture, currentBackgroundOpacity); // Red background for state 3
            p5.fill(255, 255, 255, buttonOpacity);
            p5.ellipse(button3X, button3Y, buttonSize);
            buttonPress(button3X, button3Y, p5);
            if (buttonClicked) {
              p5.noFill();
              p5.stroke(255);
              p5.strokeWeight(3);
              p5.arc(
                button3X,
                button3Y,
                buttonSize - 10,
                buttonSize - 10,
                0,
                loadingAngle3
              );
              loadingAngle3 += 0.1;
              if (loadingAngle3 >= p5.TWO_PI) {
                thirdInfoVisible = true;
              }
            }
            
            if (thirdInfoVisible){
              p5.image(thirdInfo, 0, 0, window.innerWidth/3 + 75, window.innerHeight/3 + 150);
            }
            if (buttonHovered) {
              buttonOpacity = 200;
            } else {
              buttonOpacity = 100;
            }
            break;
        }

        // Draw the hand sprite
        p5.image(userHand, easedWristX - 25, easedWristY - 25, 50, 50); // Adjust size and position as needed

        p5.pop();
      }
    } else {
      isPerson = false;
      loadingAngle0 = 0; 
      currentTime = p5.millis();
      // Draw the background and title text (unmirrored)
      p5.image(gif, 0, 0, p5.width, p5.height); // Draw the background GIF
      p5.noStroke();
      p5.textSize(32);
      p5.textAlign(p5.CENTER, p5.CENTER);
      p5.fill(255);
      p5.text(
        "The Life of MacRitchie: An Interactive Journey",
        p5.width / 2,
        p5.height / 2
      );
      p5.fill(255, 255, 255, buttonOpacity);
            p5.ellipse(button0X, button0Y, buttonSize);
            buttonPress(button0X, button0Y, p5);
    }

  };
});

async function predictWebcam() {
  // Now let's start detecting the stream.
  let startTimeMs = performance.now();

  if (lastVideoTime !== video.elt.currentTime && poseLandmarker) {
    lastVideoTime = video.elt.currentTime;
    poseLandmarker.detectForVideo(video.elt, startTimeMs, (result) => {
      landMarks = result.landmarks;
      worldLandmarks = result.worldLandmarks;
    });
  }

  // Call this function again to keep predicting when the browser is ready.
  window.requestAnimationFrame(predictWebcam);
}

function captureWebcam(p5) {
  video = p5.createCapture(
    {
      audio: false,
      video: {
        facingMode: "user",
      },
    },
    function (stream) {
      captureEvent = stream;
      // do things when video ready
      // until then, the video element will have no dimensions, or default 640x480
      setCameraDimensions(p5);

      predictWebcam();
    }
  );
  video.elt.setAttribute("playsinline", "");
  video.hide();
}

function setCameraDimensions(p5) {
  loadedCamera = captureEvent.getTracks()[0].getSettings();
  video.size(1280, 720);
}

function buttonPress(x, y, p5) {
  if (landMarks.length > 0) {
    const pose = landMarks[0];
    let wristX = pose[20].x * p5.width;
    let wristY = pose[20].y * p5.height;
    if (
      wristX > x - buttonSize / 2 &&
      wristX < x + buttonSize / 2 &&
      wristY > y - buttonSize / 2 &&
      wristY < y + buttonSize / 2
    ) {
      buttonClicked = true;
      buttonHovered = true;
    } else {
      buttonClicked = false;
      buttonHovered = false;
    }
  }
}
