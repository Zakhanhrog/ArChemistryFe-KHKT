import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function ARMetadataCard({ metadata }) {
  if (!metadata) return null;

  const isElement = metadata.type === 'element';

  return (
    <Card className="bg-popover/90 text-popover-foreground backdrop-blur shadow-lg">
      <CardHeader className="space-y-2 pb-2">
        <div className="flex flex-wrap items-center gap-2 text-[0.7rem] sm:text-xs">
          <Badge variant="secondary">{isElement ? 'Nguyên tố' : 'Phân tử'}</Badge>
          {metadata.markerIndex !== undefined ? <span>Marker #{metadata.markerIndex}</span> : null}
        </div>
        <CardTitle className="text-base sm:text-lg">{metadata.name}</CardTitle>
        {metadata.formula ? <CardDescription>Công thức: {metadata.formula}</CardDescription> : null}
        {metadata.atomicNumber ? <CardDescription>Số hiệu Z: {metadata.atomicNumber}</CardDescription> : null}
      </CardHeader>
      {metadata.description ? (
        <CardContent className="pt-2 text-xs text-muted-foreground sm:text-sm">{metadata.description}</CardContent>
      ) : null}
    </Card>
  );
}

export default ARMetadataCard;

