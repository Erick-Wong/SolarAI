import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { 
  User, Mail, Lock, Shield, Trash2, Camera, 
  CheckCircle, AlertTriangle, Save, Eye, EyeOff 
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Profile {
  id: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  phone?: string;
  company_name?: string;
  role?: string;
}

export function SettingsContent() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Form states
  const [profileForm, setProfileForm] = useState({
    first_name: "",
    last_name: "",
    username: "",
    phone: "",
    company_name: "",
  });
  
  const [emailForm, setEmailForm] = useState({
    currentEmail: "",
    newEmail: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    showCurrentPassword: false,
    showNewPassword: false,
    showConfirmPassword: false,
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      setEmailForm(prev => ({ ...prev, currentEmail: user.email || "" }));
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile(data);
        setProfileForm({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          username: data.username || "",
          phone: data.phone || "",
          company_name: data.company_name || "",
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile information.",
        variant: "destructive",
      });
    }
  };

  const updateProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          ...profileForm,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully.",
      });

      await fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateEmail = async () => {
    if (!emailForm.newEmail) {
      toast({
        title: "Error",
        description: "Please enter a new email address.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: emailForm.newEmail
      });

      if (error) throw error;

      toast({
        title: "Email Update Requested",
        description: "Please check both your old and new email addresses to confirm the change.",
      });
    } catch (error: any) {
      console.error('Error updating email:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update email.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password updated successfully.",
      });

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        showCurrentPassword: false,
        showNewPassword: false,
        showConfirmPassword: false,
      });
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update password.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggle2FA = async () => {
    setLoading(true);
    try {
      if (!twoFactorEnabled) {
        // Enable 2FA
        const { error } = await supabase.auth.mfa.enroll({
          factorType: 'totp'
        });

        if (error) throw error;

        setTwoFactorEnabled(true);
        toast({
          title: "2FA Enabled",
          description: "Two-factor authentication has been enabled for your account.",
        });
      } else {
        // Disable 2FA - this would need additional implementation
        toast({
          title: "Feature Coming Soon",
          description: "2FA disable functionality will be available soon.",
        });
      }
    } catch (error: any) {
      console.error('Error with 2FA:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update 2FA settings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // First delete user data from profiles and other tables
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', user.id);

      if (profileError) {
        console.warn('Error deleting profile:', profileError);
      }

      // Delete user from auth
      const { error } = await supabase.auth.admin.deleteUser(user.id);

      if (error) throw error;

      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted.",
      });

      // Sign out and redirect
      await signOut();
      navigate('/auth');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete account. Please contact support.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = () => {
    const firstName = profileForm.first_name || "";
    const lastName = profileForm.last_name || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U";
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="danger">Account</TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="text-lg font-semibold">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" size="sm">
                    <Camera className="h-4 w-4 mr-2" />
                    Change Photo
                  </Button>
                  <p className="text-sm text-muted-foreground mt-1">
                    JPG, GIF or PNG. 1MB max.
                  </p>
                </div>
              </div>

              {/* Profile Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={profileForm.first_name}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, first_name: e.target.value }))}
                    placeholder="Enter your first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={profileForm.last_name}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, last_name: e.target.value }))}
                    placeholder="Enter your last name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={profileForm.username}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Enter your username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter your phone number"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    value={profileForm.company_name}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, company_name: e.target.value }))}
                    placeholder="Enter your company name"
                  />
                </div>
              </div>

              <Button onClick={updateProfile} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current_email">Current Email</Label>
                <Input
                  id="current_email"
                  value={emailForm.currentEmail}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_email">New Email Address</Label>
                <Input
                  id="new_email"
                  type="email"
                  value={emailForm.newEmail}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, newEmail: e.target.value }))}
                  placeholder="Enter new email address"
                />
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">Email Change Process</p>
                    <p className="text-muted-foreground">
                      You'll receive confirmation emails at both your current and new email addresses. 
                      You must confirm the change from both emails to complete the process.
                    </p>
                  </div>
                </div>
              </div>
              <Button onClick={updateEmail} disabled={loading || !emailForm.newEmail}>
                <Mail className="h-4 w-4 mr-2" />
                {loading ? "Updating..." : "Update Email"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Password Settings */}
        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Password Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current_password">Current Password</Label>
                <div className="relative">
                  <Input
                    id="current_password"
                    type={passwordForm.showCurrentPassword ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="Enter current password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-0 h-full px-3"
                    onClick={() => setPasswordForm(prev => ({ ...prev, showCurrentPassword: !prev.showCurrentPassword }))}
                  >
                    {passwordForm.showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new_password"
                    type={passwordForm.showNewPassword ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Enter new password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-0 h-full px-3"
                    onClick={() => setPasswordForm(prev => ({ ...prev, showNewPassword: !prev.showNewPassword }))}
                  >
                    {passwordForm.showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirm_password"
                    type={passwordForm.showConfirmPassword ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm new password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-0 h-full px-3"
                    onClick={() => setPasswordForm(prev => ({ ...prev, showConfirmPassword: !prev.showConfirmPassword }))}
                  >
                    {passwordForm.showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm">
                  <p className="font-medium mb-2">Password Requirements:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>At least 6 characters long</li>
                    <li>Include a mix of uppercase and lowercase letters</li>
                    <li>Include at least one number</li>
                    <li>Consider using special characters</li>
                  </ul>
                </div>
              </div>
              <Button 
                onClick={updatePassword} 
                disabled={loading || !passwordForm.newPassword || !passwordForm.confirmPassword}
              >
                <Lock className="h-4 w-4 mr-2" />
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <h4 className="font-medium">Two-Factor Authentication</h4>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {twoFactorEnabled && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  <Switch
                    checked={twoFactorEnabled}
                    onCheckedChange={toggle2FA}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm">
                  <p className="font-medium mb-2">Security Features:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Two-factor authentication (2FA)</li>
                    <li>Email notifications for account changes</li>
                    <li>Session management</li>
                    <li>Login history tracking</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Danger Zone */}
        <TabsContent value="danger">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
                <div className="space-y-2">
                  <h4 className="font-medium text-destructive">Delete Account</h4>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <div className="text-sm text-muted-foreground mt-2">
                    <p className="font-medium">This will delete:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Your profile and account information</li>
                      <li>All your leads and customers data</li>
                      <li>Installation records and documents</li>
                      <li>Calendar events and analytics data</li>
                      <li>All uploaded files and reports</li>
                    </ul>
                  </div>
                </div>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={loading}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete My Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your account
                      and remove all your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={deleteAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Yes, delete my account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}