(function () {
  function $(s, r) { return (r || document).querySelector(s); }
  function $$ (s, r) { return [...(r || document).querySelectorAll(s)]; }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

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

  function cardHTML(item) {
    return `<article class="card r-${esc(item.rarity)}" data-id="${esc(item.id)}">
      <div class="card-media"><img src="${esc(item.img)}" alt="${esc(item.name)}"></div>
      <div class="card-body">
        <p class="rarity">${esc(item.rarity)}</p>
        <h3>${esc(item.name)}</h3>
        <p>${esc(item.blurb)}</p>
        <div class="card-row">
          <strong>$${item.usd}</strong>
          <button class="btn btn-pink" type="button" data-buy="${esc(item.id)}">Buy & mint</button>
        </div>
      </div>
    </article>`;
  }

  async function runPay(btn, label, fn) {
    const W = window.LeonidaWallet;
    const prev = btn ? btn.textContent : "";
    if (btn) { btn.disabled = true; btn.textContent = "Confirm in wallet…"; }
    try {
      const res = await fn();
      if (btn) btn.textContent = "Minted";
      return res;
    } catch (err) {
      W.toast(W.friendlyErr(err));
      if (btn) { btn.disabled = false; btn.textContent = prev || label; }
      return null;
    }
  }

  async function handleBuy(id, btn) {
    const item = window.itemById(id);
    if (!item) return;
    const res = await runPay(btn, "Buy & mint", () => window.LeonidaWallet.buyItem(item));
    if (res && res.token) {
      window.location.href = "locker.html?got=" + encodeURIComponent(res.token.tokenId);
    }
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
    const n = $("#shopCount");
    if (n) n.textContent = rows.length + " items";
  }

  function renderShop() {
    const grid = $("#shopGrid");
    if (!grid || !window.ITEMS) return;
    filterShop();
    grid.addEventListener("click", (e) => {
      const b = e.target.closest("[data-buy]");
      if (b) handleBuy(b.dataset.buy, b);
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
        <div class="card-media"><img src="${esc(c.img)}" alt="${esc(c.name)}"></div>
        <div class="card-body">
          <p class="rarity">drop</p>
          <h3>${esc(c.name)}</h3>
          <p>${esc(c.blurb)}</p>
          <p class="odds">Can roll: ${esc(names)}</p>
          <div class="card-row">
            <strong>$${c.usd}</strong>
            <button class="btn btn-gold" type="button" data-crate="${esc(c.id)}">Open drop</button>
          </div>
        </div>
      </article>`;
    }).join("");
    grid.addEventListener("click", async (e) => {
      const b = e.target.closest("[data-crate]");
      if (!b) return;
      const crate = window.CRATES.find((x) => x.id === b.dataset.crate);
      const W = window.LeonidaWallet;
      const res = await runPay(b, "Open drop", () => W.buyCrate(crate));
      if (!res) return;
      const stage = $("#crateStage");
      const tx = res.paid.tx || "";
      const href = res.paid.chain === "solana"
        ? "https://solscan.io/tx/" + tx
        : "https://polygonscan.com/tx/" + tx;
      if (stage) {
        stage.hidden = false;
        stage.innerHTML = `<div class="reveal-drop">
          <img src="${esc(res.item.img)}" alt="">
          <h3>${esc(res.item.name)}</h3>
          <p class="rarity r-${esc(res.item.rarity)}">${esc(res.item.rarity)}</p>
          <p>Minted to your locker.</p>
          <p class="mono"><a href="${esc(href)}" target="_blank" rel="noopener">View payment ${esc(tx.slice(0, 10))}…</a></p>
          <a class="btn btn-pink" href="locker.html">Open locker</a>
        </div>`;
        stage.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }

  function renderLocker() {
    const grid = $("#lockerGrid");
    if (!grid) return;
    const W = window.LeonidaWallet;
    const paint = () => {
      const owner = W.state.address;
      if (!owner) {
        grid.innerHTML = "<p class='empty'>Connect a wallet to see items minted to that address.</p>";
        return;
      }
      const rows = W.loadLocker(owner);
      if (!rows.length) {
        grid.innerHTML = "<p class='empty'>Locker empty. Buy in the shop or open a drop — payment mints here.</p>";
        return;
      }
      grid.innerHTML = rows.map((t) => {
        const href = t.chain === "solana"
          ? "https://solscan.io/tx/" + t.tx
          : "https://polygonscan.com/tx/" + t.tx;
        return `<article class="card r-${esc(t.rarity)}">
          <div class="card-media"><img src="${esc(t.image)}" alt="${esc(t.name)}"></div>
          <div class="card-body">
            <p class="rarity">${esc(t.rarity)}</p>
            <h3>${esc(t.name)}</h3>
            <p class="mono">NFT ${esc(t.tokenId)}</p>
            <p class="mono"><a href="${esc(href)}" target="_blank" rel="noopener">${esc(t.chain)} · ${esc(String(t.tx).slice(0, 18))}…</a></p>
            <p>${esc(new Date(t.mintedAt).toLocaleString())}</p>
          </div>
        </article>`;
      }).join("");
    };
    paint();
    window.addEventListener("leonida:wallet", paint);
    const got = new URLSearchParams(location.search).get("got");
    if (got) W.toast("New NFT in locker");
  }

  document.addEventListener("DOMContentLoaded", () => {
    const menu = $("#menuBtn");
    const links = $("#navLinks");
    menu?.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      menu.setAttribute("aria-expanded", String(open));
    });
    $$("#navLinks a").forEach((a) => a.addEventListener("click", () => {
      links?.classList.remove("open");
      menu?.setAttribute("aria-expanded", "false");
    }));
    tickCountdown();
    setInterval(tickCountdown, 1000);
    renderShop();
    renderDrops();
    renderLocker();
    $$(".reveal").forEach((el, i) => {
      setTimeout(() => el.classList.add("in"), 60 * i);
    });
  });
})();
