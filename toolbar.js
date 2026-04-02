// toggle dropdown open/close
const dropdownBtn = document.getElementById("adapt-dropdown-btn");
const dropdownMenu = document.getElementById("adapt-dropdown-menu");

dropdownBtn.addEventListener("click", () => {
  const isOpen = dropdownMenu.style.display === "block";
  dropdownMenu.style.display = isOpen ? "none" : "block";
});

// close when clicking outside
document.addEventListener("click", (e) => {
  if (!document.getElementById("adapt-dropdown").contains(e.target)) {
    dropdownMenu.style.display = "none";
  }
});

// handle selection
document.querySelectorAll(".adapt-dropdown-item").forEach(item => {
  item.addEventListener("click", () => {
    dropdownBtn.textContent = item.textContent + " ▾";
    dropdownMenu.style.display = "none";
  });
});