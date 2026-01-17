(function () {
  const $ = (id) => document.getElementById(id);

  const els = {
    repoBase: $("repoBase"),
    siteName: $("siteName"),
    ghToken: $("ghToken"),
    metaPixelId: $("metaPixelId"),
    metaPixelStatusText: $("metaPixelStatusText"),
    metaPixelInputWrap: $("metaPixelInputWrap"),

    artist: $("artist"),
    title: $("title"),
    trackSlug: $("trackSlug"),
    utmCampaign: $("utmCampaign"),

    destSpotify: $("destSpotify"),
    spotifyUrl: $("spotifyUrl"),
    destApple: $("destApple"),
    appleUrl: $("appleUrl"),

    btnResolver: $("btnResolver"),
    resolverOverlay: $("resolverOverlay"),
    resolverForm: $("resolverForm"),
    resolverInput: $("resolverInput"),
    resolverResults: $("resolverResults"),
    resolverStatus: $("resolverStatus"),
    btnResolverClose: $("btnResolverClose"),

    destEditor: $("destEditor"),

    btnOpenSpotify: $("btnOpenSpotify"),
    btnSearchSpotify: $("btnSearchSpotify"),

    repoBaseDisplay: $("repoBaseDisplay"),
    siteNameDisplay: $("siteNameDisplay"),
    tokenStatusText: $("tokenStatusText"),
    tokenInputWrap: $("tokenInputWrap"),

    validationPanel: $("validationPanel"),
    previewPanel: null, // removed
    logPanel: $("logPanel"),

    ogFile: $("ogFile"),
    ogFileInfo: $("ogFileInfo"),
    ogCanvas: $("ogCanvas"),
    ogImageNamePreview: $("ogImageNamePreview"),

    validation: $("validation"),
    log: $("log"),

    btnGenerate: $("btnGenerate"),
    btnPublish: $("btnPublish"),
    btnReset: $("btnReset"),
    btnForgetToken: $("btnForgetToken"),
    btnCopyCreds: $("btnCopyCreds"),
    btnTheme: $("btnTheme"),
    // ...existing code...
    previewBody: $("previewBody"),
  };

  // ---------- utils ----------
  function normBaseUrl(s) { return (s || "").trim().replace(/\/+$/, ""); }

  function sanitizeSlug(s) {
    s = (s || "").trim().toLowerCase();
    s = s.replace(/[_\s]+/g, "-");
    s = s.replace(/[^a-z0-9-]/g, "");
    s = s.replace(/-+/g, "-");
    s = s.replace(/^-+|-+$/g, "");
    return s;
  }

  function required(name, value, errors) {
    if (!value || !String(value).trim()) errors.push(`${name} is required`);
  }

  function htmlEscape(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // Channels and UTM content logic removed

  const APPLE_SEARCH_API = "https://itunes.apple.com/search";
  const ODESLI_RESOLVER_API = "https://api.song.link/v1-alpha.1/links";

  function addLogItem({ title, lines = [], linkText, linkHref, status }) {
    show(els.logPanel);
    const div = document.createElement("div");
    div.className = "logitem";
    const statusHtml = status ? `<div class="mono">${status}</div>` : "";
    const linkHtml = (linkHref && linkText) ? `<a href="${linkHref}" target="_blank" rel="noreferrer">${linkText}</a>` : "";
    div.innerHTML = `
      <div class="top">
        <div class="path">${title}</div>
        <div class="mono">${linkHtml}</div>
      </div>
      ${statusHtml}
      <div class="mono mt-8">${lines.map(l => `${htmlEscape(l)}`).join("<br>")}</div>
    `;
    els.log.appendChild(div);
  }

  function clearLog() {
    els.log.innerHTML = "";
    hideLogIfEmpty();
  }
  function hideLogIfEmpty() {
    if (!els.log) return;
    const hasItems = els.log.children.length > 0;
    toggle(els.logPanel, hasItems);
  }

  function parseSpotifyTrackId(url) {
    if (!url) return null;
    try {
      const u = new URL(url.trim());
      const match = u.pathname.match(/\/track\/([A-Za-z0-9]{10,})/);
      if (match) return match[1];
    } catch (_) { /* ignore */ }
    return null;
  }

  function autoDescription({ hasSpotify, hasApple }) {
    if (hasSpotify) return "Tap to open in Spotify.";
    if (hasApple) return "Tap to open in Apple Music.";
    return "Tap to open.";
  }

  function markNeed(el, need) {
    if (!el) return;
    el.classList.toggle("needs-input", !!need);
  }

  function show(el) {
    if (el) el.classList.remove("hidden");
  }

  function hide(el) {
    if (el) el.classList.add("hidden");
  }

  function toggle(el, shouldShow) {
    if (!el) return;
    el.classList.toggle("hidden", !shouldShow);
  }

  function updateNeedsInput() {
    const spotifyMissing = els.destSpotify.checked && !parseSpotifyTrackId(els.spotifyUrl.value || "");
    markNeed(els.spotifyUrl, spotifyMissing);

    // ...existing code...
  }

  let appleResolveTargets = { spotify: true };

  function setAppleResolveTargets(targets = {}) {
    appleResolveTargets = {
      spotify: !!targets.spotify,
    };
  }

  // ---------- Resolver (Apple search -> Odesli) ----------
  let resolverSearchAbort = null;

  function hideResolver() {
    if (resolverSearchAbort) resolverSearchAbort.abort();
    resolverSearchAbort = null;
    hide(els.resolverOverlay);
  }

  function clearResolverResults() {
    if (els.resolverResults) els.resolverResults.innerHTML = "";
  }

  function showResolver() {
    console.log('showResolver called');
    setAppleResolveTargets({ spotify: true });
    if (!els.resolverOverlay) return;
    clearResolverResults();
    if (els.resolverStatus) els.resolverStatus.textContent = "Search by song and artist.";
    show(els.resolverOverlay);
    if (els.resolverInput) {
      const title = (els.title?.value || "").trim();
      const artist = (els.artist?.value || "").trim();
      const seed = [title, artist].filter(Boolean).join(" ");
      els.resolverInput.value = seed;
      els.resolverInput.focus();
      els.resolverInput.select();
    }
  }

  function applyResolverSelection(card) {
    const url = card.dataset.appleUrl;
    const track = card.dataset.track;
    const artist = card.dataset.artist;
    if (!url) return;
    addLogItem({
      title: `Found song in Apple Search: ${track} - ${artist}`,
      status: "Selected"
    });
    const appleEnabled = !!els.destApple?.checked;
    if (appleEnabled && els.appleUrl) els.appleUrl.value = url;
    validateOnly();
    updateNeedsInput();
    hideResolver();
    resolveAppleTargets(url);
  }

  function renderResolverResults(items = []) {
    clearResolverResults();
    if (!els.resolverResults) return;
    const frag = document.createDocumentFragment();
    items.forEach(item => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "search-result";
      const art = (item.artworkUrl100 || "").replace(/100x100bb/, "200x200bb");
      const track = htmlEscape(item.trackName || "Unknown track");
      const artist = htmlEscape(item.artistName || "");
      const album = htmlEscape(item.collectionName || "");
      const url = item.trackViewUrl || item.collectionViewUrl || "";
      card.dataset.appleUrl = url;
      card.dataset.track = item.trackName || "Unknown track";
      card.dataset.artist = item.artistName || "";
      card.innerHTML = `
        <img class="result-art" src="${art}" alt="" loading="lazy" />
        <div class="search-meta">
          <div class="search-title">${track}</div>
          <div class="search-sub">${artist}${album ? " • " + album : ""}</div>
        </div>
      `;
      frag.appendChild(card);
    });
    els.resolverResults.appendChild(frag);
  }

  async function runResolverSearch(term) {
    const q = (term || "").trim();
    if (!q) {
      if (els.resolverStatus) els.resolverStatus.textContent = "Enter a song and artist.";
      clearResolverResults();
      return;
    }
    if (resolverSearchAbort) resolverSearchAbort.abort();
    resolverSearchAbort = new AbortController();
    if (els.resolverStatus) els.resolverStatus.textContent = "Searching…";
    clearResolverResults();
    try {
      const url = `${APPLE_SEARCH_API}?term=${encodeURIComponent(q)}&entity=musicTrack&limit=15`; 
      const res = await fetch(url, { signal: resolverSearchAbort.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const items = Array.isArray(data.results) ? data.results.filter(r => r.trackViewUrl) : [];
      if (!items.length) {
        if (els.resolverStatus) els.resolverStatus.textContent = "No results.";
        return;
      }
      if (els.resolverStatus) els.resolverStatus.textContent = `Found ${items.length} result${items.length === 1 ? "" : "s"}. Click to fill.`;
      renderResolverResults(items);
    } catch (e) {
      if (e.name === "AbortError") return;
      if (els.resolverStatus) els.resolverStatus.textContent = "Search failed. Try again.";
    }
  }

  async function resolveAppleTargets(appleUrl) {
    const src = (appleUrl || "").trim();
    if (!src) return;
    // Populate every destination that is currently enabled
    const wantsSpotify = !!els.destSpotify?.checked;
    const wantsApple = !!els.destApple?.checked;
    if (!wantsSpotify && !wantsApple) return;
    try {
      const odesliUrl = `${ODESLI_RESOLVER_API}?url=${encodeURIComponent(src)}`;
      const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(odesliUrl)}`;
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      console.log('Odesli data:', data);
      const links = data?.linksByPlatform || {};
      const appleLink = links.appleMusic?.url || links.itunes?.url || src;
      let updated = false;

      if (wantsApple && els.appleUrl) {
        const appleUrlResolved = appleLink;
        if (appleUrlResolved) {
          els.appleUrl.value = appleUrlResolved;
          updated = true;
        }
      }

      if (wantsSpotify) {
        let spotifyUrl = links.spotify?.url;
        console.log('Spotify URL from Apple:', spotifyUrl);
        if (!spotifyUrl) {
          // Fallback: search Odesli by song and artist name with multiple query attempts
          const title = (els.title?.value || "").trim();
          const artist = (els.artist?.value || "").trim();
          const queries = [];
          if (title && artist) queries.push(`${title} ${artist}`);
          if (title) queries.push(title);
          if (artist && title) queries.push(`${artist} ${title}`);
          for (const query of queries) {
            try {
              const fallbackUrl = `${ODESLI_RESOLVER_API}?q=${encodeURIComponent(query)}`;
              const fallbackProxy = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(fallbackUrl)}`;
              const fallbackRes = await fetch(fallbackProxy);
              if (fallbackRes.ok) {
                const fallbackData = await fallbackRes.json();
                console.log(`Fallback Odesli data for "${query}":`, fallbackData);
                const fallbackLinks = fallbackData?.linksByPlatform || {};
                spotifyUrl = fallbackLinks.spotify?.url;
                console.log(`Spotify URL from fallback "${query}":`, spotifyUrl);
                if (spotifyUrl) break; // Stop on first success
              }
            } catch (fallbackE) {
              console.log(`Fallback search failed for "${query}":`, fallbackE);
            }
          }
        }
        if (els.spotifyUrl) {
          els.spotifyUrl.value = spotifyUrl || '';
          if (spotifyUrl) {
            addLogItem({
              title: `Resolved to Spotify URL: ${spotifyUrl}`,
              status: "Success"
            });
          } else {
            addLogItem({
              title: "Spotify URL not found via resolver",
              status: "Warning",
              lines: ["Try the Search button to find manually on Spotify."]
            });
          }
          if (els.btnOpenSpotify) els.btnOpenSpotify.disabled = !spotifyUrl;
          updated = true;
        }
      }

      if (updated) {
        validateOnly();
        updateNeedsInput();
      }
    } catch (e) {
      if (els.resolverStatus) {
        els.resolverStatus.textContent = "Resolver failed. Fill manually.";
      }
    }
  }

  async function copyCredsToClipboard() {
    const token = (els.ghToken?.value || "").trim();
    const pixel = (els.metaPixelId?.value || "").trim();
    if (!token && !pixel) {
      alert("Nothing to copy. Set token and/or Meta Pixel ID first.");
      return;
    }
    const lines = [];
    if (token) lines.push(`Publish token: ${token}`);
    if (pixel) lines.push(`Meta Pixel ID: ${pixel}`);
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      alert("Token / Pixel copied to clipboard.");
    } catch (e) {
      alert("Failed to copy. You may need to allow clipboard access.");
    }
  }

  let tokenStatus = "unknown";
  let tokenValidateTimer = null;
  let metaPixelStatus = "unknown";

  function setTokenStatus(status, message) {
    tokenStatus = status;
    if (els.tokenStatusText) {
      els.tokenStatusText.textContent = status === "ok" ? "OK" : status === "pending" ? "Checking…" : "NOT OK";
      els.tokenStatusText.classList.remove("status-ok", "status-bad", "status-pending");
      if (status === "ok") els.tokenStatusText.classList.add("status-ok");
      else if (status === "pending") els.tokenStatusText.classList.add("status-pending");
      else els.tokenStatusText.classList.add("status-bad");
      if (message && status === "bad") els.tokenStatusText.title = message; else els.tokenStatusText.removeAttribute("title");
    }
    toggle(els.tokenInputWrap, status !== "ok");
  }

  function setMetaPixelStatus(status) {
    metaPixelStatus = status;
    if (els.metaPixelStatusText) {
      els.metaPixelStatusText.textContent = status === "ok" ? "OK" : status === "pending" ? "Checking…" : "NOT SET";
      els.metaPixelStatusText.classList.remove("status-ok", "status-bad", "status-pending");
      if (status === "ok") els.metaPixelStatusText.classList.add("status-ok");
      else if (status === "pending") els.metaPixelStatusText.classList.add("status-pending");
      else els.metaPixelStatusText.classList.add("status-bad");
    }
    if (els.metaPixelId) els.metaPixelId.classList.toggle("hidden", status === "ok");
  }

  function scheduleTokenValidation() {
    if (tokenValidateTimer) clearTimeout(tokenValidateTimer);
    tokenValidateTimer = setTimeout(() => validateTokenStatus(true), 500);
  }

  async function validateTokenStatus(auto = false) {
    const token = (els.ghToken.value || "").trim();
    if (!token) {
      setTokenStatus("bad");
      return false;
    }
    setTokenStatus("pending");
    try {
      await ghFetch(`/repos/${OWNER}/${REPO}`, { token });
      setTokenStatus("ok");
      persistToken(token);
      if (!auto) addLogItem({ title: "Token OK", status: "PASS", lines: ["Permissions OK for Contents (Read/Write)."] });
      return true;
    } catch (e) {
      const msg = normalizeTokenError(e);
      setTokenStatus("bad", msg);
      if (!auto) addLogItem({ title: "Token not valid", status: "FAIL", lines: [msg] });
      return false;
    }
  }

  // ---------- OG image processing ----------
  const TARGET_W = 1200;
  const TARGET_H = 630;

  const SETTINGS_KEY = "sv-generator-settings-v1";
  const SLOT_KEY = "sv-slot-state-v1";
  const HASH_KEY = "sv-file-hash-v1";
  const PUBLISH_HISTORY_KEY = "sv-publish-history-v1";

  let currentTheme = "base";
  let currentToken = "";

  const REPO_BASE_LOCKED = "https://skydevaaben.no";

  const THEMES = ["base", "ocean", "forest", "sunset", "sand", "slate", "mint"];

  const CHANNEL_INPUTS = {
    meta: () => els.metaContent,
    tiktok: () => els.ttContent,
    youtube: () => els.ytContent
  };

  const PRESET_MAP = {
    story:  { channel: "meta",   prefix: "meta-ads-story" },
    reel:   { channel: "meta",   prefix: "meta-ads-reel" },
    feed:   { channel: "meta",   prefix: "meta-ads-feed" },
    infeed: { channel: "tiktok", prefix: "tt-ads-infeed" },
    instream: { channel: "youtube", prefix: "yt-ads-instream" }
  };

  const OWNER = "strikewolf76";
  const REPO = "skydevaaben";
  const BRANCH = "main";

  let ogImageLoaded = false;
  let ogImageBitmap = null;
  let ogImageError = null;
  let ogImageSlug = null;

  function drawOgCanvasFromBitmap() {
    const canvas = els.ogCanvas;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!ogImageBitmap) {
      ctx.fillStyle = "rgba(127,127,127,0.12)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(127,127,127,0.7)";
      ctx.font = "16px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
      ctx.fillText("Upload a square image; final output is 1200×630", 20, 40);
      return;
    }

    const targetW = TARGET_W, targetH = TARGET_H;
    const srcW = ogImageBitmap.width, srcH = ogImageBitmap.height;

    // Background: cover + blur, inflate more to avoid edge clipping and make blur obvious
    const coverScale = Math.max(targetW / srcW, targetH / srcH) * 1.35;
    const bgW = srcW * coverScale;
    const bgH = srcH * coverScale;
    const bgX = (targetW - bgW) / 2;
    const bgY = (targetH - bgH) / 2;

    ctx.save();
    ctx.filter = "blur(50px) brightness(0.95)"; // softer blur + slight dim for contrast
    ctx.drawImage(ogImageBitmap, 0, 0, srcW, srcH, bgX, bgY, bgW, bgH);
    ctx.restore();

    // Add a subtle overlay to separate foreground
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(0, 0, targetW, targetH);

    // Foreground: fit height, center horizontally
    const fgScale = targetH / srcH;
    const fgW = srcW * fgScale;
    const fgH = targetH;
    const fgX = (targetW - fgW) / 2;
    ctx.drawImage(ogImageBitmap, 0, 0, srcW, srcH, fgX, 0, fgW, fgH);
  }

  async function onOgFileSelected(file) {
    ogImageLoaded = false;
    ogImageBitmap = null;
    ogImageError = null;
    ogImageSlug = null;

    if (!file) {
      els.ogFileInfo.textContent = "";
      drawOgCanvasFromBitmap();
      renderPreviewGrid();
      validateOnly();
      return;
    }

    try {
      const bitmap = await createImageBitmap(file);
      ogImageBitmap = bitmap;

      const square = bitmap.width === bitmap.height;
      const tallEnough = bitmap.height > TARGET_H;
      const messages = [`Loaded: ${file.name} (${bitmap.width}×${bitmap.height})`];
      if (!square) ogImageError = "Image must be square";
      else if (!tallEnough) ogImageError = `Image height must be > ${TARGET_H}`;

      if (ogImageError) messages.push(`INVALID: ${ogImageError}`);

      ogImageLoaded = !ogImageError;
      ogImageSlug = sanitizeSlug(file.name.replace(/\.[^.]*$/, ''));
      els.ogFileInfo.textContent = messages.join(" | ");
      drawOgCanvasFromBitmap();
      validateOnly();
    } catch (e) {
      els.ogFileInfo.textContent = `Failed to read image: ${String(e)}`;
      ogImageLoaded = false;
      ogImageBitmap = null;
      ogImageSlug = null;
      drawOgCanvasFromBitmap();
      validateOnly();
    }
  }

  const JPEG_QUALITY = 0.88; // good balance: smaller files, visually lossless for OG

  async function canvasToJpegBase64(canvas, quality = JPEG_QUALITY) {
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    const arr = await blob.arrayBuffer();
    return arrayBufferToBase64(arr);
  }

  function drawBgCanvasFromBitmap() {
    const canvas = document.createElement("canvas");
    canvas.width = TARGET_W;
    canvas.height = TARGET_H;
    const ctx = canvas.getContext("2d");
    if (!ogImageBitmap) return canvas;
    const srcW = ogImageBitmap.width, srcH = ogImageBitmap.height;
    const coverScale = Math.max(TARGET_W / srcW, TARGET_H / srcH) * 1.35;
    const bgW = srcW * coverScale;
    const bgH = srcH * coverScale;
    const bgX = (TARGET_W - bgW) / 2;
    const bgY = (TARGET_H - bgH) / 2;
    ctx.filter = "blur(50px) brightness(0.95)";
    ctx.drawImage(ogImageBitmap, 0, 0, srcW, srcH, bgX, bgY, bgW, bgH);
    return canvas;
  }

  async function bitmapToJpegBase64(bitmap, quality = JPEG_QUALITY) {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    const arr = await blob.arrayBuffer();
    return arrayBufferToBase64(arr);
  }

  // ---------- base64 helpers ----------
  function utf8ToBase64(str) {
    // safe UTF-8 base64
    const bytes = new TextEncoder().encode(str);
    return arrayBufferToBase64(bytes.buffer);
  }

  function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
  }

  function hashString(str) {
    // Lightweight, stable hash (djb2-ish)
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
      hash = hash >>> 0; // force uint32
    }
    return hash.toString(16);
  }

  // ---------- persistence (localStorage) ----------
  function safeGet(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  }
  function safeSet(key, value) {
    try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value); } catch { /* ignore */ }
  }

  function safeGetJson(key, fallback) {
    const raw = safeGet(key);
    if (!raw) return fallback;
    try { return JSON.parse(raw); } catch { return fallback; }
  }

  function safeSetJson(key, value) {
    try {
      if (!value) { localStorage.removeItem(key); return; }
      localStorage.setItem(key, JSON.stringify(value));
    } catch { /* ignore */ }
  }

  function normalizeTheme(theme) {
    return THEMES.includes(theme) ? theme : "base";
  }

  function humanizeTheme(theme) {
    if (!theme) return "Base";
    return theme.charAt(0).toUpperCase() + theme.slice(1);
  }

  function updateThemeButton(theme) {
    if (!els.btnTheme) return;
    const t = normalizeTheme(theme || document.body?.dataset?.theme);
    els.btnTheme.textContent = `Theme: ${humanizeTheme(t)}`;
  }

  function applyTheme(theme) {
    const t = normalizeTheme(theme);
    if (document?.body) document.body.dataset.theme = t;
    updateThemeButton(t);
    return t;
  }

  function loadTheme() {
    return normalizeTheme(currentTheme);
  }

  function persistTheme(theme) {
    currentTheme = normalizeTheme(theme);
    const data = collectSettings();
    safeSet(SETTINGS_KEY, JSON.stringify(data));
  }

  function cycleTheme() {
    const current = normalizeTheme(document.body?.dataset?.theme || loadTheme());
    const idx = THEMES.indexOf(current);
    const next = THEMES[(idx + 1) % THEMES.length];
    applyTheme(next);
    persistTheme(next);
  }

  // ---------- slots + history ---------- (removed slot functions)

  function loadHashStore() {
    return safeGetJson(HASH_KEY, {});
  }

  function persistHashStore(store) {
    safeSetJson(HASH_KEY, store || {});
  }

  function loadPublishHistory() {
    return safeGetJson(PUBLISH_HISTORY_KEY, {});
  }

  function persistPublishHistory(history) {
    safeSetJson(PUBLISH_HISTORY_KEY, history || {});
  }

  function histKey({ slug, dest, channel, utm_content }) {
    return `${slug || ""}::${dest || ""}::${channel || ""}::${utm_content || ""}`;
  }

  function collectSettings() {
    return {
      metaPixelId: els.metaPixelId.value,
      theme: currentTheme,
      token: currentToken,
    };
  }

  let saveTimer = null;
  function persistSettingsSoon() {
    const data = collectSettings();
    safeSet(SETTINGS_KEY, JSON.stringify(data));
  }

  function applySettings() {
    const raw = safeGet(SETTINGS_KEY);
    if (!raw) return;
    try {
      const s = JSON.parse(raw);
      const assign = (el, val, isCheckbox) => {
        if (typeof val === "undefined") return;
        if (isCheckbox) el.checked = !!val; else el.value = val;
      };
      assign(els.metaPixelId, s.metaPixelId);
      currentTheme = s.theme || "base";
      applyTheme(currentTheme);
      currentToken = s.token || "";
      els.ghToken.value = currentToken;
      updateMetaPixelStatus();
    } catch { /* ignore */ }
  }

  function loadToken() {
    return currentToken || "";
  }

  function persistToken(token) {
    currentToken = token && token.trim() ? token.trim() : "";
    const data = collectSettings();
    safeSet(SETTINGS_KEY, JSON.stringify(data));
  }

  function forgetToken() {
    currentToken = "";
    const data = collectSettings();
    safeSet(SETTINGS_KEY, JSON.stringify(data));
    els.ghToken.value = "";
    setTokenStatus("bad");
  }

  function syncSlugAndCampaignFromTitle() {
    const slug = sanitizeSlug(els.title.value || "");
    els.trackSlug.value = slug;
    els.utmCampaign.value = slug;
    const imageSlug = ogImageSlug || slug;
    els.ogImageNamePreview.textContent = imageSlug ? `assets/og/${imageSlug}.jpg` : "";
  }

  function updateMetaPixelStatus() {
    const val = (els.metaPixelId?.value || "").trim();
    console.log('metaPixelId value:', val);
    setMetaPixelStatus(val.length > 0 ? "ok" : "bad");
  }

  // ---------- HTML generation ----------
  function generateHtml({
    title,
    siteName,
    description,
    ogUrlAbs,
    ogImageAbs,
    destinations,
    metaPixelId,
    trackSlug,
    utm_campaign
  }) {
    // Generate buttons for each destination
    const buttonsHtml = destinations.map(dest => {
      const buttonLabel = dest.key === "spotify" ? "Listen on Spotify" : dest.key === "apple" ? "Listen on Apple Music" : dest.key === "deezer" ? "Listen on Deezer" : "Listen";
      return `<a class="cta" href="#" data-dest="${htmlEscape(dest.key)}" rel="noopener noreferrer">${buttonLabel}</a>`;
    }).join("");

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${htmlEscape(title)}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">

  <meta property="og:type" content="music.song">
  <meta property="og:site_name" content="${htmlEscape(siteName)}">
  <meta property="og:title" content="${htmlEscape(title)}">
  <meta property="og:description" content="${htmlEscape(description)}">
  <meta property="og:url" content="${htmlEscape(ogUrlAbs)}">
  <meta property="og:image" content="${htmlEscape(ogImageAbs)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${htmlEscape(title)}">
  <meta name="twitter:description" content="${htmlEscape(description)}">
  <meta name="twitter:image" content="${htmlEscape(ogImageAbs)}">

  <style>
    body {
      background: url('${htmlEscape(ogImageAbs.replace(/\.jpg$/i, "-bg.jpg"))}') no-repeat center center;
      background-size: cover;
      margin: 0;
      padding: 20px;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: white;
      font-family: system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;
      text-shadow: 0 0 10px rgba(0,0,0,0.5);
    }
    .content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .cover {
      width: min(300px, 80vw);
      height: min(300px, 80vw);
      object-fit: cover;
      border-radius: 10px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      margin-bottom: 20px;
    }
    .cta {
      background: rgba(0,0,0,0.7);
      color: white;
      border: 2px solid white;
      text-decoration: none;
      padding: 14px 22px;
      font-size: 18px;
      border-radius: 10px;
      transition: background 0.3s ease;
    }
    .cta:hover {
      background: rgba(0,0,0,0.9);
    }
    .consent-info {
      font-size: 13px;
      opacity: 0.9;
      margin-top: 20px;
      max-width: 480px;
      line-height: 1.4;
      text-align: center;
    }
  </style>
</head>

<body>

  <div class="content">
    <img src="${htmlEscape(ogImageAbs.replace(/\.jpg$/i, "-fg.jpg"))}" alt="" class="cover">
    ${buttonsHtml}
  </div>

  <p id="consent-info" class="consent-info" style="display:none;">
    This link uses measurement to improve campaigns. By continuing, you agree.
  </p>

<script>
(function () {
  var DESTINATIONS = ${JSON.stringify(destinations.map(d => ({ key: d.key, baseUrl: d.baseUrl, spotifyId: d.spotifyId })))};
  var META_PIXEL_ID = "${htmlEscape(metaPixelId || "")}";
  var TRACK_SLUG = "${htmlEscape(trackSlug || "")}";
  var UTM_CAMPAIGN = "${htmlEscape(utm_campaign || "")}";

  var params = new URLSearchParams(window.location.search || "");
  var CID = params.get("cid") || "";
  var consentGranted = false;
  var pixelEventsQueued = [];

  // Allow known social crawlers to fetch OG tags (no redirect)
  var ua = navigator.userAgent || "";
  var isCrawler = /(facebookexternalhit|facebot|twitterbot|linkedinbot|discordbot|pinterest|slackbot|whatsapp|telegrambot|skypeuripreview)/i.test(ua);
  if (isCrawler) return;

  // Check existing consent
  var hasConsent = false;
  try {
    hasConsent = localStorage.getItem("sv_cookie_consent") === "granted";
  } catch (_) {}

  // Show consent info for new users
  if (!hasConsent) {
    var consentInfoEl = document.getElementById("consent-info");
    if (consentInfoEl) consentInfoEl.style.display = "block";
  }

  // Grant consent (once only)
  function grantConsent() {
    if (consentGranted) return;
    consentGranted = true;
    try {
      localStorage.setItem("sv_cookie_consent", "granted");
    } catch (_) {}
    if (window.fbq && META_PIXEL_ID) {
      fbq("consent", "grant");
      // Fire queued events
      while (pixelEventsQueued.length > 0) {
        var ev = pixelEventsQueued.shift();
        ev();
      }
    }
  }

  // Initialize Meta Pixel (if ID present)
  if (META_PIXEL_ID) {
    !(function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n;
      n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");

    fbq("init", META_PIXEL_ID);
    
    // Default: consent revoked
    try { fbq("consent", "revoke"); } catch (_) {}

    // If returning user: grant immediately
    if (hasConsent) {
      grantConsent();
      fbq("track", "PageView");
    } else {
      // Queue PageView until consent granted
      pixelEventsQueued.push(function () { fbq("track", "PageView"); });
    }
  }

  function appendUtms(url, utms) {
    var u = new URL(url);
    Object.keys(utms).forEach(function(k) {
      if (utms[k]) u.searchParams.set(k, utms[k]);
    });
    return u.toString();
  }

  function handleClick(destKey, e) {
    // Allow modified clicks (open in new tab etc.)
    if (e && (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1)) return;

    if (e && e.preventDefault) e.preventDefault();

    var dest = DESTINATIONS.find(d => d.key === destKey);
    if (!dest) return;

    var webUrl = appendUtms(dest.baseUrl, { utm_campaign: UTM_CAMPAIGN, utm_content: CID });

    // Open immediately to preserve user gesture (avoids popup blocking)
    var w = null;
    try {
      w = window.open("about:blank", "_blank");
      if (w) w.opener = null;
    } catch (_) {}

    grantConsent();
    trackOutbound(destKey);

    setTimeout(function () {
      try {
        if (w && !w.closed) w.location.href = webUrl;
        else window.location.href = webUrl; // fallback
      } catch (_) {
        window.location.href = webUrl;
      }
    }, 150);
  }

  // Attach click handlers
  document.querySelectorAll('.cta').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      var destKey = this.getAttribute('data-dest');
      handleClick(destKey, e);
    });
  });

})();
</script>

