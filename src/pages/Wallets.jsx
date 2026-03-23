
import React, { useState } from "react";
import { Plus, Wallet as WalletIcon, CreditCard, PiggyBank, Landmark, TrendingUp, Edit, Trash2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useAuth } from "@/lib/AuthContext";
import { useWallets, useCreateWallet, useUpdateWallet, useDeleteWallet } from "@/hooks/useWalletQueries";
import { toast } from "sonner";

import WalletCard from "../components/wallets/WalletCard";
import AddWalletModal from "../components/wallets/AddWalletModal";
import EditWalletModal from "../components/wallets/EditWalletModal";

const walletIcons = {
  cash: WalletIcon,
  bank: Landmark,
  credit_card: CreditCard,
  savings: PiggyBank,
  investment: TrendingUp
};

export default function WalletsPage() {
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWallet, setEditingWallet] = useState(null);
  const [deletingWallet, setDeletingWallet] = useState(null);

  const { data: wallets = [], isLoading, refetch } = useWallets(user?.id);
  const createWallet = useCreateWallet(user?.id);
  const updateWallet = useUpdateWallet(user?.id);
  const deleteWallet = useDeleteWallet(user?.id);

  const handleAddWallet = async (walletData) => {
    try {
      await createWallet.mutateAsync(walletData);
      setShowAddModal(false);
      toast.success("Wallet created successfully");
    } catch (error) {
      console.error("Error adding wallet:", error);
      toast.error("Failed to create wallet");
    }
  };

  const handleEditWallet = async (walletData) => {
    try {
      await updateWallet.mutateAsync({ walletId: editingWallet.id, data: walletData });
      setEditingWallet(null);
      toast.success("Wallet updated successfully");
    } catch (error) {
      console.error("Error updating wallet:", error);
      toast.error("Failed to update wallet");
    }
  };

  const handleDeleteWallet = async () => {
    try {
      await deleteWallet.mutateAsync(deletingWallet.id);
      setDeletingWallet(null);
      toast.success("Wallet deleted successfully");
    } catch (error) {
      console.error("Error deleting wallet:", error);
      toast.error("Failed to delete wallet");
    }
  };

  const totalBalance = wallets.reduce((sum, wallet) => sum + (wallet.balance || 0), 0);

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-24 bg-gray-200 rounded-xl animate-pulse dark:bg-gray-700"></div>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse dark:bg-gray-700"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-primary text-white px-4 pt-12 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">محافظي</h1>
            <p className="text-white/80 text-sm">إدارة محافظ أموالك</p>
          </div>
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-white text-primary hover:bg-gray-100"
          >
            <Plus className="w-5 h-5 ml-2" />
            إضافة محفظة
          </Button>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-6">
        {/* Total Balance Card */}
        <Card className="bg-white shadow-lg border-0 dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-6 text-center">
            <p className="text-gray-600 text-sm mb-2 dark:text-gray-300">إجمالي الأرصدة</p>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              {totalBalance.toLocaleString()} ج.م
            </h2>
            <p className="text-gray-500 text-sm dark:text-gray-400">{wallets.length} محفظة</p>
          </CardContent>
        </Card>

        {/* Wallets List */}
        <div className="space-y-4">
          {wallets.length === 0 ? (
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-8 text-center">
                <WalletIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 mb-4 dark:text-gray-400">لا توجد محافظ بعد</p>
                <Button
                  onClick={() => setShowAddModal(true)}
                  className="bg-primary"
                >
                  <Plus className="w-4 h-4 ml-2" />
                  إنشاء محفظة جديدة
                </Button>
              </CardContent>
            </Card>
          ) : (
            wallets.map((wallet) => (
              <div key={wallet.id} className="relative">
                <WalletCard 
                  wallet={wallet}
                  icon={walletIcons[wallet.type]}
                  onUpdate={refetch}
                />
                <div className="absolute top-4 left-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="dark:bg-gray-800 dark:border-gray-700">
                      <DropdownMenuItem className="dark:text-gray-200 dark:hover:bg-gray-700" onClick={() => setEditingWallet(wallet)}>
                        <Edit className="w-4 h-4 ml-2" />
                        تعديل
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setDeletingWallet(wallet)}
                        className="text-red-600 dark:text-red-400 dark:hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4 ml-2" />
                        حذف
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bottom Spacing */}
        <div className="h-4"></div>
      </div>

      <AddWalletModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddWallet}
      />

      <EditWalletModal
        isOpen={!!editingWallet}
        onClose={() => setEditingWallet(null)}
        onSubmit={handleEditWallet}
        wallet={editingWallet}
      />

      <AlertDialog open={!!deletingWallet} onOpenChange={() => setDeletingWallet(null)}>
        <AlertDialogContent className="dark:bg-gray-800 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-gray-100">تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-gray-400">
              هل أنت متأكد من حذف محفظة "{deletingWallet?.name}"؟ هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteWallet} className="bg-red-600">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
