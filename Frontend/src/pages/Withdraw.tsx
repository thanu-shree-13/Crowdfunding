import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAddress } from "@thirdweb-dev/react";
import { StateContext } from "../contexts";
import { daysLeft } from "../utils";
import { Loader } from "../components/loader";
import { motion, AnimatePresence } from "framer-motion";
import { ethers } from "ethers";

type Campaign = {
  pId: string;
  owner: string;
  title: string;
  description: string;
  target: string;
  deadline: number;
  amountCollected: string;
  isFlagged?: boolean;
  withdrawn?: boolean;
  image: string;
};

export function Withdraw() {
  const address = useAddress();
  const navigate = useNavigate();
  const { getUserCampaigns, contract } = useContext(StateContext);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);
  const [hasDonated, setHasDonated] = useState(false);
  const [myDonationAmount, setMyDonationAmount] = useState("0");
  const [isDonationChecking, setIsDonationChecking] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // ✅ KEY FIX: This ref tracks the current campaign ID being checked
  // Any async result that doesn't match this ref is discarded (stale)
  const checkingForPId = useRef<string | null>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadCampaigns = async () => {
    if (!address) return;
    try {
      setIsLoading(true);
      const data = await getUserCampaigns();
      setCampaigns(data);
      if (data.length > 0) setSelected(data[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadCampaigns(); }, [address]);

  const checkDonation = async (campaign: Campaign) => {
    const pid = campaign.pId;

    // ✅ Mark which campaign we're checking RIGHT NOW
    checkingForPId.current = pid;

    // ✅ Immediately clear stale donation state + reset processing states
    setHasDonated(false);
    setMyDonationAmount("0");
    setIsRefunding(false);
    setIsWithdrawing(false);
    setIsDonationChecking(true);

    try {
      if (!contract || !address) {
        setIsDonationChecking(false);
        return;
      }

      const res = await contract.call("getDonatorsPaginated", [Number(pid), 0, 100]);

      // ✅ STALE CHECK: If user switched campaign while this was loading, discard result
      if (checkingForPId.current !== pid) {
        console.log(`Discarding stale donation result for pId=${pid}`);
        return;
      }

      const donors: string[] = res[0];
      const amounts: string[] = res[1];

      const total = donors.reduce((acc: ethers.BigNumber, d: string, i: number) => {
        if (d.toLowerCase() === address.toLowerCase()) {
          try { return acc.add(ethers.BigNumber.from(amounts[i])); }
          catch { return acc; }
        }
        return acc;
      }, ethers.BigNumber.from(0));

      const formatted = ethers.utils.formatEther(total);
      const amount = parseFloat(formatted);

      // ✅ Only set hasDonated if they actually have ETH donated
      if (amount > 0) {
        setHasDonated(true);
        setMyDonationAmount(formatted);
      } else {
        setHasDonated(false);
        setMyDonationAmount("0");
      }
    } catch (err) {
      // ✅ Also stale-check on error
      if (checkingForPId.current !== pid) return;
      console.log(err);
      setHasDonated(false);
      setMyDonationAmount("0");
    } finally {
      // ✅ Only clear loading if this is still the active campaign
      if (checkingForPId.current === pid) {
        setIsDonationChecking(false);
      }
    }
  };

  // ✅ Pass full campaign object so checkDonation can stale-check by pId
  useEffect(() => {
    if (selected) checkDonation(selected);
  }, [selected?.pId, address]);

  const toWei = (val: string) => {
    try { return ethers.utils.parseEther(val || "0"); }
    catch { return ethers.BigNumber.from(0); }
  };

  const isEnded = (c: Campaign) => Date.now() >= c.deadline * 1000;
  const isSuccess = (c: Campaign) => toWei(c.amountCollected).gte(toWei(c.target));

  const isFailed = (c: Campaign) =>
    (toWei(c.amountCollected).lt(toWei(c.target)) || !!c.isFlagged) &&
    toWei(c.amountCollected).gt(ethers.BigNumber.from(0));

  const isWithdrawable = (c: Campaign) =>
    isEnded(c) && isSuccess(c) && !c.withdrawn;

  // ✅ Guard with isDonationChecking so button never flashes on wrong campaign
  const isRefundable = (c: Campaign) =>
    !isDonationChecking &&
    isEnded(c) &&
    isFailed(c) &&
    !c.withdrawn &&
    hasDonated &&
    parseFloat(myDonationAmount) > 0;

  const getStatusInfo = (c: Campaign) => {
    if (c.withdrawn) return { label: "Completed", color: "#808191", dot: "#808191" };
    if (!isEnded(c)) return { label: "Active", color: "#1dc071", dot: "#1dc071" };
    if (isSuccess(c)) return { label: "Successful", color: "#1dc071", dot: "#1dc071" };
    return { label: "Ended", color: "#ff6b6b", dot: "#ff6b6b" };
  };

  const getProgressPct = (c: Campaign) => {
    try {
      const collected = parseFloat(c.amountCollected || "0");
      const target = parseFloat(c.target || "1");
      return Math.min((collected / target) * 100, 100);
    } catch { return 0; }
  };

  const handleWithdraw = async () => {
    if (!selected || !contract) return;
    try {
      setIsWithdrawing(true);
      await contract.call("withdraw", [Number(selected.pId)]);
      showToast("Withdrawal successful!", "success");
      await loadCampaigns();
    } catch (err: any) {
      showToast(err?.reason || err?.message || "Withdraw failed", "error");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleRefund = async () => {
    if (!selected || !contract) return;
    try {
      setIsRefunding(true);
      await contract.call("refund", [Number(selected.pId)]);
      showToast("Refund processed!", "success");
      await loadCampaigns();
    } catch (err: any) {
      showToast(err?.reason || err?.message || "Refund failed", "error");
    } finally {
      setIsRefunding(false);
    }
  };

  const getNoActionReason = (c: Campaign) => {
    if (isDonationChecking) return "⏳ Checking your donation status...";
    if (!isEnded(c)) return "⏳ Campaign is still active";
    if (c.withdrawn) {
      if (isSuccess(c)) return "✓ Funds already withdrawn by owner";
      return "✓ Refunds already processed";
    }
    if (isSuccess(c) && c.owner?.toLowerCase() !== address?.toLowerCase())
      return "ℹ Only the campaign owner can withdraw";
    if (isFailed(c) && !hasDonated)
      return "ℹ You did not donate to this campaign";
    if (!isFailed(c) && !isSuccess(c))
      return "ℹ No funds were collected — nothing to refund";
    return "ℹ No action available for this campaign";
  };

  if (!address) return (
    <div style={styles.centered}>
      <div style={styles.connectCard}>
        <div style={styles.connectIcon}>🔗</div>
        <p style={styles.connectText}>Connect your wallet to manage campaigns</p>
      </div>
    </div>
  );

  if (isLoading) return <Loader />;

  if (!campaigns.length) return (
    <div style={styles.centered}>
      <div style={styles.connectCard}>
        <div style={styles.connectIcon}>🚫</div>
        <p style={styles.connectText}>No campaigns found</p>
      </div>
    </div>
  );

  const progress = selected ? getProgressPct(selected) : 0;
  const statusInfo = selected ? getStatusInfo(selected) : null;

  return (
    <div style={styles.page}>
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -30, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -30, x: "-50%" }}
            style={{
              ...styles.toast,
              background: toast.type === "success"
                ? "linear-gradient(135deg, #1dc071 0%, #15924f 100%)"
                : "linear-gradient(135deg, #ff6b6b 0%, #c0392b 100%)",
            }}
          >
            {toast.type === "success" ? "✅" : "❌"} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={styles.container}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={styles.header}
        >
          <button onClick={() => navigate(-1)} style={styles.backBtn}>
            <span>←</span> Back
          </button>
          <div>
            <h1 style={styles.title}>Withdraw & Refund</h1>
            <p style={styles.subtitle}>Manage your campaign funds</p>
          </div>
          <div style={styles.walletBadge}>
            <span style={styles.walletDot} />
            {address.slice(0, 6)}…{address.slice(-4)}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          style={styles.tabsWrapper}
        >
          <p style={styles.tabsLabel}>YOUR CAMPAIGNS</p>
          <div style={styles.tabs}>
            {campaigns.map((c, i) => {
              const st = getStatusInfo(c);
              const isActive = selected?.pId === c.pId;
              return (
                <motion.button
                  key={c.pId}
                  onClick={() => setSelected(c)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{ ...styles.tab, ...(isActive ? styles.tabActive : {}) }}
                >
                  <span style={{
                    ...styles.tabDot,
                    background: st.dot,
                    boxShadow: isActive ? `0 0 6px ${st.dot}` : "none",
                  }} />
                  <span style={styles.tabTitle}>{c.title}</span>
                  <span style={{ ...styles.tabStatus, color: st.color }}>{st.label}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {selected && statusInfo && (
            <motion.div
              key={selected.pId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              style={styles.card}
            >
              <div style={styles.cardTop}>
                <div style={styles.imgWrapper}>
                  <img
                    src={selected.image}
                    alt={selected.title}
                    style={styles.img}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://via.placeholder.com/120x120/1c1c2e/ffffff?text=📷";
                    }}
                  />
                  {isEnded(selected) && (
                    <div style={styles.endedOverlay}>Campaign Ended</div>
                  )}
                </div>
                <div style={styles.cardInfo}>
                  <div style={styles.categoryTag}>Education</div>
                  <h2 style={styles.cardTitle}>{selected.title}</h2>
                  <p style={styles.cardDesc}>{selected.description}</p>
                  <div style={styles.statusRow}>
                    <div style={{
                      ...styles.statusPill,
                      background: isEnded(selected)
                        ? (selected.withdrawn ? "rgba(128,129,145,0.15)" : "rgba(255,107,107,0.15)")
                        : "rgba(29,192,113,0.15)",
                      color: statusInfo.color,
                      border: `1px solid ${statusInfo.color}40`,
                    }}>
                      <span style={{
                        ...styles.statusPillDot,
                        background: statusInfo.color,
                        boxShadow: `0 0 6px ${statusInfo.color}`,
                      }} />
                      {statusInfo.label}
                    </div>
                    {selected.isFlagged && <span style={styles.flagBadge}>🚩 Flagged</span>}
                    {selected.withdrawn && isSuccess(selected) && <span style={styles.withdrawnBadge}>✓ Withdrawn</span>}
                    {selected.withdrawn && !isSuccess(selected) && <span style={styles.refundedBadge}>✓ Refunded</span>}
                  </div>
                </div>
              </div>

              <div style={styles.progressSection}>
                <div style={styles.progressHeader}>
                  <span style={styles.progressLabel}>Progress</span>
                  <span style={{ color: "#1dc071", fontWeight: 700, fontSize: 14 }}>
                    {progress.toFixed(1)}%
                  </span>
                </div>
                <div style={styles.progressTrack}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    style={{
                      ...styles.progressFill,
                      background: progress >= 100
                        ? "linear-gradient(90deg, #1dc071, #15924f)"
                        : "linear-gradient(90deg, #1dc071aa, #1dc071)",
                    }}
                  />
                </div>
              </div>

              <div style={styles.statsRow}>
                <div style={styles.statBox}>
                  <span style={styles.statValue}>
                    {parseFloat(parseFloat(selected.amountCollected || "0").toFixed(4)).toString()}
                    <span style={styles.statUnit}> ETH</span>
                  </span>
                  <span style={styles.statLabel}>
                    of {parseFloat(parseFloat(selected.target || "0").toFixed(4)).toString()} ETH
                  </span>
                </div>
                <div style={styles.statDivider} />
                <div style={styles.statBox}>
                  <span style={styles.statValue}>
                    {isEnded(selected) ? (
                      <span style={{ color: "#ff6b6b", fontSize: 14, fontWeight: 700 }}>—</span>
                    ) : (
                      <>{daysLeft(selected.deadline)}<span style={styles.statUnit}> days</span></>
                    )}
                  </span>
                  <span style={styles.statLabel}>Days Left</span>
                </div>
                <div style={styles.statDivider} />
                <div style={styles.statBox}>
                  <span style={styles.statValue}>
                    {isEnded(selected)
                      ? <span style={{ color: "#ff6b6b", fontSize: 14, fontWeight: 700 }}>Ended</span>
                      : <span style={{ color: "#1dc071", fontSize: 14, fontWeight: 700 }}>Live</span>
                    }
                  </span>
                  <span style={styles.statLabel}>Status</span>
                </div>
              </div>

              {/* ✅ Donation badge: only show AFTER check is complete AND amount > 0 */}
              {!isDonationChecking && hasDonated && parseFloat(myDonationAmount) > 0 && (
                <div style={styles.donatedBadge}>
                  💎 You donated{" "}
                  <strong>
                    {parseFloat(parseFloat(myDonationAmount).toFixed(4)).toString()} ETH
                  </strong>{" "}
                  to this campaign
                </div>
              )}

              {/* ✅ Show subtle checking state while loading */}
              {isDonationChecking && (
                <div style={styles.checkingBadge}>
                  <span style={styles.spinnerGray} /> Checking donation status...
                </div>
              )}

              <div style={styles.actions}>
                {isWithdrawable(selected) && (
                  <motion.button
                    onClick={handleWithdraw}
                    disabled={isWithdrawing}
                    whileHover={{ scale: isWithdrawing ? 1 : 1.03 }}
                    whileTap={{ scale: isWithdrawing ? 1 : 0.97 }}
                    style={{ ...styles.withdrawBtn, opacity: isWithdrawing ? 0.75 : 1, cursor: isWithdrawing ? "not-allowed" : "pointer" }}
                  >
                    {isWithdrawing
                      ? <><span style={styles.spinner} /> Processing...</>
                      : <>⬆ Withdraw Funds</>
                    }
                  </motion.button>
                )}

                {/* ✅ isRefundable already guards isDonationChecking — no flash possible */}
                {isRefundable(selected) && (
                  <motion.button
                    onClick={handleRefund}
                    disabled={isRefunding}
                    whileHover={{ scale: isRefunding ? 1 : 1.03 }}
                    whileTap={{ scale: isRefunding ? 1 : 0.97 }}
                    style={{ ...styles.refundBtn, opacity: isRefunding ? 0.75 : 1, cursor: isRefunding ? "not-allowed" : "pointer" }}
                  >
                    {isRefunding
                      ? <><span style={styles.spinnerLight} /> Processing...</>
                      : <>↩ Claim Refund ({parseFloat(parseFloat(myDonationAmount).toFixed(4)).toString()} ETH)</>
                    }
                  </motion.button>
                )}

                {selected.withdrawn && (
                  <div style={styles.completedMsg}>
                    {isSuccess(selected)
                      ? "✅ Funds have been successfully withdrawn"
                      : "✅ Refund has been processed for all donors"}
                  </div>
                )}

                {/* ✅ No-action msg only after check completes and nothing else shows */}
                {!isDonationChecking && !isWithdrawable(selected) && !isRefundable(selected) && !selected.withdrawn && (
                  <div style={styles.noActionMsg}>
                    {getNoActionReason(selected)}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─── Styles ─── */
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#13131a",
    fontFamily: "'Epilogue', 'DM Sans', 'Segoe UI', sans-serif",
    color: "#e2e8f0",
  },
  container: { maxWidth: 860, margin: "0 auto", padding: "40px 24px" },
  centered: {
    display: "flex", alignItems: "center", justifyContent: "center",
    minHeight: "100vh", background: "#13131a",
  },
  connectCard: {
    background: "#1c1c24", border: "1px solid #2c2c3a",
    borderRadius: 16, padding: "48px 64px", textAlign: "center",
  },
  connectIcon: { fontSize: 48, marginBottom: 16 },
  connectText: { color: "#808191", fontSize: 16, margin: 0, fontFamily: "'Epilogue', sans-serif" },
  toast: {
    position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)",
    zIndex: 9999, padding: "12px 24px", borderRadius: 10, color: "#fff",
    fontWeight: 600, fontSize: 14, whiteSpace: "nowrap",
    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
  },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    marginBottom: 36, gap: 16, flexWrap: "wrap" as const,
  },
  backBtn: {
    background: "#1c1c24", border: "1px solid #2c2c3a", color: "#808191",
    padding: "10px 18px", borderRadius: 10, cursor: "pointer", fontSize: 14,
    display: "flex", alignItems: "center", gap: 6,
    fontFamily: "'Epilogue', sans-serif", fontWeight: 500, transition: "all 0.2s",
  },
  title: {
    fontSize: 26, fontWeight: 800, margin: "0 0 4px", color: "#ffffff",
    letterSpacing: "-0.01em", fontFamily: "'Epilogue', sans-serif",
  },
  subtitle: { margin: 0, color: "#808191", fontSize: 13, fontFamily: "'Epilogue', sans-serif" },
  walletBadge: {
    background: "#1c1c24", border: "1px solid #2c2c3a", padding: "8px 16px",
    borderRadius: 100, fontSize: 13, color: "#b2b3bd",
    display: "flex", alignItems: "center", gap: 8, fontWeight: 500,
  },
  walletDot: {
    width: 8, height: 8, borderRadius: "50%",
    background: "#1dc071", boxShadow: "0 0 6px #1dc071",
  },
  tabsWrapper: { marginBottom: 28 },
  tabsLabel: {
    fontSize: 11, fontWeight: 700, color: "#4b4b5a", letterSpacing: "0.12em",
    marginBottom: 12, textTransform: "uppercase" as const, fontFamily: "'Epilogue', sans-serif",
  },
  tabs: { display: "flex", gap: 10, flexWrap: "wrap" as const },
  tab: {
    background: "#1c1c24", border: "1px solid #2c2c3a", borderRadius: 10,
    padding: "10px 16px", cursor: "pointer", fontFamily: "'Epilogue', sans-serif",
    display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s", color: "#808191",
  },
  tabActive: { background: "#2c2c3a", border: "1px solid #3a3a4a", color: "#e2e8f0" },
  tabDot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  tabTitle: {
    fontSize: 13, fontWeight: 600, maxWidth: 140,
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const,
  },
  tabStatus: { fontSize: 11, fontWeight: 700, letterSpacing: "0.04em" },
  card: {
    background: "#1c1c24", border: "1px solid #2c2c3a",
    borderRadius: 16, padding: 28, position: "relative", overflow: "hidden",
  },
  cardTop: { display: "flex", gap: 20, marginBottom: 24, alignItems: "flex-start" },
  imgWrapper: {
    flexShrink: 0, width: 110, height: 110, borderRadius: 12,
    overflow: "hidden", border: "1px solid #2c2c3a", position: "relative" as const,
  },
  endedOverlay: {
    position: "absolute" as const, inset: 0, background: "rgba(19,19,26,0.72)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 11, fontWeight: 700, color: "#b2b3bd", letterSpacing: "0.06em",
    textTransform: "uppercase" as const, fontFamily: "'Epilogue', sans-serif",
  },
  img: { width: "100%", height: "100%", objectFit: "cover" as const },
  cardInfo: { flex: 1 },
  categoryTag: {
    display: "inline-block", fontSize: 11, fontWeight: 700, color: "#808191",
    background: "#2c2c3a", padding: "3px 10px", borderRadius: 6, marginBottom: 8,
    letterSpacing: "0.06em", textTransform: "uppercase" as const, fontFamily: "'Epilogue', sans-serif",
  },
  cardTitle: {
    fontSize: 20, fontWeight: 800, margin: "0 0 6px", color: "#ffffff",
    fontFamily: "'Epilogue', sans-serif", letterSpacing: "-0.01em",
  },
  cardDesc: {
    color: "#808191", fontSize: 13, lineHeight: 1.65, margin: "0 0 14px",
    display: "-webkit-box", WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical" as const, overflow: "hidden",
    fontFamily: "'Epilogue', sans-serif",
  },
  statusRow: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const },
  statusPill: {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "4px 12px", borderRadius: 100, fontSize: 12,
    fontWeight: 700, fontFamily: "'Epilogue', sans-serif",
  },
  statusPillDot: { width: 7, height: 7, borderRadius: "50%" },
  flagBadge: {
    fontSize: 11, color: "#f6a623", background: "rgba(246,166,35,0.12)",
    padding: "3px 10px", borderRadius: 6, fontWeight: 600, fontFamily: "'Epilogue', sans-serif",
  },
  withdrawnBadge: {
    fontSize: 11, color: "#1dc071", background: "rgba(29,192,113,0.12)",
    padding: "3px 10px", borderRadius: 6, fontWeight: 600, fontFamily: "'Epilogue', sans-serif",
  },
  refundedBadge: {
    fontSize: 11, color: "#63b3ed", background: "rgba(99,179,237,0.12)",
    padding: "3px 10px", borderRadius: 6, fontWeight: 600, fontFamily: "'Epilogue', sans-serif",
  },
  progressSection: { marginBottom: 20 },
  progressHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  progressLabel: { fontSize: 13, color: "#808191", fontWeight: 500, fontFamily: "'Epilogue', sans-serif" },
  progressTrack: { height: 8, background: "#2c2c3a", borderRadius: 100, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 100 },
  statsRow: {
    display: "flex", background: "#13131a", borderRadius: 12,
    border: "1px solid #2c2c3a", overflow: "hidden", marginBottom: 20,
  },
  statBox: {
    flex: 1, padding: "16px 20px",
    display: "flex", flexDirection: "column" as const, gap: 2,
  },
  statDivider: { width: 1, background: "#2c2c3a" },
  statLabel: { fontSize: 12, color: "#4b4b5a", fontWeight: 500, fontFamily: "'Epilogue', sans-serif" },
  statValue: {
    fontSize: 18, fontWeight: 700, color: "#e2e8f0",
    letterSpacing: "-0.01em", fontFamily: "'Epilogue', sans-serif",
  },
  statUnit: { fontSize: 12, color: "#4b4b5a", fontWeight: 500 },
  donatedBadge: {
    background: "rgba(29,192,113,0.08)", border: "1px solid rgba(29,192,113,0.2)",
    borderRadius: 10, padding: "10px 16px", fontSize: 13, color: "#1dc071",
    marginBottom: 20, fontWeight: 600, fontFamily: "'Epilogue', sans-serif",
  },
  checkingBadge: {
    background: "#13131a", border: "1px solid #2c2c3a",
    borderRadius: 10, padding: "10px 16px", fontSize: 13, color: "#4b4b5a",
    marginBottom: 20, fontWeight: 500, fontFamily: "'Epilogue', sans-serif",
    display: "flex", alignItems: "center", gap: 8,
  },
  actions: { display: "flex", gap: 12, flexWrap: "wrap" as const },
  withdrawBtn: {
    background: "#1dc071", border: "none", color: "#ffffff",
    padding: "14px 28px", borderRadius: 10, fontFamily: "'Epilogue', sans-serif",
    fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center",
    gap: 8, transition: "all 0.2s", letterSpacing: "0.01em",
  },
  refundBtn: {
    background: "transparent", border: "1px solid #ff6b6b", color: "#ff6b6b",
    padding: "14px 28px", borderRadius: 10, fontFamily: "'Epilogue', sans-serif",
    fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center",
    gap: 8, transition: "all 0.2s", letterSpacing: "0.01em",
  },
  spinner: {
    display: "inline-block", width: 14, height: 14,
    border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff",
    borderRadius: "50%", animation: "spin 0.7s linear infinite",
  },
  spinnerLight: {
    display: "inline-block", width: 14, height: 14,
    border: "2px solid rgba(255,107,107,0.3)", borderTop: "2px solid #ff6b6b",
    borderRadius: "50%", animation: "spin 0.7s linear infinite",
  },
  spinnerGray: {
    display: "inline-block", width: 12, height: 12,
    border: "2px solid rgba(128,129,145,0.3)", borderTop: "2px solid #808191",
    borderRadius: "50%", animation: "spin 0.7s linear infinite",
  },
  completedMsg: {
    color: "#1dc071", fontSize: 13, padding: "14px 20px",
    background: "rgba(29,192,113,0.07)", border: "1px solid rgba(29,192,113,0.2)",
    borderRadius: 10, fontFamily: "'Epilogue', sans-serif", fontWeight: 600,
  },
  noActionMsg: {
    color: "#808191", fontSize: 13, padding: "14px 20px",
    background: "#13131a", border: "1px solid #2c2c3a",
    borderRadius: 10, fontFamily: "'Epilogue', sans-serif",
  },
};