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
  const [hasChanges, setHasChanges] = useState(false);
  const [duitnowQr, setDuitnowQr] = useState<string | null>(null);
  const [defaultPayment, setDefaultPayment] = useState("tng");

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

  const handleInputChange = () => setHasChanges(true);

  const actionButtonsJsx = (
    <div className="flex items-center gap-3 mt-6">
      {!isEditing ? (
        <Button className="rounded-xl" onClick={() => setIsEditing(true)}>
          Edit Data
        </Button>
      ) : (
        <>
          <Button variant="outline" className="rounded-xl" onClick={() => {
            setIsEditing(false);
            setHasChanges(false);
          }}>
            Cancel
          </Button>
          {hasChanges && (
            <Button
              className="rounded-xl"
              onClick={() => {
                toast.success("Changes saved successfully");
                setIsEditing(false);
                setHasChanges(false);
              }}
            >
              Save changes
            </Button>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Profile"
        description="Manage identity, vehicle settings, saved locations, and preferences."
      />

      <Tabs 
        defaultValue="settings" 
        className="flex flex-col md:flex-row gap-6 md:gap-10 md:items-start"
        onValueChange={() => { setIsEditing(false); setHasChanges(false); }}
      >
        <TabsList className="flex flex-col justify-start h-auto bg-transparent p-0 space-y-2 w-full md:w-64 shrink-0">
          <TabsTrigger value="settings" className="w-full justify-start px-4 py-2.5 text-left rounded-xl data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none hover:bg-muted/50 transition-colors">
            Settings
          </TabsTrigger>
          {params.role === "driver" && (
            <TabsTrigger value="vehicle" className="w-full justify-start px-4 py-2.5 text-left rounded-xl data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none hover:bg-muted/50 transition-colors">
              Vehicle
            </TabsTrigger>
          )}
          <TabsTrigger value="prefs" className="w-full justify-start px-4 py-2.5 text-left rounded-xl data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none hover:bg-muted/50 transition-colors">
            Preferences
          </TabsTrigger>
          <TabsTrigger value="places" className="w-full justify-start px-4 py-2.5 text-left rounded-xl data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none hover:bg-muted/50 transition-colors">
            Saved places
          </TabsTrigger>
          <TabsTrigger value="pay" className="w-full justify-start px-4 py-2.5 text-left rounded-xl data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none hover:bg-muted/50 transition-colors">
            Payments
          </TabsTrigger>
          <TabsTrigger value="stats" className="w-full justify-start px-4 py-2.5 text-left rounded-xl data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none hover:bg-muted/50 transition-colors">
            Stats
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 min-w-0">
          <TabsContent value="settings" className="mt-0">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account</CardTitle>
                  <CardDescription>Basic identity pulled from the session store.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Full name</Label>
                    <Input defaultValue={user.name} className="rounded-xl" readOnly={!isEditing} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>University email</Label>
                    <Input defaultValue={user.email} className="rounded-xl" readOnly />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Faculty</Label>
                    <Input defaultValue={user.faculty} className="rounded-xl" readOnly={!isEditing} onChange={handleInputChange} />
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

              {actionButtonsJsx}
            </div>
          </TabsContent>

          {params.role === "driver" && (
            <TabsContent value="vehicle" className="mt-0">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Vehicle information</CardTitle>
                    <CardDescription>Used when you post offers — verification flow comes later.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Model</Label>
                      <Input defaultValue="Perodua Myvi" className="rounded-xl" readOnly={!isEditing} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                      <Label>Colour</Label>
                      <Input defaultValue="Midnight blue" className="rounded-xl" readOnly={!isEditing} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Plate</Label>
                      <Input defaultValue="ABC 1234" className="rounded-xl" readOnly={!isEditing} onChange={handleInputChange} />
                    </div>
                  </CardContent>
                </Card>

                {actionButtonsJsx}
              </div>
            </TabsContent>
          )}

          <TabsContent value="prefs" className="mt-0">
            <div className="space-y-6">
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
                      <Switch defaultChecked={p.defaultChecked} onCheckedChange={(checked) => {
                        handleInputChange();
                        toast.success(`Preference updated`);
                      }} />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {actionButtonsJsx}
            </div>
          </TabsContent>

          <TabsContent value="places" className="mt-0">
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

          <TabsContent value="pay" className="mt-0">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Methods</CardTitle>
                  <CardDescription>Configure supported direct payment methods.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div 
                    className="flex items-center justify-between rounded-2xl border border-border p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      setDefaultPayment("tng");
                      toast.success("Default payment method set to Touch 'n Go eWallet");
                    }}
                  >
                    <div>
                      <p className="text-sm font-semibold">Touch ‘n Go eWallet</p>
                      <p className="text-xs text-muted-foreground">Default for passenger QR code checkouts</p>
                    </div>
                    {defaultPayment === "tng" ? (
                      <Badge className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">Default</Badge>
                    ) : (
                      <Badge variant="outline" className="rounded-full">Available</Badge>
                    )}
                  </div>
                  <div 
                    className="flex items-center justify-between rounded-2xl border border-border p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      setDefaultPayment("cash");
                      toast.success("Default payment method set to Cash");
                    }}
                  >
                    <div>
                      <p className="text-sm font-semibold">Cash</p>
                      <p className="text-xs text-muted-foreground">Fallback method collected directly</p>
                    </div>
                    {defaultPayment === "cash" ? (
                      <Badge className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">Default</Badge>
                    ) : (
                      <Badge variant="outline" className="rounded-full">Available</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {params.role === "driver" && (
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
              )}
            </div>
          </TabsContent>

          <TabsContent value="stats" className="mt-0">
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
        </div>
      </Tabs>
    </div>
  );
}

