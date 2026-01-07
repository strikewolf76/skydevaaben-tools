(function () {
  let bubble = null;
  let activeTarget = null;

  function ensureBubble() {
    if (bubble) return bubble;
    bubble = document.createElement("div");
    bubble.className = "tooltip-bubble";
    bubble.setAttribute("role", "tooltip");
    document.body.appendChild(bubble);
    return bubble;
  }

  function hideBubble() {
    activeTarget = null;
    if (bubble) bubble.classList.remove("visible");
  }

  function positionBubble(target) {
    if (!bubble || !target) return;
    const rect = target.getBoundingClientRect();
    const bubbleRect = bubble.getBoundingClientRect();
    const spacing = 8;
    let top = rect.top - bubbleRect.height - spacing;
    let left = rect.left + rect.width / 2 - bubbleRect.width / 2;

    // Flip below if not enough room above
    if (top < 8) top = rect.bottom + spacing;

    const maxLeft = window.innerWidth - bubbleRect.width - 8;
    if (left < 8) left = 8;
    if (left > maxLeft) left = maxLeft;

    bubble.style.top = `${top}px`;
    bubble.style.left = `${left}px`;
  }

  function showBubble(target) {
    const tip = target?.dataset?.tip;
    if (!tip) return;
    ensureBubble();
    bubble.textContent = tip;
    bubble.classList.add("visible");
    activeTarget = target;
    positionBubble(target);
  }

  function onEnter(e) {
    const t = e.currentTarget;
    showBubble(t);
  }

  function onLeave() {
    hideBubble();
  }

  function onMove(e) {
    if (!activeTarget || !bubble || bubble.classList.contains("visible") === false) return;
    positionBubble(e.currentTarget);
  }

  function handleEsc(e) {
    if (e.key === "Escape") hideBubble();
  }

  function wireTooltips() {
    const targets = document.querySelectorAll("[data-tip]");
    targets.forEach(t => {
      t.addEventListener("mouseenter", onEnter);
      t.addEventListener("mouseleave", onLeave);
      t.addEventListener("focus", onEnter);
      t.addEventListener("blur", onLeave);
      t.addEventListener("mousemove", onMove);
    });
    document.addEventListener("keydown", handleEsc);
  }

  if (document.readyState === "complete" || document.readyState === "interactive") {
    wireTooltips();
  } else {
    document.addEventListener("DOMContentLoaded", wireTooltips);
  }
})();
