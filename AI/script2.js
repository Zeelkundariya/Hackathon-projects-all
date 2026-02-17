let prompt = document.querySelector("#prompt")
let submitbtn = document.querySelector("#submit")
let chatContainer = document.querySelector(".chat-container")
let imagebtn = document.querySelector("#image")
let image = document.querySelector("#image img")
let imageinput = document.querySelector("#image input")

// Updated ChatGPT API endpoint and key
const Api_Url = "https://api.openai.com/v1/chat/completions"
// Replace with your actual OpenAI API key or use an environment variable
const Api_Key = "YOUR_OPENAI_API_KEY_HERE"


let user = {
    message: null,
    file: {
        mime_type: null,
        data: null
    }
}

async function generateResponse(aiChatBox) {
    let text = aiChatBox.querySelector(".ai-chat-area")

    // Prepare messages for ChatGPT API
    let messages = [
        {
            role: "user",
            content: [
                {
                    type: "text",
                    text: user.message
                }
            ]
        }
    ]

    // Add image to content if available
    if (user.file.data) {
        messages[0].content.push({
            type: "image_url",
            image_url: {
                url: `data:${user.file.mime_type};base64,${user.file.data}`
            }
        })
    }

    let RequestOption = {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Api_Key}`
        },
        body: JSON.stringify({
            model: "gpt-4-vision-preview", // Use this for image support
            // model: "gpt-4o", // Alternative model
            messages: messages,
            max_tokens: 1000,
            temperature: 0.7
        })
    }

    try {
        let response = await fetch(Api_Url, RequestOption)

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        let data = await response.json()

        // Extract response from ChatGPT API format
        let apiResponse = data.choices[0].message.content
        // Remove markdown formatting if needed
        apiResponse = apiResponse.replace(/\*\*(.*?)\*\*/g, "$1").trim()
        text.innerHTML = apiResponse
    }
    catch (error) {
        console.log("Error:", error)
        text.innerHTML = "Sorry, there was an error processing your request. Please try again."
    }
    finally {
        chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: "smooth" })
        image.src = `img.svg`
        image.classList.remove("choose")
        user.file = {}
    }
}

function createChatBox(html, classes) {
    let div = document.createElement("div")
    div.innerHTML = html
    div.classList.add(classes)
    return div
}

function handlechatResponse(userMessage) {
    user.message = userMessage
    let html = `<img src="user.png" alt="" id="userImage" width="8%">
<div class="user-chat-area">
${user.message}
${user.file.data ? `<img src="data:${user.file.mime_type};base64,${user.file.data}" class="chooseimg" />` : ""}
</div>`
    prompt.value = ""
    let userChatBox = createChatBox(html, "user-chat-box")
    chatContainer.appendChild(userChatBox)

    chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: "smooth" })

    setTimeout(() => {
        let html = `<img src="ai.png" alt="" id="aiImage" width="10%">
    <div class="ai-chat-area">
    <img src="loading.webp" alt="" class="load" width="50px">
    </div>`
        let aiChatBox = createChatBox(html, "ai-chat-box")
        chatContainer.appendChild(aiChatBox)
        generateResponse(aiChatBox)

    }, 600)
}

prompt.addEventListener("keydown", (e) => {
    if (e.key == "Enter") {
        handlechatResponse(prompt.value)
    }
})

submitbtn.addEventListener("click", () => {
    handlechatResponse(prompt.value)
})
imageinput.addEventListener("change", () => {
    const file = imageinput.files[0]
    if (!file) return
    let reader = new FileReader()
    reader.onload = (e) => {
        let base64string = e.target.result.split(",")[1]
        user.file = {
            mime_type: file.type,
            data: base64string
        }
        image.src = `data:${user.file.mime_type};base64,${user.file.data}`
        image.classList.add("choose")
    }

    reader.readAsDataURL(file)
})

imagebtn.addEventListener("click", () => {
    imagebtn.querySelector("input").click()
})