/* MediaPipe runs in this classic worker so inference never blocks the game loop. */
importScripts('./vision/vision_bundle.js');

let tracker = null;
let initializing = false;
self.onmessage = async ({ data }) => {
  try {
    if (data.type === 'initialize') {
      if (initializing || tracker) throw new Error('Hand tracker is already initialized.');
      initializing = true;
      const files = await Vision.FilesetResolver.forVisionTasks(new URL('./vision', self.location.href).href);
      tracker = await Vision.HandLandmarker.createFromOptions(files, {
        baseOptions: {
          modelAssetPath: new URL('./models/hand_landmarker.task', self.location.href).href,
          delegate: 'CPU',
        },
        runningMode: 'VIDEO',
        numHands: 1,
        minHandDetectionConfidence: 0.65,
        minHandPresenceConfidence: 0.65,
        minTrackingConfidence: 0.65,
      });
      self.postMessage({ type: 'ready' });
    } else if (data.type === 'frame') {
      if (!tracker) throw new Error('Hand tracker has not finished loading.');
      const result = tracker.detectForVideo(data.bitmap, data.timestamp);
      self.postMessage({
        type: 'result', timestamp: data.timestamp,
        hand: result.landmarks[0] ?? null,
        identity: result.handedness[0]?.[0]?.categoryName ?? 'hand',
      });
    } else throw new Error('Unknown hand-tracker message.');
  } catch (error) {
    self.postMessage({ type: 'error', message: error instanceof Error ? error.message : String(error) });
  } finally {
    if (data.type === 'frame') data.bitmap.close();
  }
};
