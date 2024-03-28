import { ref } from 'vue'
import * as faceapi from 'face-api.js'

type Options = {
  immediate: boolean
  /**
   * 人脸识别分数阈值
   */
  scoreThreshold: number
}

const useFaceDetector = (
  options: Options = {
    immediate: true,
    scoreThreshold: 0.5
  }
) => {
  const isFaceApiInitialized = ref(false)

  /**
   * 识别人脸
   * @param input
   * @param deadZoneRatio 左右两边不检测区域的占比
   */
  const detectSingleFace = async (
    input: faceapi.TNetInput,
    deadZoneRatio: number = 0
  ) => {
    const tinyFaceDetectorOptions = new faceapi.TinyFaceDetectorOptions({
      inputSize: faceapi.TinyYolov2SizeType.LG,
      scoreThreshold: options.scoreThreshold
    })
    const result = await faceapi.detectSingleFace(
      input,
      tinyFaceDetectorOptions
    )

    const isDetected =
      result &&
      result.box.left >= result.imageWidth * deadZoneRatio &&
      result.box.right <= result.imageWidth * (1 - deadZoneRatio)

    return isDetected ? result : Promise.reject('未检测到人脸')
  }

  const initFaceApiModel = async () => {
    const path = new URL(
      '/js/faceapi_model/tiny_face_detector_model-shard1',
      import.meta.url
    ).href.replace('/tiny_face_detector_model-shard1', '')
    await faceapi.nets.tinyFaceDetector.load(path)
    isFaceApiInitialized.value = true
  }

  options.immediate && initFaceApiModel()

  return {
    isFaceApiInitialized,
    detectSingleFace
  }
}

export default useFaceDetector
