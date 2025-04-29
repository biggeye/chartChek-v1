import { KipuContact } from '~/lib/kipu/service/contact-service';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';

interface ContactListProps {
  contacts: KipuContact[];
  total: number;
}

export function ContactList({ contacts, total }: ContactListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contacts ({total})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {contacts.map((contact) => (
            <div key={contact.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold">
                    {contact.firstName} {contact.lastName}
                    {contact.isReferrer && (
                      <Badge variant="secondary" className="ml-2">Referrer</Badge>
                    )}
                  </div>
                  {contact.organization && (
                    <div className="text-sm text-muted-foreground">
                      {contact.organization}
                    </div>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {contact.type}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {contact.email && (
                  <div>
                    <span className="font-medium">Email:</span> {contact.email}
                  </div>
                )}
                {contact.phone && (
                  <div>
                    <span className="font-medium">Phone:</span> {contact.phone}
                  </div>
                )}
                {contact.address && (
                  <div className="col-span-2">
                    <span className="font-medium">Address:</span><br />
                    {contact.address.street}<br />
                    {contact.address.city}, {contact.address.state} {contact.address.zipCode}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 