import { Card, CardContent } from "~/components/ui/card";

export default function MetricCard({ icon, title, value, delta }: { 
    icon: React.ReactNode;
    title: string;
    value: string;
    delta: string;
  }) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                {icon}
                <span className="text-sm">{title}</span>
              </div>
              <div className="text-lg font-bold">{value}</div>
            </div>
            <span className="text-sm text-green-600">{delta}</span>
          </div>
        </CardContent>
      </Card>
    );
  }