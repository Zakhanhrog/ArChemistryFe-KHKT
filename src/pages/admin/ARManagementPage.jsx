import React, { useState, useEffect, useRef } from 'react';
import { 
  getActiveMarkerFile, 
  uploadMarkerFile,
  getAllModelFiles,
  getAllModelFilesIncludingInactive,
  uploadModelFile,
  toggleModelFileStatus,
  getAllTargets,
  getAllTargetsIncludingInactive,
  createTarget,
  updateTarget,
  toggleTargetStatus,
  getTargetById
} from '@/services/adminARService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, Power, Edit, Plus, File, Package, Target } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';

export default function ARManagementPage() {
  const toast = useToast();
  const confirmDialog = useConfirmDialog();
  const [activeTab, setActiveTab] = useState('marker');
  const [markerFile, setMarkerFile] = useState(null);
  const [models, setModels] = useState([]);
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showTargetForm, setShowTargetForm] = useState(false);
  const [editingTarget, setEditingTarget] = useState(null);
  const [showInactive, setShowInactive] = useState(false);
  const [targetForm, setTargetForm] = useState({
    name: '',
    targetIndex: 0,
    markerFileId: null,
    modelFileId: null,
    scaleX: 0.15,
    scaleY: 0.15,
    scaleZ: 0.15,
    positionX: 0,
    positionY: 0,
    positionZ: 0.1,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    animationEnabled: false,
    animationType: 'position',
    animationToX: 0,
    animationToY: 0.1,
    animationToZ: 0.1,
    animationDuration: 1000,
    animationEasing: 'easeInOutQuad',
    animationLoop: true,
    animationDirection: 'alternate'
  });

  const markerFileInputRef = useRef(null);
  const modelFileInputRef = useRef(null);

  useEffect(() => {
    loadData();
  }, [showInactive]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [markerData, modelsData, targetsData] = await Promise.all([
        getActiveMarkerFile().catch((err) => {
          // 404 or no marker file is OK, just return null
          if (err.response?.status === 404 || err.response?.status === 200) {
            return null;
          }
          throw err;
        }),
        showInactive ? getAllModelFilesIncludingInactive().catch(() => []) : getAllModelFiles().catch(() => []),
        showInactive ? getAllTargetsIncludingInactive().catch(() => []) : getAllTargets().catch(() => [])
      ]);
      
      setMarkerFile(markerData);
      setModels(modelsData || []);
      setTargets(targetsData || []);
      
      if (markerData) {
        setTargetForm(prev => ({ ...prev, markerFileId: markerData.id }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Lỗi khi tải dữ liệu: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.name.endsWith('.mind')) {
      toast.error('File phải có định dạng .mind');
      return;
    }

    setLoading(true);
    try {
      const result = await uploadMarkerFile(file);
      setMarkerFile(result);
      setTargetForm(prev => ({ ...prev, markerFileId: result.id }));
      toast.success('Upload marker file thành công!');
      await loadData();
    } catch (error) {
      console.error('Error uploading marker:', error);
      toast.error('Lỗi khi upload marker file: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleModelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.name.endsWith('.glb')) {
      toast.error('File phải có định dạng .glb');
      return;
    }

    setLoading(true);
    try {
      await uploadModelFile(file);
      toast.success('Upload model thành công!');
      await loadData();
    } catch (error) {
      console.error('Error uploading model:', error);
      toast.error('Lỗi khi upload model: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleModelStatus = async (id, currentStatus) => {
    const action = currentStatus ? 'vô hiệu hóa' : 'kích hoạt';
    const confirmed = await confirmDialog.confirm(
      `Bạn có chắc muốn ${action} model này?`,
      {
        title: currentStatus ? 'Vô hiệu hóa model' : 'Kích hoạt model',
        confirmText: currentStatus ? 'Vô hiệu hóa' : 'Kích hoạt',
        cancelText: 'Hủy',
        variant: currentStatus ? 'destructive' : 'default',
      }
    );
    
    if (!confirmed) return;

    setLoading(true);
    try {
      await toggleModelFileStatus(id);
      toast.success(`${currentStatus ? 'Vô hiệu hóa' : 'Kích hoạt'} model thành công!`);
      await loadData();
    } catch (error) {
      console.error('Error toggling model status:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      toast.error('Lỗi: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTarget = async () => {
    if (!targetForm.name || targetForm.modelFileId === null || targetForm.markerFileId === null) {
      toast.warning('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setLoading(true);
    try {
      if (editingTarget) {
        await updateTarget(editingTarget.id, targetForm);
        toast.success('Cập nhật target thành công!');
      } else {
        await createTarget(targetForm);
        toast.success('Tạo target thành công!');
      }
      setShowTargetForm(false);
      setEditingTarget(null);
      resetTargetForm();
      await loadData();
    } catch (error) {
      console.error('Error saving target:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      toast.error('Lỗi: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTarget = async (id) => {
    setLoading(true);
    try {
      const target = await getTargetById(id);
      setTargetForm({
        name: target.name,
        targetIndex: target.targetIndex,
        markerFileId: target.markerFileId,
        modelFileId: target.modelFileId,
        scaleX: target.scaleX,
        scaleY: target.scaleY,
        scaleZ: target.scaleZ,
        positionX: target.positionX,
        positionY: target.positionY,
        positionZ: target.positionZ,
        rotationX: target.rotationX,
        rotationY: target.rotationY,
        rotationZ: target.rotationZ,
        animationEnabled: target.animationEnabled,
        animationType: target.animationType || 'position',
        animationToX: target.animationToX,
        animationToY: target.animationToY,
        animationToZ: target.animationToZ,
        animationDuration: target.animationDuration,
        animationEasing: target.animationEasing,
        animationLoop: target.animationLoop,
        animationDirection: target.animationDirection
      });
      setEditingTarget(target);
      setShowTargetForm(true);
    } catch (error) {
      console.error('Error loading target:', error);
      toast.error('Lỗi khi tải target: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTargetStatus = async (id, currentStatus) => {
    const action = currentStatus ? 'vô hiệu hóa' : 'kích hoạt';
    const confirmed = await confirmDialog.confirm(
      `Bạn có chắc muốn ${action} target này?`,
      {
        title: currentStatus ? 'Vô hiệu hóa target' : 'Kích hoạt target',
        confirmText: currentStatus ? 'Vô hiệu hóa' : 'Kích hoạt',
        cancelText: 'Hủy',
        variant: currentStatus ? 'destructive' : 'default',
      }
    );
    
    if (!confirmed) return;

    setLoading(true);
    try {
      await toggleTargetStatus(id);
      toast.success(`${currentStatus ? 'Vô hiệu hóa' : 'Kích hoạt'} target thành công!`);
      await loadData();
    } catch (error) {
      console.error('Error toggling target status:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      toast.error('Lỗi: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetTargetForm = () => {
    setTargetForm({
      name: '',
      targetIndex: 0,
      markerFileId: markerFile?.id || null,
      modelFileId: null,
      scaleX: 0.15,
      scaleY: 0.15,
      scaleZ: 0.15,
      positionX: 0,
      positionY: 0,
      positionZ: 0.1,
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
      animationEnabled: false,
      animationType: 'position',
      animationToX: 0,
      animationToY: 0.1,
      animationToZ: 0.1,
      animationDuration: 1000,
      animationEasing: 'easeInOutQuad',
      animationLoop: true,
      animationDirection: 'alternate'
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Quản lý AR</h1>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('marker')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'marker'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <File className="w-4 h-4 inline mr-2" />
                Marker File
              </button>
              <button
                onClick={() => setActiveTab('models')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'models'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Package className="w-4 h-4 inline mr-2" />
                Models
              </button>
              <button
                onClick={() => setActiveTab('targets')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'targets'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Target className="w-4 h-4 inline mr-2" />
                Targets
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Marker File Tab */}
            {activeTab === 'marker' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Marker File (.mind)</h2>
                {markerFile ? (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{markerFile.name}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Size: {formatFileSize(markerFile.fileSize)} | 
                          Targets: {markerFile.targetsCount || 0}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{markerFile.filePath}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 mb-4">Chưa có marker file nào</p>
                )}
                <input
                  ref={markerFileInputRef}
                  type="file"
                  accept=".mind"
                  onChange={handleMarkerUpload}
                  className="hidden"
                  disabled={loading}
                />
                <Button 
                  onClick={() => markerFileInputRef.current?.click()}
                  disabled={loading}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {markerFile ? 'Cập nhật Marker File' : 'Upload Marker File'}
                </Button>
              </div>
            )}

            {/* Models Tab */}
            {activeTab === 'models' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Model Files (.glb)</h2>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showInactive}
                        onChange={(e) => setShowInactive(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-600">Hiển thị inactive</span>
                    </label>
                    <input
                      ref={modelFileInputRef}
                      type="file"
                      accept=".glb"
                      onChange={handleModelUpload}
                      className="hidden"
                      disabled={loading}
                    />
                    <Button 
                      onClick={() => modelFileInputRef.current?.click()}
                      disabled={loading}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Thêm Model
                    </Button>
                  </div>
                </div>
                <div className="space-y-3">
                  {models.length === 0 ? (
                    <p className="text-gray-500">Chưa có model nào</p>
                  ) : (
                    models.map((model) => (
                      <div key={model.id} className={`rounded-lg p-4 flex justify-between items-center border ${
                        model.isActive ? 'bg-gray-50 border-gray-200' : 'bg-gray-100 border-gray-300 opacity-75'
                      }`}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-gray-900">{model.name}</p>
                            <Badge variant={model.isActive ? 'default' : 'secondary'}>
                              {model.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Size: {formatFileSize(model.fileSize)}
                          </p>
                          {model.description && (
                            <p className="text-xs text-gray-500 mt-1">{model.description}</p>
                          )}
                        </div>
                        <Button
                          variant={model.isActive ? 'destructive' : 'default'}
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleToggleModelStatus(model.id, model.isActive);
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          disabled={loading}
                          title={model.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                          className="cursor-pointer"
                        >
                          <Power className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Targets Tab */}
            {activeTab === 'targets' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Targets</h2>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showInactive}
                        onChange={(e) => setShowInactive(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-600">Hiển thị inactive</span>
                    </label>
                    <Button
                      onClick={() => {
                        resetTargetForm();
                        setEditingTarget(null);
                        setShowTargetForm(true);
                      }}
                      disabled={loading || !markerFile}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Thêm Target
                    </Button>
                  </div>
                </div>

                {!markerFile && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <p className="text-yellow-800 font-medium">⚠️ Vui lòng upload marker file trước khi tạo targets</p>
                    <p className="text-yellow-700 text-sm mt-1">Bước 1: Vào tab "Marker File" và upload file .mind</p>
                  </div>
                )}
                
                {markerFile && models.length === 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-blue-800 font-medium">ℹ️ Chưa có model nào</p>
                    <p className="text-blue-700 text-sm mt-1">Bước 2: Vào tab "Models" và upload các file .glb trước khi tạo targets</p>
                  </div>
                )}
                
                {markerFile && models.length > 0 && targets.length === 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <p className="text-green-800 font-medium">✅ Sẵn sàng tạo targets!</p>
                    <p className="text-green-700 text-sm mt-1">
                      Bạn đã có {models.length} model(s). Click "Thêm Target" để bắt đầu mapping targetIndex với models.
                    </p>
                    <div className="mt-2 text-sm text-green-700">
                      <p className="font-medium">Hướng dẫn:</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Target Index bắt đầu từ 0 (0 = target đầu tiên trong file .mind)</li>
                        <li>Mỗi targetIndex phải unique (không được trùng)</li>
                        <li>Chọn model tương ứng với targetIndex đó</li>
                      </ul>
                    </div>
                  </div>
                )}

                {showTargetForm && (
                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold mb-4">
                      {editingTarget ? 'Chỉnh sửa Target' : 'Tạo Target mới'}
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên</label>
                        <input
                          type="text"
                          value={targetForm.name}
                          onChange={(e) => setTargetForm({ ...targetForm, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Target Index
                          <span className="text-xs text-gray-500 ml-1">(bắt đầu từ 0)</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={targetForm.targetIndex}
                          onChange={(e) => setTargetForm({ ...targetForm, targetIndex: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="0, 1, 2..."
                        />
                        <div className="mt-1 space-y-1">
                          <p className="text-xs text-gray-500">
                            Target Index phải khớp với thứ tự trong file .mind (0 = target đầu tiên, 1 = target thứ 2, ...)
                          </p>
                          {targets.length > 0 && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mt-2">
                              <p className="text-xs text-yellow-800 font-medium mb-1">⚠️ Lưu ý quan trọng:</p>
                              <p className="text-xs text-yellow-700">
                                Target Index không phụ thuộc vào số lượng targets hiện có trong database.
                              </p>
                              <p className="text-xs text-yellow-700 mt-1">
                                Nếu xóa target rồi thêm lại, vẫn phải điền đúng index theo thứ tự trong file .mind.
                              </p>
                              <p className="text-xs text-yellow-700 mt-1">
                                <strong>Target indices đang có:</strong> {targets.map(t => t.targetIndex).sort((a, b) => a - b).join(', ') || 'Không có'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                        <select
                          value={targetForm.modelFileId || ''}
                          onChange={(e) => setTargetForm({ ...targetForm, modelFileId: parseInt(e.target.value) || null })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="">Chọn model</option>
                          {models.map((model) => (
                            <option key={model.id} value={model.id}>
                              {model.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Scale X</label>
                        <input
                          type="number"
                          step="0.01"
                          value={targetForm.scaleX}
                          onChange={(e) => setTargetForm({ ...targetForm, scaleX: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Scale Y</label>
                        <input
                          type="number"
                          step="0.01"
                          value={targetForm.scaleY}
                          onChange={(e) => setTargetForm({ ...targetForm, scaleY: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Scale Z</label>
                        <input
                          type="number"
                          step="0.01"
                          value={targetForm.scaleZ}
                          onChange={(e) => setTargetForm({ ...targetForm, scaleZ: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Position X</label>
                        <input
                          type="number"
                          step="0.01"
                          value={targetForm.positionX}
                          onChange={(e) => setTargetForm({ ...targetForm, positionX: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Position Y</label>
                        <input
                          type="number"
                          step="0.01"
                          value={targetForm.positionY}
                          onChange={(e) => setTargetForm({ ...targetForm, positionY: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Position Z</label>
                        <input
                          type="number"
                          step="0.01"
                          value={targetForm.positionZ}
                          onChange={(e) => setTargetForm({ ...targetForm, positionZ: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={targetForm.animationEnabled}
                            onChange={(e) => setTargetForm({ ...targetForm, animationEnabled: e.target.checked })}
                            className="mr-2"
                          />
                          <span className="text-sm font-medium text-gray-700">Bật Animation</span>
                        </label>
                      </div>
                      {targetForm.animationEnabled && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Animation Type</label>
                            <select
                              value={targetForm.animationType}
                              onChange={(e) => setTargetForm({ ...targetForm, animationType: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            >
                              <option value="position">Position</option>
                              <option value="rotation">Rotation</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (ms)</label>
                            <input
                              type="number"
                              value={targetForm.animationDuration}
                              onChange={(e) => setTargetForm({ ...targetForm, animationDuration: parseInt(e.target.value) || 1000 })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button onClick={handleCreateTarget} disabled={loading}>
                        {editingTarget ? 'Cập nhật' : 'Tạo'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowTargetForm(false);
                          setEditingTarget(null);
                          resetTargetForm();
                        }}
                      >
                        Hủy
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {targets.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Chưa có target nào</p>
                      <p className="text-sm mt-1">Click "Thêm Target" để bắt đầu</p>
                    </div>
                  ) : (
                    <>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-blue-800">
                          <strong>Tổng số targets:</strong> {targets.length} | 
                          <strong className="ml-2">Target indices:</strong> {targets.map(t => t.targetIndex).sort((a, b) => a - b).join(', ')}
                        </p>
                      </div>
                      {targets
                        .sort((a, b) => a.targetIndex - b.targetIndex)
                        .map((target) => {
                          const model = models.find(m => m.id === target.modelFileId);
                          return (
                            <div key={target.id} className={`rounded-lg p-4 border ${
                              target.isActive ? 'bg-gray-50 border-gray-200' : 'bg-gray-100 border-gray-300 opacity-75'
                            }`}>
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">
                                      Index: {target.targetIndex}
                                    </span>
                                    <p className="font-medium text-gray-900">{target.name}</p>
                                    <Badge variant={target.isActive ? 'default' : 'secondary'}>
                                      {target.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">
                                    <strong>Model:</strong> {model?.name || 'N/A'}
                                  </p>
                                  <div className="text-xs text-gray-500 mt-2 space-y-1">
                                    <p>
                                      <strong>Scale:</strong> [{target.scaleX}, {target.scaleY}, {target.scaleZ}]
                                    </p>
                                    <p>
                                      <strong>Position:</strong> [{target.positionX}, {target.positionY}, {target.positionZ}]
                                    </p>
                                    {target.animationEnabled && (
                                      <p className="text-green-600">
                                        <strong>Animation:</strong> {target.animationType} ({target.animationDuration}ms)
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2 ml-4 relative z-50 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleEditTarget(target.id);
                                    }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    disabled={loading}
                                    title="Chỉnh sửa"
                                    className="cursor-pointer"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant={target.isActive ? 'destructive' : 'default'}
                                    size="sm"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleToggleTargetStatus(target.id, target.isActive);
                                    }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    disabled={loading}
                                    title={target.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                                    className="cursor-pointer"
                                  >
                                    <Power className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
    </div>
  );
}

