import { KipuUser } from '~/lib/kipu/service/provider-service';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';

interface UserListProps {
  users: KipuUser[];
  total: number;
}

export function UserList({ users, total }: UserListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Users ({total})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.map((user) => (
            <div key={user.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold">
                    {user.firstName} {user.lastName}
                    {user.title && (
                      <span className="text-sm text-muted-foreground ml-2">
                        ({user.title})
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {user.email}
                  </div>
                </div>
                <Badge variant={user.status === 'active' ? 'success' : 'secondary'}>
                  {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                </Badge>
              </div>
              <div className="mt-4">
                <div className="text-sm font-medium">Roles:</div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {user.roles.map((role, index) => (
                    <Badge key={index} variant="outline">{role}</Badge>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 