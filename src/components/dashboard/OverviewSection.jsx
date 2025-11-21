import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Target, TrendingUp } from 'lucide-react';

const highlights = [
  { 
    label: 'Mô hình đã học', 
    value: '0', 
    trend: 'Bắt đầu quét để khám phá',
    icon: BookOpen,
    color: 'text-blue-600'
  },
  { 
    label: 'Nguyên tố đã quét', 
    value: '0', 
    trend: 'Quét marker trong SGK để xem',
    icon: Target,
    color: 'text-green-600'
  },
  { 
    label: 'Tiến độ học tập', 
    value: '0%', 
    trend: 'Tiếp tục khám phá để cải thiện',
    icon: TrendingUp,
    color: 'text-purple-600'
  },
];

function OverviewSection() {
  return (
    <section className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {highlights.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`h-5 w-5 ${item.color}`} />
              <CardDescription className="text-gray-600">{item.label}</CardDescription>
                </div>
                <CardTitle className="text-3xl font-bold text-gray-900">{item.value}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600">{item.trend}</CardContent>
          </Card>
          );
        })}
      </div>
      
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg text-gray-900">Hướng dẫn sử dụng</CardTitle>
          <CardDescription className="text-gray-700">
            Cách học Hóa học với AR
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-700">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-xs">
              1
            </div>
            <p>Mở sách giáo khoa Hóa học của bạn</p>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-xs">
              2
            </div>
            <p>Vào tab "Quét ngay" và cho phép camera</p>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-xs">
              3
            </div>
            <p>Đưa camera vào hình ảnh marker trong sách</p>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-xs">
              4
            </div>
            <p>Xem mô hình 3D hiển thị và tương tác để học tập</p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export default OverviewSection;

