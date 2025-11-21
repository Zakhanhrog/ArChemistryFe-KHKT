import React, { useEffect, useRef, useState } from 'react';
import 'aframe';
import 'mind-ar/dist/mindar-image-aframe.prod.js';
import targetsMind from '@/assets/markers/targets.mind';
import testModel from '@/assets/models/test.glb';
import test2Model from '@/assets/models/test2.glb';
import { Button } from '@/components/ui/button';
import { Camera, ChevronDown } from 'lucide-react';

export default () => {
  const sceneRef = useRef(null);
  const videoRef = useRef(null);
  const [cameras, setCameras] = useState([]);
  const [currentCameraId, setCurrentCameraId] = useState(null);
  const [showCameraMenu, setShowCameraMenu] = useState(false);
  const currentStreamRef = useRef(null);
  const [isStreamReady, setIsStreamReady] = useState(false);
  const arReadyHandledRef = useRef(false);
  const isInitializedRef = useRef(false);

  // Detect mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Khởi tạo camera stream
  const initCameraStream = async (deviceId = null) => {
    try {
      // Stop stream hiện tại nếu có
      if (currentStreamRef.current) {
        currentStreamRef.current.getTracks().forEach(track => track.stop());
        currentStreamRef.current = null;
      }

      // Tạo constraints
      let constraints;
      if (deviceId) {
        constraints = {
          video: { 
            deviceId: { exact: deviceId },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        };
      } else if (isMobile) {
        constraints = { video: { facingMode: 'environment' } };
      } else {
        constraints = { video: true };
      }

      // Lấy camera stream
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      currentStreamRef.current = stream;

      // Cập nhật video element hiển thị và đợi metadata
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Đợi video có metadata trước khi play
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Video metadata timeout'));
          }, 5000);
          
          videoRef.current.onloadedmetadata = () => {
            clearTimeout(timeout);
            videoRef.current.play()
              .then(() => {
                console.log('Camera stream initialized with metadata');
                resolve();
              })
              .catch(reject);
          };
          
          videoRef.current.onerror = (e) => {
            clearTimeout(timeout);
            reject(new Error('Video error: ' + e));
          };
        });
      }

      // Cập nhật MindAR video nếu scene đã ready - đảm bảo video có metadata
      const sceneEl = sceneRef.current;
      if (sceneEl) {
        const arSystem = sceneEl.systems && sceneEl.systems["mindar-image-system"];
        if (arSystem && arSystem.video && arSystem.video.srcObject !== stream) {
          // Tạo video element tạm để đảm bảo có metadata
          const tempVideo = document.createElement('video');
          tempVideo.srcObject = stream;
          tempVideo.muted = true;
          
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('MindAR video metadata timeout'));
            }, 5000);
            
            tempVideo.onloadedmetadata = () => {
              clearTimeout(timeout);
              // Chỉ set stream sau khi có metadata
              arSystem.video.srcObject = stream;
              // Đảm bảo video play
              if (arSystem.video.paused) {
                arSystem.video.play().catch(err => {
                  console.warn('MindAR video play warning:', err);
                });
              }
              console.log('MindAR video stream updated with metadata');
              resolve();
            };
            
            tempVideo.onerror = (e) => {
              clearTimeout(timeout);
              // Vẫn set stream dù có lỗi metadata
              arSystem.video.srcObject = stream;
              console.warn('MindAR video metadata error, but stream set:', e);
              resolve();
            };
          });
        }
      }

      setIsStreamReady(true);
      return stream;
    } catch (err) {
      console.error('Error initializing camera stream:', err);
      setIsStreamReady(false);
      throw err;
    }
  };

  // Lấy danh sách cameras
  useEffect(() => {
    const getCameras = async () => {
      try {
        // Yêu cầu quyền truy cập camera trước
        const constraints = isMobile 
          ? { video: { facingMode: 'environment' } }
          : { video: true };
        
        await navigator.mediaDevices.getUserMedia(constraints);
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        setCameras(videoDevices);
        
        // Khởi tạo camera stream với camera phù hợp
        if (videoDevices.length > 0 && !currentCameraId) {
          let selectedDeviceId = null;
          
          // Trên mobile: tìm camera sau
          if (isMobile) {
            const backCamera = videoDevices.find(device => 
              device.label.toLowerCase().includes('back') || 
              device.label.toLowerCase().includes('environment') ||
              device.label.toLowerCase().includes('rear')
            ) || videoDevices[0];
            selectedDeviceId = backCamera.deviceId;
          } else {
            selectedDeviceId = videoDevices[0].deviceId;
          }
          
          setCurrentCameraId(selectedDeviceId);
          await initCameraStream(selectedDeviceId);
        }
      } catch (err) {
        console.error('Error getting cameras:', err);
      }
    };

    getCameras();
  }, [isMobile]);

  // Đóng menu khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCameraMenu && !event.target.closest('.camera-menu-container')) {
        setShowCameraMenu(false);
      }
    };

    if (showCameraMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showCameraMenu]);

  // Hàm chuyển đổi camera
  const switchCamera = async (deviceId) => {
    try {
      setShowCameraMenu(false);
      setCurrentCameraId(deviceId);
      await initCameraStream(deviceId);
      console.log('Camera switched successfully');
    } catch (err) {
      console.error('Error switching camera:', err);
    }
  };

  useEffect(() => {
    const sceneEl = sceneRef.current;
    if (!sceneEl) return;

    // Đăng ký component smoothing cho A-Frame
    if (typeof AFRAME !== 'undefined' && !AFRAME.components['smooth-tracking']) {
      const THREE = AFRAME.THREE;
      AFRAME.registerComponent('smooth-tracking', {
        schema: {
          factor: { type: 'number', default: 0.15 }
        },
        init: function() {
          this.smoothedPosition = new THREE.Vector3();
          this.smoothedQuaternion = new THREE.Quaternion();
          // Lưu position và rotation ban đầu
          this.smoothedPosition.copy(this.el.object3D.position);
          this.smoothedQuaternion.copy(this.el.object3D.quaternion);
        },
        tick: function() {
          const currentPos = this.el.object3D.position;
          const currentQuat = this.el.object3D.quaternion;
          
          // Smooth position bằng lerp
          this.smoothedPosition.lerp(currentPos, this.data.factor);
          this.el.object3D.position.copy(this.smoothedPosition);
          
          // Smooth rotation bằng slerp
          this.smoothedQuaternion.slerp(currentQuat, this.data.factor);
          this.el.object3D.quaternion.copy(this.smoothedQuaternion);
        }
      });
    }

    const handleRenderStart = async () => {
      if (isInitializedRef.current) return; // Chỉ chạy một lần
      
      const arSystem = sceneEl.systems && sceneEl.systems["mindar-image-system"];
      if (arSystem && arSystem.start) {
        // Đảm bảo video có metadata trước khi start AR
        if (currentStreamRef.current && arSystem.video) {
          if (arSystem.video.srcObject !== currentStreamRef.current) {
            arSystem.video.srcObject = currentStreamRef.current;
          }
          
          // Đợi video có metadata nếu chưa có
          if (!arSystem.video.videoWidth || !arSystem.video.videoHeight) {
            await new Promise((resolve) => {
              const checkMetadata = () => {
                if (arSystem.video.videoWidth && arSystem.video.videoHeight) {
                  console.log('MindAR video metadata ready:', {
                    width: arSystem.video.videoWidth,
                    height: arSystem.video.videoHeight
                  });
                  resolve();
                } else {
                  setTimeout(checkMetadata, 100);
                }
              };
              checkMetadata();
            });
          }
          
          // Đảm bảo video đang play
          if (arSystem.video.paused) {
            try {
              await arSystem.video.play();
            } catch (err) {
              console.warn('MindAR video play warning:', err);
            }
          }
          
          console.log('MindAR video ready for AR start');
        }
        
        // Start AR sau khi đảm bảo video ready
        try {
          arSystem.start(); // start AR 
          isInitializedRef.current = true;
          console.log('AR started successfully');
        } catch (err) {
          console.error('Error starting AR:', err);
        }
      }
    };

    const handleARReady = () => {
      // Chỉ xử lý một lần
      if (arReadyHandledRef.current) return;
      arReadyHandledRef.current = true;
      
      console.log('AR Ready');
      
      // Cập nhật MindAR video với stream của chúng ta (chỉ nếu chưa set)
      if (currentStreamRef.current) {
        const arSystem = sceneEl.systems && sceneEl.systems["mindar-image-system"];
        if (arSystem && arSystem.video && arSystem.video.srcObject !== currentStreamRef.current) {
          arSystem.video.srcObject = currentStreamRef.current;
          console.log('MindAR video stream updated on arReady');
        }
      }
      
      // Ẩn video của MindAR (vì chúng ta dùng video riêng) - chỉ làm một lần
      setTimeout(() => {
        const mindarVideo = sceneEl.querySelector('video');
        if (mindarVideo && mindarVideo !== videoRef.current) {
          mindarVideo.style.display = 'none';
        }
      }, 100);
    };

    const handleLoaded = () => {
      sceneEl.addEventListener('renderstart', handleRenderStart);
    };

    sceneEl.addEventListener('loaded', handleLoaded);
    sceneEl.addEventListener('arReady', handleARReady);

    return () => {
      // Reset flags
      arReadyHandledRef.current = false;
      isInitializedRef.current = false;
      
      // Stop camera stream
      if (currentStreamRef.current) {
        currentStreamRef.current.getTracks().forEach(track => track.stop());
        currentStreamRef.current = null;
      }

      if (sceneEl) {
        sceneEl.removeEventListener('loaded', handleLoaded);
        sceneEl.removeEventListener('renderstart', handleRenderStart);
        sceneEl.removeEventListener('arReady', handleARReady);
        const arSystem = sceneEl.systems && sceneEl.systems["mindar-image-system"];
        if (arSystem && arSystem.stop) {
          try {
            arSystem.stop();
          } catch (e) {
            // Ignore errors during cleanup
          }
        }
      }
    }
  }, []);

  return (
    <>
      {/* Video element riêng để hiển thị camera */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute top-0 left-0 w-full h-full object-cover z-10"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1,
          backgroundColor: '#000'
        }}
      />

      {/* Camera Switch Button */}
      {cameras.length > 1 && (
        <div className="absolute top-4 right-4 z-50 camera-menu-container">
          <div className="relative">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                setShowCameraMenu(!showCameraMenu);
              }}
              variant="secondary"
              size="sm"
              className="bg-black/70 hover:bg-black/90 text-white border border-white/20 backdrop-blur-sm"
            >
              <Camera className="w-4 h-4 mr-2" />
              Đổi camera
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
            
            {showCameraMenu && (
              <div 
                className="absolute top-full right-0 mt-2 bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg shadow-lg min-w-[200px] overflow-hidden z-50"
                onClick={(e) => e.stopPropagation()}
              >
                {cameras.map((camera) => (
                  <button
                    key={camera.deviceId}
                    onClick={(e) => {
                      e.stopPropagation();
                      switchCamera(camera.deviceId);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors ${
                      currentCameraId === camera.deviceId ? 'bg-white/20' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      <span className="truncate">
                        {camera.label || `Camera ${cameras.indexOf(camera) + 1}`}
                      </span>
                      {currentCameraId === camera.deviceId && (
                        <span className="ml-auto text-xs">✓</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <a-scene 
        ref={sceneRef} 
        mindar-image={`imageTargetSrc: ${targetsMind}; autoStart: false; uiLoading: no; uiError: no; uiScanning: no; maxTrack: 2; filterMinCF: 60; filterBeta: 10000;`}
        color-space="sRGB" 
        embedded 
        renderer="colorManagement: true, physicallyCorrectLights" 
        vr-mode-ui="enabled: false" 
        device-orientation-permission-ui="enabled: false"
      >
        <a-assets>
          <a-asset-item id="testModel" src={testModel}></a-asset-item>
          <a-asset-item id="test2Model" src={test2Model}></a-asset-item>
        </a-assets>

        <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>

        {/* Target 0: targets.mind → test.glb */}
        <a-entity mindar-image-target="targetIndex: 0" smooth-tracking="factor: 0.15">
          <a-gltf-model 
            rotation="0 0 0" 
            position="0 0 0.1" 
            scale="0.15 0.15 0.15" 
            src="#testModel" 
            animation="property: position; to: 0 0.1 0.1; dur: 1000; easing: easeInOutQuad; loop: true; dir: alternate"
          ></a-gltf-model>
        </a-entity>

        {/* Target 1: targets2.mind → test2.glb */}
        <a-entity mindar-image-target="targetIndex: 1" smooth-tracking="factor: 0.15">
          <a-gltf-model 
            rotation="0 0 0" 
            position="0 0 0.1" 
            scale="0.15 0.15 0.15" 
            src="#test2Model" 
            animation="property: rotation; to: 0 360 0; dur: 2000; easing: linear; loop: true"
          ></a-gltf-model>
        </a-entity>
      </a-scene>
      <style>{`
        a-scene {
          width: 100% !important;
          height: 100% !important;
          display: block !important;
          position: relative !important;
        }
        /* Ẩn video của MindAR vì chúng ta dùng video riêng */
        a-scene video {
          display: none !important;
        }
        a-scene canvas,
        canvas {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          z-index: 2 !important;
          width: 100% !important;
          height: 100% !important;
        }
      `}</style>
    </>
  )
}
