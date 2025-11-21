import { CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function ARInstructions({ steps }) {
  return (
    <Card className="w-full border-dashed">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg sm:text-xl">Hướng dẫn quét</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Tối ưu trải nghiệm AR và đảm bảo nhận diện chính xác.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {steps.map((step) => (
          <div key={step} className="flex items-start gap-3 text-muted-foreground">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary shrink-0" />
            <p>{step}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default ARInstructions;

