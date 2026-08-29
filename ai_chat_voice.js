
document.addEventListener(
    "DOMContentLoaded",
    function () {

        const micButton =
            document.getElementById(
                "aiChatMicButton"
            );


        const input =
            document.getElementById(
                "aiChatInput"
            );


        const sendButton =
            document.getElementById(
                "aiChatSendButton"
            );


        if (
            !micButton ||
            !input ||
            !sendButton
        ) {

            console.error(
                "AI Chat Voice: required elements are missing."
            );

            return;

        }


        // ====================================================
        // BROWSER SUPPORT
        // ====================================================

        const SpeechRecognition =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;


        if (!SpeechRecognition) {

            micButton.disabled =
                true;

            micButton.title =
                "Voice input is not supported in this browser";

            micButton.style.opacity =
                "0.45";

            return;

        }


        // ====================================================
        // RECOGNITION ENGINE
        // ====================================================

        const recognition =
            new SpeechRecognition();


        recognition.lang =
            navigator.language ||
            "en-US";


        recognition.continuous =
            false;


        recognition.interimResults =
            true;


        recognition.maxAlternatives =
            1;


        let listening =
            false;


        let finalText =
            "";


        // ====================================================
        // MICROPHONE ICON
        // ====================================================

        function showMicIcon() {

            micButton.innerHTML = `
                <svg
                    class="ai-chat-mic-icon"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    focusable="false"
                >
                    <path
                        d="M12 14.5a3.5 3.5 0 0 0 3.5-3.5V7a3.5 3.5 0 0 0-7 0v4a3.5 3.5 0 0 0 3.5 3.5Z"
                    ></path>

                    <path
                        d="M18 10.5v.5a6 6 0 0 1-12 0v-.5"
                    ></path>

                    <path
                        d="M12 17v4"
                    ></path>

                    <path
                        d="M9 21h6"
                    ></path>
                </svg>
            `;

        }


        // ====================================================
        // START
        // ====================================================

        function startListening() {

            if (listening) {
                return;
            }


            finalText =
                "";


            try {

                recognition.start();

            } catch (error) {

                console.error(
                    "AI Chat microphone start error:",
                    error
                );

            }

        }


        // ====================================================
        // STOP
        // ====================================================

        function stopListening() {

            if (!listening) {
                return;
            }


            try {

                recognition.stop();

            } catch (error) {

                console.error(
                    "AI Chat microphone stop error:",
                    error
                );

            }

        }


        // ====================================================
        // BUTTON
        // ====================================================

        micButton.addEventListener(
            "click",
            function () {

                if (listening) {

                    stopListening();

                } else {

                    startListening();

                }

            }
        );


        // ====================================================
        // START EVENT
        // ====================================================

        recognition.addEventListener(
            "start",
            function () {

                listening =
                    true;


                micButton.classList.add(
                    "ai-chat-mic-listening"
                );


                micButton.title =
                    "Listening... click to stop";


                micButton.setAttribute(
                    "aria-label",
                    "Stop voice input"
                );


                input.placeholder =
                    "Listening...";


                input.focus();

            }
        );


        // ====================================================
        // RESULT EVENT
        // ====================================================

        recognition.addEventListener(
            "result",
            function (event) {

                let transcript =
                    "";


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


                input.value =
                    transcript;


                const latestResult =
                    event.results[
                        event.results.length - 1
                    ];


                if (
                    latestResult.isFinal
                ) {

                    finalText =
                        transcript;


                    // Automatically send the message,
                    // just like voice search on the
                    // main Mini Search interface.
                    setTimeout(
                        function () {

                            if (
                                finalText.trim()
                            ) {

                                sendButton.click();

                            }

                        },
                        120
                    );

                }

            }
        );


        // ====================================================
        // ERROR
        // ====================================================

        recognition.addEventListener(
            "error",
            function (event) {

                console.error(
                    "AI Chat voice error:",
                    event.error
                );


                listening =
                    false;


                micButton.classList.remove(
                    "ai-chat-mic-listening"
                );


                input.placeholder =
                    "Ask a question...";


                showMicIcon();


                micButton.title =
                    "Speak to Mini Search AI";


                micButton.setAttribute(
                    "aria-label",
                    "Speak to Mini Search AI"
                );

            }
        );


        // ====================================================
        // END
        // ====================================================

        recognition.addEventListener(
            "end",
            function () {

                listening =
                    false;


                micButton.classList.remove(
                    "ai-chat-mic-listening"
                );


                input.placeholder =
                    "Ask a question...";


                showMicIcon();


                micButton.title =
                    "Speak to Mini Search AI";


                micButton.setAttribute(
                    "aria-label",
                    "Speak to Mini Search AI"
                );

            }
        );


        showMicIcon();


        console.log(
            "✅ Mini Search AI Chat microphone initialized."
        );

    }
);
