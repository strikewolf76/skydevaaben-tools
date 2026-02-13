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

    btnResolver: $("btnResolver"),
    resolverOverlay: $("resolverOverlay"),
    resolverForm: $("resolverForm"),
    resolverInput: $("resolverInput"),
    resolverResults: $("resolverResults"),
    resolverStatus: $("resolverStatus"),
    btnResolverClose: $("btnResolverClose"),

    destEditor: $("destEditor"),

    btnTestSpotify: $("btnTestSpotify"),
    btnSearchSpotify: $("btnSearchSpotify"),

    repoBaseDisplay: $("repoBaseDisplay"),
    siteNameDisplay: $("siteNameDisplay"),
    tokenStatusText: $("tokenStatusText"),
    tokenInputWrap: $("tokenInputWrap"),

    validationPanel: $("validationPanel"),
    previewPanel: null, // removed
    logPanel: $("logPanel"),

    shortUrlPanel: $("shortUrlPanel"),
    shortSlug: $("shortSlug"),
    platformYt: $("platformYt"),
    platformIg: $("platformIg"),
    platformFb: $("platformFb"),
    platformTt: $("platformTt"),
    numReels: $("numReels"),

    ogFile: $("ogFile"),
    ogFileInfo: $("ogFileInfo"),
    ogCanvas: $("ogCanvas"),
    ogImageNamePreview: $("ogImageNamePreview"),

    validation: $("validation"),
    log: $("log"),

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
    
    resolverStatus = `<span class="info">Trying to resolve...</span>`;
    validateOnly();
    
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
            resolverStatus = `<span class="ok">✓ Resolved to Spotify URL: ${spotifyUrl}</span>`;
          } else {
            resolverStatus = `<span class="warn">⚠ Spotify URL not found. Try the Search button to find manually on Spotify.</span>`;
          }
          if (els.btnTestSpotify) els.btnTestSpotify.disabled = !spotifyUrl;
          if (els.btnSearchSpotify) els.btnSearchSpotify.disabled = !!spotifyUrl;
          updated = true;
        }
      }

      if (updated) {
        validateOnly();
        updateNeedsInput();
      }
    } catch (e) {
      resolverStatus = `<span class="bad">✗ Resolver failed. Fill manually or try again.</span>`;
      validateOnly();
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

  function setMetaPixelStatus(status, value = "") {
    metaPixelStatus = status;
    const displayText = value ? `Pixel: ${value}` : (status === "ok" ? "OK" : status === "pending" ? "Checking…" : "NOT SET");
    if (els.metaPixelStatusText) {
      els.metaPixelStatusText.textContent = displayText;
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

  let currentTheme = "base";
  let currentToken = "";

  const REPO_BASE_LOCKED = "https://skydevaaben.no";

  const THEMES = ["base", "ocean", "forest", "sunset", "sand", "slate", "mint"];

  const OWNER = "strikewolf76";
  const REPO = "skydevaaben";
  const BRANCH = "main";

  let ogImageLoaded = false;
  let ogImageBitmap = null;
  let ogImageError = null;
  let ogImageSlug = null;
  let allSlugs = [];
  let songNames = {};
  let resolverStatus = ""; // Track resolver status for validation

  // Generate short slug from artist and title
  function generateShortSlug(artist, title) {
    if (!title) return "";
    
    // Get first letter of each word in title
    const titleWords = title.split(/\s+/).filter(word => word.length > 0);
    const titleFirsts = titleWords.map(word => word.charAt(0).toUpperCase()).join("");
    
    return titleFirsts;
  }

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

  function collectSettings() {
    return {
      metaPixelId: els.metaPixelId.value,
      theme: currentTheme,
      token: currentToken,
    };
  }

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
    
    // Auto-generate short slug if field is empty
    const currentShortSlug = (els.shortSlug.value || "").trim();
    if (!currentShortSlug) {
      const artist = (els.artist.value || "").trim();
      const title = (els.title.value || "").trim();
      const autoShortSlug = generateShortSlug(artist, title);
      if (autoShortSlug) {
        els.shortSlug.value = autoShortSlug.toLowerCase();
      }
    }
    
    const imageSlug = ogImageSlug || slug;
    els.ogImageNamePreview.textContent = imageSlug ? `assets/og/${imageSlug}.jpg` : "";
  }

  function updateMetaPixelStatus() {
    const val = (els.metaPixelId?.value || "").trim();
    console.log('metaPixelId value:', val);
    setMetaPixelStatus(val.length > 0 ? "ok" : "bad", val);
  }

  // ---------- HTML generation ----------
  function generateHtml({
    title,
    artist,
    siteName,
    description,
    ogUrlAbs,
    ogImageAbs,
    destinations,
    metaPixelId,
    trackSlug,
    utm_campaign
  }) {
    // Ensure artist is a string
    artist = String(artist || "").trim();
    // title is song, artist is artist

    // Generate buttons for each destination
    const buttonsHtml = destinations.map(dest => {
      if (dest.key === "spotify") {
        return `<a class="cta spotify-btn" href="${htmlEscape(dest.baseUrl)}" data-dest="${htmlEscape(dest.key)}" rel="noopener noreferrer">
        <span class="spotify-logo">
          <svg width="28" height="28" viewBox="0 0 168 168"><circle fill="#1ED760" cx="84" cy="84" r="84"/><path d="M120.1 116.6c-1.7 2.8-5.3 3.7-8.1 2-22.2-13.6-50.2-16.7-83.2-9.2-3.2.7-6.4-1.3-7.1-4.5-.7-3.2 1.3-6.4 4.5-7.1 35.7-7.9 66.1-4.4 90.2 10.5 2.8 1.7 3.7 5.3 2 8.3zm11.5-23.1c-2.1 3.4-6.5 4.5-9.9 2.4-25.5-15.6-64.5-20.1-94.7-11.1-3.8 1.1-7.8-1.1-8.9-4.9-1.1-3.8 1.1-7.8 4.9-8.9 33.9-9.8 76.1-5 104.7 12.2 3.4 2.1 4.5 6.5 2.4 9.9zm12.7-25.2c-30.1-18.1-79.7-19.8-108.1-11.1-4.4 1.3-9-1.2-10.3-5.6-1.3-4.4 1.2-9 5.6-10.3 31.9-9.5 85.2-7.6 119.6 12.3 4 2.4 5.3 7.7 2.9 11.7-2.4 4-7.7 5.3-11.7 2.9z" fill="#fff"/></svg>
        </span>
        <span class="spotify-text">Play</span>
      </a>`;
      } else {
        const buttonLabel = dest.key === "apple" ? "Listen on Apple Music" : dest.key === "deezer" ? "Listen on Deezer" : "Listen";
        return `<a class="cta" href="${htmlEscape(dest.baseUrl)}" data-dest="${htmlEscape(dest.key)}" rel="noopener noreferrer">${buttonLabel}</a>`;
      }
    }).join("");

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${artist ? htmlEscape(artist) + " - " + htmlEscape(title) : htmlEscape(title)}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">

  <meta property="og:type" content="music.song">
  <meta property="og:site_name" content="${htmlEscape(siteName)}">
  <meta property="og:title" content="${artist ? htmlEscape(artist) + " - " + htmlEscape(title) : htmlEscape(title)}">
  <meta property="og:description" content="${htmlEscape(description)}">
  <meta property="og:url" content="${htmlEscape(ogUrlAbs)}">
  <meta property="og:image" content="${htmlEscape(ogImageAbs)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${artist ? htmlEscape(artist) + " - " + htmlEscape(title) : htmlEscape(title)}">
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
      background: rgba(0,0,0,0.35);
      border-radius: 16px;
      padding: 24px 24px 32px 24px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.25);
      max-width: 340px;
    }
    .cover {
      width: 280px;
      height: 280px;
      object-fit: cover;
      border-radius: 10px;
      box-shadow: 0 6px 24px rgba(0,0,0,0.5);
      margin-bottom: 20px;
    }
    .track-title {
      font-size: 1.2rem;
      font-weight: 600;
      margin-bottom: 6px;
      text-align: center;
    }
    .track-subtitle {
      font-size: 1rem;
      opacity: 0.85;
      margin-bottom: 18px;
      text-align: center;
    }
    .service-buttons {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 12px;
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
      text-align: center;
    }
    .cta:hover {
      background: rgba(0,0,0,0.9);
    }
    .cta.spotify-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fff;
      color: #191414;
      border: none;
      font-size: 1.1rem;
      font-weight: 600;
      border-radius: 8px;
      padding: 12px 0;
      box-shadow: 0 2px 8px rgba(30,215,96,0.10);
      transition: background 0.2s;
      gap: 10px;
    }
    .cta.spotify-btn:hover {
      background: #1ed760;
      color: #191414;
    }
    .spotify-logo {
      display: flex;
      align-items: center;
    }
    .spotify-text {
      font-size: 1.1rem;
      font-weight: 600;
      letter-spacing: 0.01em;
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
    <div class="track-title">${artist ? htmlEscape(artist) + " - " + htmlEscape(title) : htmlEscape(title)}</div>
    <div class="track-subtitle">Choose your preferred music service</div>
    <div class="service-buttons">
      ${buttonsHtml}
    </div>
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
  var UTM_CONTENT_DEFAULT = "meta";

  var params = new URLSearchParams(window.location.search || "");
  var CID = params.get("cid") || "";
  var consentGranted = false;
  var pixelEventsQueued = [];
  var clickLocked = false;
  var pageViewFired = false;

  // Allow known social crawlers to fetch OG tags (no redirect)
  var ua = navigator.userAgent || "";
  var isCrawler = /(facebookexternalhit|facebot|twitterbot|linkedinbot|discordbot|pinterest|slackbot|whatsapp|telegrambot|skypeuripreview)/i.test(ua);
  var isInAppBrowser = /(FBAN|FBAV|Instagram|Messenger|Line|TikTok)/i.test(ua);
  if (isCrawler) return;

  // Helper functions
  function hasConsent() {
    try {
      return localStorage.getItem("sv_cookie_consent") === "granted";
    } catch (_) {
      return false;
    }
  }

  function setConsentGranted() {
    if (consentGranted) return;
    consentGranted = true;
    try {
      localStorage.setItem("sv_cookie_consent", "granted");
    } catch (_) {}
    if (typeof window.fbq === "function" && META_PIXEL_ID) {
      fbq("consent", "grant");
      // Fire queued events
      while (pixelEventsQueued.length > 0) {
        var ev = pixelEventsQueued.shift();
        ev();
      }
    }
  }

  function showConsentNoticeIfNeeded() {
    if (!hasConsent()) {
      var consentInfoEl = document.getElementById("consent-info");
      if (consentInfoEl) consentInfoEl.style.display = "block";
    }
  }

  function firePageViewOnce() {
    if (pageViewFired) return;
    if (typeof window.fbq !== "function" || !META_PIXEL_ID) return;
    pageViewFired = true;
    try { fbq("track", "PageView"); } catch (_) {}
  }

  // Show consent notice for new users
  showConsentNoticeIfNeeded();

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
    
    // If returning user: grant immediately and fire PageView
    if (hasConsent()) {
      setConsentGranted();
      firePageViewOnce();
    } else {
      // Queue PageView until consent granted
      pixelEventsQueued.push(function () { firePageViewOnce(); });
    }
  }

  function appendUtms(url, utms) {
    var u = new URL(url);
    Object.keys(utms).forEach(function(k) {
      if (utms[k]) u.searchParams.set(k, utms[k]);
    });
    return u.toString();
  }

  function fireOutboundSpotify(kind, destKey, dest) {
    if (typeof window.fbq !== "function" || !META_PIXEL_ID) return;
    try {
      var eventId = "ob_" + Date.now() + "_" + Math.random().toString(16).slice(2);
      fbq("trackCustom", "OutboundSpotify", {
        kind: kind,
        cid: CID || "",
        slug: TRACK_SLUG || "",
        dest: destKey === "spotify" ? "spotify" : destKey,
        channel: "meta",
        track_id: (dest && dest.spotifyId) ? dest.spotifyId : "",
        utm_campaign: UTM_CAMPAIGN || "",
        utm_content: (CID || UTM_CONTENT_DEFAULT || "")
      }, { eventID: eventId });
    } catch (_) {}
  }

  function handleClick(destKey, e) {
    // Allow modified clicks (open in new tab etc.)
    if (e && (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1)) return;

    if (clickLocked) return;

    if (e && e.preventDefault) e.preventDefault();

    var dest = DESTINATIONS.find(d => d.key === destKey);
    if (!dest) return;

    clickLocked = true;

    var webUrl = appendUtms(dest.baseUrl, { utm_campaign: UTM_CAMPAIGN, utm_content: (CID || UTM_CONTENT_DEFAULT) });

    if (!hasConsent()) {
      setConsentGranted();
    }
    firePageViewOnce();
    fireOutboundSpotify("click", destKey, dest);

    try {
      if (navigator.sendBeacon && META_PIXEL_ID) {
        navigator.sendBeacon("https://www.facebook.com/tr/", new Blob([], { type: "application/x-www-form-urlencoded" }));
      }
    } catch (_) {}
    
    // Always redirect to web URL (instant in in-app browsers; short delay elsewhere)
    if (isInAppBrowser) {
      window.location.href = webUrl;
    } else {
      setTimeout(function () { window.location.href = webUrl; }, 120);
    }
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

  function generateShortUrlHtml(trackSlug) {
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="robots" content="noindex,nofollow" />
  <title>Redirecting…</title>
</head>
<body>
<script>
(function () {
  var targetBase = "https://skydevaaben.no/tracks/${htmlEscape(trackSlug)}/index.html";
  var params = new URLSearchParams(window.location.search || "");

  // Default cid if none provided
  if (!params.has("cid")) params.set("cid", "notcidded");

  window.location.replace(targetBase + "?" + params.toString());
})();
</script>
</body>
</html>`;
  }

  function generateRHtml(shortSlug, cid) {
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="robots" content="noindex,nofollow" />
  <title>Redirecting…</title>
</head>
<body>
<script>
(function () {
  var targetBase = "https://skydevaaben.no/shorturl/${htmlEscape(shortSlug)}/";
  var params = new URLSearchParams(window.location.search || "");

  params.set("cid", "${htmlEscape(cid)}");

  window.location.replace(targetBase + "?" + params.toString());
})();
</script>
</body>
</html>`;
  }

  // ---------- validation + batch build ----------
  async function validateOnly(requireOg = true) {
    syncSlugAndCampaignFromTitle();
    const errors = [];
    const warnings = [];
    updateNeedsInput();
    resolverStatus = ""; // Clear resolver status on validation

    const title = (els.title.value || "").trim();
    const artist = (els.artist.value || "").trim();

    // If no basic inputs, show nothing
    if (!title && !artist) {
      els.validation.innerHTML = '';
      hide(els.validationPanel);
      return { ok: false, errors, warnings };
    }

    // Check song name uniqueness
    if (title) {
      try {
        await fetchIndexHtml();
        const existingTitles = Object.values(songNames);
        if (existingTitles.includes(title)) {
          errors.push(`Song name "${title}" already exists. Must be unique.`);
        }
      } catch (e) {
        console.warn('Could not check song uniqueness:', e);
      }
    }

    const slugRaw = (els.trackSlug.value || "");
    if (/_/.test(slugRaw)) errors.push("Track slug contains '_' (underscore). Use hyphens only.");
    const slug = sanitizeSlug(slugRaw);
    required("Track slug", slug, errors);

    // Check slug uniqueness
    if (slug) {
      try {
        await fetchIndexHtml();
        if (allSlugs.includes(slug)) {
          errors.push(`Slug "${slug}" already exists. Choose a different slug.`);
        }
      } catch (e) {
        console.warn('Could not check slug uniqueness:', e);
      }
    }

    const utmCampaign = sanitizeSlug(els.utmCampaign.value);
    required("utm_campaign", utmCampaign, errors);

    const anyDest = els.destSpotify.checked;
    if (!anyDest) errors.push("Select at least one destination.");

    let spotifyIdParsed = null;
    if (els.destSpotify.checked) {
      spotifyIdParsed = parseSpotifyTrackId(els.spotifyUrl.value || "");
      if (!spotifyIdParsed) errors.push("Spotify URL must contain a track ID");
    }

    // Check cover exists
    if (slug) {
      try {
        const ogPath = `assets/og/${slug}.jpg`;
        await ghFetch(`/repos/${OWNER}/${REPO}/contents/${ogPath}`, { token });
        warnings.push(`Cover exists at ${ogPath}, existing cover will be used.`);
      } catch (e) {
        // File does not exist, that's fine
      }
    }

    // Check short URL uniqueness
    const shortSlug = (els.shortSlug.value || "").trim();
    const platformsChecked = [els.platformYt, els.platformIg, els.platformFb, els.platformTt].filter(cb => cb.checked).length > 0;
    if (platformsChecked) {
      if (!shortSlug) {
        errors.push("Short slug is required when platforms are selected.");
      } else {
        try {
          await fetchIndexHtml();
          const used = allSlugs.some(slug => slug.substring(2, slug.length - 1) === shortSlug);
          if (used) {
            errors.push(`Short slug "${shortSlug}" is already in use. Please change it manually.`);
          }
        } catch (e) {
          console.warn('Could not check short slug uniqueness:', e);
        }
      }
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
      return { ok: false, errors, warnings };
    }

    let status = `<span class="ok">OK</span>`;
    if (warnings.length) {
      status += `\n<span class="warn">WARNINGS</span>\n` + warnings.map(w => `- ${w}`).join("\n");
    }
    
    // Add resolver status
    if (resolverStatus) {
      status += `\n${resolverStatus}`;
    }
    
    status += `\n- Publish will create/update:\n` +
      `  - assets/og/${imageSlug}.jpg\n` +
      `  - assets/og/${imageSlug}-bg.jpg\n` +
      `  - assets/og/${imageSlug}-fg.jpg\n` +
      `  - tracks/${slug}/index.html\n` +
      `  - qrs/${slug}/index.png\n`;
    
    if (platformsChecked && shortSlug) {
      const platforms = [];
      if (els.platformYt.checked) platforms.push('yt');
      if (els.platformIg.checked) platforms.push('ig');
      if (els.platformFb.checked) platforms.push('fb');
      if (els.platformTt.checked) platforms.push('tt');
      
      const shortUrls = platforms.flatMap(platform => 
        ['1', '2', '3', '4'].map(version => `r/${platform}${shortSlug}${version}.html`)
      );
      
      status += `  - ${shortUrls.join('\n  - ')}\n`;
    }
    
    els.validation.innerHTML = status;
    show(els.validationPanel);

    return { ok: true, errors, warnings };
  }

  async function updateValidation() {
    const v = await validateOnly(false); // Don't require OG for real-time
    els.btnPublish.disabled = !v.ok;
  }

  async function buildBatch({ requireOg = true } = {}) {
    const v = await validateOnly(requireOg);
    if (!v.ok) return null;

    const repoBase = normBaseUrl(els.repoBase.value);
    const siteName = (els.siteName.value || "").trim();
    const title = (els.title.value || "").trim();
    const artist = (els.artist.value || "").trim();
    const metaPixelId = (els.metaPixelId.value || "").trim();
    const spotifyIdParsed = parseSpotifyTrackId(els.spotifyUrl.value || "");

    const hasSpotify = !!(els.destSpotify.checked && spotifyIdParsed);
    const description = autoDescription({ hasSpotify, hasApple: false });

    const slug = sanitizeSlug(els.trackSlug.value);
    const utm_campaign = sanitizeSlug(els.utmCampaign.value);

    const shortSlug = sanitizeSlug(els.shortSlug.value || "");
    const platforms = [];
    if (els.platformYt.checked) platforms.push({key: 'yt', name: 'YouTube'});
    if (els.platformIg.checked) platforms.push({key: 'ig', name: 'Instagram'});
    if (els.platformFb.checked) platforms.push({key: 'fb', name: 'Facebook'});
    if (els.platformTt.checked) platforms.push({key: 'tt', name: 'TikTok'});
    const numReels = Math.max(1, Math.min(10, parseInt(els.numReels.value) || 3));

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

    const pagesUrl = ogUrlAbs; // no default cid

    const html = generateHtml({
      title,
      artist,
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

    const shortUrlItems = [];
    if (shortSlug) {
      // shorturl
      const shortUrlHtml = generateShortUrlHtml(slug);
      shortUrlItems.push({
        relPath: `shorturl/${shortSlug}/index.html`,
        pagesUrl: `${repoBase}/shorturl/${shortSlug}/`,
        html: shortUrlHtml
      });

      // r/ folders
      for (const platform of platforms) {
        for (let i = 1; i <= numReels; i++) {
          const cid = `org-${platform.key}-${shortSlug}-r${i}`;
          const rHtml = generateRHtml(shortSlug, cid);
          shortUrlItems.push({
            relPath: `r/${platform.key}${shortSlug}${i}/index.html`,
            pagesUrl: `${repoBase}/r/${platform.key}${shortSlug}${i}/`,
            html: rHtml
          });
        }
      }
    }

    return { ok: true, slug, shortSlug, platforms, numReels, ogImageRel, ogImageAbs, items, shortUrlItems };
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
      return;
    }

    if (!batch.items.length) {
      els.previewBody.innerHTML = '<tr><td colspan="3" class="text-center">No landing page.</td></tr>';
      return;
    }

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

  // Helper to get file content from repo
  async function getRepoFileContents(path) {
    const res = await ghFetch(`/repos/${OWNER}/${REPO}/contents/${path}`, { token: currentToken });
    if (res.content) {
      return atob(res.content.replace(/\s/g, ''));
    }
    throw new Error(`File not found: ${path}`);
  }

  // Function to fetch and parse the current r/index.html
  async function fetchIndexHtml() {
    try {
      const content = await getRepoFileContents('r/index.html');
      console.log('Fetched content length:', content.length);
      // Extract the slugs array using regex (assumes it's defined as const slugs = [ ... ]; on one or more lines)
      const slugsMatch = content.match(/const slugs = \[([^\]]*)\];/s); // 's' flag for multiline
      if (slugsMatch) {
        // Parse the array string into an array (split by commas, trim quotes)
        allSlugs = slugsMatch[1].split(',').map(s => s.trim().replace(/['"]/g, '')).filter(s => s);
        console.log('Parsed slugs:', allSlugs.length);
      } else {
        console.log('Slugs match failed');
        throw new Error('Could not parse slugs array from index.html');
      }
      // Extract the songNames object
      const songNamesMatch = content.match(/const songNames = \{([^}]*)\};/s);
      if (songNamesMatch) {
        // Parse the object string into a simple object
        const songNamesStr = songNamesMatch[1];
        songNames = {};
        // Simple parsing of key: 'value' pairs
        const pairs = songNamesStr.split(',').map(s => s.trim());
        pairs.forEach(pair => {
          const [key, value] = pair.split(':').map(s => s.trim().replace(/['"]/g, ''));
          if (key && value) {
            songNames[key] = value;
          }
        });
        console.log('Parsed songNames:', Object.keys(songNames).length);
      } else {
        console.log('songNames match failed');
        songNames = {}; // Fallback
      }
      return content;
    } catch (error) {
      console.warn('Failed to fetch index.html:', error);
      allSlugs = []; // Fallback to empty
      songNames = {}; // Fallback
      return null;
    }
  }

  // Function to update and publish r/index.html with new slugs
  async function updateIndexHtml(newSlugs) {
    console.log('updateIndexHtml called with:', newSlugs);
    // Fetch current content
    const currentContent = await fetchIndexHtml();
    if (!currentContent) {
      console.log('No current content fetched');
      return; // Skip if fetch failed
    }

    // Append new slugs, avoiding duplicates
    const uniqueNewSlugs = newSlugs.filter(slug => !allSlugs.includes(slug));
    console.log('Unique new slugs:', uniqueNewSlugs);
    allSlugs.push(...uniqueNewSlugs);

    // Regenerate the slugs array string (format as multiline for readability)
    const slugsString = allSlugs.map(slug => `'${slug}'`).join(',\n      ');

    // Replace the slugs array in the content
    const updatedContent = currentContent.replace(
      /const slugs = \[([^\]]*)\];/s,
      `const slugs = [\n      ${slugsString}\n    ];`
    );

    console.log('Publishing updated index.html');
    // Publish the updated file
    await putFile({ owner: OWNER, repo: REPO, branch: BRANCH, token, path: 'r/index.html', message: `Update slugs: added ${uniqueNewSlugs.join(', ')}`, contentBase64: utf8ToBase64(updatedContent) });

    // Log the update
    addLogItem({
      title: `Updated r/index.html`,
      status: "PUBLISHED",
      lines: [`Added ${uniqueNewSlugs.length} new slugs: ${uniqueNewSlugs.join(', ')}; total: ${allSlugs.length}`]
    });
  }

  // ---------- publish ----------
  async function publishAll() {
    clearLog();

    const v = await validateOnly();
    if (!v.ok) return;

    const repoBase = normBaseUrl(els.repoBase.value);

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
        `Files: ${batch.items.length}`,
        `Short URLs: ${batch.shortUrlItems ? batch.shortUrlItems.length : 0}`
      ]
    });

    let failures = 0;
    const pendingUploads = [];

    // Prepare OG image upload
    try {
      const ogJpgB64 = await canvasToJpegBase64(els.ogCanvas, 0.92);
      pendingUploads.push({
        path: batch.ogImageRel,
        link: batch.ogImageAbs,
        type: "OG",
        run: async () => putFile({ owner: OWNER, repo: REPO, branch: BRANCH, token, path: batch.ogImageRel, message: `OG image: ${batch.slug}`, contentBase64: ogJpgB64 })
      });

      // Prepare BG image upload
      const bgCanvas = drawBgCanvasFromBitmap();
      const bgJpgB64 = await canvasToJpegBase64(bgCanvas, 0.92);
      const bgPath = batch.ogImageRel.replace(/\.jpg$/i, '-bg.jpg');
      pendingUploads.push({
        path: bgPath,
        link: batch.ogImageAbs.replace(/\.jpg$/i, '-bg.jpg'),
        type: "BG",
        run: async () => putFile({ owner: OWNER, repo: REPO, branch: BRANCH, token, path: bgPath, message: `BG image: ${batch.slug}`, contentBase64: bgJpgB64 })
      });

      // Prepare FG image upload
      const fgJpgB64 = await bitmapToJpegBase64(ogImageBitmap, 0.92);
      const fgPath = batch.ogImageRel.replace(/\.jpg$/i, '-fg.jpg');
      pendingUploads.push({
        path: fgPath,
        link: batch.ogImageAbs.replace(/\.jpg$/i, '-fg.jpg'),
        type: "FG",
        run: async () => putFile({ owner: OWNER, repo: REPO, branch: BRANCH, token, path: fgPath, message: `FG image: ${batch.slug}`, contentBase64: fgJpgB64 })
      });
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
      pendingUploads.push({
        path: qrPath,
        link: `${repoBase}/${qrPath}`,
        type: "QR",
        run: async () => putFile({ owner: OWNER, repo: REPO, branch: BRANCH, token, path: qrPath, message: `QR: ${batch.slug}`, contentBase64: base64 })
      });
    } catch (e) {
      addLogItem({ title: "QR publish failed", status: "ERROR", lines: [normalizeTokenError(e)] });
      failures += 1;
    }

    // Prepare HTML uploads
    for (const it of batch.items) {
      try {
        const htmlB64 = utf8ToBase64(it.html);
        pendingUploads.push({
          path: it.relPath,
          link: it.pagesUrl,
          type: "HTML",
          item: it,
          run: async () => putFile({ owner: OWNER, repo: REPO, branch: BRANCH, token, path: it.relPath, message: `Landing page: ${batch.slug}`, contentBase64: htmlB64 })
        });
      } catch (e) {
        addLogItem({ title: `FAIL: ${it.relPath}`, status: "ERROR", lines: [normalizeTokenError(e)] });
        failures += 1;
      }
    }

    // Prepare short URL HTML uploads
    for (const it of batch.shortUrlItems || []) {
      try {
        const htmlB64 = utf8ToBase64(it.html);
        pendingUploads.push({
          path: it.relPath,
          link: it.pagesUrl,
          type: "SHORTURL",
          item: it,
          run: async () => putFile({ owner: OWNER, repo: REPO, branch: BRANCH, token, path: it.relPath, message: `Short URL: ${batch.shortSlug}`, contentBase64: htmlB64 })
        });
      } catch (e) {
        addLogItem({ title: `FAIL: ${it.relPath}`, status: "ERROR", lines: [normalizeTokenError(e)] });
        failures += 1;
      }
    }

    for (const job of pendingUploads) {
      try {
        await job.run();
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

    // Update index.html with new slugs
    const newSlugs = (batch.shortUrlItems || []).map(it => it.relPath.replace(/^r\//, '').replace(/\.html$/, ''));
    console.log('New slugs to add:', newSlugs);
    try {
      await updateIndexHtml(newSlugs);
    } catch (error) {
      console.error('Index update error:', error);
      addLogItem({ title: "Index update failed", status: "ERROR", lines: [normalizeTokenError(error)] });
      failures += 1;
    }

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
    if (els.btnTestSpotify) els.btnTestSpotify.disabled = true;
    if (els.btnSearchSpotify) els.btnSearchSpotify.disabled = true;

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
      if (els.btnTestSpotify) els.btnTestSpotify.disabled = !hasUrl;
      if (els.btnSearchSpotify) els.btnSearchSpotify.disabled = hasUrl;
    });

    // Real-time validation
    if (els.title) els.title.addEventListener("input", () => { syncSlugAndCampaignFromTitle(); updateValidation(); });
    if (els.artist) els.artist.addEventListener("input", () => { syncSlugAndCampaignFromTitle(); updateValidation(); });
    if (els.shortSlug) els.shortSlug.addEventListener("input", updateValidation);
    if (els.trackSlug) els.trackSlug.addEventListener("input", updateValidation);
    if (els.utmCampaign) els.utmCampaign.addEventListener("input", updateValidation);
    if (els.destSpotify) els.destSpotify.addEventListener("change", updateValidation);
    if (els.spotifyUrl) els.spotifyUrl.addEventListener("input", updateValidation);
    if (els.platformYt) els.platformYt.addEventListener("change", updateValidation);
    if (els.platformIg) els.platformIg.addEventListener("change", updateValidation);
    if (els.platformFb) els.platformFb.addEventListener("change", updateValidation);
    if (els.platformTt) els.platformTt.addEventListener("change", updateValidation);
    if (els.numReels) els.numReels.addEventListener("input", updateValidation);

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
    if (els.btnTestSpotify) els.btnTestSpotify.addEventListener("click", () => {
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
