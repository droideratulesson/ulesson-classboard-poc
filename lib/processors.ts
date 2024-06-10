import {
  Detection,
  DrawingUtils,
  FaceDetector,
  FilesetResolver,
  GestureRecognizer,
  GestureRecognizerResult,
} from '@mediapipe/tasks-vision';
import { createContext, useState } from 'react';

let runningMode: 'IMAGE' | 'VIDEO' = 'VIDEO';

// Keep a reference of all the child elements we create
// so we can remove them easilly on each render.
let children: any[] = [];

type GestureDetectorFun = {
  func: (desc: string) => void;
};

export let gestureDetectorFun: GestureDetectorFun = {
  func: (desc: string) => {
    console.log('Default handler called');
  },
};
export const GestureDetectionContext = createContext<string>('Connecting...');

const createGestureRecognizer = async (): Promise<GestureRecognizer> => {
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm',
  );
  return await GestureRecognizer.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
      delegate: 'GPU',
    },
    runningMode: runningMode,
  });
};

const createFaceDetector = async (): Promise<FaceDetector> => {
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm',
  );

  return await FaceDetector.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`,
      delegate: 'GPU',
    },
    runningMode: runningMode,
  });
};

export class MediapipeTransformer {
  inputVideo: HTMLVideoElement;
  lastVideoTime: number = 0;

  constructor(video: HTMLVideoElement) {
    this.inputVideo = video;
    this.init();
  }

  async init() {
    console.log('[MEDIAPIPE] Initializing...');
    this.gestureRecognizer = await createGestureRecognizer();
    this.faceDetector = await createFaceDetector();
    this.transform();
    console.log('[MEDIAPIPE] Initialized');
  }

  async destroy() {
    this.gestureRecognizer?.close();
    this.faceDetector?.close();
  }

  static get isSupported() {
    return typeof OffscreenCanvas !== 'undefined';
  }

  async transform() {
    console.log('[MEDIAPIPE] Transforming...');
    if ((this.inputVideo?.readyState ?? 0) < HTMLMediaElement.HAVE_CURRENT_DATA) {
      console.log(`[MEDIAPIPE] Video not ready yet`);
      window.requestAnimationFrame(this.transform.bind(this));
      return;
    }

    if (this.inputVideo.currentTime === this.lastVideoTime) {
      window.requestAnimationFrame(this.transform.bind(this));
      console.log('[MEDIAPIPE] Same time... Returning');
      return;
    }

    this.lastVideoTime = this.inputVideo.currentTime;

    try {
      let result = this.gestureRecognizer?.recognizeForVideo(this.inputVideo, new Date().getTime());
      this.drawResult(result);
      console.log('[MEDIAPIPE] Drawn the result of gesture recognizer??');
    } catch (e) {
      console.error(`[MEDIAPIPE] Error is ${e}`);
    }

    try {
      let result = this.faceDetector?.detectForVideo(this.inputVideo, new Date().getTime());

      if (result) {
        this.drawFaceDetectionResult(result.detections);
        console.log('[MEDIAPIPE] Drawn the result of face detection');
      }
    } catch (e) {
      console.error(`[MEDIAPIPE] Error is ${e}`);
    }
    window.requestAnimationFrame(this.transform.bind(this));
  }

  oldData: string = '';

  async drawResult(result?: GestureRecognizerResult) {
    if (!result || !this.inputVideo || !this.canvasElement) {
      return;
    }
    // this.canvasElement.width = this.inputVideo.width;
    // this.canvasElement.height = this.inputVideo.height;
    // let ctx = this.canvasElement.getContext('2d');
    // if (ctx == null) return;
    // ctx.save();
    // ctx.clearRect(0, 0, frame.displayWidth, frame.displayHeight);
    // const drawingUtils = new DrawingUtils(ctx);
    // if (result.landmarks) {
    //   for (const landmark of result.landmarks) {
    //     drawingUtils.drawConnectors(landmark, GestureRecognizer.HAND_CONNECTIONS, {
    //       color: '#00FF00',
    //       lineWidth: 5,
    //     });
    //     drawingUtils.drawLandmarks(landmark, { color: '#FF0000', lineWidth: 2 });
    //   }
    // }
    // ctx.restore();
    if (result.gestures.length > 0) {
      const categoryName = result.gestures[0][0].categoryName;
      const categoryScore = (result.gestures[0][0].score * 100).toFixed(2);
      const handedness = result.handedness[0][0].displayName;
      if (!categoryName.includes('None')) {
        this.oldData = `Category: ${categoryName}, Score: ${categoryScore}, Handedness: ${handedness}. `;
      } else {
        this.oldData = `No gesture detected. `;
      }
      // TODO: Show the element
    } else {
      // TODO: Hide the element
    }
  }

  async drawFaceDetectionResult(detections: Detection[]) {
    gestureDetectorFun.func(this.oldData + `\nNo of faces: ${detections.length}`);
    // let mainView = document.querySelector('.main-view');
    // for (let child of children) {
    //   mainView?.removeChild(child);
    // }
    // children.splice(0);
    // let video = this.inputVideo;
    // for (let detection of detections) {
    //   const highlighter = document.createElement('div');
    //   highlighter.setAttribute('class', 'highlighter');
    //   highlighter.setAttribute(
    //     'style',
    //     'left: ' +
    //       (video.width - detection.boundingBox!.originX - detection.boundingBox!.width / 2) +
    //       'px;' +
    //       'top: ' +
    //       detection.boundingBox!.originY +
    //       'px;' +
    //       'width: ' +
    //       detection.boundingBox!.width +
    //       'px;' +
    //       'height: ' +
    //       detection.boundingBox!.height +
    //       'px;',
    //   );
    //   mainView?.appendChild(highlighter);
    //   children.push(highlighter);
    //   for (let keypoint of detection.keypoints) {
    //     const keypointEl = document.createElement('span');
    //     keypointEl.className = 'key-point';
    //     keypointEl.style.top = `${keypoint.y * video.offsetHeight - 3}px`;
    //     keypointEl.style.left = `${video.offsetWidth - keypoint.x * video.offsetWidth - 3}px`;
    //     mainView?.appendChild(keypointEl);
    //     children.push(keypointEl);
    //   }
    // }
  }

  update(options: {}): void {}

  gestureRecognizer?: GestureRecognizer;
  faceDetector?: FaceDetector;
  canvasElement: HTMLCanvasElement | null = document.getElementById(
    'output_canvas',
  ) as HTMLCanvasElement | null;
}
