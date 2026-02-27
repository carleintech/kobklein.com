import { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowUpRight, ArrowDownLeft, Repeat, Banknote, CreditCard } from "lucide-react-native";
import Card from "@/components/ui/Card";
import { useWalletStore } from "@/context/wallet-store";
import { kkGet } from "@/lib/api";
import { formatCurrency } from "@/hooks/useFormatCurrency";
import { colors, fonts, spacing, radii } from "@/constants/theme";
import i18n from "@/i18n";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  description: string;
  createdAt: string;
  status: string;
}

const typeIcons: Record<string, React.ReactNode> = {
  send: <ArrowUpRight size={18} color={colors.danger} />,
  receive: <ArrowDownLeft size={18} color={colors.gold} />,
  transfer: <Repeat size={18} color={colors.gold} />,
  cash_in: <Banknote size={18} color={colors.gold} />,
  cash_out: <Banknote size={18} color={colors.danger} />,
  card: <CreditCard size={18} color={colors.textBody} />,
};

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const { balances, refresh, loading } = useWalletStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 20;

  const loadTransactions = useCallback(async (pageNum: number, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setTxLoading(true);
    }
    try {
      const data = await kkGet<Transaction[]>(
        `/v1/transactions/history?limit=${PAGE_SIZE}&offset=${pageNum * PAGE_SIZE}`,
      );
      if (append) {
        setTransactions((prev) => [...prev, ...data]);
      } else {
        setTransactions(data);
      }
      setHasMore(data.length >= PAGE_SIZE);
      setPage(pageNum);
    } catch {
      // Silent
    } finally {
      if (append) {
        setLoadingMore(false);
      } else {
        setTxLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    refresh();
    loadTransactions(0);
  }, []);

  const onRefresh = async () => {
    setHasMore(true);
    await Promise.all([refresh(), loadTransactions(0)]);
  };

  const onEndReached = () => {
    if (!hasMore || loadingMore || txLoading) return;
    loadTransactions(page + 1, true);
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const isDebit = ["send", "cash_out", "withdrawal"].includes(item.type);

    return (
      <View style={styles.txRow}>
        <View style={styles.txIcon}>
          {typeIcons[item.type] ?? <Repeat size={18} color={colors.textMuted} />}
        </View>
        <View style={styles.txContent}>
          <Text style={styles.txDescription} numberOfLines={1}>
            {item.description}
          </Text>
          <Text style={styles.txDate}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <Text style={[styles.txAmount, isDebit ? styles.txDebit : styles.txCredit]}>
          {isDebit ? "-" : "+"}{formatCurrency(Math.abs(item.amount), item.currency)}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.screenTitle}>{i18n.t("wallet.title")}</Text>

      {/* Balance Cards */}
      <View style={styles.balanceCards}>
        {balances.map((wallet) => (
          <Card key={wallet.walletId} style={styles.walletCard}>
            <Text style={styles.walletCurrency}>
              {wallet.currency === "HTG" ? "🇭🇹" : "🇺🇸"}{" "}
              {wallet.currency === "HTG" ? i18n.t("wallet.htg") : i18n.t("wallet.usd")}
            </Text>
            <Text style={styles.walletBalance}>
              {formatCurrency(wallet.balance, wallet.currency)}
            </Text>
          </Card>
        ))}
      </View>

      {/* Transaction History */}
      <Text style={styles.sectionTitle}>{i18n.t("wallet.history")}</Text>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderTransaction}
        refreshControl={
          <RefreshControl
            refreshing={loading || txLoading}
            onRefresh={onRefresh}
            tintColor={colors.gold}
            colors={[colors.gold]}
          />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          !txLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{i18n.t("wallet.noTransactions")}</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={colors.gold} />
            </View>
          ) : null
        }
        contentContainerStyle={styles.txList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  screenTitle: {
    fontFamily: fonts.serif,
    fontSize: 24,
    color: colors.textHeading,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  balanceCards: {
    paddingHorizontal: spacing.lg,
    gap: 10,
    marginBottom: spacing.lg,
  },
  walletCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  walletCurrency: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.textBody,
  },
  walletBalance: {
    fontFamily: fonts.sansBold,
    fontSize: 20,
    color: colors.textHeading,
  },
  sectionTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  txList: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
  },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  txIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.panel,
    alignItems: "center",
    justifyContent: "center",
  },
  txContent: {
    flex: 1,
  },
  txDescription: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.textHeading,
  },
  txDate: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  txAmount: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
  },
  txDebit: {
    color: colors.textBody,
  },
  txCredit: {
    color: colors.gold,
  },
  empty: {
    paddingVertical: spacing["4xl"],
    alignItems: "center",
  },
  emptyText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textMuted,
  },
  footerLoader: {
    paddingVertical: spacing.xl,
    alignItems: "center",
  },
});
