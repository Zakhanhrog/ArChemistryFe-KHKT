import { useState, useEffect } from 'react';
import { Monitor, Smartphone, Tablet, Globe, Calendar, User, Shield, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getLoginHistory } from '@/services/adminLoginHistoryService';

function LoginHistoryManagement() {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    loadHistory();
  }, [page]);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      const data = await getLoginHistory(page, pageSize);
      setHistory(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
      setError('');
    } catch (err) {
      setError(err.message || 'Không thể tải lịch sử đăng nhập');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getDeviceIcon = (deviceType) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      case 'tablet':
        return <Tablet className="h-4 w-4" />;
      case 'desktop':
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getLoginTypeLabel = (type) => {
    const labels = {
      'LOGIN': 'Đăng nhập',
      'REGISTER': 'Đăng ký',
      'GUEST': 'Dùng thử',
      'GOOGLE': 'Google'
    };
    return labels[type] || type;
  };

  const getLoginTypeColor = (type) => {
    const colors = {
      'LOGIN': 'bg-blue-100 text-blue-700',
      'REGISTER': 'bg-green-100 text-green-700',
      'GUEST': 'bg-purple-100 text-purple-700',
      'GOOGLE': 'bg-orange-100 text-orange-700'
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const getRoleColor = (role) => {
    if (role === 'ADMIN') return 'bg-purple-100 text-purple-700';
    if (role === 'GUEST') return 'bg-gray-100 text-gray-700';
    return 'bg-blue-100 text-blue-700';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lịch sử đăng nhập</CardTitle>
        <CardDescription>
          Theo dõi tất cả hoạt động đăng nhập, đăng ký và dùng thử trong hệ thống
          {totalElements > 0 && ` (Tổng: ${totalElements} bản ghi)`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {history.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Không có lịch sử đăng nhập nào
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Thời gian</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Người dùng</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Loại</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">IP</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Thiết bị</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Trình duyệt</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Hệ điều hành</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(item.createdAt)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-900">{item.userName || 'N/A'}</span>
                            </div>
                            <div className="text-xs text-gray-500">{item.userEmail}</div>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(item.userRole)}`}>
                              <Shield className="h-3 w-3" />
                              {item.userRole}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getLoginTypeColor(item.loginType)}`}>
                            {getLoginTypeLabel(item.loginType)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 font-mono">
                          {item.ipAddress || 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {getDeviceIcon(item.deviceType)}
                            <span className="text-sm text-gray-600">{item.deviceType || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {item.browser && item.browser !== 'Unknown' ? (
                            <div>
                              <div className="font-medium">{item.browser}</div>
                              {item.browserVersion && item.browserVersion !== 'Unknown' && (
                                <div className="text-xs text-gray-500">{item.browserVersion}</div>
                              )}
                            </div>
                          ) : (
                            'N/A'
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {item.operatingSystem && item.operatingSystem !== 'Unknown' ? (
                            <div>
                              <div className="font-medium">{item.operatingSystem}</div>
                              {item.osVersion && item.osVersion !== 'Unknown' && (
                                <div className="text-xs text-gray-500">{item.osVersion}</div>
                              )}
                            </div>
                          ) : (
                            'N/A'
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {item.isSuccessful ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              <CheckCircle className="h-3 w-3" />
                              Thành công
                            </span>
                          ) : (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                <XCircle className="h-3 w-3" />
                                Thất bại
                              </span>
                              {item.failureReason && (
                                <div className="text-xs text-red-600 mt-1">{item.failureReason}</div>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-gray-600">
                    Trang {page + 1} / {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(prev => Math.max(0, prev - 1))}
                      disabled={page === 0}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Trước
                    </button>
                    <button
                      onClick={() => setPage(prev => Math.min(totalPages - 1, prev + 1))}
                      disabled={page >= totalPages - 1}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default LoginHistoryManagement;

