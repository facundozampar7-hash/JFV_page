document.addEventListener("DOMContentLoaded", () => {
  const viewport = document.getElementById("galleryViewport");
  const track = document.getElementById("galleryTrack");
  const prev = document.getElementById("galPrev");
  const next = document.getElementById("galNext");
  if (!viewport || !track) return;

  const originals = Array.from(track.querySelectorAll(".gallery-item"));
  if (!originals.length) return;

  // Duplicate the cards: the CSS animation moves exactly half the track,
  // producing a seamless infinite loop.
  originals.forEach(card => {
    const clone = card.cloneNode(true);
    clone.classList.remove("reveal", "is-visible");
    clone.classList.add("gallery-clone");
    track.appendChild(clone);
  });

  // The reveal system can hide the cloned cards; make sure they are visible.
  track.querySelectorAll(".gallery-clone").forEach(el => el.classList.add("is-visible"));

  const setPaused = paused => {
    viewport.classList.toggle("gallery-paused", paused);
  };

  // Pause only while the pointer is over an individual square/card.
  track.querySelectorAll(".gallery-item").forEach(card => {
    card.addEventListener("mouseenter", () => setPaused(true));
    card.addEventListener("mouseleave", () => setPaused(false));
  });

  // Buttons temporarily move the strip and then let the continuous animation resume.
  const cardStep = () => {
    const card = track.querySelector(".gallery-item");
    if (!card) return 300;
    return card.getBoundingClientRect().width + parseFloat(getComputedStyle(track).gap || 0);
  };

  next?.addEventListener("click", () => {
    setPaused(true);
    track.style.animation = "none";
    const current = parseFloat(getComputedStyle(track).getPropertyValue("--manual-x")) || 0;
    const x = current - cardStep();
    track.style.setProperty("--manual-x", `${x}px`);
    track.style.transform = `translate3d(${x}px,0,0)`;
    setTimeout(() => { track.style.removeProperty("animation"); track.style.removeProperty("transform"); track.style.removeProperty("--manual-x"); setPaused(false); }, 350);
  });

  prev?.addEventListener("click", () => {
    setPaused(true);
    track.style.animation = "none";
    const current = parseFloat(getComputedStyle(track).getPropertyValue("--manual-x")) || 0;
    const x = current + cardStep();
    track.style.setProperty("--manual-x", `${x}px`);
    track.style.transform = `translate3d(${x}px,0,0)`;
    setTimeout(() => { track.style.removeProperty("animation"); track.style.removeProperty("transform"); track.style.removeProperty("--manual-x"); setPaused(false); }, 350);
  });
});
