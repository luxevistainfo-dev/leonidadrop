(function () {
  const CFG = () => window.LEONIDA || {};
  const TOKENS = {
    USDT: { address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", decimals: 6, symbol: "USDT" },
    USDC: { address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", decimals: 6, symbol: "USDC" },
    USDCe: { address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", decimals: 6, symbol: "USDC.e" }
  };
  const POLYGON = {
    chainId: "0x89",
    chainName: "Polygon",
    nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
    rpcUrls: ["https://polygon-bor-rpc.publicnode.com", "https://polygon-rpc.com"],
    blockExplorerUrls: ["https://polygonscan.com"]
  };
  const SESSION = "leonida-session";
  const announced = new Map();

  window.addEventListener("eip6963:announceProvider", (e) => {
    const d = e.detail;
    if (d && d.info && d.provider) announced.set(d.info.rdns || d.info.uuid, d);
  });
  try { window.dispatchEvent(new Event("eip6963:requestProvider")); } catch (e) {}

  function dappUrl() {
    return location.origin + location.pathname + location.search + location.hash;
  }
  function isMobile() {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "");
  }
  function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
  function pad32(hex) { return String(hex).replace(/^0x/, "").toLowerCase().padStart(64, "0"); }
  function encodeTransfer(to, amount) {
    return "0xa9059cbb" + pad32(to) + BigInt(amount).toString(16).padStart(64, "0");
  }
  function encodeBalanceOf(account) { return "0x70a08231" + pad32(account); }
  function toast(msg) {
    const el = document.getElementById("toast");
    if (!el) { return; }
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("show"), 3200);
  }
  function shortAddr(a) {
    if (!a) return "";
    return a.slice(0, 6) + "…" + a.slice(-4);
  }
  function friendlyErr(err) {
    const code = err && err.code;
    const msg = String((err && (err.message || err.reason || err.error)) || err || "");
    if (code === 4001 || /rejected|denied|user cancel|user rejected/i.test(msg)) return "You closed the wallet. Nothing was sent.";
    if (/insufficient funds|insufficient balance|exceeds balance/i.test(msg)) return "Not enough funds for the price plus gas.";
    if (/already pending|tx in progress/i.test(msg)) return "A transaction is already waiting in the wallet.";
    if (/solana library|solanaWeb3/i.test(msg)) return "Solana is still loading. Wait a second, then try again.";
    if (!msg || msg === "undefined") return "Wallet error. Nothing was sent.";
    return msg.length > 160 ? "Wallet error. Nothing was sent." : msg;
  }
  function lockerKey(owner) { return "leonida-locker-" + String(owner).toLowerCase(); }
  function loadLocker(owner) {
    if (!owner) return [];
    try { return JSON.parse(localStorage.getItem(lockerKey(owner)) || "[]"); } catch { return []; }
  }
  function saveLocker(owner, rows) {
    localStorage.setItem(lockerKey(owner), JSON.stringify(rows));
  }
  function mintToLocker(owner, item, meta) {
    const token = {
      tokenId: "LD-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8),
      itemId: item.id,
      name: item.name,
      rarity: item.rarity,
      image: item.img,
      usd: item.usd,
      owner,
      chain: meta.chain,
      tx: meta.tx,
      label: meta.label || "",
      mintedAt: new Date().toISOString()
    };
    const rows = loadLocker(owner);
    rows.unshift(token);
    saveLocker(owner, rows);
    return token;
  }

  const state = { kind: null, address: null, id: null, name: null };

  function persist() {
    if (!state.address) localStorage.removeItem(SESSION);
    else localStorage.setItem(SESSION, JSON.stringify({ kind: state.kind, address: state.address, id: state.id, name: state.name }));
  }
  function setConnected() {
    persist();
    document.querySelectorAll("[data-connect]").forEach((b) => {
      b.textContent = state.address ? shortAddr(state.address) : "Connect wallet";
    });
    const chip = document.getElementById("walletChip");
    if (chip) {
      chip.hidden = !state.address;
      chip.textContent = (state.name || (state.kind === "sol" ? "Solana" : "EVM")) + " · " + shortAddr(state.address);
    }
    const bar = document.getElementById("mobileWalletBar");
    if (bar) bar.classList.toggle("in", !state.address && isMobile());
    window.dispatchEvent(new CustomEvent("leonida:wallet", { detail: { ...state } }));
  }

  function fallbackEth() {
    if (typeof window.ethereum === "undefined") return null;
    if (window.ethereum.providers && window.ethereum.providers.length) {
      return window.ethereum.providers.find((p) => p.isMetaMask)
        || window.ethereum.providers.find((p) => p.isCoinbaseWallet)
        || window.ethereum.providers[0];
    }
    return window.ethereum;
  }
  function providerById(id) {
    const map = {
      metamask: ["io.metamask", "io.metamask.mobile"],
      coinbase: ["com.coinbase.wallet"],
      trust: ["com.trustwallet.app"],
      rainbow: ["me.rainbow"],
      okx: ["com.okex.wallet"],
      brave: ["com.brave.wallet"]
    };
    const rdns = map[id] || [];
    for (const r of rdns) {
      const hit = announced.get(r);
      if (hit) return hit.provider;
    }
    const e = fallbackEth();
    if (!e) return null;
    if (id === "metamask" && (e.isMetaMask || window.ethereum?.providers?.some((p) => p.isMetaMask))) {
      return (window.ethereum.providers || []).find((p) => p.isMetaMask) || e;
    }
    if (id === "coinbase" && (e.isCoinbaseWallet || window.coinbaseWalletExtension)) {
      return window.coinbaseWalletExtension || (window.ethereum.providers || []).find((p) => p.isCoinbaseWallet) || e;
    }
    if (id === "trust" && (e.isTrust || window.trustwallet)) return window.trustwallet || e;
    if (id === "okx" && window.okxwallet) return window.okxwallet;
    if (id === "rainbow" && e.isRainbow) return e;
    if (id === "injected") return e;
    return null;
  }
  function phantom() {
    if (window.solana && window.solana.isPhantom) return window.solana;
    if (window.phantom && window.phantom.solana) return window.phantom.solana;
    return null;
  }
  function solflare() {
    return window.solflare || (window.solana && window.solana.isSolflare ? window.solana : null);
  }

  const WALLETS = [
    { id: "metamask", name: "MetaMask", kind: "evm", deep: () => "https://metamask.app.link/dapp/" + location.host + location.pathname + location.search + location.hash, install: "https://metamask.io/download/" },
    { id: "coinbase", name: "Coinbase Wallet", kind: "evm", deep: () => "https://go.cb-w.com/dapp?cb_url=" + encodeURIComponent(dappUrl()), install: "https://www.coinbase.com/wallet" },
    { id: "trust", name: "Trust Wallet", kind: "evm", deep: () => "https://link.trustwallet.com/open_url?coin_id=60&url=" + encodeURIComponent(dappUrl()), install: "https://trustwallet.com/" },
    { id: "rainbow", name: "Rainbow", kind: "evm", deep: () => "https://rainbow.me/dapp?uri=" + encodeURIComponent(dappUrl()), install: "https://rainbow.me/" },
    { id: "okx", name: "OKX Wallet", kind: "evm", deep: () => "https://www.okx.com/download?deeplink=" + encodeURIComponent("okx://wallet/dapp/url?dappUrl=" + encodeURIComponent(dappUrl())), install: "https://www.okx.com/web3" },
    { id: "phantom", name: "Phantom", kind: "sol", deep: () => "https://phantom.app/ul/browse/" + encodeURIComponent(dappUrl()) + "?ref=" + encodeURIComponent(location.origin), install: "https://phantom.app/" },
    { id: "solflare", name: "Solflare", kind: "sol", deep: () => "https://solflare.com/ul/v1/browse/" + encodeURIComponent(dappUrl()) + "?ref=" + encodeURIComponent(location.origin), install: "https://solflare.com/" }
  ];

  function ensureModal() {
    if (document.getElementById("walletModal")) return;
    const m = document.createElement("div");
    m.id = "walletModal";
    m.className = "modal";
    m.hidden = true;
    m.innerHTML = `<div class="sheet wallet-sheet" role="dialog" aria-labelledby="walletTitle">
      <h3 id="walletTitle">Connect wallet</h3>
      <p class="lede" id="walletHint">Use a browser wallet, or open this page inside the mobile app.</p>
      <div id="walletList" class="wallet-list"></div>
      <button class="btn btn-ghost" type="button" id="walletCancel">Cancel</button>
    </div>`;
    document.body.appendChild(m);
    m.addEventListener("click", (e) => { if (e.target === m) closeModal(true); });
    document.getElementById("walletCancel").addEventListener("click", () => closeModal(true));
  }
  let cancelWait = null;
  function closeModal(cancelled) {
    const m = document.getElementById("walletModal");
    if (m) m.hidden = true;
    if (cancelled && cancelWait) {
      const fn = cancelWait;
      cancelWait = null;
      fn();
    }
  }
  function openChooser(title, hint, onPick) {
    ensureModal();
    document.getElementById("walletTitle").textContent = title || "Connect wallet";
    document.getElementById("walletHint").textContent = hint || "Browser wallets, or open in the mobile app.";
    const list = document.getElementById("walletList");
    list.innerHTML = WALLETS.map((w) => {
      const ready = w.kind === "evm" ? !!providerById(w.id) : !!(w.id === "phantom" ? phantom() : solflare());
      const tag = ready ? "Detected" : (isMobile() ? "Open app" : "Install");
      return `<button type="button" class="wallet-row" data-wid="${w.id}">
        <span>${w.name}</span><em>${tag}</em>
      </button>`;
    }).join("");
    list.querySelectorAll("[data-wid]").forEach((b) => {
      b.addEventListener("click", async () => {
        closeModal();
        try { await onPick(b.dataset.wid); }
        catch (err) { toast(friendlyErr(err)); }
      });
    });
    document.getElementById("walletModal").hidden = false;
  }

  async function connectEvm(id) {
    const e = providerById(id) || (id === "injected" ? fallbackEth() : null);
    if (!e) {
      const w = WALLETS.find((x) => x.id === id);
      if (isMobile() && w) { location.href = w.deep(); return; }
      toast((w ? w.name : "Wallet") + " not found. Install it, then refresh.");
      if (w) window.open(w.install, "_blank", "noopener");
      return;
    }
    const acc = await e.request({ method: "eth_requestAccounts" });
    if (!acc || !acc[0]) throw new Error("No account selected");
    state.kind = "evm";
    state.address = acc[0];
    state.id = id;
    state.name = (WALLETS.find((x) => x.id === id) || {}).name || "Wallet";
    state.provider = e;
    e.removeAllListeners?.("accountsChanged");
    e.on?.("accountsChanged", (a) => {
      state.address = (a && a[0]) || null;
      if (!state.address) { state.kind = null; state.id = null; }
      setConnected();
    });
    setConnected();
    toast(state.name + " connected");
  }
  async function connectSol(id) {
    const p = id === "solflare" ? solflare() : phantom();
    const w = WALLETS.find((x) => x.id === id);
    if (!p) {
      if (isMobile() && w) { location.href = w.deep(); return; }
      toast((w ? w.name : "Wallet") + " not found. Install it, then refresh.");
      if (w) window.open(w.install, "_blank", "noopener");
      return;
    }
    const res = await p.connect();
    const pk = (res && res.publicKey) || p.publicKey;
    if (!pk) throw new Error("No account selected");
    state.kind = "sol";
    state.address = pk.toString();
    state.id = id;
    state.name = w.name;
    state.provider = p;
    setConnected();
    toast(w.name + " connected");
  }
  async function connectById(id) {
    const w = WALLETS.find((x) => x.id === id);
    if (!w) throw new Error("Unknown wallet");
    if (w.kind === "sol") return connectSol(id);
    return connectEvm(id);
  }

  async function restore() {
    let s;
    try { s = JSON.parse(localStorage.getItem(SESSION) || "null"); } catch { s = null; }
    if (!s || !s.kind) return;
    try {
      if (s.kind === "evm") {
        const e = (s.id && providerById(s.id)) || fallbackEth();
        if (!e) return;
        const acc = await e.request({ method: "eth_accounts" });
        if (acc && acc[0]) {
          state.kind = "evm";
          state.address = acc[0];
          state.id = s.id || "injected";
          state.name = s.name || "Wallet";
          state.provider = e;
          setConnected();
        }
      } else if (s.kind === "sol") {
        const p = s.id === "solflare" ? solflare() : phantom();
        if (!p) return;
        let pk = p.publicKey;
        if (!pk && p.connect) {
          try {
            const res = await p.connect({ onlyIfTrusted: true });
            pk = (res && res.publicKey) || p.publicKey;
          } catch (e) {}
        }
        if (pk) {
          state.kind = "sol";
          state.address = pk.toString();
          state.id = s.id || "phantom";
          state.name = s.name || "Phantom";
          state.provider = p;
          setConnected();
        }
      }
    } catch (e) {}
  }

  async function ensurePolygon(e) {
    const id = await e.request({ method: "eth_chainId" });
    if (id === "0x89") return;
    try {
      await e.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x89" }] });
    } catch (err) {
      if (err && (err.code === 4902 || /unrecognized chain/i.test(String(err.message || "")))) {
        await e.request({ method: "wallet_addEthereumChain", params: [POLYGON] });
        return;
      }
      throw err;
    }
  }
  async function prices() {
    if (window._ldPrices) return window._ldPrices;
    try {
      const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=polygon-ecosystem-token,solana&vs_currencies=usd");
      const j = await res.json();
      window._ldPrices = {
        pol: (j["polygon-ecosystem-token"] && j["polygon-ecosystem-token"].usd) || 0.2,
        sol: (j.solana && j.solana.usd) || 150
      };
    } catch {
      window._ldPrices = { pol: 0.2, sol: 150 };
    }
    return window._ldPrices;
  }
  async function tokenBal(e, token, account) {
    const result = await e.request({
      method: "eth_call",
      params: [{ to: token.address, data: encodeBalanceOf(account) }, "latest"]
    });
    return BigInt(result || "0x0");
  }
  async function waitEvm(e, hash) {
    for (let i = 0; i < 36; i++) {
      const rec = await e.request({ method: "eth_getTransactionReceipt", params: [hash] });
      if (rec && rec.blockNumber) {
        if (rec.status === "0x0") throw new Error("Transaction reverted. Nothing was taken.");
        return rec;
      }
      await sleep(2200);
    }
    return null;
  }

  async function payEvm(usd) {
    const e = state.provider || providerById(state.id) || fallbackEth();
    if (!e) throw new Error("Connect an EVM wallet first");
    if (!state.address) await connectEvm(state.id || "metamask");
    if (!state.address) throw new Error("Connect an EVM wallet first");
    await ensurePolygon(e);
    const to = CFG().evm;
    const units6 = BigInt(Math.round(Number(usd) * 1e6));
    for (const token of [TOKENS.USDT, TOKENS.USDC, TOKENS.USDCe]) {
      try {
        const bal = await tokenBal(e, token, state.address);
        if (bal >= units6) {
          toast("Sending " + usd + " " + token.symbol + " on Polygon…");
          const hash = await e.request({
            method: "eth_sendTransaction",
            params: [{ from: state.address, to: token.address, data: encodeTransfer(to, units6), value: "0x0" }]
          });
          toast("Broadcast. Waiting for Polygon…");
          await waitEvm(e, hash);
          return { chain: "polygon", tx: hash, label: usd + " " + token.symbol };
        }
      } catch (err) {
        if (err && err.code === 4001) throw err;
      }
    }
    const px = await prices();
    const wei = BigInt(Math.floor((Number(usd) / px.pol) * 1e18));
    if (wei <= 0n) throw new Error("Amount too small");
    toast("No USDT/USDC — sending ~$" + usd + " in POL…");
    const hash = await e.request({
      method: "eth_sendTransaction",
      params: [{ from: state.address, to, value: "0x" + wei.toString(16) }]
    });
    toast("Broadcast. Waiting for Polygon…");
    await waitEvm(e, hash);
    return { chain: "polygon", tx: hash, label: usd + " USD in POL" };
  }

  function solWeb3() {
    return window.solanaWeb3 || window.solanaWeb3js || null;
  }
  async function paySol(usd) {
    const p = state.provider || (state.id === "solflare" ? solflare() : phantom()) || phantom() || solflare();
    if (!p) throw new Error("Connect Phantom or Solflare first");
    if (!state.address) await connectSol(state.id || "phantom");
    const web3 = solWeb3();
    if (!web3) throw new Error("Solana library still loading. Wait a second, then try again.");
    const px = await prices();
    const lamports = Math.floor((Number(usd) / px.sol) * 1e9);
    if (lamports <= 0) throw new Error("Amount too small");
    const { Connection, PublicKey, SystemProgram, Transaction } = web3;
    const conn = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
    const from = new PublicKey(state.address);
    const dest = new PublicKey(CFG().solana);
    const tx = new Transaction().add(SystemProgram.transfer({ fromPubkey: from, toPubkey: dest, lamports }));
    tx.feePayer = from;
    tx.recentBlockhash = (await conn.getLatestBlockhash()).blockhash;
    toast("Sending ~$" + usd + " in SOL…");
    const signed = await p.signAndSendTransaction(tx);
    const sig = typeof signed === "string" ? signed : (signed && (signed.signature || signed));
    if (!sig) throw new Error("No Solana signature returned");
    return { chain: "solana", tx: String(sig), label: usd + " USD in SOL" };
  }

  async function ensureConnected() {
    if (state.address) return;
    await new Promise((resolve, reject) => {
      cancelWait = () => reject(new Error("You closed the wallet. Nothing was sent."));
      openChooser("Connect wallet", "Pick a wallet to log in. On phone, this opens the app.", async (id) => {
        try {
          await connectById(id);
          cancelWait = null;
          if (state.address) resolve();
          else reject(new Error("Open this page inside your wallet app, then tap Connect again."));
        } catch (err) { cancelWait = null; reject(err); }
      });
    });
  }

  async function buyItem(item, prefer) {
    if (!item) throw new Error("Unknown item");
    await ensureConnected();
    const kind = prefer || state.kind || "evm";
    const paid = kind === "sol" ? await paySol(item.usd) : await payEvm(item.usd);
    if (!paid || !paid.tx) throw new Error("Payment did not go through");
    const token = mintToLocker(state.address, item, paid);
    toast("Paid. Minted to your locker · " + item.name);
    return { token, paid };
  }
  function rollCrate(crate) {
    const total = crate.pool.reduce((s, p) => s + p[1], 0);
    let n = Math.random() * total;
    for (const [id, w] of crate.pool) {
      n -= w;
      if (n <= 0) return window.itemById(id);
    }
    return window.itemById(crate.pool[0][0]);
  }
  async function buyCrate(crate, prefer) {
    await ensureConnected();
    const kind = prefer || state.kind || "evm";
    const paid = kind === "sol" ? await paySol(crate.usd) : await payEvm(crate.usd);
    if (!paid || !paid.tx) throw new Error("Payment did not go through");
    const item = rollCrate(crate);
    if (!item) throw new Error("Drop pool is empty");
    const token = mintToLocker(state.address, item, { ...paid, fromCrate: crate.id });
    toast("Drop opened · " + item.name);
    return { token, item, paid };
  }

  window.LeonidaWallet = {
    state, toast, shortAddr, loadLocker, mintToLocker, friendlyErr,
    connectById, buyItem, buyCrate, rollCrate, openChooser, ensureConnected, WALLETS
  };

  document.addEventListener("DOMContentLoaded", async () => {
    ensureModal();
    try { window.dispatchEvent(new Event("eip6963:requestProvider")); } catch (e) {}
    await restore();
    document.querySelectorAll("[data-connect]").forEach((b) => {
      b.addEventListener("click", () => {
        if (state.address) {
          toast("Connected as " + shortAddr(state.address) + " · tap again to switch");
        }
        openChooser("Connect wallet", "MetaMask, Coinbase, Trust, Rainbow, OKX, Phantom, Solflare.", (id) => connectById(id));
      });
    });
    document.getElementById("connectEvm")?.addEventListener("click", () => {
      openChooser("EVM wallet", "Polygon payments.", (id) => connectById(id));
    });
    document.getElementById("connectSol")?.addEventListener("click", () => connectSol("phantom").catch((e) => toast(friendlyErr(e))));
    if (isMobile() && !state.address) {
      let bar = document.getElementById("mobileWalletBar");
      if (!bar) {
        bar = document.createElement("div");
        bar.id = "mobileWalletBar";
        bar.className = "mobile-bar";
        bar.innerHTML = `<button type="button" class="btn btn-pink" data-connect>Connect wallet</button>
          <a class="btn btn-gold" href="shop.html">Shop</a>`;
        document.body.appendChild(bar);
        bar.querySelector("[data-connect]").addEventListener("click", () => {
          openChooser("Connect wallet", "On phone, pick your app — it opens this page inside the wallet.", (id) => connectById(id));
        });
      }
      bar.classList.add("in");
    }
  });
})();
