document.addEventListener("DOMContentLoaded", function() {
    d3.csv("ds_salaries.csv").then(function(data) {
        const workYears = new Set();

        // Extract unique years from the work_year column
        data.forEach(row => {
            const workYear = row.work_year;
            workYears.add(workYear);
        });

        const workYearArray = Array.from(workYears); // Convert set to an array

        const slider = document.getElementById('myRange');
        slider.min = Math.min(...workYearArray);
        slider.max = Math.max(...workYearArray);
        slider.value = Math.floor(workYearArray.length / 2);

        const sliderValue = document.getElementById('sliderValue');
        sliderValue.textContent = slider.value; // Set initial value

        let isPlaying = false;
        let intervalId;

        // Function to automatically move the slider to the next value
        function moveSlider() {
            const currentValue = parseInt(slider.value);
            const nextValue = currentValue + 1;
            if (nextValue <= slider.max) {
                slider.value = nextValue;
            } else {
                slider.value = slider.min; // Go back to the first value
            }
            sliderValue.textContent = slider.value;
        }

        // Function to start the autoplay
        function startSlider() {
            if (!isPlaying) {
                intervalId = setInterval(moveSlider, 2000);
                isPlaying = true;
            }
        }

        // Function to stop the autoplay
        function stopSlider() {
            clearInterval(intervalId);
            isPlaying = false;
        }
        slider.addEventListener('input', () => {
            sliderValue.textContent = slider.value;
        });

        const playButton = document.getElementById('playButton');
        const stopButton = document.getElementById('stopButton');

        playButton.addEventListener('click', startSlider);
        stopButton.addEventListener('click', stopSlider);
    });
});
