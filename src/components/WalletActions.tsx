import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import axios from "axios";
import { Coins, Wallet } from "lucide-react";

interface WalletActionsProps {
  currentBalance: number;
  user: any;
}

export const WalletActions = ({ currentBalance, user }: WalletActionsProps) => {
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [depositUrl, setDepositUrl] = useState<string | null>(null);
  const [embedBlocked, setEmbedBlocked] = useState(false);

  const handleDepositRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post("/api/oxapay/create-invoice", {
        amount,
        user_id: user.id,
      });

      if (!data?.wallet_address) throw new Error("Failed to get payment link");

      setDepositUrl(data.wallet_address);
      toast.success("Deposit request created! Complete the payment below.");
    } catch (err: any) {
      console.error("Deposit request error:", err);
      toast.error(err.message || "Deposit request failed");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!withdrawAddress || withdrawAddress.trim().length === 0) {
      toast.error("Please enter a valid wallet address");
      return;
    }

    if (amount > currentBalance) {
      toast.error("Insufficient balance");
      return;
    }

    setWithdrawLoading(true);
    try {
      const { data } = await axios.post("/api/oxapay/withdraw", {
        amount,
        wallet_address: withdrawAddress,
        user_id: user.id,
      });

      if (!data?.success) throw new Error(data.error || "Withdrawal failed");

      toast.success("Withdrawal processed successfully!");
      setWithdrawAmount("");
      setWithdrawAddress("");
      setWithdrawDialogOpen(false);

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      console.error("Withdrawal error:", err);
      toast.error(err.response?.data?.error || err.message || "Withdrawal failed");
    } finally {
      setWithdrawLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Dialog open={depositDialogOpen} onOpenChange={setDepositDialogOpen}>
        <DialogTrigger asChild>
          <Card className="p-6 gradient-card border-primary/20 hover:border-primary/40 cursor-pointer group">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">Deposit (USDT/TRX)</h3>
                <p className="text-sm text-muted-foreground">Add funds via OxaPay</p>
              </div>
              <Coins className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
            </div>
          </Card>
        </DialogTrigger>

        <DialogContent className="max-w-2xl w-full">
          <DialogHeader>
            <DialogTitle>Deposit USDT/TRX</DialogTitle>
            <DialogDescription>
              Enter the amount and complete the payment below.
            </DialogDescription>
          </DialogHeader>

          {!depositUrl ? (
            <form onSubmit={handleDepositRequest} className="space-y-4">
              <div>
                <Label htmlFor="depositAmount">Amount (USDT)</Label>
                <Input
                  id="depositAmount"
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder="100.00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full" size="lg">
                {loading ? "Creating deposit..." : "Generate Deposit Wallet"}
              </Button>
            </form>
          ) : (
            <div className="mt-4">
              {!embedBlocked ? (
                <div className="relative w-full pb-[75%]">
                  <iframe
                    src={depositUrl}
                    title="OxaPay Deposit"
                    className="absolute top-0 left-0 w-full h-full border rounded-lg"
                    onError={() => setEmbedBlocked(true)}
                  />
                </div>
              ) : (
                <Button
                  className="mt-4 w-full"
                  onClick={() => window.open(depositUrl!, "_blank")}
                >
                  Open Payment in New Tab
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
        <DialogTrigger asChild>
          <Card className="p-6 gradient-card border-primary/20 hover:border-primary/40 cursor-pointer group">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">Withdraw (USDT/TRX)</h3>
                <p className="text-sm text-muted-foreground">Withdraw funds to your wallet</p>
              </div>
              <Wallet className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
            </div>
          </Card>
        </DialogTrigger>

        <DialogContent className="max-w-lg w-full">
          <DialogHeader>
            <DialogTitle>Withdraw USDT/TRX</DialogTitle>
            <DialogDescription>
              Enter the amount and your wallet address to withdraw funds.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleWithdrawRequest} className="space-y-4 mt-4">
            <div>
              <Label htmlFor="withdrawAmount">Amount (USDT)</Label>
              <Input
                id="withdrawAmount"
                type="number"
                step="0.01"
                min="1"
                max={currentBalance}
                placeholder="100.00"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                required
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Available balance: ${currentBalance.toFixed(2)}
              </p>
            </div>

            <div>
              <Label htmlFor="withdrawAddress">Wallet Address (TRX Network)</Label>
              <Input
                id="withdrawAddress"
                type="text"
                placeholder="TYour...WalletAddress"
                value={withdrawAddress}
                onChange={(e) => setWithdrawAddress(e.target.value)}
                required
                className="mt-1 font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Make sure to use a TRC-20 USDT compatible address
              </p>
            </div>

            <Button type="submit" disabled={withdrawLoading} className="w-full" size="lg">
              {withdrawLoading ? "Processing withdrawal..." : "Withdraw Funds"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
