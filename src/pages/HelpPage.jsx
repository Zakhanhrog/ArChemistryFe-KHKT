import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader.jsx';
import BottomNav from '@/components/layout/BottomNav.jsx';

function HelpPage() {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState(null);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleNavChange = (key) => {
    if (key === 'explore') {
      navigate('/ar?tab=explore');
    } else if (key === 'materials') {
      navigate('/ar?tab=materials');
    } else if (key === 'scan') {
      navigate('/ar?tab=scan');
    } else if (key === 'ai-assistant') {
      navigate('/ar?tab=ai-assistant');
    } else if (key === 'profile') {
      navigate('/ar?tab=profile');
    }
  };

  const features = [
    {
      iconSrc: '/icon/aricon.svg',
      title: 'Quét AR',
      color: 'from-blue-400/80 to-cyan-400/80',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      description: 'Quét hình ảnh từ sách giáo khoa để xem mô hình 3D tương tác của các nguyên tố và phân tử hóa học.',
      steps: [
        'Mở tab "Quét" ở thanh điều hướng dưới',
        'Cho phép truy cập camera khi được yêu cầu',
        'Đưa camera vào hình ảnh marker trong sách giáo khoa',
        'Mô hình 3D sẽ hiển thị trên màn hình',
        'Xoay, phóng to/thu nhỏ để khám phá mô hình'
      ]
    },
    {
      iconSrc: '/icon/khampha.svg',
      title: 'Khám phá',
      color: 'from-purple-400/80 to-pink-400/80',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      description: 'Đọc các bài viết thú vị về hóa học, ứng dụng thực tế và kiến thức cấp 3.',
      steps: [
        'Chọn tab "Khám phá" ở thanh điều hướng',
        'Xem danh sách các bài viết được đề xuất',
        'Click "Đọc thêm" để xem chi tiết',
        'Các bài viết được cập nhật thường xuyên'
      ]
    },
    {
      iconSrc: '/icon/nguyento.svg',
      title: 'Thư viện',
      color: 'from-green-400/80 to-emerald-400/80',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      description: 'Xem danh sách các mô hình 3D có sẵn và thông tin chi tiết về từng nguyên tố, phân tử.',
      steps: [
        'Vào tab "Thư viện"',
        'Xem danh sách các mô hình 3D',
        'Click vào mô hình để xem thông tin chi tiết',
        'Sử dụng marker tương ứng để quét AR'
      ]
    },
    {
      iconSrc: '/icon/troliai.svg',
      title: 'Trợ lý AI',
      color: 'from-orange-400/80 to-red-400/80',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      description: 'Hỏi đáp về hóa học với trợ lý AI thông minh, giải thích khái niệm và trả lời câu hỏi.',
      steps: [
        'Mở tab "Trợ lý AI"',
        'Nhập câu hỏi về hóa học vào ô chat',
        'Nhấn Enter hoặc click nút gửi',
        'AI sẽ trả lời ngay lập tức',
        'Có thể hỏi về nguyên tố, phản ứng, công thức...'
      ]
    },
    {
      iconSrc: '/icon/canhan.svg',
      title: 'Hồ sơ',
      color: 'from-indigo-400/80 to-blue-400/80',
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      description: 'Quản lý thông tin cá nhân, xem lịch sử hoạt động và cài đặt tài khoản.',
      steps: [
        'Vào tab "Hồ sơ"',
        'Xem và chỉnh sửa thông tin cá nhân',
        'Đổi ảnh đại diện nếu muốn',
        'Đăng xuất khi cần'
      ]
    }
  ];


  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-24">
      <PageHeader />
      
      {/* Hero Header */}
      <div className="pt-20 pb-4 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-3">
            <h1 className="text-2xl font-bold text-gray-900 mb-1.5">
              Hướng dẫn sử dụng
            </h1>
            <p className="text-gray-600 text-sm">
              Tìm hiểu cách sử dụng các tính năng của chemar.
            </p>
          </div>
        </div>
      </div>

      {/* Features Guide - Accordion */}
      <div className="px-4 max-w-2xl mx-auto space-y-2">
        {features.map((feature, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300"
            >
              {/* Feature Header - Clickable */}
              <button
                onClick={() => toggleAccordion(index)}
                className={`w-full bg-gradient-to-r ${feature.color} px-4 py-3 flex items-center justify-between hover:opacity-90 transition-opacity`}
              >
                <h2 className="text-base font-bold text-white">
                  {feature.title}
                </h2>
                <ChevronDown
                  className={`h-5 w-5 text-white transition-transform duration-300 ${
                    isOpen ? 'transform rotate-180' : ''
                  }`}
                />
              </button>

              {/* Steps - Collapsible Content */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="p-4 space-y-3">
                  {feature.steps.map((step, stepIndex) => (
                    <div key={stepIndex} className="flex items-start gap-3">
                      <div className={`h-7 w-7 rounded-lg ${feature.bgColor} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <span className={`text-sm font-bold ${feature.iconColor}`}>
                          {stepIndex + 1}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed pt-1 flex-1">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <BottomNav activeKey="" onChange={handleNavChange} />
    </div>
  );
}

export default HelpPage;

