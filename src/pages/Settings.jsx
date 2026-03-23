import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Palette, Globe, Bell, Shield, LogOut, User as UserIcon, Moon, Sun, Check, X, Trash2, Download, Upload, FileSpreadsheet, Lock } from "lucide-react";
import { exportJSON, exportTransactionsCSV, importJSON } from "@/api/services/dataService";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/api/supabaseClient";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import CategoryManagement from "../components/settings/CategoryManagement";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const colorThemes = [
  { name: 'أخضر', primary: '#10b981', secondary: '#065f46', accent: '#34d399' },
  { name: 'أزرق', primary: '#3b82f6', secondary: '#1e40af', accent: '#60a5fa' },
  { name: 'بنفسجي', primary: '#8b5cf6', secondary: '#5b21b6', accent: '#a78bfa' },
  { name: 'برتقالي', primary: '#f59e0b', secondary: '#d97706', accent: '#fbbf24' },
  { name: 'أحمر', primary: '#ef4444', secondary: '#dc2626', accent: '#f87171' },
  { name: 'سماوي', primary: '#06b6d4', secondary: '#0891b2', accent: '#22d3ee' }
];

export default function SettingsPage() {
  const { user, userSettings: settings, updateSettings, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  // State for editing user name
  const [isEditingName, setIsEditingName] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  
  // Password change state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    if (user && settings) {
      setNewFullName(user.user_metadata?.full_name || user.email || '');
      setLoading(false);
    }
  }, [user, settings]);

  const handleSave = async (updatedSettings) => {
    setSaving(true);
    try {
      await updateSettings(updatedSettings);
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleNameUpdate = async () => {
    if (!newFullName.trim() || newFullName.trim() === user.user_metadata?.full_name) {
      setIsEditingName(false);
      setNewFullName(user.user_metadata?.full_name || ''); // Reset to original name if no change
      return;
    }
    setSaving(true);
    try {
      await supabase.auth.updateUser({ data: { full_name: newFullName.trim() } });
      setIsEditingName(false);
      toast.success("تم تحديث الاسم بنجاح");
      // AuthContext will refresh user data on next session check
    } catch (error) {
      console.error("خطأ في تحديث الاسم:", error);
      // Revert newFullName if update fails
      setNewFullName(user.user_metadata?.full_name || '');
      setIsEditingName(false);
      toast.error("خطأ في تحديث الاسم");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelNameEdit = () => {
    setIsEditingName(false);
    setNewFullName(user.user_metadata?.full_name || ''); // Reset to original name
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error('كلمات المرور غير متطابقة');
      return;
    }
    setPasswordSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('تم تغيير كلمة المرور بنجاح');
      setIsChangingPassword(false);
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error.message || 'خطأ في تغيير كلمة المرور');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleThemeChange = (theme) => {
    const updatedSettings = {
      primary_color: theme.primary,
      secondary_color: theme.secondary,
      accent_color: theme.accent
    };
    handleSave(updatedSettings);
  };
  
  const handleThemeModeChange = () => {
    const newTheme = settings?.theme === 'dark' ? 'light' : 'dark';
    handleSave({ theme: newTheme });
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Failed to logout");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // Delete all user data from tables
      await Promise.all([
        supabase.from('transactions').delete().eq('user_id', user.id),
        supabase.from('wallets').delete().eq('user_id', user.id),
        supabase.from('wishlist_items').delete().eq('user_id', user.id),
        supabase.from('budgets').delete().eq('user_id', user.id),
        supabase.from('user_settings').delete().eq('user_id', user.id),
      ]);
      // Sign out — full auth user deletion requires a server-side admin call
      await logout();
      toast.success('تم حذف جميع بياناتك بنجاح');
      navigate('/login');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('خطأ في حذف الحساب');
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-32 bg-gray-200 rounded-xl animate-pulse dark:bg-gray-700"></div>
        <div className="h-48 bg-gray-200 rounded-xl animate-pulse dark:bg-gray-700"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PageHeader title="الإعدادات" subtitle="تخصيص التطبيق حسب تفضيلاتك" />

      <div className="px-4 -mt-4 space-y-6">
        {/* User Profile */}
        <Card className="bg-white shadow-lg border-0 dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg text-gray-900 dark:text-gray-100">الملف الشخصي</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400">معلومات حسابك</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              {isEditingName ? (
                <div className="flex-grow flex items-center gap-2">
                  <Input
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                    disabled={saving}
                    placeholder="أدخل اسمك الجديد"
                  />
                  <Button 
                    size="icon" 
                    onClick={handleNameUpdate} 
                    disabled={saving || !newFullName.trim()} 
                    className="bg-green-500 hover:bg-green-600"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={handleCancelNameEdit} 
                    disabled={saving}
                    className="dark:text-gray-400 dark:hover:bg-gray-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-200">{user?.user_metadata?.full_name || 'لا يوجد اسم'}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {user?.role === 'admin' ? 'مدير' : 'مستخدم'}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsEditingName(true)}
                    className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                  >
                    تعديل الاسم
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Theme Settings */}
        <Card className="shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center dark:bg-purple-900/50">
              <Palette className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-lg text-gray-900 dark:text-gray-100">السمة والألوان</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400">اختر الألوان والوضع المفضل لديك</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Theme Mode Button */}
            <Button
              variant="outline"
              onClick={handleThemeModeChange}
              disabled={saving}
              className="w-full justify-start gap-3 dark:bg-gray-700/50 dark:border-gray-600 dark:text-gray-200"
            >
              {settings?.theme === 'dark' ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4" />}
              <span>{settings?.theme === 'dark' ? 'التحويل للوضع الفاتح' : 'التحويل للوضع الداكن'}</span>
            </Button>
            
            {/* Color Theme Selection */}
            <div className="grid grid-cols-2 gap-3">
              {colorThemes.map((theme, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className={`h-16 p-3 flex flex-col gap-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 ${
                    settings?.primary_color === theme.primary ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleThemeChange(theme)}
                  disabled={saving}
                >
                  <div className="flex gap-1">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: theme.primary }}
                    />
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: theme.secondary }}
                    />
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: theme.accent }}
                    />
                  </div>
                  <span className="text-xs font-medium">{theme.name}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Language & Currency */}
        <Card className="shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center dark:bg-blue-900/50">
              <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-lg text-gray-900 dark:text-gray-100">اللغة والعملة</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400">تفضيلات اللغة والعملة</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-800 dark:text-gray-200">العملة الافتراضية</Label>
              <Select 
                value={settings?.default_currency || 'EGP'} 
                onValueChange={(value) => handleSave({ default_currency: value })}
              >
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:text-gray-200">
                  <SelectItem value="EGP">جنيه مصري (ج.م)</SelectItem>
                  <SelectItem value="SAR">ريال سعودي (ر.س)</SelectItem>
                  <SelectItem value="USD">دولار أمريكي ($)</SelectItem>
                  <SelectItem value="EUR">يورو (€)</SelectItem>
                  <SelectItem value="GBP">جنيه إسترليني (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center dark:bg-yellow-900/50">
              <Bell className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <CardTitle className="text-lg text-gray-900 dark:text-gray-100">الإشعارات</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400">إدارة إشعارات التطبيق</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-gray-800 dark:text-gray-200">الإشعارات العامة</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                   الحالة: {settings?.notifications_enabled !== false ? 'مفعلة' : 'معطلة'}
                </p>
              </div>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => handleSave({ notifications_enabled: !(settings?.notifications_enabled !== false) })}
                disabled={saving}
                className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
              >
                {settings?.notifications_enabled !== false ? 'تعطيل' : 'تفعيل'}
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-gray-800 dark:text-gray-200">تنبيهات الميزانية</Label>
                 <p className="text-sm text-gray-500 dark:text-gray-400">
                  الحالة: {settings?.budget_alerts !== false ? 'مفعلة' : 'معطلة'}
                </p>
              </div>
               <Button 
                variant="outline"
                size="sm"
                onClick={() => handleSave({ budget_alerts: !(settings?.budget_alerts !== false) })}
                disabled={saving}
                className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
              >
                {settings?.budget_alerts !== false ? 'تعطيل' : 'تفعيل'}
              </Button>
            </div>

            <div className="space-y-2 pt-2 border-t dark:border-gray-700">
              <Label className="text-gray-800 dark:text-gray-200">حد التنبيه للمعاملات الكبيرة (ج.م)</Label>
              <p className="text-xs text-gray-500 dark:text-gray-400">سيتم تنبيهك عند إضافة معاملة تتجاوز هذا المبلغ (0 = معطل)</p>
              <Input
                type="number"
                min="0"
                step="100"
                defaultValue={settings?.large_transaction_threshold ?? 5000}
                onBlur={(e) => handleSave({ large_transaction_threshold: Number(e.target.value) })}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 w-40"
                disabled={saving}
              />
            </div>
          </CardContent>
        </Card>

        {/* Category Management */}
        <CategoryManagement userId={user?.id} />

        {/* Data Management */}
        <Card className="shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center dark:bg-emerald-900/50">
              <Download className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <CardTitle className="text-lg text-gray-900 dark:text-gray-100">إدارة البيانات</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400">تصدير واستيراد بياناتك</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
              disabled={exporting || importing}
              onClick={async () => {
                setExporting(true);
                try {
                  await exportJSON(user.id);
                  toast.success('تم تصدير النسخة الاحتياطية بنجاح');
                } catch { toast.error('حدث خطأ أثناء التصدير'); }
                finally { setExporting(false); }
              }}
            >
              <Download className="w-4 h-4 ml-2" />
              {exporting ? 'جارِ التصدير...' : 'تصدير نسخة احتياطية (JSON)'}
            </Button>
            <Button
              variant="outline"
              className="w-full dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
              disabled={exporting || importing}
              onClick={async () => {
                setExporting(true);
                try {
                  await exportTransactionsCSV(user.id);
                  toast.success('تم تصدير المعاملات بنجاح');
                } catch { toast.error('حدث خطأ أثناء التصدير'); }
                finally { setExporting(false); }
              }}
            >
              <FileSpreadsheet className="w-4 h-4 ml-2" />
              {exporting ? 'جارِ التصدير...' : 'تصدير المعاملات (CSV)'}
            </Button>
            <Button
              variant="outline"
              className="w-full dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
              disabled={exporting || importing}
              onClick={async () => {
                setImporting(true);
                try {
                  const result = await importJSON(user.id);
                  if (result.imported) {
                    toast.success(`تم الاستيراد: ${result.wallets} محافظ، ${result.transactions} معاملة، ${result.budgets} ميزانيات، ${result.wishlist} أمنيات`);
                  }
                } catch (err) { toast.error(err.message || 'حدث خطأ أثناء الاستيراد'); }
                finally { setImporting(false); }
              }}
            >
              <Upload className="w-4 h-4 ml-2" />
              {importing ? 'جارِ الاستيراد...' : 'استيراد نسخة احتياطية'}
            </Button>
          </CardContent>
        </Card>

        {/* Password Change */}
        <Card className="shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center dark:bg-indigo-900/50">
              <Lock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <CardTitle className="text-lg text-gray-900 dark:text-gray-100">تغيير كلمة المرور</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400">تحديث كلمة مرور حسابك</p>
            </div>
          </CardHeader>
          <CardContent>
            {isChangingPassword ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-gray-800 dark:text-gray-200">كلمة المرور الجديدة</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="6 أحرف على الأقل"
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                    disabled={passwordSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-800 dark:text-gray-200">تأكيد كلمة المرور</Label>
                  <Input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="أعد إدخال كلمة المرور"
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                    disabled={passwordSaving}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handlePasswordChange}
                    disabled={passwordSaving || !newPassword || !confirmNewPassword}
                    className="bg-primary"
                  >
                    {passwordSaving ? 'جارِ الحفظ...' : 'حفظ كلمة المرور'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => { setIsChangingPassword(false); setNewPassword(''); setConfirmNewPassword(''); }}
                    disabled={passwordSaving}
                    className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                onClick={() => setIsChangingPassword(true)}
              >
                <Lock className="w-4 h-4 ml-2" />
                تغيير كلمة المرور
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card className="shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center dark:bg-red-900/50">
              <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <CardTitle className="text-lg text-gray-900 dark:text-gray-100">إدارة الحساب</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400">إعدادات الحساب والأمان</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-500/50 dark:hover:bg-red-500/10"
                onClick={() => setShowLogoutDialog(true)}
              >
                <LogOut className="w-4 h-4 ml-2" />
                تسجيل الخروج
              </Button>
              <Button
                variant="outline"
                className="w-full text-red-700 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-500/50 dark:hover:bg-red-500/10"
                onClick={() => { setDeleteConfirmText(''); setShowDeleteDialog(true); }}
              >
                <Trash2 className="w-4 h-4 ml-2" />
                حذف الحساب وجميع البيانات
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Spacing */}
        <div className="h-4"></div>
      </div>

      {/* Delete Account Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="dark:bg-gray-800 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-gray-100 text-red-600">حذف الحساب نهائياً</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-gray-400">
              سيتم حذف جميع بياناتك (المحافظ، المعاملات، الإعدادات) بشكل نهائي ولا يمكن التراجع عن هذا الإجراء.
              اكتب <strong>احذف حسابي</strong> للتأكيد.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-1 pb-2">
            <input
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
              placeholder="احذف حسابي"
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteConfirmText !== 'احذف حسابي'}
              onClick={handleDeleteAccount}
              className="bg-red-600 disabled:opacity-50"
            >
              حذف نهائي
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="dark:bg-gray-800 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-gray-100">تسجيل الخروج</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-gray-400">
              هل أنت متأكد من رغبتك في تسجيل الخروج من حسابك؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-red-600">
              تسجيل الخروج
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}