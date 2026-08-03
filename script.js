document.documentElement.classList.add("js");

const slots = document.querySelectorAll(".slot");

const reveal = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        reveal.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

slots.forEach((slot, index) => {
  slot.style.setProperty("--i", String(index));
  reveal.observe(slot);
});
