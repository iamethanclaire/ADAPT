// Size functionality
let size = 100;
let sizeStep = 10; // this should be changable in settings
let maxSize = 200; // this should be changable in settings
let minSize = 50; // this should be changable in settings

const sizeInput = adaptShadow.getElementById("adapt-size-value");

// set initial input value
sizeInput.value = size + "%";

// handle size input changes
sizeInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        const numValue = parseInt(e.target.value) || 100;
        if (numValue >= minSize && numValue <= maxSize) {
            size = numValue;
        } else if (numValue < minSize) {
            size = minSize;
        } else if (numValue > maxSize) {
            size = maxSize;
        }
        e.target.value = size + "%";
        e.target.blur();
    }
});

sizeInput.addEventListener("blur", (e) => {
    const numValue = parseInt(e.target.value) || 100;
    if (numValue >= minSize && numValue <= maxSize) {
        size = numValue;
    } else if (numValue < minSize) {
        size = minSize;
    } else if (numValue > maxSize) {
        size = maxSize;
    }
    e.target.value = size + "%";
});

// font size buttons

function decreaseSize() {
    if (size - sizeStep >= minSize) {
        size = size - sizeStep;
        sizeInput.value = size + "%";
        console.log("decrease font size to " + size + "%");
    } else {
        size = minSize;
    }
}

function increaseSize() {
    if (size + sizeStep <= maxSize) {
        size = size + sizeStep;
        sizeInput.value = size + "%";
        console.log("increase font size to " + size + "%");
    } else {
        size = maxSize;
    }
}