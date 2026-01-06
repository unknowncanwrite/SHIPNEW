import { Link } from 'wouter';
import { ShipmentData } from '@/types/shipment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CalendarDays, Truck, ExternalLink, ArrowRight, Anchor } from 'lucide-react';
import { format } from 'date-fns';
import { calculateProgress } from '@/lib/shipment-utils';

interface ShipmentCardProps {
  data: ShipmentData;
}

export default function ShipmentCard({ data }: ShipmentCardProps) {
  const progress = calculateProgress(data);

  const getStatusColor = (progress: number) => {
    if (progress === 100) return 'bg-success text-white';
    if (progress > 50) return 'bg-accent text-white';
    return 'bg-warning text-white';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-primary overflow-hidden group">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-bold text-primary flex items-center gap-2">
            {data.id}
            <Badge className={`${getStatusColor(progress)} hover:${getStatusColor(progress)} border-none shadow-sm`}>
              {progress === 100 ? 'Completed' : 'In Progress'}
            </Badge>
          </CardTitle>
          <Link href={`/shipment/${data.id}`}>
            <Button size="sm" className="bg-accent hover:bg-accent/90 text-white shadow-sm flex items-center gap-2 group/btn h-9 px-4">
              Open <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground font-medium">Customer</span>
            <span className="font-semibold text-foreground truncate max-w-[150px]">{data.details.customer || '—'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground font-medium">Container</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-foreground">{data.details.container || '—'}</span>
              {data.details.container && (
                <a 
                  href={`https://www.track-trace.com/container/list/${data.details.container}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-accent hover:text-accent/80 transition-colors"
                  title="Track Container"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-dashed border-border">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <CalendarDays className="h-3 w-3" /> Inspection
            </span>
            <span className="text-sm font-medium">
              {data.details.inspectionDate ? format(new Date(data.details.inspectionDate), 'MMM d, yyyy') : 'Pending'}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Truck className="h-3 w-3" /> ETA
            </span>
            <span className="text-sm font-medium">
              {data.details.eta ? format(new Date(data.details.eta), 'MMM d, yyyy') : 'Pending'}
            </span>
          </div>
          <div className="col-span-2 flex flex-col gap-1 mt-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Anchor className="h-3 w-3" /> Forwarder
            </span>
            <span className="text-sm font-medium">
              {data.manualForwarderName || (data.forwarder === 'xpo' ? 'XPO Logistics' : data.forwarder === 'hmi' ? 'HMI Logistics' : '—')}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}