</body>
</html>
`;
  }

  // ---------- validation + batch build ----------
  function validateOnly(requireOg = true) {
    syncSlugAndCampaignFromTitle();
    const errors = [];
    updateNeedsInput();

    const repoBase = normBaseUrl(els.repoBase.value);
    required("Pages base URL", repoBase, errors);
    if (repoBase) {
      try {
        const u = new URL(repoBase);
        if (u.protocol !== "https:") errors.push("Pages base URL must be https");
        if (!u.hostname) errors.push("Pages base URL must include a host");
      } catch {
        errors.push("Pages base URL is not a valid URL");
      }
    }

    const title = (els.title.value || "").trim();
    required("Title", title, errors);

    const artist = (els.artist.value || "").trim();
    required("Artist", artist, errors);

    const slugRaw = (els.trackSlug.value || "");
    if (/_/.test(slugRaw)) errors.push("Track slug contains '_' (underscore). Use hyphens only.");
    const slug = sanitizeSlug(slugRaw);
    required("Track slug", slug, errors);

    const utmCampaign = sanitizeSlug(els.utmCampaign.value);
    required("utm_campaign", utmCampaign, errors);

    const anyDest = els.destSpotify.checked;
    if (!anyDest) errors.push("Select at least one destination.");

    let spotifyIdParsed = null;
    if (els.destSpotify.checked) {
      spotifyIdParsed = parseSpotifyTrackId(els.spotifyUrl.value || "");
      if (!spotifyIdParsed) errors.push("Spotify URL must contain a track ID");
    }

    if (requireOg) {
      if (!ogImageLoaded) errors.push("OG image not uploaded yet (required).");
      if (ogImageError) errors.push(ogImageError);
    }

    const imageSlug = ogImageSlug || slug;
    els.ogImageNamePreview.textContent = imageSlug ? `assets/og/${imageSlug}.jpg` : "";

    if (errors.length) {
      els.validation.innerHTML = `<span class="bad">FAIL</span>\n` + errors.map(e => `- ${e}`).join("\n");
      show(els.validationPanel);
      return { ok: false, errors };
    }

    els.validation.innerHTML =
      `<span class="ok">OK</span>\n` +
      `- Publish will create/update:\n` +
      `  - assets/og/${slug}.jpg\n` +
      `  - assets/og/${slug}-bg.jpg\n` +
      `  - assets/og/${slug}-fg.jpg\n` +
      `  - tracks/${slug}/index.html\n` +
      `  - qrs/${slug}/index.png\n`;
    show(els.validationPanel);

    return { ok: true };
  }

  function buildBatch({ requireOg = true } = {}) {
    const v = validateOnly(requireOg);
    if (!v.ok) return null;

    const repoBase = normBaseUrl(els.repoBase.value);
    const siteName = (els.siteName.value || "").trim();
    const title = (els.title.value || "").trim();
    const metaPixelId = (els.metaPixelId.value || "").trim();
    const spotifyIdParsed = parseSpotifyTrackId(els.spotifyUrl.value || "");

    const hasSpotify = !!(els.destSpotify.checked && spotifyIdParsed);
    const description = autoDescription({ hasSpotify, hasApple: false });

    const slug = sanitizeSlug(els.trackSlug.value);
    const utm_campaign = sanitizeSlug(els.utmCampaign.value);

    const imageSlug = ogImageSlug || slug;
    const ogImageRel = `assets/og/${imageSlug}.jpg`;
    const ogImageAbs = `${repoBase}/${ogImageRel}`;

    const destinations = [];
    if (els.destSpotify.checked) {
      const sid = spotifyIdParsed;
      destinations.push({
        key: "spotify",
        type: "spotify",
        baseUrl: `https://open.spotify.com/track/${encodeURIComponent(sid)}`,
        spotifyId: sid,
      });
    }

    const items = [];

    // Generate one landing page per campaign with multiple platform buttons
    const relPath = `tracks/${slug}/index.html`;
    const ogUrlAbs = `${repoBase}/${relPath}`;

    const pagesUrl = `${ogUrlAbs}?cid=${encodeURIComponent(utm_campaign)}`; // use campaign as default cid?

    const html = generateHtml({
      title,
      siteName,
      description,
      ogUrlAbs,
      ogImageAbs,
      destinations, // pass all destinations
      metaPixelId,
      trackSlug: slug,
      utm_campaign
    });

    items.push({
      relPath,
      pagesUrl,
      destinations: destinations.map(d => d.key),
      html
    });

    return { ok: true, slug, ogImageRel, ogImageAbs, items };
  }

  // ---------- drag & drop OG ----------
  function wireOgDragDrop() {
    const canvas = els.ogCanvas;
    const prevent = (e) => { e.preventDefault(); e.stopPropagation(); };
    ["dragenter", "dragover", "dragleave", "drop"].forEach(ev => canvas.addEventListener(ev, prevent));
    canvas.addEventListener("drop", (e) => {
      const file = e.dataTransfer?.files?.[0];
      if (file) onOgFileSelected(file);
    });
  }

  // ---------- clipboard + QR ----------
  function renderPreviewGrid() {
    const batch = buildBatch({ requireOg: true });
    if (!els.previewBody) return;

    if (!batch || !batch.ok) {
      els.previewBody.innerHTML = '<tr><td colspan="3" class="text-center">Fix validation to preview.</td></tr>';
      hide(els.previewPanel);
      return;
    }

    if (!batch.items.length) {
      els.previewBody.innerHTML = '<tr><td colspan="3" class="text-center">No landing page.</td></tr>';
      hide(els.previewPanel);
      return;
    }

    show(els.previewPanel);
    els.previewBody.innerHTML = batch.items.map(i => `
      <tr>
        <td>${htmlEscape(i.relPath)}</td>
        <td>${htmlEscape(i.pagesUrl)}</td>
        <td>Landing page with buttons for: ${i.destinations.join(", ")}</td>
      </tr>
    `).join("");
  }


  const QR_LIB_URLS = [
    "https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js",
    "https://unpkg.com/qrcode@1.5.3/build/qrcode.min.js",
    "https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js"
  ];

  function loadQrLib() {
    if (window.QRCode) return Promise.resolve();

    const existing = document.querySelector('script[data-qr-lib="1"]');
    if (existing) {
      return new Promise((resolve, reject) => {
        existing.addEventListener("load", () => window.QRCode ? resolve() : reject(new Error("QR lib loaded without QRCode")));
        existing.addEventListener("error", () => reject(new Error("QR lib failed to load")));
      });
    }

    const tryUrl = (urlIndex = 0) => {
      const url = QR_LIB_URLS[urlIndex];
      if (!url) return Promise.reject(new Error("QR lib failed to load from all CDNs"));

      return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = url;
        script.async = true;
        script.dataset.qrLib = "1";
        script.onload = () => window.QRCode ? resolve() : reject(new Error(`QR lib loaded from ${url} but QRCode missing`));
        script.onerror = () => reject(new Error(`QR lib failed from ${url}`));
        document.head.appendChild(script);
      }).catch(() => tryUrl(urlIndex + 1));
    };

    return tryUrl();
  }

  function dataUrlToBase64(dataUrl) {
    if (!dataUrl) return "";
    const parts = String(dataUrl).split(",");
    return parts.length > 1 ? parts[1] : parts[0];
  }

  // ---------- GitHub API (create/update contents) ----------
  async function ghFetch(path, { method = "GET", token, body } = {}) {
    const res = await fetch(`https://api.github.com${path}`, {
      method,
      headers: {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        ...(body ? { "Content-Type": "application/json" } : {})
      },
      body: body ? JSON.stringify(body) : undefined
    });
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch { /* ignore */ }
    if (!res.ok) {
      const msg = json?.message || `${res.status} ${res.statusText}`;
      throw new Error(`${msg}`);
    }
    return json;
  }

  async function getFileSha({ owner, repo, path, branch, token }) {
    // If file doesn't exist, GitHub returns 404 -> we catch and return null
    try {
      const data = await ghFetch(`/repos/${owner}/${repo}/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}?ref=${encodeURIComponent(branch)}`, { token });
      return data?.sha || null;
    } catch (e) {
      if (String(e.message || "").includes("Not Found")) return null;
      throw e;
    }
  }

  async function putFile({ owner, repo, path, branch, token, message, contentBase64 }) {
    const sha = await getFileSha({ owner, repo, path, branch, token });
    const body = {
      message,
      content: contentBase64,
      branch
    };
    if (sha) body.sha = sha;

    // PUT create/update file contents
    return ghFetch(`/repos/${owner}/${repo}/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}`, {
      method: "PUT",
      token,
      body
    });
  }

  function normalizeTokenError(e) {
    const msg = String(e?.message || e || "").trim();
    const isToken = /bad credentials|expired|authentication|unauthorized/i.test(msg);
    if (isToken) forgetToken();
    const extra = isToken ? "Token may be expired. Create a new fine-grained PAT with Contents Read/Write." : "";
    return extra ? `${msg} | ${extra}` : msg;
  }

  // ---------- publish ----------
  async function publishAll() {
    clearLog();

    const v = validateOnly();
    if (!v.ok) return;

    const repoBase = normBaseUrl(els.repoBase.value);
    const publishHistory = loadPublishHistory();
    const hashStore = loadHashStore();

    const token = (els.ghToken.value || "").trim();
    if (!token) {
      addLogItem({ title: "Missing token", status: "FAIL", lines: [
        "No token found. Create a fine-grained PAT with Contents Read/Write and paste it here.",
        "Quick link: https://github.com/settings/personal-access-tokens/new"
      ] });
      return;
    }
    const tokenOk = await validateTokenStatus(true);
    if (!tokenOk) {
      addLogItem({ title: "Token not valid", status: "FAIL", lines: ["Validate the token and try again."] });
      return;
    }
    persistToken(token);

    const batch = buildBatch();
    if (!batch || !batch.ok) {
      addLogItem({ title: "Batch build failed", status: "FAIL", lines: [batch?.error || "Unknown error"] });
      return;
    }

    addLogItem({
      title: "Publishing…",
      status: "RUNNING",
      lines: [
        `Target: ${OWNER}/${REPO} @ ${BRANCH}`,
        `OG image: ${batch.ogImageRel}`,
        `Files: ${batch.items.length}`
      ]
    });

    let failures = 0;
    const pendingUploads = [];
    let confirmNeeded = false;

    // Prepare OG image upload (hash-aware)
    try {
      const ogJpgB64 = await canvasToJpegBase64(els.ogCanvas, 0.92);
      const ogHash = hashString(ogJpgB64);
      const prevHash = hashStore[batch.ogImageRel];
      if (prevHash && prevHash === ogHash) {
        addLogItem({ title: `UNCHANGED: ${batch.ogImageRel}`, status: "UNCHANGED", lines: [batch.ogImageRel] });
      } else {
        if (prevHash && prevHash !== ogHash) confirmNeeded = true;
        pendingUploads.push({
          path: batch.ogImageRel,
          hash: ogHash,
          link: batch.ogImageAbs,
          type: "OG",
          run: async () => putFile({ owner: OWNER, repo: REPO, branch: BRANCH, token, path: batch.ogImageRel, message: `OG image: ${batch.slug}`, contentBase64: ogJpgB64 })
        });
      }

      // Prepare BG image upload
      const bgCanvas = drawBgCanvasFromBitmap();
      const bgJpgB64 = await canvasToJpegBase64(bgCanvas, 0.92);
      const bgPath = batch.ogImageRel.replace(/\.jpg$/i, '-bg.jpg');
      const bgHash = hashString(bgJpgB64);
      const prevBgHash = hashStore[bgPath];
      if (prevBgHash && prevBgHash === bgHash) {
        addLogItem({ title: `UNCHANGED: ${bgPath}`, status: "UNCHANGED", lines: [bgPath] });
      } else {
        if (prevBgHash && prevBgHash !== bgHash) confirmNeeded = true;
        pendingUploads.push({
          path: bgPath,
          hash: bgHash,
          link: batch.ogImageAbs.replace(/\.jpg$/i, '-bg.jpg'),
          type: "BG",
          run: async () => putFile({ owner: OWNER, repo: REPO, branch: BRANCH, token, path: bgPath, message: `BG image: ${batch.slug}`, contentBase64: bgJpgB64 })
        });
      }

      // Prepare FG image upload
      const fgJpgB64 = await bitmapToJpegBase64(ogImageBitmap, 0.92);
      const fgPath = batch.ogImageRel.replace(/\.jpg$/i, '-fg.jpg');
      const fgHash = hashString(fgJpgB64);
      const prevFgHash = hashStore[fgPath];
      if (prevFgHash && prevFgHash === fgHash) {
        addLogItem({ title: `UNCHANGED: ${fgPath}`, status: "UNCHANGED", lines: [fgPath] });
      } else {
        if (prevFgHash && prevFgHash !== fgHash) confirmNeeded = true;
        pendingUploads.push({
          path: fgPath,
          hash: fgHash,
          link: batch.ogImageAbs.replace(/\.jpg$/i, '-fg.jpg'),
          type: "FG",
          run: async () => putFile({ owner: OWNER, repo: REPO, branch: BRANCH, token, path: fgPath, message: `FG image: ${batch.slug}`, contentBase64: fgJpgB64 })
        });
      }
    } catch (e) {
      addLogItem({ title: `FAIL: ${batch.ogImageRel}`, status: "ERROR", lines: [normalizeTokenError(e)] });
      return;
    }

    // Prepare QR upload
    try {
      await loadQrLib();
      const it = batch.items[0]; // only one item
      let dataUrl;
      try {
        dataUrl = await window.QRCode.toDataURL(it.pagesUrl, { width: 320, margin: 2 });
      } catch (_) {
        const apiUrl = `https://quickchart.io/qr?text=${encodeURIComponent(it.pagesUrl)}&size=320&margin=2`;
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error(`QR API ${res.status}`);
        const blob = await res.blob();
        dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }

      const base64 = dataUrlToBase64(dataUrl);
      const qrPath = `qrs/${batch.slug}/index.png`;
      const qrHash = hashString(base64);
      const prevHash = hashStore[qrPath];
      if (prevHash && prevHash === qrHash) {
        addLogItem({ title: `UNCHANGED: ${qrPath}`, status: "UNCHANGED", lines: [`${repoBase}/${qrPath}`] });
      } else {
        if (prevHash && prevHash !== qrHash) confirmNeeded = true;
        pendingUploads.push({
          path: qrPath,
          hash: qrHash,
          link: `${repoBase}/${qrPath}`,
          type: "QR",
          run: async () => putFile({ owner: OWNER, repo: REPO, branch: BRANCH, token, path: qrPath, message: `QR: ${batch.slug}`, contentBase64: base64 })
        });
      }
    } catch (e) {
      addLogItem({ title: "QR publish failed", status: "ERROR", lines: [normalizeTokenError(e)] });
      failures += 1;
    }

    // Prepare HTML uploads
    for (const it of batch.items) {
      try {
        const htmlHash = hashString(it.html);
        const prevHash = hashStore[it.relPath];
        if (prevHash && prevHash === htmlHash) {
          addLogItem({ title: `UNCHANGED: ${it.relPath}`, status: "UNCHANGED", lines: [`slug=${batch.slug}`] });
        } else {
          if (prevHash && prevHash !== htmlHash) confirmNeeded = true;
          const htmlB64 = utf8ToBase64(it.html);
          pendingUploads.push({
            path: it.relPath,
            hash: htmlHash,
            link: it.pagesUrl,
            type: "HTML",
            item: it,
            run: async () => putFile({ owner: OWNER, repo: REPO, branch: BRANCH, token, path: it.relPath, message: `Landing page: ${batch.slug}`, contentBase64: htmlB64 })
          });
        }
      } catch (e) {
        addLogItem({ title: `FAIL: ${it.relPath}`, status: "ERROR", lines: [normalizeTokenError(e)] });
        failures += 1;
      }
    }

    if (confirmNeeded) {
      const ok = window.confirm(`Overwrite ${pendingUploads.length} file(s)?`);
      if (!ok) {
        addLogItem({ title: "Canceled", status: "CANCEL", lines: ["User canceled overwrite."] });
        return;
      }
    }

    for (const job of pendingUploads) {
      try {
        await job.run();
        hashStore[job.path] = job.hash;
        addLogItem({
          title: `${job.type} OK: ${job.path}`,
          status: "PUBLISHED",
          linkText: job.link ? "Open" : undefined,
          linkHref: job.link,
          lines: job.item ? [`slug=${batch.slug}`] : [job.path]
        });
      } catch (e) {
        addLogItem({ title: `FAIL: ${job.path}`, status: "ERROR", lines: [normalizeTokenError(e)] });
        failures += 1;
      }
    }

    persistHashStore(hashStore);
    batch.items.forEach(it => {
      publishHistory[histKey({ slug: batch.slug, dest: "", channel: "", utm_content: "" })] = true;
    });
    persistPublishHistory(publishHistory);

    if (failures > 0) {
      addLogItem({
        title: "DONE (with errors)",
        status: "PARTIAL",
        lines: [`${failures} file(s) failed. Check errors above.`]
      });
    } else {
      addLogItem({
        title: "DONE",
        status: "SUCCESS",
        lines: ["All changed files created/updated. Unchanged files were skipped."]
      });
    }
  }

  // ---------- token check ----------
  async function checkToken() {
    clearLog();

    const token = (els.ghToken.value || "").trim();

    const errors = [];
    required("Token", token, errors);
    if (errors.length) {
      addLogItem({ title: "Check token", status: "FAIL", lines: errors });
      return;
    }

    addLogItem({ title: "Checking token…", status: "RUNNING", lines: [`${OWNER}/${REPO}`] });
    try {
      const repoInfo = await ghFetch(`/repos/${OWNER}/${REPO}`, { token });
      persistToken(token);
      addLogItem({
        title: "Token OK",
        status: "PASS",
        lines: [
          `Default branch: ${repoInfo?.default_branch || "unknown"}`,
          `Permissions OK for Contents (expected Read/Write).`
        ]
      });
    } catch (e) {
      addLogItem({
        title: "Token check failed",
        status: "FAIL",
        lines: [normalizeTokenError(e), "Quick link: https://github.com/settings/personal-access-tokens/new"]
      });
    }
  }

  // ---------- reset ----------
  function resetForm() {
    // Keep repoBase, siteName (stable)
    els.artist.value = "";
    els.title.value = "";
    els.trackSlug.value = "";
    els.utmCampaign.value = "";

    els.destSpotify.checked = true;
    els.spotifyUrl.value = "";
    if (els.btnOpenSpotify) els.btnOpenSpotify.disabled = true;

    els.ogFile.value = "";
    els.ogFileInfo.textContent = "";
    ogImageLoaded = false;
    ogImageBitmap = null;
    ogImageSlug = null;
    drawOgCanvasFromBitmap();

    clearLog();
    els.validation.textContent = "";
    els.ogImageNamePreview.textContent = "";

    syncSlugAndCampaignFromTitle();
    updateNeedsInput();
    updateMetaPixelStatus();
  }

  // ---------- wire ----------
  function wire() {
    applySettings();
    const initialTheme = applyTheme(loadTheme());
    persistTheme(initialTheme);

    // Enforce locked base URL regardless of localStorage state
    els.repoBase.value = REPO_BASE_LOCKED;
    els.repoBase.value = REPO_BASE_LOCKED; // re-assert after applying other settings
    if (els.repoBaseDisplay) els.repoBaseDisplay.textContent = REPO_BASE_LOCKED;
    if (els.siteNameDisplay) els.siteNameDisplay.textContent = els.siteName.value || "";
    syncSlugAndCampaignFromTitle();
    updateNeedsInput();
    updateMetaPixelStatus();
    if (currentToken) validateTokenStatus(true); else setTokenStatus("bad");

    [
      els.repoBase, els.siteName, els.metaPixelId,
      els.ghToken,
      els.artist, els.title, els.trackSlug, els.utmCampaign,
      els.destSpotify, els.spotifyUrl
    ].forEach(el => el.addEventListener("input", () => {
      if (el === els.title) { syncSlugAndCampaignFromTitle(); }
      validateOnly();
      if (el === els.metaPixelId) persistSettingsSoon();
      if (el === els.ghToken) {
        persistToken(els.ghToken.value);
        scheduleTokenValidation();
      }
      updateNeedsInput();
      if (el === els.metaPixelId) updateMetaPixelStatus();
    }));

    // Also listen for paste events, as they may not trigger input reliably
    [els.ghToken].forEach(el => el.addEventListener("paste", () => {
      setTimeout(() => {
        persistToken(els.ghToken.value);
        scheduleTokenValidation();
      }, 0);
    }));

    // Also on blur, to catch any missed changes
    els.ghToken.addEventListener("blur", () => {
      persistToken(els.ghToken.value);
      scheduleTokenValidation();
    });

    els.ogFile.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      onOgFileSelected(file);
    });

    if (els.spotifyUrl) els.spotifyUrl.addEventListener("input", () => {
      const hasUrl = !!(els.spotifyUrl.value || "").trim();
      if (els.btnOpenSpotify) els.btnOpenSpotify.disabled = !hasUrl;
    });

    els.btnGenerate.addEventListener("click", () => {
      clearLog();
      const batch = buildBatch({ requireOg: true });
      if (!batch || !batch.ok) return;

      const qrFiles = [`qrs/${batch.slug}/index.png`];

      addLogItem({
        title: "Preview (not published)",
        status: "READY",
        lines: [
          `OG image: ${batch.ogImageRel}`,
          `BG image: ${batch.ogImageRel.replace(/\.jpg$/i, '-bg.jpg')}`,
          `FG image: ${batch.ogImageRel.replace(/\.jpg$/i, '-fg.jpg')}`,
          `HTML file:`,
          `- ${batch.items[0].relPath}`,
          `QR file:`,
          `- ${normBaseUrl(els.repoBase.value)}/${qrFiles[0]}`
        ]
      });
      hideLogIfEmpty();
    });

    els.btnPublish.addEventListener("click", () => publishAll());
    if (els.btnReset) els.btnReset.addEventListener("click", () => resetForm());

    els.btnForgetToken.addEventListener("click", () => { forgetToken(); clearLog(); addLogItem({ title: "Token cleared", status: "OK", lines: ["Token removed from the browser."] }); });
    if (els.btnCopyCreds) els.btnCopyCreds.addEventListener("click", () => copyCredsToClipboard());
    if (els.btnTheme) els.btnTheme.addEventListener("click", () => cycleTheme());
    if (els.btnResolver) {
      console.log('Attaching resolver click listener');
      els.btnResolver.addEventListener("click", () => showResolver());
    }
    if (els.resolverForm) els.resolverForm.addEventListener("submit", (e) => { e.preventDefault(); runResolverSearch(els.resolverInput.value); });
    if (els.resolverResults) els.resolverResults.addEventListener("click", (e) => {
      const card = e.target.closest("[data-apple-url]");
      if (!card) return;
      applyResolverSelection(card);
    });
    if (els.btnResolverClose) els.btnResolverClose.addEventListener("click", () => hideResolver());
    if (els.resolverOverlay) els.resolverOverlay.addEventListener("click", (e) => { if (e.target === els.resolverOverlay) hideResolver(); });
    if (els.btnOpenSpotify) els.btnOpenSpotify.addEventListener("click", () => {
      const url = (els.spotifyUrl?.value || "").trim();
      if (url) window.open(url, '_blank');
    });
    if (els.btnSearchSpotify) els.btnSearchSpotify.addEventListener("click", () => {
      const title = (els.title?.value || "").trim();
      const artist = (els.artist?.value || "").trim();
      const query = [title, artist].filter(Boolean).join(" ");
      if (query) {
        const searchUrl = `https://open.spotify.com/search/${encodeURIComponent(query)}`;
        window.open(searchUrl, '_blank');
      }
    });
    document.addEventListener("keydown", (e) => {
      const resolverOpen = els.resolverOverlay && !els.resolverOverlay.classList.contains("hidden");
      if (resolverOpen && e.key === "Escape") hideResolver();
    });

    wireOgDragDrop();

    drawOgCanvasFromBitmap();
    syncSlugAndCampaignFromTitle();
    validateOnly();
    updateNeedsInput();
    updateMetaPixelStatus();
    hideLogIfEmpty();
  }

  wire();
})();
