const { Configuration, OpenAIApi } = require("openai");

async function fetchKeywords(product, recallCount = 0) {

    const configuration = new Configuration({
        //organization: "org-82qLtXsxScZBZi6gHiKIesX",
        apiKey: process.env.OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);
    const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
            { role: "user", content: "Create keywords optimized for google Adsense based on the following category and product (separate each by a new line):" },
            { role: "user", content: product }
        ],
    });
    if((typeof completion.data.choices[0].message.content === "undefined" || !completion.data.choices[0].message.content.includes("\n")) && recallCount < 10) {
        recallCount++;
        return await fetchKeywords(product, recallCount);
    }
    return completion.data.choices[0].message.content.replace(/[^\w\s\n]/gi, '').split("\n").map(e => e.trim());
}

module.exports = { fetchKeywords }