(function () {
  const CFG = () => window.LEONIDA || {};
  const USDT = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F";
  const POLYGON = {
    chainId: "0x89",
    chainName: "Polygon",
    nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
    rpcUrls: ["https://polygon-bor-rpc.publicnode.com"],
    blockExplorerUrls: ["https://polygonscan.com"]
  };

  function eth() {
    if (typeof window.ethereum === "undefined") return null;
    if (window.ethereum.providers && window.ethereum.providers.length) {
      return window.ethereum.providers.find((p) => p.isMetaMask) || window.ethereum.providers[0];
    }
    return window.ethereum;
  }
  function phantom() {
    return (window.solana && window.solana.isPhantom) ? window.solana : window.phantom?.solana || null;
  }
  function pad32(hex) {
    return hex.replace(/^0x/, "").toLowerCase().padStart(64, "0");
  }
  function encodeTransfer(to, amount) {
    return "0xa9059cbb" + pad32(to) + BigInt(amount).toString(16).padStart(64, "0");
  }
  function encodeBalanceOf(account) {
    return "0x70a08231" + pad32(account);
  }
  function toast(msg) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    setTimeout(() => el.classList.remove("show"), 2600);
  }
  function shortAddr(a) {
    if (!a) return "";
    return a.slice(0, 6) + "…" + a.slice(-4);
  }
  function lockerKey(owner) {
    return "leonida-locker-" + owner.toLowerCase();
  }
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
      mintedAt: new Date().toISOString()
    };
    const rows = loadLocker(owner);
    rows.unshift(token);
    saveLocker(owner, rows);
    return token;
  }

  const state = { kind: null, address: null };

  function setConnected() {
    document.querySelectorAll("[data-connect]").forEach((b) => {
      b.textContent = state.address ? shortAddr(state.address) : "Connect wallet";
    });
    const chip = document.getElementById("walletChip");
    if (chip) {
      chip.hidden = !state.address;
      chip.textContent = state.kind === "sol" ? "Phantom · " + shortAddr(state.address) : "MetaMask · " + shortAddr(state.address);
    }
    window.dispatchEvent(new CustomEvent("leonida:wallet", { detail: state }));
  }

  async function connectMetaMask() {
    const e = eth();
    if (!e) {
      toast("Install MetaMask, then return.");
      window.open("https://metamask.io/download/", "_blank", "noopener");
      return;
    }
    const acc = await e.request({ method: "eth_requestAccounts" });
    state.kind = "evm";
    state.address = acc[0];
    setConnected();
    toast("MetaMask connected");
  }
  async function connectPhantom() {
    const p = phantom();
    if (!p) {
      toast("Install Phantom, then return.");
      window.open("https://phantom.app/", "_blank", "noopener");
      return;
    }
    const res = await p.connect();
    state.kind = "sol";
    state.address = (res.publicKey || p.publicKey).toString();
    setConnected();
    toast("Phantom connected");
  }

  async function ensurePolygon(e) {
    const id = await e.request({ method: "eth_chainId" });
    if (id === "0x89") return;
    try {
      await e.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x89" }] });
    } catch (err) {
      if (err && err.code === 4902) {
        await e.request({ method: "wallet_addEthereumChain", params: [POLYGON] });
        return;
      }
      throw err;
    }
  }

  async function polUsd() {
    if (window._polUsd) return window._polUsd;
    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=polygon-ecosystem-token,solana&vs_currencies=usd");
    const j = await res.json();
    window._polUsd = (j["polygon-ecosystem-token"] && j["polygon-ecosystem-token"].usd) || 0.2;
    window._solUsd = (j.solana && j.solana.usd) || 150;
    return window._polUsd;
  }
  async function solUsd() {
    if (window._solUsd) return window._solUsd;
    await polUsd();
    return window._solUsd;
  }

  async function payEvm(usd) {
    const e = eth();
    if (!e) throw new Error("Connect MetaMask first");
    if (!state.address) await connectMetaMask();
    await ensurePolygon(e);
    const to = CFG().evm;
    const units = BigInt(Math.round(usd * 1e6));
    const balHex = await e.request({
      method: "eth_call",
      params: [{ to: USDT, data: encodeBalanceOf(state.address) }, "latest"]
    });
    const bal = BigInt(balHex || "0x0");
    if (bal >= units) {
      const hash = await e.request({
        method: "eth_sendTransaction",
        params: [{ from: state.address, to: USDT, data: encodeTransfer(to, units), value: "0x0" }]
      });
      return { chain: "polygon", tx: hash, label: usd + " USDT" };
    }
    const price = await polUsd();
    const wei = BigInt(Math.floor((usd / price) * 1e18));
    const hash = await e.request({
      method: "eth_sendTransaction",
      params: [{ from: state.address, to, value: "0x" + wei.toString(16) }]
    });
    return { chain: "polygon", tx: hash, label: usd + " USD in POL" };
  }

  async function paySol(usd) {
    const p = phantom();
    if (!p) throw new Error("Connect Phantom first");
    if (!state.address) await connectPhantom();
    if (!window.solanaWeb3) throw new Error("Solana library still loading");
    const price = await solUsd();
    const lamports = Math.floor((usd / price) * 1e9);
    if (lamports <= 0) throw new Error("Amount too small");
    const { Connection, PublicKey, SystemProgram, Transaction } = window.solanaWeb3;
    const conn = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
    const from = new PublicKey(state.address);
    const to = new PublicKey(CFG().solana);
    const tx = new Transaction().add(SystemProgram.transfer({ fromPubkey: from, toPubkey: to, lamports }));
    tx.feePayer = from;
    tx.recentBlockhash = (await conn.getLatestBlockhash()).blockhash;
    const signed = await p.signAndSendTransaction(tx);
    return { chain: "solana", tx: signed.signature, label: usd + " USD in SOL" };
  }

  async function buyItem(item, prefer) {
    if (!item) throw new Error("Unknown item");
    const kind = prefer || state.kind || "evm";
    const paid = kind === "sol" ? await paySol(item.usd) : await payEvm(item.usd);
    const token = mintToLocker(state.address, item, paid);
    toast("Minted to your locker · " + item.name);
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
    const kind = prefer || state.kind || "evm";
    const paid = kind === "sol" ? await paySol(crate.usd) : await payEvm(crate.usd);
    const item = rollCrate(crate);
    const token = mintToLocker(state.address, item, { ...paid, fromCrate: crate.id });
    toast("Drop opened · " + item.name);
    return { token, item, paid };
  }

  function openChooser(cb) {
    const m = document.getElementById("payModal");
    if (!m) {
      cb(state.kind || "evm");
      return;
    }
    m.hidden = false;
    const go = (kind) => {
      m.hidden = true;
      cb(kind);
    };
    document.getElementById("payEvm").onclick = () => go("evm");
    document.getElementById("paySol").onclick = () => go("sol");
    document.getElementById("payCancel").onclick = () => { m.hidden = true; };
  }

  window.LeonidaWallet = {
    state, toast, shortAddr, loadLocker, mintToLocker,
    connectMetaMask, connectPhantom, buyItem, buyCrate, rollCrate, openChooser
  };

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-connect]").forEach((b) => {
      b.addEventListener("click", async () => {
        try {
          if (phantom() && !eth()) await connectPhantom();
          else if (eth() && !phantom()) await connectMetaMask();
          else openChooser(async (k) => {
            if (k === "sol") await connectPhantom();
            else await connectMetaMask();
          });
        } catch (err) {
          toast(err.message || "Wallet closed");
        }
      });
    });
    document.getElementById("connectEvm")?.addEventListener("click", () => connectMetaMask().catch((e) => toast(e.message)));
    document.getElementById("connectSol")?.addEventListener("click", () => connectPhantom().catch((e) => toast(e.message)));
  });
})();
