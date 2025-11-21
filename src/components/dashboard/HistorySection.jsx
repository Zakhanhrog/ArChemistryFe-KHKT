import { Clock3, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const history = [
  { id: '1', label: 'Nguyên tử Hydro (H)', type: 'Nguyên tố', time: '09:24, Hôm nay', status: 'Thành công' },
  { id: '2', label: 'Phân tử Nước (H₂O)', type: 'Phân tử', time: '08:55, Hôm nay', status: 'Thành công' },
  { id: '3', label: 'Nguyên tử Carbon (C)', type: 'Nguyên tố', time: '17:42, Hôm qua', status: 'Thành công' },
];

function HistorySection() {
  return (
    <section className="space-y-4">
      {history.length > 0 ? (
      <Card>
        <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock3 className="h-5 w-5 text-blue-600" />
              Các mô hình đã quét gần đây
            </CardTitle>
            <CardDescription>Danh sách các nguyên tố và phân tử bạn đã khám phá</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          {history.map((item) => (
              <div key={item.id} className="flex flex-col gap-2 py-4 text-sm hover:bg-gray-50 -mx-4 px-4 rounded-lg transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 mb-1">{item.label}</p>
                    <Badge variant="outline" className="text-xs">
                      {item.type}
                    </Badge>
                  </div>
                  {item.status === 'Thành công' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  )}
              </div>
                <div className="flex items-center gap-2 text-gray-500 text-xs">
                  <Clock3 className="h-3 w-3" />
                <span>{item.time}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium mb-2">Chưa có lịch sử quét</p>
            <p className="text-sm text-gray-500">Bắt đầu quét các marker trong sách giáo khoa để xem lịch sử ở đây</p>
          </CardContent>
        </Card>
      )}
    </section>
  );
}

export default HistorySection;

