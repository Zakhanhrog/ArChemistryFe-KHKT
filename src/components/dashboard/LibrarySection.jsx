import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Atom, FlaskConical, BookOpen } from 'lucide-react';

const models = [
  { id: 'H-001', name: 'Nguyên tử Hydro (H)', formula: 'H', type: 'Nguyên tố', marker: '#0', description: 'Nguyên tố nhẹ nhất trong bảng tuần hoàn' },
  { id: 'C-002', name: 'Nguyên tử Carbon (C)', formula: 'C', type: 'Nguyên tố', marker: '#1', description: 'Nguyên tố cơ bản của sự sống' },
  { id: 'H2O-01', name: 'Phân tử Nước', formula: 'H₂O', type: 'Phân tử', marker: '#2', description: 'Phân tử quan trọng nhất cho sự sống' },
  { id: 'CO2-01', name: 'Phân tử CO₂', formula: 'CO₂', type: 'Phân tử', marker: '#3', description: 'Khí carbon dioxide' },
  { id: 'O-001', name: 'Nguyên tử Oxy (O)', formula: 'O', type: 'Nguyên tố', marker: '#4', description: 'Nguyên tố cần thiết cho hô hấp' },
  { id: 'NaCl-01', name: 'Phân tử Muối', formula: 'NaCl', type: 'Phân tử', marker: '#5', description: 'Natri clorua - muối ăn' },
];

function LibrarySection() {
  return (
    <section className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {models.map((model) => (
          <Card key={model.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1">
                  <CardTitle className="text-base font-semibold text-gray-900 mb-1">
                    {model.name}
                  </CardTitle>
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    {model.formula}
                  </div>
                </div>
                {model.type === 'Nguyên tố' ? (
                  <Atom className="h-6 w-6 text-blue-500 flex-shrink-0" />
                ) : (
                  <FlaskConical className="h-6 w-6 text-green-500 flex-shrink-0" />
                )}
              </div>
              <CardDescription className="text-sm text-gray-600">
                {model.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-2 text-sm pt-0">
              <Badge 
                variant="secondary" 
                className={model.type === 'Nguyên tố' 
                  ? 'bg-blue-100 text-blue-700 border-blue-200' 
                  : 'bg-green-100 text-green-700 border-green-200'
                }
              >
                {model.type}
              </Badge>
              <span className="text-gray-500">Marker {model.marker}</span>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {models.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium mb-2">Thư viện đang trống</p>
            <p className="text-sm text-gray-500">Các mô hình sẽ xuất hiện ở đây khi được thêm vào hệ thống</p>
          </CardContent>
        </Card>
      )}
    </section>
  );
}

export default LibrarySection;

