const TwitterApi = require('twitter-api-v2').default;
const functions = require("firebase-functions");
const admin = require('firebase-admin')
const getMeme = require("./scrape");
const axios = require('axios');
const config = require("./config")
const amazon = require("./amazon scraper/scrape")
require('dotenv').config();
admin.initializeApp();

const dbRefMeme = admin.firestore().doc('tokens/meme')
const dbRefQuote = admin.firestore().doc('tokens/quote')

exports.authMeme = functions.region('australia-southeast1').runWith({ timeoutSeconds: 60 }).https.onRequest(async (request, response) => {
    const client = new TwitterApi({
        appKey: config.memeConfig.appKey,
        appSecret: config.memeConfig.appSecret
    })
    const auth = await client.generateAuthLink(
        config.callbackURLMeme,
        { linkMode: 'authorize' }
    );

    // store verifier
    await dbRefMeme.set({ token: auth.oauth_token, secretToken: auth.oauth_token_secret });

    response.redirect(auth.url);
});

exports.authQuote = functions.region('australia-southeast1').https.onRequest(async (request, response) => {
    const client = new TwitterApi({
        appKey: config.quoteConfig.appKey,
        appSecret: config.quoteConfig.appSecret
    })
    const auth = await client.generateAuthLink(
        config.callbackURLQuote,
        { linkMode: 'authorize' }
    );

    await dbRefQuote.set({ token: auth.oauth_token, secretToken: auth.oauth_token_secret });

    response.redirect(auth.url);
});

exports.callbackMeme = functions.region('australia-southeast1').https.onRequest(async (request, response) => {
    const { oauth_token, oauth_verifier } = request.query;

    const dbSnapshot = await dbRefMeme.get();
    const { secretToken } = dbSnapshot.data();

    if (!oauth_token || !oauth_verifier || !secretToken) {
        return res.status(400).send('You denied the app or your session expired!');
    }

    const client = new TwitterApi({
        appKey: config.memeConfig.appKey,
        appSecret: config.memeConfig.appSecret,
        accessToken: oauth_token,
        accessSecret: secretToken,
    });
    const result = await client.login(oauth_verifier);

    await dbRefMeme.set({ token: result.accessToken, secretToken: result.accessSecret });

});

exports.callbackQuote = functions.region('australia-southeast1').https.onRequest(async (request, response) => {
    const { oauth_token, oauth_verifier } = request.query;

    const dbSnapshot = await dbRefQuote.get();
    const { secretToken } = dbSnapshot.data();

    if (!oauth_token || !oauth_verifier || !secretToken) {
        return res.status(400).send('You denied the app or your session expired!');
    }

    const client = new TwitterApi({
        appKey: config.quoteConfig.appKey,
        appSecret: config.quoteConfig.appSecret,
        accessToken: oauth_token,
        accessSecret: secretToken,
    });
    const result = await client.login(oauth_verifier);

    await dbRefQuote.set({ token: result.accessToken, secretToken: result.accessSecret });
});


exports.tweet = functions.region('australia-southeast1').runWith({ memory: "512MB", timeoutSeconds: 60 }).pubsub.schedule('every 60 minutes').onRun(async (context) => {
    const quoteRun = async () => {
        const dbSnapshot = await dbRefQuote.get();
        const { secretToken, token } = dbSnapshot.data();

        const client = new TwitterApi({
            appKey: config.quoteConfig.appKey,
            appSecret: config.quoteConfig.appSecret,
            accessToken: token,
            accessSecret: secretToken,
        });

        const clt = await client.currentUser();
        //console.log(clt.screen_name); @thing

        let quote = "";
        let author = "";
        let hashtags = "";
        axios.get('https://api.quotable.io/random').then(async (e) => {


            e.data.tags.forEach(element => {
                hashtags += `#${element.replace('-', '_')} `
            });

            quote = e.data.content;
            author = e.data.author;
            const tweet = await client.v1.tweet(
                `"${quote}"\n-${author}\n\n#quote #inspiration ${hashtags}`
            );
            //await client.v2.like(clt.id_str, tweet.data.id);
        }).catch((e) => { console.log(e); })
    }

    const memeRun = async () => {
        const dbSnapshot = await dbRefMeme.get();
        const { secretToken, token } = dbSnapshot.data();

        const client = new TwitterApi({
            appKey: config.memeConfig.appKey,
            appSecret: config.memeConfig.appSecret,
            accessToken: token,
            accessSecret: secretToken,
        });

        const clt = await client.currentUser();
        //console.log(clt.screen_name); @thing
        let meme = await getMeme();

        const response = await axios.get(meme.image, { responseType: 'arraybuffer' })
        const buffer = Buffer.from(response.data, "utf-8")

        const mediaId = await client.v1.uploadMedia(buffer, { mimeType: 'image/png' })
        const tweet = await client.v1.tweet(
            `${meme.title}`, { media_ids: [mediaId] }
        );
        //await client.v2.like(clt.id_str, tweet.id+"");
    }

    await memeRun();
    //await quoteRun();
});

exports.tweetSponsor = functions.region('australia-southeast1').runWith({ memory: "512MB", timeoutSeconds: 60 }).pubsub.schedule('At 09:00').onRun(async (context) => {
    const memeRun = async () => {
        const dbSnapshot = await dbRefMeme.get();
        const { secretToken, token } = dbSnapshot.data();

        const client = new TwitterApi({
            appKey: config.memeConfig.appKey,
            appSecret: config.memeConfig.appSecret,
            accessToken: token,
            accessSecret: secretToken,
        });

        const clt = await client.currentUser();
        //console.log(clt.screen_name); @thing
        //let meme = await getMeme();
        const categories = await amazon.getCategories();
        const products = {};
        for (const category of categories) {
            console.log(category);
            const product = await amazon.scrapeProducts(category);
            let finalCategoryProducts = [];

            finalCategoryProducts.push(product);
            console.log(product);
            console.log("");

            products[category.name] = finalCategoryProducts;
        }

        for (let category in products) {
            let categoryItems = products[key];
            for (let product in categoryItems) {

                const tweet = await client.v1.tweet(
                    `${product.title} ${product.url}?tag=${process.env.AMAZON_TAG} #${category} #amazon #product #notsponsored #affiliate`);
            }

        }

    }

    await memeRun();
});