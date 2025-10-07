import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownLeft, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  date: string;
  txHash?: string;
}

export const TransactionHistory = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      const formattedTransactions: Transaction[] = (data || []).map((t) => ({
        id: t.id,
        type: t.type,
        amount: Number(t.amount),
        status: t.status || "pending",
        date: new Date(t.created_at).toLocaleDateString(),
        txHash: t.transaction_hash || undefined,
      }));

      setTransactions(formattedTransactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  // Poll transactions every 2 seconds to show new pending deposits
  useEffect(() => {
    fetchTransactions();
    const interval = setInterval(fetchTransactions, 2000);
    return () => clearInterval(interval);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowDownLeft className="w-5 h-5 text-primary" />;
      case "withdrawal":
        return <ArrowUpRight className="w-5 h-5 text-destructive" />;
      case "game_earning":
      case "referral_bonus":
        return <Users className="w-5 h-5 text-earnings-gold" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "pending":
        return "secondary";
      case "failed":
        return "destructive";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4">Recent Transactions</h3>
        <p className="text-muted-foreground">Loading...</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-xl font-bold mb-4">Recent Transactions</h3>
      {transactions.length === 0 ? (
        <p className="text-muted-foreground">No transactions yet</p>
      ) : (
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 rounded-lg bg-game-bg/50 border border-border"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-full bg-card">
                  {getIcon(transaction.type)}
                </div>
                <div>
                  <p className="font-semibold capitalize">
                    {transaction.type === "game_earning"
                      ? "Game Earnings"
                      : transaction.type.replace("_", " ")}
                  </p>
                  <p className="text-xs text-muted-foreground">{transaction.date}</p>
                  {transaction.txHash && (
                    <p className="text-xs text-muted-foreground font-mono">{transaction.txHash}</p>
                  )}
                </div>
              </div>

              <div className="text-right flex items-center gap-3">
                <div>
                  <p
                    className={`font-bold ${
                      transaction.type === "withdrawal" ? "text-destructive" : "text-earnings-gold"
                    }`}
                  >
                    {transaction.type === "withdrawal" ? "-" : "+"}${transaction.amount.toFixed(2)}
                  </p>
                </div>
                <Badge variant={getStatusColor(transaction.status) as any}>
                  {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
