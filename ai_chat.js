
document.addEventListener(
    "DOMContentLoaded",
    function () {

        const openButton =
            document.getElementById(
                "aiChatOpenButton"
            );

        const closeButton =
            document.getElementById(
                "aiChatCloseButton"
            );

        const panel =
            document.getElementById(
                "aiChatPanel"
            );

        const messages =
            document.getElementById(
                "aiChatMessages"
            );

        const input =
            document.getElementById(
                "aiChatInput"
            );

        const sendButton =
            document.getElementById(
                "aiChatSendButton"
            );

        const clearButton =
            document.getElementById(
                "aiChatClearButton"
            );

        const typing =
            document.getElementById(
                "aiChatTyping"
            );


        if (
            !openButton ||
            !closeButton ||
            !panel ||
            !messages ||
            !input ||
            !sendButton
        ) {

            console.error(
                "AI Chat: required elements are missing."
            );

            return;
        }


        // ====================================================
        // CHAT MEMORY
        // Browser-only memory for this session.
        // ====================================================

        let conversation = [];


        // ====================================================
        // OPEN
        // ====================================================

        function openChat() {

            panel.classList.add(
                "ai-chat-open"
            );

            panel.setAttribute(
                "aria-hidden",
                "false"
            );

            setTimeout(
                function () {
                    input.focus();
                },
                100
            );

        }


        // ====================================================
        // CLOSE
        // ====================================================

        function closeChat() {

            panel.classList.remove(
                "ai-chat-open"
            );

            panel.setAttribute(
                "aria-hidden",
                "true"
            );

        }


        // ====================================================
        // ESCAPE HTML
        // ====================================================

        function escapeHTML(
            value
        ) {

            const div =
                document.createElement(
                    "div"
                );

            div.textContent =
                value == null
                    ? ""
                    : String(value);

            return div.innerHTML;

        }


        // ====================================================
        // ADD USER MESSAGE
        // ====================================================

        function addUserMessage(
            text
        ) {

            const message =
                document.createElement(
                    "div"
                );

            message.className =
                "ai-chat-message ai-chat-user";


            message.innerHTML = `
                <div class="ai-chat-avatar">
                    You
                </div>

                <div class="ai-chat-bubble">
                    ${escapeHTML(text)}
                </div>
            `;


            messages.appendChild(
                message
            );


            scrollToBottom();

        }


        // ====================================================
        // ADD AI MESSAGE
        // ====================================================

        function addAIMessage(
            answer,
            sources
        ) {

            const wrapper =
                document.createElement(
                    "div"
                );

            wrapper.className =
                "ai-chat-message ai-chat-assistant";


            const sourceHTML = [];


            const seen =
                new Set();


            (sources || [])
                .slice(0, 5)
                .forEach(
                    function (source) {

                        const url =
                            String(
                                source.url || ""
                            ).trim();


                        if (
                            !url ||
                            seen.has(url)
                        ) {

                            return;

                        }


                        seen.add(
                            url
                        );


                        sourceHTML.push(`
                            <a
                                class="ai-chat-source"
                                href="${escapeHTML(url)}"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                ${escapeHTML(
                                    source.source
                                    ||
                                    source.title
                                    ||
                                    "Source"
                                )}
                            </a>
                        `);

                    }
                );


            let sourcesBlock =
                "";


            if (
                sourceHTML.length
            ) {

                sourcesBlock = `
                    <div class="ai-chat-sources">
                        ${sourceHTML.join("")}
                    </div>
                `;

            }


            wrapper.innerHTML = `

                <div class="ai-chat-avatar ai-chat-ai-avatar">
                    AI
                </div>

                <div class="ai-chat-bubble ai-chat-ai-bubble">

                    <div class="ai-chat-answer">
                        ${escapeHTML(answer)}
                    </div>

                    ${sourcesBlock}

                </div>
            `;


            messages.appendChild(
                wrapper
            );


            scrollToBottom();

        }


        // ====================================================
        // TYPING
        // ====================================================

        function showTyping() {

            if (!typing) {
                return;
            }

            typing.classList.remove(
                "hidden"
            );

            scrollToBottom();

        }


        function hideTyping() {

            if (!typing) {
                return;
            }

            typing.classList.add(
                "hidden"
            );

        }


        // ====================================================
        // SCROLL
        // ====================================================

        function scrollToBottom() {

            messages.scrollTop =
                messages.scrollHeight;

        }


        // ====================================================
        // BUILD CONTEXT
        // ====================================================

        function buildContext(
            currentMessage
        ) {

            const recent =
                conversation.slice(
                    -6
                );


            if (
                recent.length === 0
            ) {

                return currentMessage;

            }


            const context =
                recent
                    .map(
                        function (item) {

                            return (
                                item.role
                                + ": "
                                + item.content
                            );

                        }
                    )
                    .join("\n");


            return (
                "Conversation context:\n"
                + context
                + "\n\n"
                + "Current user question:\n"
                + currentMessage
            );

        }


        // ====================================================
        // SEND MESSAGE
        // ====================================================

        async function sendMessage() {

            const text =
                input.value.trim();


            if (!text) {
                return;
            }


            input.value =
                "";


            input.disabled =
                true;

            sendButton.disabled =
                true;


            addUserMessage(
                text
            );


            conversation.push({

                role:
                    "user",

                content:
                    text

            });


            showTyping();


            try {

                const query =
                    buildContext(
                        text
                    );


                const response =
                    await fetch(
                        "/ai-answer?q="
                        + encodeURIComponent(
                            query
                        ),
                        {
                            method:
                                "GET",

                            cache:
                                "no-store"
                        }
                    );


                const data =
                    await response.json();


                hideTyping();


                if (
                    !response.ok
                    ||
                    data.status !== "ok"
                    ||
                    !data.answer
                ) {

                    throw new Error(
                        data.message
                        ||
                        "AI could not answer."
                    );

                }


                addAIMessage(
                    data.answer,
                    data.sources
                );


                conversation.push({

                    role:
                        "assistant",

                    content:
                        data.answer

                });


            } catch (error) {

                hideTyping();


                addAIMessage(
                    "I couldn't answer that right now. Please try again.",
                    []
                );


                console.error(
                    "AI Chat error:",
                    error
                );

            }


            input.disabled =
                false;

            sendButton.disabled =
                false;

            input.focus();

        }


        // ====================================================
        // CLEAR CHAT
        // ====================================================

        function clearChat() {

            conversation =
                [];


            messages.innerHTML = `

                <div class="ai-chat-welcome">

                    <div class="ai-chat-welcome-icon">
                        ✦
                    </div>

                    <h3>
                        Hi, I'm Mini Search AI
                    </h3>

                    <p>
                        Ask me anything, then ask
                        follow-up questions naturally.
                    </p>

                </div>

            `;

        }


        // ====================================================
        // BUTTON EVENTS
        // ====================================================

        openButton.addEventListener(
            "click",
            openChat
        );


        closeButton.addEventListener(
            "click",
            closeChat
        );


        sendButton.addEventListener(
            "click",
            sendMessage
        );


        if (clearButton) {

            clearButton.addEventListener(
                "click",
                clearChat
            );

        }


        // ====================================================
        // ENTER TO SEND
        // ====================================================

        input.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Enter"
                    &&
                    !event.shiftKey
                ) {

                    event.preventDefault();

                    sendMessage();

                }

            }
        );


        // ====================================================
        // ESCAPE TO CLOSE
        // ====================================================

        document.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Escape"
                ) {

                    closeChat();

                }

            }
        );


        // ====================================================
        // INITIAL STATE
        // ====================================================

        panel.setAttribute(
            "aria-hidden",
            "true"
        );


        console.log(
            "✅ Mini Search AI Chat initialized."
        );

    }
);
