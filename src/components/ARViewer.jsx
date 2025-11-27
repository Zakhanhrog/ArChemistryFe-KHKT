import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'aframe';
import 'mind-ar/dist/mindar-image-aframe.prod.js';
import targetsMind from '@/assets/markers/targets.mind';
import testModel from '@/assets/models/test.glb';
import test2Model from '@/assets/models/test2.glb';
import { Button } from '@/components/ui/button';
import { Camera, ChevronDown, Info, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import api from '@/services/api';
import { getApiBaseUrl } from '@/utils/config';

export default () => {
  const navigate = useNavigate();
  const sceneRef = useRef(null);
  const videoRef = useRef(null);
  const [cameras, setCameras] = useState([]);
  const [currentCameraId, setCurrentCameraId] = useState(null);
  const [showCameraMenu, setShowCameraMenu] = useState(false);
  const currentStreamRef = useRef(null);
  const [isStreamReady, setIsStreamReady] = useState(false);
  const arReadyHandledRef = useRef(false);
  const isInitializedRef = useRef(false);
  const [arConfig, setArConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [useBackendFiles, setUseBackendFiles] = useState(false);
  const targetFoundCountRef = useRef({});
  const setupCleanupRef = useRef(null);
  const isMountedRef = useRef(true);
  const [sceneKey, setSceneKey] = useState(0);
  const [currentTarget, setCurrentTarget] = useState(null);
  const [isTracking, setIsTracking] = useState(false);

  // Detect mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Cleanup khi component unmount
  useEffect(() => {
    isMountedRef.current = true;
    const newKey = Date.now(); // Tạo key mới khi mount
    setSceneKey(newKey);
    
    return () => {
      isMountedRef.current = false;
      
      // Stop camera stream
      if (currentStreamRef.current) {
        currentStreamRef.current.getTracks().forEach(track => {
          track.stop();
        });
        currentStreamRef.current = null;
      }

      // Stop video playback
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      }

      // Stop AR system và cleanup scene
      const sceneEl = sceneRef.current;
      if (sceneEl) {
        // Stop AR system trước
        const arSystem = sceneEl.systems && sceneEl.systems["mindar-image-system"];
        if (arSystem) {
          try {
            if (arSystem.stop) {
              arSystem.stop();
            }
            // Reset video source
            if (arSystem.video) {
              arSystem.video.pause();
              arSystem.video.srcObject = null;
            }
          } catch (e) {
            // Error stopping AR system
          }
        }

        // Stop renderer và disconnect
        try {
          if (sceneEl.renderer) {
            sceneEl.renderer.dispose();
          }
          if (sceneEl.camera) {
            sceneEl.camera = null;
          }
          if (sceneEl.hasLoaded) {
            sceneEl.removeAllListeners();
          }
          // Disconnect scene
          sceneEl.disconnect();
        } catch (e) {
          // Error disposing scene
        }

        // Remove scene từ DOM
        if (sceneEl.parentNode) {
          sceneEl.parentNode.removeChild(sceneEl);
        }
        
        // Clear reference
        sceneRef.current = null;
      }

      // Reset refs
      arReadyHandledRef.current = false;
      isInitializedRef.current = false;
      targetFoundCountRef.current = {};
      
      // Reset tracking state
      setCurrentTarget(null);
      setIsTracking(false);
      
      // Clear setup cleanup
      if (setupCleanupRef.current) {
        setupCleanupRef.current();
        setupCleanupRef.current = null;
      }
    };
  }, []);

  // Load AR config từ API - dùng HTTP URL trực tiếp
  useEffect(() => {
    const loadARConfig = async () => {
      try {
        setLoadingConfig(true);
        setArConfig(null);
        setUseBackendFiles(false);
        
        const response = await api.get('/api/ar/targets');
        
        if (!isMountedRef.current) return;
        
        if (response.data.success && response.data.data) {
          const config = response.data.data;
          const baseURL = api.defaults.baseURL || getApiBaseUrl();
          
          // Build full HTTP URLs cho marker và models
          if (config.markerFile) {
            config.markerFile.fullUrl = baseURL + config.markerFile.url;
          }
          
          if (config.targets && Array.isArray(config.targets)) {
            config.targets.forEach((target) => {
              if (target.model) {
                target.model.fullUrl = baseURL + target.model.url;
              }
            });
          }
          
          setArConfig(config);
          setUseBackendFiles(true);
        } else {
          setUseBackendFiles(false);
        }
      } catch (error) {
        // Failed to load AR config
        if (isMountedRef.current) {
          setUseBackendFiles(false);
        }
      } finally {
        if (isMountedRef.current) {
          setLoadingConfig(false);
        }
      }
    };

    loadARConfig();
  }, []);

  // Khởi tạo camera stream
  const initCameraStream = async (deviceId = null) => {
    if (!isMountedRef.current) return;
    
    try {
      // Stop stream hiện tại nếu có
      if (currentStreamRef.current) {
        currentStreamRef.current.getTracks().forEach(track => {
          track.stop();
        });
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
      
      if (!isMountedRef.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      
      currentStreamRef.current = stream;

      // Cập nhật video element hiển thị
      if (videoRef.current && isMountedRef.current) {
        videoRef.current.srcObject = stream;
        
        // Đợi video có metadata
        await new Promise((resolve) => {
          const checkReady = () => {
            if (!isMountedRef.current) {
              resolve();
              return;
            }
            if (videoRef.current && (videoRef.current.readyState >= 2 || videoRef.current.videoWidth > 0)) {
              videoRef.current.play()
                .then(() => resolve())
                .catch(() => {
                  resolve();
                });
            } else {
              setTimeout(checkReady, 100);
            }
          };
          
          checkReady();
          
          const handleLoadedMetadata = () => {
            if (!videoRef.current || !isMountedRef.current) {
              resolve();
              return;
            }
            videoRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
            videoRef.current.play()
              .then(() => resolve())
              .catch(() => {
                resolve();
              });
          };
          
          if (videoRef.current && isMountedRef.current) {
            videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
          }
          
          setTimeout(() => {
            if (videoRef.current && videoRef.current.readyState < 2 && isMountedRef.current) {
              videoRef.current.play().catch(() => {});
              resolve();
            }
          }, 5000);
        });
      }

      if (!isMountedRef.current) return;

      // Cập nhật MindAR video nếu scene đã ready
      const sceneEl = sceneRef.current;
      if (sceneEl && isMountedRef.current) {
        const arSystem = sceneEl.systems && sceneEl.systems["mindar-image-system"];
        if (arSystem && arSystem.video) {
          // QUAN TRỌNG: Set stream cho MindAR video
          arSystem.video.srcObject = stream;
          
          // Đảm bảo video play
          if (arSystem.video.paused) {
            arSystem.video.play().catch(() => {});
          }
        }
      }

      if (isMountedRef.current) {
        setIsStreamReady(true);
      }
      return stream;
    } catch (err) {
      if (isMountedRef.current) {
        setIsStreamReady(false);
      }
      throw err;
    }
  };

  // Lấy danh sách cameras - chỉ chạy khi component mount và config đã load
  useEffect(() => {
    if (loadingConfig) return;
    
    const getCameras = async () => {
      if (!isMountedRef.current) return;
      
      try {
        const constraints = isMobile 
          ? { video: { facingMode: 'environment' } }
          : { video: true };
        
        await navigator.mediaDevices.getUserMedia(constraints);
        
        if (!isMountedRef.current) return;
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        if (!isMountedRef.current) return;
        
        setCameras(videoDevices);
        
        if (videoDevices.length > 0) {
          let selectedDeviceId = currentCameraId;
          
          if (!selectedDeviceId) {
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
          }
          
          if (selectedDeviceId && isMountedRef.current) {
            await initCameraStream(selectedDeviceId);
          }
        }
      } catch (err) {
        // Error getting cameras
      }
    };

    getCameras();
  }, [isMobile, loadingConfig]);

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
    } catch (err) {
      // Error switching camera
    }
  };

  useEffect(() => {
    // Đợi config load xong và scene được render
    if (loadingConfig || !isMountedRef.current) return;
    
    // Reset refs khi setup lại
    arReadyHandledRef.current = false;
    isInitializedRef.current = false;
    
    const setupAR = () => {
      if (!isMountedRef.current) return;
      
      const sceneEl = sceneRef.current;
      if (!sceneEl) {
        setTimeout(setupAR, 200);
        return;
      }

      // Đăng ký component smoothing cho A-Frame - Tối ưu để giảm giật và mượt mà hơn
      if (typeof AFRAME !== 'undefined' && !AFRAME.components['smooth-tracking']) {
        const THREE = AFRAME.THREE;
        AFRAME.registerComponent('smooth-tracking', {
          schema: {
            factor: { type: 'number', default: 0.28 },
            positionThreshold: { type: 'number', default: 0.001 },
            rotationThreshold: { type: 'number', default: 0.01 }
          },
          init: function() {
            this.smoothedPosition = new THREE.Vector3();
            this.smoothedQuaternion = new THREE.Quaternion();
            this.lastPosition = new THREE.Vector3();
            this.lastQuaternion = new THREE.Quaternion();
            this.velocity = new THREE.Vector3();
            this.isInitialized = false;
            
            // Khởi tạo với giá trị hiện tại
            this.smoothedPosition.copy(this.el.object3D.position);
            this.smoothedQuaternion.copy(this.el.object3D.quaternion);
            this.lastPosition.copy(this.el.object3D.position);
            this.lastQuaternion.copy(this.el.object3D.quaternion);
          },
          tick: function(time, delta) {
            if (!delta || delta === 0) return;
            
            const currentPos = this.el.object3D.position;
            const currentQuat = this.el.object3D.quaternion;
            
            // Tính toán delta time normalized (60fps = 16.67ms)
            const normalizedDelta = Math.min(delta / 16.67, 2.0); // Giới hạn max 2x để tránh jump lớn
            
            // Tính adaptive factor dựa trên tốc độ thay đổi
            const posDelta = currentPos.distanceTo(this.lastPosition);
            const quatDelta = currentQuat.angleTo(this.lastQuaternion);
            
            // Nếu thay đổi quá nhỏ (jitter), giảm factor để giữ nguyên vị trí
            let adaptiveFactor = this.data.factor;
            if (posDelta < this.data.positionThreshold && quatDelta < this.data.rotationThreshold) {
              // Dead zone: giữ nguyên nếu thay đổi quá nhỏ
              adaptiveFactor = this.data.factor * 0.3;
            } else if (posDelta > 0.1 || quatDelta > 0.5) {
              // Thay đổi lớn: tăng factor để responsive hơn
              adaptiveFactor = Math.min(this.data.factor * 1.5, 0.5);
            }
            
            // Áp dụng normalized delta time
            const finalFactor = 1 - Math.pow(1 - adaptiveFactor, normalizedDelta);
            
            // Tính velocity để dự đoán chuyển động (chỉ khi đã khởi tạo)
            if (this.isInitialized) {
              this.velocity.subVectors(currentPos, this.lastPosition);
              this.velocity.multiplyScalar(0.2); // Damping factor nhẹ để tránh overshoot
            } else {
              this.velocity.set(0, 0, 0);
            }
            
            // Lerp position với velocity prediction nhẹ
            this.smoothedPosition.lerp(currentPos, finalFactor);
            
            // Áp dụng velocity prediction nhẹ để giảm lag (chỉ khi có chuyển động đáng kể)
            if (this.isInitialized && this.velocity.length() > 0.001) {
              const velocityOffset = this.velocity.clone().multiplyScalar(0.15); // Nhẹ nhàng
              this.smoothedPosition.add(velocityOffset);
            }
            
            // Smooth rotation với slerp
            this.smoothedQuaternion.slerp(currentQuat, finalFactor);
            
            // Áp dụng smoothed values
            this.el.object3D.position.copy(this.smoothedPosition);
            this.el.object3D.quaternion.copy(this.smoothedQuaternion);
            
            // Lưu giá trị cho lần sau
            this.lastPosition.copy(currentPos);
            this.lastQuaternion.copy(currentQuat);
            this.isInitialized = true;
          }
        });
      }

      // Đăng ký component zoom tương tác cho model 3D
      if (typeof AFRAME !== 'undefined' && !AFRAME.components['interactive-zoom']) {
        AFRAME.registerComponent('interactive-zoom', {
          schema: {
            targetId: { type: 'string' },
            minScale: { type: 'number', default: 0.5 },
            maxScale: { type: 'number', default: 3.0 },
            sensitivity: { type: 'number', default: 0.01 }
          },
          init: function() {
            this.currentScale = 1.0;
            this.targetScale = 1.0;
            this.isZooming = false;
            this.lastTouchDistance = 0;
            this.lastWheelTime = 0;
            
            // Lấy model entity (child gltf-model)
            this.modelEl = this.el.querySelector('a-gltf-model');
            if (!this.modelEl) {
              console.warn('interactive-zoom: No gltf-model found');
              return;
            }
            
            // Lưu base scale từ attribute
            const baseScale = this.modelEl.getAttribute('scale');
            if (baseScale) {
              this.baseScale = typeof baseScale === 'object' ? baseScale : { x: baseScale, y: baseScale, z: baseScale };
            } else {
              this.baseScale = { x: 1, y: 1, z: 1 };
            }
            
            // Touch events cho mobile (pinch-to-zoom) - attach to entity
            this.el.addEventListener('touchstart', this.onTouchStart.bind(this));
            this.el.addEventListener('touchmove', this.onTouchMove.bind(this));
            this.el.addEventListener('touchend', this.onTouchEnd.bind(this));
            
            // Lưu reference vào scene để có thể truy cập từ React
            const scene = this.el.sceneEl;
            if (scene && this.data.targetId) {
              if (!scene.modelZoomComponents) {
                scene.modelZoomComponents = {};
              }
              scene.modelZoomComponents[this.data.targetId] = this;
              
              // Setup wheel listener sau khi scene đã render
              this.wheelHandler = this.onWheel.bind(this);
              this.wheelTarget = null;
              
              // Đợi scene render xong rồi mới setup wheel listener
              if (scene.hasLoaded) {
                this.setupWheelListener();
              } else {
                scene.addEventListener('loaded', () => {
                  this.setupWheelListener();
                });
              }
            }
            
            // Track visibility để enable/disable wheel
            this.wasVisible = false;
          },
          
          onTouchStart: function(e) {
            if (e.touches.length === 2) {
              this.isZooming = true;
              const touch1 = e.touches[0];
              const touch2 = e.touches[1];
              this.lastTouchDistance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
              );
              e.preventDefault();
            }
          },
          
          onTouchMove: function(e) {
            if (e.touches.length === 2 && this.isZooming) {
              const touch1 = e.touches[0];
              const touch2 = e.touches[1];
              const currentDistance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
              );
              
              const delta = (currentDistance - this.lastTouchDistance) * this.data.sensitivity;
              this.updateScale(delta);
              
              this.lastTouchDistance = currentDistance;
              e.preventDefault();
            }
          },
          
          onTouchEnd: function(e) {
            if (e.touches.length < 2) {
              this.isZooming = false;
            }
          },
          
          setupWheelListener: function() {
            if (this.wheelTarget) return; // Đã setup rồi
            
            const scene = this.el.sceneEl;
            if (!scene || !this.wheelHandler) return;
            
            // Thử lấy canvas từ renderer
            let canvas = null;
            if (scene.renderer && scene.renderer.domElement) {
              canvas = scene.renderer.domElement;
            } else if (scene.canvas) {
              canvas = scene.canvas;
            } else {
              // Fallback: tìm canvas trong scene
              const canvasEl = scene.querySelector('canvas');
              if (canvasEl) canvas = canvasEl;
            }
            
            if (canvas) {
              canvas.addEventListener('wheel', this.wheelHandler, { passive: false });
              this.wheelTarget = canvas;
            } else {
              // Fallback cuối cùng: attach to window (chỉ khi target visible)
              window.addEventListener('wheel', this.wheelHandler, { passive: false });
              this.wheelTarget = window;
            }
          },
          
          onWheel: function(e) {
            // Chỉ zoom khi model đang hiển thị (visible)
            if (!this.modelEl || !this.modelEl.object3D.visible) return;
            
            // Throttle wheel events
            const now = Date.now();
            if (now - this.lastWheelTime < 16) return; // ~60fps max
            this.lastWheelTime = now;
            
            const delta = -e.deltaY * this.data.sensitivity * 0.1;
            this.updateScale(delta);
            e.preventDefault();
            e.stopPropagation();
          },
          
          updateScale: function(delta) {
            this.targetScale = Math.max(
              this.data.minScale,
              Math.min(this.data.maxScale, this.targetScale + delta)
            );
          },
          
          setScale: function(scale) {
            this.targetScale = Math.max(
              this.data.minScale,
              Math.min(this.data.maxScale, scale)
            );
            this.currentScale = this.targetScale;
            this.applyScale();
          },
          
          resetScale: function() {
            this.targetScale = 1.0;
            this.currentScale = 1.0;
            this.applyScale();
          },
          
          applyScale: function() {
            if (!this.modelEl) return;
            
            const newScale = {
              x: this.baseScale.x * this.currentScale,
              y: this.baseScale.y * this.currentScale,
              z: this.baseScale.z * this.currentScale
            };
            
            this.modelEl.setAttribute('scale', newScale);
          },
          
          tick: function(time, delta) {
            if (!delta || delta === 0) return;
            
            // Kiểm tra visibility để enable/disable wheel listener
            const isVisible = this.modelEl && this.modelEl.object3D.visible;
            if (isVisible !== this.wasVisible) {
              this.wasVisible = isVisible;
              // Wheel listener đã được setup từ đầu, không cần enable/disable
            }
            
            // Smooth interpolation đến target scale
            const scaleDiff = this.targetScale - this.currentScale;
            if (Math.abs(scaleDiff) > 0.001) {
              const normalizedDelta = Math.min(delta / 16.67, 2.0);
              const lerpFactor = 1 - Math.pow(0.1, normalizedDelta); // Smooth interpolation
              this.currentScale += scaleDiff * lerpFactor;
              this.applyScale();
            }
          },
          
          remove: function() {
            this.el.removeEventListener('touchstart', this.onTouchStart);
            this.el.removeEventListener('touchmove', this.onTouchMove);
            this.el.removeEventListener('touchend', this.onTouchEnd);
            
            // Remove wheel handler
            if (this.wheelHandler && this.wheelTarget) {
              this.wheelTarget.removeEventListener('wheel', this.wheelHandler);
            }
            
            const scene = this.el.sceneEl;
            if (scene && scene.modelZoomComponents && this.data.targetId) {
              delete scene.modelZoomComponents[this.data.targetId];
            }
          }
        });
      }

      // Event handlers
      const handleTargetFound = (event) => {
        if (!isMountedRef.current) return;
        const targetIndex = event.detail?.targetIndex ?? event.target?.getAttribute('mindar-image-target')?.match(/targetIndex:\s*(\d+)/)?.[1];
        if (targetIndex !== undefined) {
          const idx = parseInt(targetIndex);
          targetFoundCountRef.current[idx] = (targetFoundCountRef.current[idx] || 0) + 1;
          
          // Tìm target data từ config
          if (useBackendFiles && arConfig && arConfig.targets) {
            const targetData = arConfig.targets.find(t => t.targetIndex === idx);
            if (targetData && isMountedRef.current) {
              setCurrentTarget(targetData);
              setIsTracking(true);
            }
          }
        }
      };

      const handleTargetLost = (event) => {
        if (!isMountedRef.current) return;
        // Reset tracking state khi mất target
        setIsTracking(false);
        setCurrentTarget(null);
      };

      const handleRenderStart = async () => {
        if (!isMountedRef.current || isInitializedRef.current) return;
        
        const arSystem = sceneEl.systems && sceneEl.systems["mindar-image-system"];
        if (!arSystem || !arSystem.start) {
          return;
        }
        
        // Đảm bảo video stream được set cho MindAR
        if (currentStreamRef.current && arSystem.video) {
          if (arSystem.video.srcObject !== currentStreamRef.current) {
            arSystem.video.srcObject = currentStreamRef.current;
          }
          
          // Đợi video có metadata
          if (!arSystem.video.videoWidth || !arSystem.video.videoHeight) {
            await new Promise((resolve) => {
              const checkMetadata = () => {
                if (!isMountedRef.current) {
                  resolve();
                  return;
                }
                if (arSystem.video.videoWidth && arSystem.video.videoHeight) {
                  resolve();
                } else {
                  setTimeout(checkMetadata, 100);
                }
              };
              checkMetadata();
            });
          }
          
          if (!isMountedRef.current) return;
          
          // Đảm bảo video đang play
          if (arSystem.video.paused) {
            try {
              await arSystem.video.play();
            } catch (err) {
              // MindAR video play error
            }
          }
        }
        
        if (!isMountedRef.current) return;
        
        // Start AR
        try {
          arSystem.start();
          isInitializedRef.current = true;
        } catch (err) {
          // Error starting AR
        }
      };

      const handleARReady = () => {
        if (!isMountedRef.current || arReadyHandledRef.current) return;
        arReadyHandledRef.current = true;
        
        // Cập nhật MindAR video với stream của chúng ta
        if (currentStreamRef.current) {
          const arSystem = sceneEl.systems && sceneEl.systems["mindar-image-system"];
          if (arSystem && arSystem.video) {
            if (arSystem.video.srcObject !== currentStreamRef.current) {
              arSystem.video.srcObject = currentStreamRef.current;
            }
            
            // Đảm bảo video play
            if (arSystem.video.paused) {
              arSystem.video.play().catch(() => {});
            }
          }
        }
        
        // QUAN TRỌNG: KHÔNG dùng display:none cho MindAR video
        // Chỉ ẩn bằng opacity để MindAR vẫn có thể tracking
        setTimeout(() => {
          if (!isMountedRef.current) return;
          const mindarVideo = sceneEl.querySelector('video');
          if (mindarVideo && mindarVideo !== videoRef.current) {
            mindarVideo.style.opacity = '0';
            mindarVideo.style.pointerEvents = 'none';
            mindarVideo.style.position = 'absolute';
            mindarVideo.style.zIndex = '0';
          }
        }, 100);
      };

      const handleLoaded = () => {
        if (!isMountedRef.current) return;
        sceneEl.addEventListener('renderstart', handleRenderStart);
        
        // Add target found/lost listeners cho mỗi target entity
        setTimeout(() => {
          if (!isMountedRef.current) return;
          const targetEntities = sceneEl.querySelectorAll('[mindar-image-target]');
          targetEntities.forEach((entity) => {
            entity.addEventListener('targetFound', handleTargetFound);
            entity.addEventListener('targetLost', handleTargetLost);
          });
        }, 500);
      };

      // Check if scene already loaded
      if (sceneEl.hasLoaded) {
        handleLoaded();
      } else {
        sceneEl.addEventListener('loaded', handleLoaded);
      }
      
      sceneEl.addEventListener('arReady', handleARReady);
      sceneEl.addEventListener('renderstart', handleRenderStart);

      // Store cleanup function
      const cleanup = () => {
        arReadyHandledRef.current = false;
        isInitializedRef.current = false;
        
        if (sceneEl && isMountedRef.current) {
          sceneEl.removeEventListener('loaded', handleLoaded);
          sceneEl.removeEventListener('renderstart', handleRenderStart);
          sceneEl.removeEventListener('arReady', handleARReady);
          
          const targetEntities = sceneEl.querySelectorAll('[mindar-image-target]');
          targetEntities.forEach((entity) => {
            entity.removeEventListener('targetFound', handleTargetFound);
            entity.removeEventListener('targetLost', handleTargetLost);
          });
          
          const arSystem = sceneEl.systems && sceneEl.systems["mindar-image-system"];
          if (arSystem) {
            try {
              if (arSystem.stop) {
                arSystem.stop();
              }
              // Clear video source
              if (arSystem.video) {
                arSystem.video.pause();
                arSystem.video.srcObject = null;
              }
            } catch (e) {
              // Error stopping AR system
            }
          }
        }
      };
      
      setupCleanupRef.current = cleanup;
      return cleanup;
    };
    
    // Setup với delay nhỏ để đảm bảo scene đã render
    const timer = setTimeout(setupAR, 100);
    return () => {
      clearTimeout(timer);
      if (setupCleanupRef.current) {
        setupCleanupRef.current();
        setupCleanupRef.current = null;
      }
    };
  }, [loadingConfig, arConfig]);

  // Validate target indices
  useEffect(() => {
    if (arConfig && arConfig.targets) {
      arConfig.targets.forEach(target => {
        if (target.targetIndex < 0) {
          // Invalid targetIndex
        }
      });
    }
  }, [arConfig]);

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

      {/* Detail Button và Zoom Controls - Hiển thị khi đang track target */}
      {isTracking && currentTarget && (
        <>
          {/* Zoom Controls */}
          <div className="absolute bottom-32 right-4 z-50 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <Button
              onClick={() => {
                const sceneEl = sceneRef.current;
                if (sceneEl && sceneEl.modelZoomComponents) {
                  const zoomComponent = sceneEl.modelZoomComponents[currentTarget.id];
                  if (zoomComponent) {
                    const currentScale = zoomComponent.currentScale || 1.0;
                    zoomComponent.setScale(Math.min(currentScale + 0.2, 3.5));
                  }
                }
              }}
              variant="secondary"
              size="sm"
              className="bg-black/70 hover:bg-black/90 text-white border border-white/20 backdrop-blur-sm rounded-full w-12 h-12 p-0 flex items-center justify-center"
              title="Phóng to"
            >
              <ZoomIn className="w-5 h-5" />
            </Button>
            <Button
              onClick={() => {
                const sceneEl = sceneRef.current;
                if (sceneEl && sceneEl.modelZoomComponents) {
                  const zoomComponent = sceneEl.modelZoomComponents[currentTarget.id];
                  if (zoomComponent) {
                    const currentScale = zoomComponent.currentScale || 1.0;
                    zoomComponent.setScale(Math.max(currentScale - 0.2, 0.3));
                  }
                }
              }}
              variant="secondary"
              size="sm"
              className="bg-black/70 hover:bg-black/90 text-white border border-white/20 backdrop-blur-sm rounded-full w-12 h-12 p-0 flex items-center justify-center"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-5 h-5" />
            </Button>
            <Button
              onClick={() => {
                const sceneEl = sceneRef.current;
                if (sceneEl && sceneEl.modelZoomComponents) {
                  const zoomComponent = sceneEl.modelZoomComponents[currentTarget.id];
                  if (zoomComponent) {
                    zoomComponent.resetScale();
                  }
                }
              }}
              variant="secondary"
              size="sm"
              className="bg-black/70 hover:bg-black/90 text-white border border-white/20 backdrop-blur-sm rounded-full w-12 h-12 p-0 flex items-center justify-center"
              title="Reset về mặc định"
            >
              <RotateCcw className="w-5 h-5" />
            </Button>
          </div>

          {/* Detail Button */}
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Button
            onClick={() => {
              navigate('/ar/model-detail', {
                state: {
                  targetData: currentTarget
                }
              });
            }}
            className="text-white shadow-lg px-6 py-3 rounded-full flex items-center gap-2 backdrop-blur-sm"
            style={{ backgroundColor: '#1689E4', boxShadow: '0 10px 15px -3px rgba(22, 137, 228, 0.3)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1373C4'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1689E4'}
          >
            <Info className="w-5 h-5" />
            <span className="font-medium">Xem chi tiết</span>
          </Button>
        </div>
        </>
      )}

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

      {loadingConfig ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="text-white">Đang tải cấu hình AR...</div>
      </div>
      ) : (
        <a-scene 
          key={`ar-scene-${sceneKey}`}
          ref={sceneRef}
          mindar-image={`imageTargetSrc: ${useBackendFiles && arConfig?.markerFile?.fullUrl ? arConfig.markerFile.fullUrl : targetsMind}; autoStart: false; uiLoading: no; uiError: no; uiScanning: no; maxTrack: ${useBackendFiles && arConfig?.markerFile?.totalTargets ? arConfig.markerFile.totalTargets : (arConfig?.targets?.length || 2)}; filterMinCF: 35; filterBeta: 15000;`}
          color-space="sRGB" 
          embedded 
          renderer="colorManagement: true, physicallyCorrectLights, antialias: true, powerPreference: high-performance" 
          vr-mode-ui="enabled: false" 
          device-orientation-permission-ui="enabled: false"
        >
          <a-assets>
            {useBackendFiles && arConfig ? (
              arConfig.targets.map((target) => {
                if (!target.model.fullUrl) {
                  return null;
                }
                return (
                  <a-asset-item 
                    key={target.id} 
                    id={`model${target.id}`} 
                    src={target.model.fullUrl}
                  ></a-asset-item>
                );
              }).filter(Boolean)
            ) : (
              <>
                <a-asset-item id="testModel" src={testModel}></a-asset-item>
                <a-asset-item id="test2Model" src={test2Model}></a-asset-item>
              </>
            )}
          </a-assets>

          <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>

          {useBackendFiles && arConfig ? (
            arConfig.targets.map((target) => {
              const scale = target.scale || [0.15, 0.15, 0.15];
              const position = target.position || [0, 0, 0.1];
              const rotation = target.rotation || [0, 0, 0];
              const anim = target.animation;
              
              return (
                <a-entity 
                  key={target.id}
                  mindar-image-target={`targetIndex: ${target.targetIndex}`} 
                  smooth-tracking="factor: 0.28; positionThreshold: 0.001; rotationThreshold: 0.01"
                  interactive-zoom={`targetId: ${target.id}; minScale: 0.3; maxScale: 3.5; sensitivity: 0.01`}
                >
                  <a-gltf-model 
                    rotation={`${rotation[0]} ${rotation[1]} ${rotation[2]}`}
                    position={`${position[0]} ${position[1]} ${position[2]}`}
                    scale={`${scale[0]} ${scale[1]} ${scale[2]}`}
                    src={`#model${target.id}`}
                    animation={anim?.enabled ? `property: ${anim.type}; to: ${anim.to.join(' ')}; dur: ${anim.duration}; easing: ${anim.easing}; loop: ${anim.loop}; ${anim.direction ? `dir: ${anim.direction}` : ''}` : ''}
                  ></a-gltf-model>
                </a-entity>
              );
            })
          ) : (
            <>
              <a-entity mindar-image-target="targetIndex: 0" smooth-tracking="factor: 0.28; positionThreshold: 0.001; rotationThreshold: 0.01" interactive-zoom="targetId: test-0; minScale: 0.3; maxScale: 3.5; sensitivity: 0.01">
                <a-gltf-model 
                  rotation="0 0 0" 
                  position="0 0 0.1" 
                  scale="0.15 0.15 0.15" 
                  src="#testModel" 
                  animation="property: position; to: 0 0.1 0.1; dur: 1000; easing: easeInOutQuad; loop: true; dir: alternate"
                ></a-gltf-model>
              </a-entity>

              <a-entity mindar-image-target="targetIndex: 1" smooth-tracking="factor: 0.28; positionThreshold: 0.001; rotationThreshold: 0.01" interactive-zoom="targetId: test-1; minScale: 0.3; maxScale: 3.5; sensitivity: 0.01">
                <a-gltf-model 
                  rotation="0 0 0" 
                  position="0 0 0.1" 
                  scale="0.15 0.15 0.15" 
                  src="#test2Model" 
                  animation="property: rotation; to: 0 360 0; dur: 2000; easing: linear; loop: true"
                ></a-gltf-model>
              </a-entity>
            </>
          )}
        </a-scene>
      )}
      <style>{`
        a-scene {
          width: 100% !important;
          height: 100% !important;
          display: block !important;
          position: relative !important;
        }
        /* QUAN TRỌNG: KHÔNG dùng display:none cho MindAR video */
        /* MindAR cần video để tracking, chỉ ẩn bằng opacity */
        a-scene video {
          opacity: 0 !important;
          pointer-events: none !important;
          position: absolute !important;
          z-index: 0 !important;
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
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
