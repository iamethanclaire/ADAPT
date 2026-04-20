// Leading functionality
let leading = 100;
let leadingStep = 10; // this should be changable in settings
let maxLeading = 200; // this should be changable in settings
let minLeading = 80; // this should be changable in settings

const leadingInput = adaptShadow.getElementById("adapt-leading-value");

// set initial input value
leadingInput.value = leading + "%";

// handle leading input changes
leadingInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        const numValue = parseInt(e.target.value) || 100;
        if (numValue >= minLeading && numValue <= maxLeading) {
            leading = numValue;
        } else if (numValue < minLeading) {
            leading = minLeading;
        } else if (numValue > maxLeading) {
            leading = maxLeading;
        }
        e.target.value = leading + "%";
        e.target.blur();
    }
});

leadingInput.addEventListener("blur", (e) => {
    const numValue = parseInt(e.target.value) || 100;
    if (numValue >= minLeading && numValue <= maxLeading) {
        leading = numValue;
    } else if (numValue < minLeading) {
        leading = minLeading;
    } else if (numValue > maxLeading) {
        leading = maxLeading;
    }
    e.target.value = leading + "%";
});

function decreaseLeading() {
    if (leading - leadingStep >= minLeading) {
        leading = leading - leadingStep;
        leadingInput.value = leading + "%";
        console.log("decrease text leading to " + leading + "%");
    } else {
        leading = minLeading;
    }
}

function increaseLeading() {
    if (leading + leadingStep <= maxLeading) {
        leading = leading + leadingStep;
        leadingInput.value = leading + "%";
        console.log("increase text leading to " + leading + "%");
    } else {
        leading = maxLeading;
    }
}