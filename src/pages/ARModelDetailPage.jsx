import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

function ARModelDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [targetData, setTargetData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Lấy target data từ navigation state
    if (location.state?.targetData) {
      setTargetData(location.state.targetData);
      setLoading(false);
    } else {
      // Nếu không có state, có thể fetch từ API hoặc redirect về AR page
      console.warn('No target data found, redirecting to AR page');
      navigate('/ar?tab=scan');
    }
  }, [location.state, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">Đang tải...</p>
      </div>
    );
  }

  if (!targetData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Không tìm thấy dữ liệu model.</p>
          <Button onClick={() => navigate('/ar?tab=scan')}>
            Quay lại AR
          </Button>
        </div>
      </div>
    );
  }

  const modelUrl = targetData.model?.fullUrl || targetData.model?.url;

  return (
    <div className="min-h-screen bg-white">
      {/* Header with back button */}
      <div className="sticky top-0 z-20 bg-white border-b">
        <div className="container px-4 sm:px-6 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/ar?tab=scan')}
            className="flex items-center gap-1.5 text-gray-700 hover:text-gray-900 h-7 px-3 -ml-2 bg-blue-100/80 backdrop-blur-sm rounded-full"
          >
            <ArrowLeft className="h-4 w-4" c/>
            <span className="text-sm">Quay lại</span>
          </Button>
          <h1 className="text-lg font-semibold text-gray-900">Chi tiết Model</h1>
          <div className="w-20"></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* Model Content */}
      <div className="container px-4 sm:px-6 py-6 sm:py-8 max-w-4xl mx-auto">
        {/* Model Header */}
        <div className="mb-8">
          <div className="mb-4">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              {targetData.name || 'Model 3D'}
            </h1>
            {targetData.targetIndex !== undefined && (
              <Badge variant="secondary" className="text-sm">
                Marker Index: {targetData.targetIndex}
              </Badge>
            )}
          </div>
        </div>

        {/* Model Body */}
        <div className="text-gray-800 leading-relaxed space-y-6">
          {/* 3D Model */}
          {modelUrl && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Mô hình 3D</h2>
              <div 
                className="bg-gray-50 rounded-lg overflow-hidden relative" 
                style={{ 
                  height: '400px',
                  touchAction: 'none',
                  pointerEvents: 'auto'
                }}
              >
                <model-viewer
                  src={modelUrl}
                  alt={targetData.name || '3D Model'}
                  camera-controls
                  auto-rotate
                  interaction-policy="always-allow"
                  touch-action="none"
                  disable-zoom={false}
                  rotation-per-second="30deg"
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#f9fafb',
                    touchAction: 'none',
                    userSelect: 'none',
                    pointerEvents: 'auto',
                    cursor: 'grab'
                  }}
                  loading="lazy"
                  onLoad={(e) => {
                    const modelViewer = e.target;
                    if (modelViewer) {
                      modelViewer.setAttribute('interaction-policy', 'always-allow');
                      modelViewer.setAttribute('camera-controls', 'true');
                      modelViewer.focus();
                    }
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                  }}
                >
                </model-viewer>
              </div>
            </div>
          )}

          {/* Model Information */}
          <div className="bg-gray-50 rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Thông tin Model</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Tên</p>
                <p className="text-lg font-semibold text-gray-900">{targetData.name || 'N/A'}</p>
              </div>
              {targetData.targetIndex !== undefined && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Target Index</p>
                  <p className="text-lg font-semibold text-gray-900">{targetData.targetIndex}</p>
                </div>
              )}
              {targetData.scale && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Scale</p>
                  <p className="text-lg font-semibold text-gray-900">
                    X: {targetData.scale[0]}, Y: {targetData.scale[1]}, Z: {targetData.scale[2]}
                  </p>
                </div>
              )}
              {targetData.position && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Position</p>
                  <p className="text-lg font-semibold text-gray-900">
                    X: {targetData.position[0]}, Y: {targetData.position[1]}, Z: {targetData.position[2]}
                  </p>
                </div>
              )}
              {targetData.rotation && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Rotation</p>
                  <p className="text-lg font-semibold text-gray-900">
                    X: {targetData.rotation[0]}°, Y: {targetData.rotation[1]}°, Z: {targetData.rotation[2]}°
                  </p>
                </div>
              )}
              {targetData.animation && targetData.animation.enabled && (
                <div className="sm:col-span-2">
                  <p className="text-sm font-medium text-gray-600 mb-1">Animation</p>
                  <p className="text-lg font-semibold text-gray-900">
                    Type: {targetData.animation.type || 'N/A'}, 
                    Duration: {targetData.animation.duration || 'N/A'}ms,
                    Loop: {targetData.animation.loop ? 'Yes' : 'No'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Model URL Info */}
          {modelUrl && (
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-600 mb-1">Model File</p>
              <p className="text-sm text-gray-700 break-all">{modelUrl}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ARModelDetailPage;

