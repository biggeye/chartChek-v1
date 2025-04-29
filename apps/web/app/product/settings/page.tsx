'use client'
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@kit/ui/card";
export default function SettingsPage() {
    const [selection, setSelection]=useState();

    return(
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => window.location.href = '/product/settings/compliance'}>
        <CardHeader>
          <CardTitle>Compliance Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Configure compliance rules and requirements
          </p>
        </CardContent>
      </Card>

      <Card className="hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => window.location.href = '/product/settings/kipu'}>
        <CardHeader>
          <CardTitle>Kipu Integration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Manage Kipu EHR connection settings
          </p>
        </CardContent>
      </Card>

      <Card className="hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => window.location.href = '/product/settings/ai'}>
        <CardHeader>
          <CardTitle>AI Models</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Configure AI model settings and parameters
          </p>
        </CardContent>
      </Card>

      <Card className="hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => window.location.href = '/product/settings/userProfile'}>
        <CardHeader>
          <CardTitle>User Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Update your profile and preferences
          </p>
        </CardContent>
      </Card>
    </div>
    )
}