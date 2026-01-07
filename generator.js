(function () {
  const $ = (id) => document.getElementById(id);

  const els = {
    repoBase: $("repoBase"),
    siteName: $("siteName"),
    ghToken: $("ghToken"),
    metaPixelId: $("metaPixelId"),
    metaPixelStatusText: $("metaPixelStatusText"),
    metaPixelInputWrap: $("metaPixelInputWrap"),

    title: $("title"),
    trackSlug: $("trackSlug"),
    utmCampaign: $("utmCampaign"),

    destSpotify: $("destSpotify"),
    spotifyUrl: $("spotifyUrl"),
    destApple: $("destApple"),
    appleUrl: $("appleUrl"),
    destDeezer: $("destDeezer"),
    deezerUrl: $("deezerUrl"),

    chMeta: $("chMeta"),
    metaContent: $("metaContent"),
    chTikTok: $("chTikTok"),
    ttContent: $("ttContent"),
    chYouTube: $("chYouTube"),
    ytContent: $("ytContent"),
    chIGDM: $("chIGDM"),
    igdmContent: $("igdmContent"),

    destEditor: $("destEditor"),
    chEditor: $("chEditor"),

    repoBaseDisplay: $("repoBaseDisplay"),
    siteNameDisplay: $("siteNameDisplay"),
    tokenStatusText: $("tokenStatusText"),
    tokenInputWrap: $("tokenInputWrap"),

    validationPanel: $("validationPanel"),
    previewPanel: $("previewPanel"),
    logPanel: $("logPanel"),

    ogFile: $("ogFile"),
    ogFileInfo: $("ogFileInfo"),
    ogCanvas: $("ogCanvas"),
    ogImageNamePreview: $("ogImageNamePreview"),

    validation: $("validation"),
    log: $("log"),

    btnChPrefill: $("btnChPrefill"),

    btnGenerate: $("btnGenerate"),
    btnPublish: $("btnPublish"),
    btnReset: $("btnReset"),
    btnForgetToken: $("btnForgetToken"),
    btnCopyCreds: $("btnCopyCreds"),
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
      .replace(/"/g, "&quot;");
  }

  const CHANNELS = {
    meta:   { utm_source: "meta",      utm_medium: "paid_social" },
    tiktok: { utm_source: "tiktok",    utm_medium: "paid_social" },
    youtube:{ utm_source: "youtube",   utm_medium: "paid_video"  },
    igdm:   { utm_source: "instagram", utm_medium: "dm"          }
  };

  const CHANNEL_UTM_DEFAULTS = {
    meta: "meta-ads-story01",
    tiktok: "tt-ads-infeed01",
    youtube: "yt-ads-instream01",
    igdm: "ig-dm-v1"
  };

  function appendUtms(destUrl, { utm_source, utm_medium, utm_campaign, utm_content }) {
    const u = new URL(destUrl);
    u.searchParams.set("utm_source", utm_source);
    u.searchParams.set("utm_medium", utm_medium);
    u.searchParams.set("utm_campaign", utm_campaign);
    u.searchParams.set("utm_content", utm_content);
    return u.toString();
  }

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

  function autoDescription({ hasSpotify, hasApple, hasDeezer }) {
    if (hasSpotify) return "Tap to open in Spotify.";
    if (hasApple) return "Tap to open in Apple Music.";
    if (hasDeezer) return "Tap to open in Deezer.";
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
    const appleMissing = els.destApple.checked && !(els.appleUrl.value || "").trim();
    const deezerMissing = els.destDeezer.checked && !(els.deezerUrl.value || "").trim();
    markNeed(els.spotifyUrl, spotifyMissing);
    markNeed(els.appleUrl, appleMissing);
    markNeed(els.deezerUrl, deezerMissing);

    const metaMissing = els.chMeta.checked && !(els.metaContent.value || "").trim();
    const ttMissing = els.chTikTok.checked && !(els.ttContent.value || "").trim();
    const ytMissing = els.chYouTube.checked && !(els.ytContent.value || "").trim();
    const igMissing = els.chIGDM.checked && !(els.igdmContent.value || "").trim();
    markNeed(els.metaContent, metaMissing);
    markNeed(els.ttContent, ttMissing);
    markNeed(els.ytContent, ytMissing);
    markNeed(els.igdmContent, igMissing);
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
  const TOKEN_KEY = "sv-generator-token";

  const REPO_BASE_LOCKED = "https://skydevaaben.no";

  const OWNER = "strikewolf76";
  const REPO = "skydevaaben";
  const BRANCH = "main";

  let ogImageLoaded = false;
  let ogImageBitmap = null;
  let ogImageError = null;

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

    if (!file) {
      els.ogFileInfo.textContent = "";
      drawOgCanvasFromBitmap();
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
      els.ogFileInfo.textContent = messages.join(" | ");
      drawOgCanvasFromBitmap();
      validateOnly();
    } catch (e) {
      els.ogFileInfo.textContent = `Failed to read image: ${String(e)}`;
      ogImageLoaded = false;
      ogImageBitmap = null;
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

  function collectSettings() {
    return {
      siteName: els.siteName.value,
      title: els.title.value,
      metaPixelId: els.metaPixelId.value,
      destSpotify: els.destSpotify.checked,
      spotifyUrl: els.spotifyUrl.value,
      destApple: els.destApple.checked,
      appleUrl: els.appleUrl.value,
      destDeezer: els.destDeezer.checked,
      deezerUrl: els.deezerUrl.value,
      chMeta: els.chMeta.checked,
      metaContent: els.metaContent.value,
      chTikTok: els.chTikTok.checked,
      ttContent: els.ttContent.value,
      chYouTube: els.chYouTube.checked,
      ytContent: els.ytContent.value,
      chIGDM: els.chIGDM.checked,
      igdmContent: els.igdmContent.value,
    };
  }

  let saveTimer = null;
  function persistSettingsSoon() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const data = collectSettings();
      safeSet(SETTINGS_KEY, JSON.stringify(data));
    }, 200);
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
      assign(els.siteName, s.siteName);
      assign(els.title, s.title);
      assign(els.metaPixelId, s.metaPixelId);
      assign(els.destSpotify, s.destSpotify, true);
      assign(els.spotifyUrl, s.spotifyUrl);
      assign(els.destApple, s.destApple, true);
      assign(els.appleUrl, s.appleUrl);
      assign(els.destDeezer, s.destDeezer, true);
      assign(els.deezerUrl, s.deezerUrl);
      assign(els.chMeta, s.chMeta, true);
      assign(els.metaContent, s.metaContent);
      assign(els.chTikTok, s.chTikTok, true);
      assign(els.ttContent, s.ttContent);
      assign(els.chYouTube, s.chYouTube, true);
      assign(els.ytContent, s.ytContent);
      assign(els.chIGDM, s.chIGDM, true);
      assign(els.igdmContent, s.igdmContent);
      updateMetaPixelStatus();
    } catch { /* ignore */ }
  }

  function loadToken() {
    return safeGet(TOKEN_KEY) || "";
  }

  function persistToken(token) {
    if (token && token.trim()) safeSet(TOKEN_KEY, token.trim());
    else safeSet(TOKEN_KEY, null);
  }

  function forgetToken() {
    persistToken("");
    els.ghToken.value = "";
    setTokenStatus("bad");
  }

  function syncSlugAndCampaignFromTitle() {
    const slug = sanitizeSlug(els.title.value || "");
    els.trackSlug.value = slug;
    els.utmCampaign.value = slug;
    els.ogImageNamePreview.textContent = slug ? `assets/og/${slug}.jpg` : "";
  }

  function updateMetaPixelStatus() {
    const val = (els.metaPixelId?.value || "").trim();
    setMetaPixelStatus(val ? "ok" : "bad");
  }

  // ---------- HTML generation ----------
  function generateHtml({
    title,
    siteName,
    description,
    ogUrlAbs,
    ogImageAbs,
    destType,
    spotifyTrackId,
    webUrl,
    metaPixelId,
    trackSlug,
    destKey,
    channel,
    utm_campaign,
    utm_content
  }) {
    const isSpotify = destType === "spotify";

    const appBlock = isSpotify ? `
  var TRACK_ID = "${htmlEscape(spotifyTrackId)}";
  var APP_URI = "spotify:track:" + TRACK_ID;
` : `
    var TRACK_ID = null;
  var APP_URI = null;
`;

    const normalBrowserLogic = isSpotify ? `
      try {
        trackOutbound("auto");
        window.location.href = APP_URI;
        setTimeout(function () {
          window.location.href = WEB_URL;
        }, 600);
      } catch (e) {
        trackOutbound("auto");
        window.location.href = WEB_URL;
      }
  ` : `
      trackOutbound("auto");
      window.location.href = WEB_URL;
  `;

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
    body { font-family: system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; margin: 16px; }
    .cta { font-size: 18px; padding: 14px 22px; display: inline-block; text-decoration: none; }
  </style>
</head>

<body>

  <p id="status">Opening…</p>

  <p>
    <a id="play"
       class="cta"
       href="${htmlEscape(webUrl)}">
      Open
    </a>
  </p>

<script>
(function () {${appBlock}
  var WEB_URL = "${htmlEscape(webUrl)}";
  WEB_URL = WEB_URL.replace(/&amp;/g, "&");
  var META_PIXEL_ID = "${htmlEscape(metaPixelId || "")}";
  var TRACK_SLUG = "${htmlEscape(trackSlug || "")}";
  var DEST_KEY = "${htmlEscape(destKey || "")}";
  var CHANNEL = "${htmlEscape(channel || "")}";
  var UTM_CAMPAIGN = "${htmlEscape(utm_campaign || "")}";
  var UTM_CONTENT = "${htmlEscape(utm_content || "")}";

  var params = new URLSearchParams(window.location.search || "");
  var CID = params.get("cid") || "";

  // Allow known social crawlers to fetch OG tags (no redirect)
  var ua = navigator.userAgent || "";
  var isCrawler = /(facebookexternalhit|facebot|twitterbot|linkedinbot|discordbot|pinterest)/i.test(ua);
  if (isCrawler) return;

  if (META_PIXEL_ID) {
    !(function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n;
      n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");

    try { fbq("consent", "revoke"); } catch (_) {}
    fbq("init", META_PIXEL_ID);
    try {
      var consent = localStorage.getItem("sv_cookie_consent");
      if (consent === "granted") fbq("consent", "grant");
    } catch (_) { /* ignore */ }
    fbq("track", "PageView");
  }

  var statusEl = document.getElementById("status");
  var playEl = document.getElementById("play");

  function isMetaInApp() {
    var ua = navigator.userAgent || "";
    return /FBAN|FBAV|FB_IAB|FBIOS|FB4A|Instagram|Messenger/i.test(ua);
  }

  function trackOutbound(kind) {
    if (!window.fbq || !META_PIXEL_ID) return;
    fbq("trackCustom", "OutboundSpotify", {
      kind: kind,
      cid: CID,
      slug: TRACK_SLUG,
      dest: DEST_KEY,
      channel: CHANNEL,
      utm_campaign: UTM_CAMPAIGN,
      utm_content: UTM_CONTENT,
      track_id: TRACK_ID || ""
    });
  }

  playEl.href = WEB_URL;
  playEl.addEventListener("click", function () { trackOutbound("click"); });

  if (isMetaInApp()) {
    playEl.removeAttribute("target");
    statusEl.textContent = "Opening…";
    setTimeout(function () {
      trackOutbound("auto");
      window.location.href = WEB_URL;
    }, 150);
  } else {
    statusEl.textContent = "Opening…";
${normalBrowserLogic}
  }
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

    const slugRaw = (els.trackSlug.value || "");
    if (/_/.test(slugRaw)) errors.push("Track slug contains '_' (underscore). Use hyphens only.");
    const slug = sanitizeSlug(slugRaw);
    required("Track slug", slug, errors);

    const utmCampaign = sanitizeSlug(els.utmCampaign.value);
    required("utm_campaign", utmCampaign, errors);

    const anyDest = els.destSpotify.checked || els.destApple.checked || els.destDeezer.checked;
    if (!anyDest) errors.push("Select at least one destination.");

    let spotifyIdParsed = null;
    if (els.destSpotify.checked) {
      spotifyIdParsed = parseSpotifyTrackId(els.spotifyUrl.value || "");
      if (!spotifyIdParsed) errors.push("Spotify URL must contain a track ID");
    }
    if (els.destApple.checked) required("Apple URL", (els.appleUrl.value || "").trim(), errors);
    if (els.destDeezer.checked) required("Deezer URL", (els.deezerUrl.value || "").trim(), errors);

    const anyCh = els.chMeta.checked || els.chTikTok.checked || els.chYouTube.checked || els.chIGDM.checked;
    if (!anyCh) errors.push("Select at least one channel.");

    if (els.chMeta.checked) required("utm_content (Meta)", els.metaContent.value, errors);
    if (els.chTikTok.checked) required("utm_content (TikTok)", els.ttContent.value, errors);
    if (els.chYouTube.checked) required("utm_content (YouTube)", els.ytContent.value, errors);
    if (els.chIGDM.checked) required("utm_content (IG DM)", els.igdmContent.value, errors);

    if (requireOg) {
      if (!ogImageLoaded) errors.push("OG image not uploaded yet (required).");
      if (ogImageError) errors.push(ogImageError);
    }

    els.ogImageNamePreview.textContent = slug ? `assets/og/${slug}.jpg` : "";

    if (errors.length) {
      els.validation.innerHTML = `<span class="bad">FAIL</span>\n` + errors.map(e => `- ${e}`).join("\n");
      show(els.validationPanel);
      return { ok: false, errors };
    }

    els.validation.innerHTML =
      `<span class="ok">OK</span>\n` +
      `- Publish will create/update:\n` +
      `  - assets/og/${slug}.jpg\n` +
      `  - tracks/${slug}/&lt;dest&gt;/meta.html (Meta)\n` +
      `  - tracks/${slug}/&lt;dest&gt;/&lt;utm_content&gt;.html (TikTok/YouTube/IG DM)\n`;
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
    const hasApple = !!els.destApple.checked;
    const hasDeezer = !!els.destDeezer.checked;
    const description = autoDescription({ hasSpotify, hasApple, hasDeezer });

    const slug = sanitizeSlug(els.trackSlug.value);
    const utm_campaign = sanitizeSlug(els.utmCampaign.value);

    const ogImageRel = `assets/og/${slug}.jpg`;
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
    if (els.destApple.checked) {
      destinations.push({ key: "apple", type: "web", baseUrl: (els.appleUrl.value || "").trim(), spotifyId: "" });
    }
    if (els.destDeezer.checked) {
      destinations.push({ key: "deezer", type: "web", baseUrl: (els.deezerUrl.value || "").trim(), spotifyId: "" });
    }

    const channels = [];
    if (els.chMeta.checked) channels.push({ key: "meta",   content: sanitizeSlug(els.metaContent.value) });
    if (els.chTikTok.checked) channels.push({ key: "tiktok", content: sanitizeSlug(els.ttContent.value) });
    if (els.chYouTube.checked) channels.push({ key: "youtube",content: sanitizeSlug(els.ytContent.value) });
    if (els.chIGDM.checked) channels.push({ key: "igdm",  content: sanitizeSlug(els.igdmContent.value) });

    const items = [];

    for (const dest of destinations) {
      for (const ch of channels) {
        const chMeta = CHANNELS[ch.key];
        if (!chMeta) {
          return { ok: false, error: `Unknown channel config for "${ch.key}".` };
        }
        const { utm_source, utm_medium } = chMeta;
        const utm_content = ch.content;

        let webUrl;
        try {
          webUrl = appendUtms(dest.baseUrl, { utm_source, utm_medium, utm_campaign, utm_content });
        } catch (e) {
          return { ok: false, error: `Invalid URL for destination "${dest.key}": ${dest.baseUrl}` };
        }

        const relPath = ch.key === "meta"
          ? `tracks/${slug}/${dest.key}/meta.html`
          : `tracks/${slug}/${dest.key}/${utm_content}.html`;
        const ogUrlAbs = `${repoBase}/${relPath}`;

        const pagesUrl = ch.key === "meta"
          ? `${ogUrlAbs}?cid=${encodeURIComponent(utm_content)}`
          : ogUrlAbs;

        const html = generateHtml({
          title,
          siteName,
          description,
          ogUrlAbs,
          ogImageAbs,
          destType: dest.key === "spotify" ? "spotify" : "web",
          spotifyTrackId: dest.spotifyId,
          webUrl,
          metaPixelId,
          trackSlug: slug,
          destKey: dest.key,
          channel: ch.key,
          utm_campaign,
          utm_content
        });

        items.push({
          relPath,
          pagesUrl,
          dest: dest.key,
          channel: ch.key,
          utm_source, utm_medium, utm_campaign, utm_content,
          finalDestUrl: webUrl,
          html
        });
      }
    }

    return { ok: true, slug, ogImageRel, ogImageAbs, items };
  }

  // ---------- presets ----------
  function ensureUtmDefault(channelKey) {
    const defaults = CHANNEL_UTM_DEFAULTS[channelKey];
    if (!defaults) return;
    if (channelKey === "meta" && !els.metaContent.value) els.metaContent.value = defaults;
    if (channelKey === "tiktok" && !els.ttContent.value) els.ttContent.value = defaults;
    if (channelKey === "youtube" && !els.ytContent.value) els.ytContent.value = defaults;
    if (channelKey === "igdm" && !els.igdmContent.value) els.igdmContent.value = defaults;
  }

  function prefillSelectedChannels() {
    const applyDefault = (key, inputEl) => {
      const def = CHANNEL_UTM_DEFAULTS[key];
      if (!inputEl) return;
      if (!inputEl.value) inputEl.value = def || "";
    };
    if (els.chMeta?.checked) applyDefault("meta", els.metaContent);
    if (els.chTikTok?.checked) applyDefault("tiktok", els.ttContent);
    if (els.chYouTube?.checked) applyDefault("youtube", els.ytContent);
    if (els.chIGDM?.checked) applyDefault("igdm", els.igdmContent);
    persistSettingsSoon();
    validateOnly();
    renderPreviewGrid();
    updateNeedsInput();
  }

  function fillUtmExamples() {
    els.metaContent.value = "meta-ads-story01";
    els.ttContent.value = "tt-ads-infeed01";
    els.ytContent.value = "yt-ads-instream01";
    els.igdmContent.value = "ig-dm-v1";
    persistSettingsSoon();
    validateOnly();
    renderPreviewGrid();
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
      els.previewBody.innerHTML = '<tr><td colspan="8" class="text-center">Fix validation to preview.</td></tr>';
      hide(els.previewPanel);
      return;
    }

    if (!batch.items.length) {
      els.previewBody.innerHTML = '<tr><td colspan="8" class="text-center">No combinations.</td></tr>';
      hide(els.previewPanel);
      return;
    }

    show(els.previewPanel);
    els.previewBody.innerHTML = batch.items.map(i => `
      <tr>
        <td>${htmlEscape(i.dest)}</td>
        <td>${htmlEscape(i.channel)}</td>
        <td>${htmlEscape(i.utm_source)}</td>
        <td>${htmlEscape(i.utm_medium)}</td>
        <td>${htmlEscape(i.utm_campaign)}</td>
        <td>${htmlEscape(i.utm_content)}</td>
        <td>${htmlEscape(i.pagesUrl)}</td>
        <td>${htmlEscape(i.finalDestUrl)}</td>
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

    // 1) Publish OG image
    try {
      const ogJpgB64 = await canvasToJpegBase64(els.ogCanvas, 0.92);
      await putFile({
        owner: OWNER, repo: REPO, branch: BRANCH, token,
        path: batch.ogImageRel,
        message: `OG image: ${batch.slug}`,
        contentBase64: ogJpgB64
      });
      addLogItem({
        title: `OK: ${batch.ogImageRel}`,
        status: "PUBLISHED",
        linkText: "Open OG image",
        linkHref: batch.ogImageAbs,
        lines: [`Repo path: ${batch.ogImageRel}`]
      });
    } catch (e) {
      addLogItem({
        title: `FAIL: ${batch.ogImageRel}`,
        status: "ERROR",
        lines: [normalizeTokenError(e)]
      });
      return;
    }

    let failures = 0;

    // Publish QR PNGs to repo
    try {
      await loadQrLib();
      for (const it of batch.items) {
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
        const qrPath = `qrs/${batch.slug}/${it.dest}-${it.channel}.png`;
        await putFile({
          owner: OWNER, repo: REPO, branch: BRANCH, token,
          path: qrPath,
          message: `QR: ${batch.slug} (${it.dest}/${it.channel})`,
          contentBase64: base64
        });

        addLogItem({
          title: `OK QR: ${qrPath}`,
          status: "PUBLISHED",
          linkText: "QR PNG",
          linkHref: `${repoBase}/${qrPath}`,
          lines: [`${repoBase}/${qrPath}`]
        });
      }
    } catch (e) {
      addLogItem({ title: "QR publish failed", status: "ERROR", lines: [normalizeTokenError(e)] });
      failures += 1;
    }

    // 2) Publish HTML files sequentially (avoid conflicts)
    for (const it of batch.items) {
      try {
        const htmlB64 = utf8ToBase64(it.html);
        await putFile({
          owner: OWNER, repo: REPO, branch: BRANCH, token,
          path: it.relPath,
          message: `Redirect: ${batch.slug} (${it.dest}) ${it.utm_content}`,
          contentBase64: htmlB64
        });

        addLogItem({
          title: `OK: ${it.relPath}`,
          status: "PUBLISHED",
          linkText: "Open Pages URL",
          linkHref: it.pagesUrl,
          lines: [
            `Repo path: ${it.relPath}`,
            `dest=${it.dest} utm_source=${it.utm_source} utm_medium=${it.utm_medium} utm_content=${it.utm_content}`
          ]
        });
      } catch (e) {
        addLogItem({
          title: `FAIL: ${it.relPath}`,
          status: "ERROR",
          lines: [normalizeTokenError(e)]
        });
        failures += 1;
        continue;
      }
    }

    if (failures > 0) {
      addLogItem({
        title: "DONE (with errors)",
        status: "PARTIAL",
        lines: [`${failures} of ${batch.items.length} HTML files failed. Check errors above.`]
      });
    } else {
      addLogItem({
        title: "DONE",
        status: "SUCCESS",
        lines: ["All files created/updated in GitHub. Give Pages a few seconds, then test the Pages URLs."]
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
    els.title.value = "";
    els.trackSlug.value = "";
    els.utmCampaign.value = "";

    els.destSpotify.checked = true;
    els.spotifyUrl.value = "";
    els.destApple.checked = false;
    els.appleUrl.value = "";
    els.destDeezer.checked = false;
    els.deezerUrl.value = "";

    els.chMeta.checked = true;
    els.metaContent.value = "";
    els.chTikTok.checked = true;
    els.ttContent.value = "";
    els.chYouTube.checked = true;
    els.ytContent.value = "";
    els.chIGDM.checked = false;
    els.igdmContent.value = "";

    els.ogFile.value = "";
    els.ogFileInfo.textContent = "";
    ogImageLoaded = false;
    ogImageBitmap = null;
    drawOgCanvasFromBitmap();

    clearLog();
    els.validation.textContent = "";
    els.ogImageNamePreview.textContent = "";

    syncSlugAndCampaignFromTitle();
    updateNeedsInput();
    updateMetaPixelStatus();
    persistSettingsSoon();
  }

  // ---------- wire ----------
  function wire() {
    // Enforce locked base URL regardless of localStorage state
    els.repoBase.value = REPO_BASE_LOCKED;
    applySettings();
    const savedToken = loadToken();
    if (savedToken) els.ghToken.value = savedToken;
    els.repoBase.value = REPO_BASE_LOCKED; // re-assert after applying other settings
    if (els.repoBaseDisplay) els.repoBaseDisplay.textContent = REPO_BASE_LOCKED;
    if (els.siteNameDisplay) els.siteNameDisplay.textContent = els.siteName.value || "";
    syncSlugAndCampaignFromTitle();
    updateNeedsInput();
    updateMetaPixelStatus();
    if (savedToken) validateTokenStatus(true); else setTokenStatus("bad");

    [
      els.repoBase, els.siteName, els.metaPixelId,
      els.ghToken,
      els.title,
      els.destSpotify, els.spotifyUrl, els.destApple, els.appleUrl, els.destDeezer, els.deezerUrl,
      els.chMeta, els.metaContent, els.chTikTok, els.ttContent, els.chYouTube, els.ytContent, els.chIGDM, els.igdmContent
    ].forEach(el => el.addEventListener("input", () => {
      if (el === els.title) syncSlugAndCampaignFromTitle();
      validateOnly();
      if (el !== els.ghToken) persistSettingsSoon();
      else {
        persistToken(els.ghToken.value);
        scheduleTokenValidation();
      }
      updateNeedsInput();
      if (el === els.metaPixelId) updateMetaPixelStatus();
    }));

    els.ogFile.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      onOgFileSelected(file);
    });

    els.btnGenerate.addEventListener("click", () => {
      clearLog();
      const batch = buildBatch({ requireOg: true });
      if (!batch || !batch.ok) return;
      renderPreviewGrid();

      const qrFiles = batch.items.map(i => `qrs/${batch.slug}/${i.dest}-${i.channel}.png`);

      addLogItem({
        title: "Preview (not published)",
        status: "READY",
        lines: [
          `OG image: ${batch.ogImageRel}`,
          `HTML files (${batch.items.length}):`,
          ...batch.items.map(i => `- ${i.relPath}`),
          `QR files (${qrFiles.length}):`,
          ...qrFiles.map(f => `- ${normBaseUrl(els.repoBase.value)}/${f}`)
        ]
      });
      hideLogIfEmpty();
    });

    els.btnPublish.addEventListener("click", () => publishAll());
    if (els.btnReset) els.btnReset.addEventListener("click", () => resetForm());

    els.btnForgetToken.addEventListener("click", () => { forgetToken(); clearLog(); addLogItem({ title: "Token cleared", status: "OK", lines: ["Token removed from the browser."] }); });
    if (els.btnCopyCreds) els.btnCopyCreds.addEventListener("click", () => copyCredsToClipboard());
    if (els.btnChPrefill) els.btnChPrefill.addEventListener("click", () => prefillSelectedChannels());
    if (els.chMeta) els.chMeta.addEventListener("change", () => { if (els.chMeta.checked) { ensureUtmDefault("meta"); persistSettingsSoon(); renderPreviewGrid(); validateOnly(); } });
    if (els.chTikTok) els.chTikTok.addEventListener("change", () => { if (els.chTikTok.checked) { ensureUtmDefault("tiktok"); persistSettingsSoon(); renderPreviewGrid(); validateOnly(); } });
    if (els.chYouTube) els.chYouTube.addEventListener("change", () => { if (els.chYouTube.checked) { ensureUtmDefault("youtube"); persistSettingsSoon(); renderPreviewGrid(); validateOnly(); } });
    if (els.chIGDM) els.chIGDM.addEventListener("change", () => { if (els.chIGDM.checked) { ensureUtmDefault("igdm"); persistSettingsSoon(); renderPreviewGrid(); validateOnly(); } });

    wireOgDragDrop();

    drawOgCanvasFromBitmap();
    syncSlugAndCampaignFromTitle();
    validateOnly();
    updateNeedsInput();
    updateMetaPixelStatus();
    renderPreviewGrid();
    hideLogIfEmpty();
  }

  wire();
})();
