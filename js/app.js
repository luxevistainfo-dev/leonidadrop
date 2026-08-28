(function () {
  function $(s, r) { return (r || document).querySelector(s); }
  function $$ (s, r) { return [...(r || document).querySelectorAll(s)]; }

  function tickCountdown() {
    const el = $("#countdown");
    if (!el) return;
    const end = new Date((window.LEONIDA && window.LEONIDA.release) || "2026-11-19T00:00:00-05:00").getTime();
    const t = Math.max(0, end - Date.now());
    const d = Math.floor(t / 86400000);
    const h = Math.floor((t % 86400000) / 3600000);
    const m = Math.floor((t % 3600000) / 60000);
    const s = Math.floor((t % 60000) / 1000);
    el.innerHTML = ["Days", "Hrs", "Min", "Sec"].map((lab, i) => {
      const n = [d, h, m, s][i];
      return `<span><b>${String(n).padStart(2, "0")}</b>${lab}</span>`;
    }).join("");
  }

  function rarityClass(r) { return "r-" + r; }

  function cardHTML(item) {
    return `<article class="card ${rarityClass(item.rarity)}" data-id="${item.id}">
      <div class="card-media"><img src="${item.img}" alt="${item.name}"></div>
      <div class="card-body">
        <p class="rarity">${item.rarity}</p>
        <h3>${item.name}</h3>
        <p>${item.blurb}</p>
        <div class="card-row">
          <strong>$${item.usd}</strong>
          <button class="btn btn-pink" type="button" data-buy="${item.id}">Buy & mint</button>
        </div>
      </div>
    </article>`;
  }

  async function handleBuy(id) {
    const item = window.itemById(id);
    const W = window.LeonidaWallet;
    if (!W.state.address) {
      W.toast("Connect a wallet first");
      document.querySelector("[data-connect]")?.click();
      return;
    }
    W.openChooser(async (kind) => {
      const btn = document.querySelector(`[data-buy="${id}"]`);
      if (btn) { btn.disabled = true; btn.textContent = "Confirm in wallet…"; }
      try {
        const res = await W.buyItem(item, kind);
        if (btn) btn.textContent = "Minted";
        window.location.href = "locker.html?got=" + encodeURIComponent(res.token.tokenId);
      } catch (err) {
        W.toast((err && err.message) || "Cancelled");
        if (btn) { btn.disabled = false; btn.textContent = "Buy & mint"; }
      }
    });
  }

  function filterShop() {
    const q = ($("#q") && $("#q").value || "").toLowerCase();
    const cat = ($("#cat") && $("#cat").value) || "all";
    const grid = $("#shopGrid");
    if (!grid) return;
    const rows = window.ITEMS.filter((it) => {
      const okCat = cat === "all" || it.cat === cat || (cat === "cheap" && it.usd < 20) || (cat === "high" && it.usd >= 80);
      const okQ = !q || it.name.toLowerCase().includes(q) || it.blurb.toLowerCase().includes(q);
      return okCat && okQ;
    });
    grid.innerHTML = rows.map(cardHTML).join("") || "<p class='empty'>Nothing in this lane.</p>";
  }

  function renderShop() {
    const grid = $("#shopGrid");
    if (!grid || !window.ITEMS) return;
    filterShop();
    grid.addEventListener("click", (e) => {
      const b = e.target.closest("[data-buy]");
      if (b) handleBuy(b.dataset.buy);
    });
    $("#q")?.addEventListener("input", filterShop);
    $("#cat")?.addEventListener("change", filterShop);
  }

  function renderDrops() {
    const grid = $("#dropGrid");
    if (!grid || !window.CRATES) return;
    grid.innerHTML = window.CRATES.map((c) => {
      const names = c.pool.map((p) => window.itemById(p[0])?.name).filter(Boolean).join(" · ");
      return `<article class="card crate-card">
        <div class="card-media"><img src="${c.img}" alt="${c.name}"></div>
        <div class="card-body">
          <p class="rarity">drop</p>
          <h3>${c.name}</h3>
          <p>${c.blurb}</p>
          <p class="odds">Can roll: ${names}</p>
          <div class="card-row">
            <strong>$${c.usd}</strong>
            <button class="btn btn-gold" type="button" data-crate="${c.id}">Open drop</button>
          </div>
        </div>
      </article>`;
    }).join("");
    grid.addEventListener("click", async (e) => {
      const b = e.target.closest("[data-crate]");
      if (!b) return;
      const crate = window.CRATES.find((x) => x.id === b.dataset.crate);
      const W = window.LeonidaWallet;
      if (!W.state.address) {
        W.toast("Connect a wallet first");
        document.querySelector("[data-connect]")?.click();
        return;
      }
      W.openChooser(async (kind) => {
        b.disabled = true;
        b.textContent = "Confirm in wallet…";
        const stage = $("#crateStage");
        try {
          const res = await W.buyCrate(crate, kind);
          if (stage) {
            stage.hidden = false;
            stage.innerHTML = `<div class="reveal-drop">
              <img src="${res.item.img}" alt="">
              <h3>${res.item.name}</h3>
              <p class="rarity ${"r-" + res.item.rarity}">${res.item.rarity}</p>
              <p>Minted to your locker. On-chain receipt: ${res.paid.tx.slice(0, 10)}…</p>
              <a class="btn btn-pink" href="locker.html">Open locker</a>
            </div>`;
          }
        } catch (err) {
          W.toast((err && err.message) || "Cancelled");
          b.disabled = false;
          b.textContent = "Open drop";
        }
      });
    });
  }

  function renderLocker() {
    const grid = $("#lockerGrid");
    if (!grid) return;
    const W = window.LeonidaWallet;
    const paint = () => {
      const owner = W.state.address;
      if (!owner) {
        grid.innerHTML = "<p class='empty'>Connect MetaMask or Phantom to see drops minted to that wallet.</p>";
        return;
      }
      const rows = W.loadLocker(owner);
      if (!rows.length) {
        grid.innerHTML = "<p class='empty'>Locker empty. Buy a skin or open a drop — it mints here, bound to this wallet.</p>";
        return;
      }
      grid.innerHTML = rows.map((t) => `<article class="card ${"r-" + t.rarity}">
        <div class="card-media"><img src="${t.image}" alt="${t.name}"></div>
        <div class="card-body">
          <p class="rarity">${t.rarity}</p>
          <h3>${t.name}</h3>
          <p class="mono">NFT ${t.tokenId}</p>
          <p class="mono">tx ${t.tx}</p>
          <p>Chain: ${t.chain} · ${new Date(t.mintedAt).toLocaleString()}</p>
        </div>
      </article>`).join("");
    };
    paint();
    window.addEventListener("leonida:wallet", paint);
    const got = new URLSearchParams(location.search).get("got");
    if (got) W.toast("New NFT in locker: " + got);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const menu = $("#menuBtn");
    const links = $("#navLinks");
    menu?.addEventListener("click", () => links.classList.toggle("open"));
    tickCountdown();
    setInterval(tickCountdown, 1000);
    renderShop();
    renderDrops();
    renderLocker();
    $$(".reveal").forEach((el, i) => {
      setTimeout(() => el.classList.add("in"), 80 * i);
    });
  });
})();
