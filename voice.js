
document.addEventListener("DOMContentLoaded", function () {

    const voiceButton =
        document.getElementById("voiceSearchButton");

    const searchInput =
        document.getElementById("searchInput");

    const searchButton =
        document.getElementById("searchButton");

    const message =
        document.getElementById("message");


    if (!voiceButton || !searchInput || !searchButton) {
        console.error("Voice Search: required elements are missing.");
        return;
    }


    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (!SpeechRecognition) {

        voiceButton.disabled = true;
        voiceButton.title =
            "Voice search is not supported in this browser";
        voiceButton.style.opacity = "0.45";

        return;
    }


    const recognition =
        new SpeechRecognition();


    recognition.lang =
        navigator.language || "en-US";

    recognition.continuous =
        false;

    recognition.interimResults =
        true;

    recognition.maxAlternatives =
        1;


    let listening = false;
    let finalTranscript = "";


    function setStatus(text, active = false) {

        if (!message) {
            return;
        }

        message.innerHTML = "";

        const dot =
            document.createElement("span");

        dot.className = "status-dot";

        if (active) {
            dot.classList.add("voice-active-dot");
        }

        message.appendChild(dot);

        message.appendChild(
            document.createTextNode(" " + text)
        );
    }


    function setMicIcon() {

        voiceButton.innerHTML = `
            <svg
                class="mic-icon"
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
            >
                <path d="M12 14.5a3.5 3.5 0 0 0 3.5-3.5V7a3.5 3.5 0 0 0-7 0v4a3.5 3.5 0 0 0 3.5 3.5Z"></path>
                <path d="M18 10.5v.5a6 6 0 0 1-12 0v-.5"></path>
                <path d="M12 17v4"></path>
                <path d="M9 21h6"></path>
            </svg>
        `;

    }


    function startListening() {

        if (listening) {
            return;
        }

        finalTranscript = "";

        try {
            recognition.start();
        } catch (error) {
            console.error("Voice start error:", error);
        }
    }


    function stopListening() {

        if (!listening) {
            return;
        }

        try {
            recognition.stop();
        } catch (error) {
            console.error("Voice stop error:", error);
        }
    }


    voiceButton.addEventListener(
        "click",
        function () {

            if (listening) {
                stopListening();
            } else {
                startListening();
            }

        }
    );


    recognition.addEventListener(
        "start",
        function () {

            listening = true;

            voiceButton.classList.add(
                "voice-listening"
            );

            voiceButton.setAttribute(
                "aria-label",
                "Stop voice search"
            );

            voiceButton.title =
                "Listening... click to stop";

            setStatus(
                "Listening... speak now.",
                true
            );

            searchInput.focus();
        }
    );


    recognition.addEventListener(
        "result",
        function (event) {

            let transcript = "";

            for (
                let i = event.resultIndex;
                i < event.results.length;
                i++
            ) {

                transcript +=
                    event.results[i][0].transcript;
            }

            transcript =
                transcript.trim();


            if (!transcript) {
                return;
            }


            searchInput.value =
                transcript;


            const latest =
                event.results[
                    event.results.length - 1
                ];


            if (latest.isFinal) {

                finalTranscript =
                    transcript;

                setStatus(
                    "Voice input complete."
                );

            } else {

                setStatus(
                    "Hearing: " + transcript,
                    true
                );

            }
        }
    );


    recognition.addEventListener(
        "error",
        function (event) {

            listening = false;

            voiceButton.classList.remove(
                "voice-listening"
            );

            setMicIcon();


            let text =
                "Voice search could not start.";


            if (event.error === "not-allowed") {
                text =
                    "Please allow microphone access.";

            } else if (event.error === "no-speech") {
                text =
                    "No speech detected. Try again.";

            } else if (event.error === "audio-capture") {
                text =
                    "No microphone was detected.";

            } else if (event.error === "network") {
                text =
                    "Voice recognition needs a network connection.";
            }


            setStatus(text);
        }
    );


    recognition.addEventListener(
        "end",
        function () {

            const query =
                finalTranscript ||
                searchInput.value.trim();


            listening = false;


            voiceButton.classList.remove(
                "voice-listening"
            );


            setMicIcon();


            voiceButton.setAttribute(
                "aria-label",
                "Search by voice"
            );


            voiceButton.title =
                "Search by voice";


            if (query) {

                searchInput.value =
                    query;

                setStatus(
                    "Searching: " + query
                );

                searchButton.click();

            } else {

                setStatus(
                    "No speech detected. Try again."
                );

            }
        }
    );


    setMicIcon();

    console.log(
        "✅ Mini Search click-to-voice initialized."
    );

});
