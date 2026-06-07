"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSessionStore } from "@/store/session-store";
import { ThemeToggle } from "@/components/layout/theme-toggle";
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
  const params = useParams<{ role: string }>();
  const { user } = useSessionStore();
  const [isEditing, setIsEditing] = useState(false);
  const [duitnowQr, setDuitnowQr] = useState<string | null>(null);

  // Load saved DuitNow QR code from localstorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedQr = localStorage.getItem("campusride_driver_duitnow_qr");
      if (savedQr) setDuitnowQr(savedQr);
    }
  }, []);

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setDuitnowQr(base64String);
        localStorage.setItem("campusride_driver_duitnow_qr", base64String);
        toast.success("DuitNow QR Code stored locally!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveQr = () => {
    setDuitnowQr(null);
    localStorage.removeItem("campusride_driver_duitnow_qr");
    toast.success("DuitNow QR Code removed!");
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Profile"
        description="Manage identity, vehicle settings, saved locations, and DuitNow QR code uploads."
        action={
          isEditing ? (
            <div className="flex gap-2">
              <Button variant="outline" className="rounded-xl" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button
                className="rounded-xl"
                onClick={() => {
                  toast.success("Profile saved successfully");
                  setIsEditing(false);
                }}
              >
                Save changes
              </Button>
            </div>
          ) : (
            <Button className="rounded-xl" onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          )
        }
      />

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className={`grid w-full rounded-xl ${params.role === "driver" ? "grid-cols-2 lg:grid-cols-3 xl:grid-cols-6" : "grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"}`}>
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
          {params.role === "driver" && (
            <TabsTrigger value="pay" className="rounded-lg">
              Payments
            </TabsTrigger>
          )}
          <TabsTrigger value="stats" className="rounded-lg">
            Stats
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account</CardTitle>
                <CardDescription>Basic identity pulled from the session store.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Full name</Label>
                  <Input defaultValue={user.name} className="rounded-xl" readOnly={!isEditing} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>University email</Label>
                  <Input defaultValue={user.email} className="rounded-xl" readOnly />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Faculty</Label>
                  <Input defaultValue={user.faculty} className="rounded-xl" readOnly={!isEditing} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Display Theme</CardTitle>
                <CardDescription>Select your preferred color theme for the application interface.</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm font-semibold">Dark mode</p>
                  <p className="text-xs text-muted-foreground">Toggle between light and dark mode</p>
                </div>
                <ThemeToggle />
              </CardContent>
            </Card>
          </div>
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
                <Input defaultValue="Perodua Myvi" className="rounded-xl" readOnly={!isEditing} />
              </div>
              <div className="space-y-2">
                <Label>Colour</Label>
                <Input defaultValue="Midnight blue" className="rounded-xl" readOnly={!isEditing} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Plate</Label>
                <Input defaultValue="ABC 1234" className="rounded-xl" readOnly={!isEditing} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prefs">
          <Card>
            <CardHeader>
              <CardTitle>Ride preferences</CardTitle>
              <CardDescription>Soft toggles for matching heuristics.</CardDescription>
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
                    <p className="text-xs text-muted-foreground">Stored locally in preference store.</p>
                  </div>
                  <Switch defaultChecked={p.defaultChecked} disabled={!isEditing} />
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

        {params.role === "driver" && (
          <TabsContent value="pay">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Methods</CardTitle>
                  <CardDescription>Configure supported direct payment methods.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between rounded-2xl border border-border p-4">
                    <div>
                      <p className="text-sm font-semibold">Touch ‘n Go eWallet</p>
                      <p className="text-xs text-muted-foreground">Default for passenger QR code checkouts</p>
                    </div>
                    <Badge className="rounded-full">Default</Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-border p-4">
                    <div>
                      <p className="text-sm font-semibold">Cash</p>
                      <p className="text-xs text-muted-foreground">Fallback method collected directly</p>
                    </div>
                    <Badge variant="outline" className="rounded-full">Available</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>DuitNow QR Code</CardTitle>
                  <CardDescription>
                    Upload your personal DuitNow QR code so passengers can pay you directly during ride completion.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {duitnowQr ? (
                    <div className="space-y-4">
                      <div className="relative w-44 h-44 border border-border rounded-2xl overflow-hidden bg-white p-2 mx-auto flex items-center justify-center">
                        <img src={duitnowQr} alt="Uploaded QR Code" className="w-full h-full object-contain" />
                      </div>
                      <div className="flex justify-center gap-2">
                        <Button variant="outline" size="sm" className="rounded-xl text-destructive hover:bg-destructive/10" onClick={handleRemoveQr}>
                          Remove QR Code
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-dashed border-border rounded-2xl p-8 text-center space-y-3 bg-muted/20">
                      <p className="text-sm text-muted-foreground">No DuitNow QR code uploaded yet</p>
                      <Input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        id="qr-upload" 
                        onChange={handleQrUpload}
                      />
                      <Button asChild size="sm" className="rounded-xl">
                        <Label htmlFor="qr-upload" className="cursor-pointer">
                          Upload QR Image
                        </Label>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

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
