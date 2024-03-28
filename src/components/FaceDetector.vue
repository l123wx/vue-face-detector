<template>
  <div class="face-detector-container">
    <Spin
      :spinning="!isFaceApiInitialized"
      tip="人脸识别模块初始化中..."
    >
      <div class="viewer">
        <video
          id="inputVideo"
          ref="inputVideoRef"
          autoplay
          muted
          playsinline
        />
        <img
          class="cover"
          src="@/assets/images/face-detector-cover.png"
        />
        <canvas
          width="350px"
          height="213px"
          ref="canvasRef"
          style="position: absolute; top: 0; left: 0"
        />
        <div class="border">
          <div></div>
          <div></div>
        </div>
      </div>
    </Spin>
    <div
      v-if="isFaceApiInitialized"
      class="tips"
    >
      {{ tips }}
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
  import { Spin } from 'ant-design-vue'
  import * as faceapi from 'face-api.js'

  import useFaceDetector from '@/hooks/useFaceDetector'

  let stream: MediaStream
  const debug = false

  const inputVideoRef = ref<HTMLVideoElement>()
  const canvasRef = ref<HTMLCanvasElement>()
  const isDetecting = ref(false)
  const isMediaDeviceInitialized = ref(false)

  const { isFaceApiInitialized, detectSingleFace } = useFaceDetector()

  const tips = computed(() => {
    if (isDetecting.value) {
      return '识别到人脸, 请保持不要移动'
    }
    return '未检测到人脸，请将面部对准辅助检测框'
  })

  const init = () => {
    return initMediaDevices()
  }

  const initMediaDevices = () => {
    return new Promise<void>(async (resolve, reject) => {
      try {
        const videoEl = inputVideoRef.value
        stream = await navigator.mediaDevices.getUserMedia({ video: true })
        inputVideoRef.value!.srcObject = stream

        const interval = setInterval(() => {
          if (!(videoEl!.paused || videoEl!.ended)) {
            isMediaDeviceInitialized.value = true
            clearInterval(interval)
            resolve()
          }
        }, 100)
      } catch (err) {
        if (String(err).includes('Permission denied')) {
          alert('请开启摄像头权限')
        }
        reject(err)
      }
    })
  }

  const detect = async () => {
    try {
      const deadZoneRatio = 0.23
      const videoEl = inputVideoRef.value!
      const canvasElement = canvasRef.value!
      const ctx = canvasElement.getContext('2d')
      ctx?.clearRect(0, 0, canvasElement.width, canvasElement.height)

      if (debug) {
        ctx!.fillStyle = '#000000'
        ctx?.fillRect(
          0,
          0,
          canvasElement.width * deadZoneRatio,
          canvasElement.height
        )
        ctx?.fillRect(
          canvasElement.width * (1 - deadZoneRatio),
          0,
          canvasElement.width * deadZoneRatio,
          canvasElement.height
        )
      }

      const detection = await detectSingleFace(videoEl, deadZoneRatio)
      isDetecting.value = true

      const _detection = detection.forSize(
        canvasElement.width,
        canvasElement.height
      )
      faceapi.draw.drawDetections(canvasElement, [_detection])
    } catch (err) {
      isDetecting.value = false
    } finally {
      setTimeout(detect, 500)
    }

    // const canvas = await faceapi.extractFaces(videoEl, [
    //   detection.box,
    //   detection.box.toSquare(),
    //   detection.box.pad(10, 10),
    //   detection.box.pad(20, 10)
    // ])

    // document.body.append(...canvas)
  }

  onMounted(async () => {
    await init()
    detect()
  })

  onBeforeUnmount(() => {
    stream.getTracks().forEach(track => track.stop())
  })
</script>

<style scoped lang="less">
  .face-detector-container {
    width: 350px;

    .viewer {
      margin-top: 10px;
      height: 213px;
      position: relative;
      .border {
        position: absolute;
        height: 100%;
        width: 100%;
        top: 0;
        left: 0;
        div::before,
        div::after {
          content: '';
          width: 19px;
          height: 19px;
          display: inline-block;
          position: absolute;
          background-image: url(@/assets/images/border.png);
        }
        div::after {
          transform: scaleX(-1);
          right: 0;
        }
        div:nth-child(1) {
          position: absolute;
          transform: scaleY(-1);
          bottom: 0;
          width: 100%;
        }
      }
      #inputVideo {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .cover {
        position: absolute;
        width: 100%;
        left: 0;
        top: 0;
        opacity: 0.6;
      }
    }
    .tips {
      font-size: 14px;
      color: #0079fe;
      text-align: center;
      height: 26px;
      line-height: 26px;
      margin: 5px 0;
    }
    .button {
      height: 50px;
      width: 100%;
    }
  }
</style>
