"use client";

import { useSessionStore } from "@/store/session-store";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner"; 

export default function ProfilePage() {
  const { user } = useSessionStore();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Profile"
        description="Manage identity, vehicle, preferences, and payment UI — all local mock forms."
        action={
          <Button className="rounded-xl" onClick={() => toast.success("Profile saved (mock)")}>
            Save changes
          </Button>
        }
      />

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 rounded-xl lg:grid-cols-3 xl:grid-cols-6">
          <TabsTrigger value="settings" className="rounded-lg">
            Settings
          </TabsTrigger>
          <TabsTrigger value="vehicle" className="rounded-lg">
            Vehicle
          </TabsTrigger>
          <TabsTrigger value="prefs" className="rounded-lg">
            Preferences
          </TabsTrigger>
          <TabsTrigger value="places" className="rounded-lg">
            Saved places
          </TabsTrigger>
          <TabsTrigger value="pay" className="rounded-lg">
            Payments
          </TabsTrigger>
          <TabsTrigger value="stats" className="rounded-lg">
            Stats
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>Basic identity pulled from the mock session store.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Full name</Label>
                <Input defaultValue={user.name} className="rounded-xl" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>University email</Label>
                <Input defaultValue={user.email} className="rounded-xl" readOnly />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Faculty</Label>
                <Input defaultValue={user.faculty} className="rounded-xl" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vehicle">
          <Card>
            <CardHeader>
              <CardTitle>Vehicle information</CardTitle>
              <CardDescription>Used when you post offers — verification flow comes later.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Model</Label>
                <Input defaultValue="Perodua Myvi" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Colour</Label>
                <Input defaultValue="Midnight blue" className="rounded-xl" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Plate</Label>
                <Input defaultValue="ABC 1234" className="rounded-xl" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prefs">
          <Card>
            <CardHeader>
              <CardTitle>Ride preferences</CardTitle>
              <CardDescription>Soft toggles for matching heuristics (mock).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { id: "music", label: "Quiet rides preferred", defaultChecked: true },
                { id: "pets", label: "Pet-friendly (small carriers)", defaultChecked: false },
                { id: "female", label: "Prefer female drivers after 9pm", defaultChecked: false },
              ].map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-4 rounded-2xl border border-border p-4">
                  <div>
                    <p className="text-sm font-semibold">{p.label}</p>
                    <p className="text-xs text-muted-foreground">Stored locally in a future version.</p>
                  </div>
                  <Switch defaultChecked={p.defaultChecked} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="places">
          <Card>
            <CardHeader>
              <CardTitle>Saved places</CardTitle>
              <CardDescription>One-tap origins/destinations for repeat Melaka routes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {["UTeM Main Campus — SRC A", "Technology Campus — FTMK", "Melaka Sentral"].map((place) => (
                <div key={place} className="flex items-center justify-between gap-3 rounded-2xl border border-border p-4">
                  <p className="text-sm font-medium">{place}</p>
                  <Badge variant="outline" className="rounded-full">
                    Malaysia
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pay">
          <Card>
            <CardHeader>
              <CardTitle>Payment methods (UI)</CardTitle>
              <CardDescription>No PSP keys — show investors how split payments could look.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-2xl border border-border p-4">
                <div>
                  <p className="text-sm font-semibold">Touch ‘n Go eWallet</p>
                  <p className="text-xs text-muted-foreground">Default for campus corridor rides</p>
                </div>
                <Badge className="rounded-full">Default</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between rounded-2xl border border-border p-4">
                <div>
                  <p className="text-sm font-semibold">Visa ·••• 4242</p>
                  <p className="text-xs text-muted-foreground">Backup for long-distance splits</p>
                </div>
                <Button variant="secondary" size="sm" className="rounded-xl">
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Rides hosted</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-semibold">18</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Rides joined</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-semibold">54</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Average rating</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-semibold">{user.rating.toFixed(1)}</CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
