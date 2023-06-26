const axios = require("axios");

//https://medium.com/geekculture/how-to-publish-content-with-the-instagram-graph-api-806ec9c56588
//https://developers.facebook.com/docs/instagram-api/guides/content-publishing/
async function createInstagramPost(caption, mediaUrl) {
  try {
    const response = await axios.post(
      `https://graph.instagram.com/${process.env.INSTAGRAM_ACCOUNT_ID}/media`,
      {
        caption: caption,
        image_url: mediaUrl,
        access_token: process.env.ACCESS_TOKEN,
      }
    );
    const postId = response.data.id;
    return postId;
  } catch (error) {
    console.error("Error creating Instagram post:", error.message);
    throw error;
  }
}

//https://developers.facebook.com/docs/marketing-api/reference/adgroup
async function promoteInstagramPost(name, postId, url) {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v17.0/${process.env.FACEBOOK_AD_ACCOUNT_ID}/ads`,
      {
        name: name,
        creative: {
          object_story_spec: {
            page_id: process.env.INSTAGRAM_ACCOUNT_ID,
            instagram_actor_id: process.env.INSTAGRAM_ACCOUNT_ID,
            ad_format: "INSTAGRAM_STANDARD",
            link_data: {
              call_to_action: {
                type: "SHOP_NOW",
                value: {
                  link: url,
                },
              },
              image_hash: postId,
            },
          },
        },
        access_token: process.env.ACCESS_TOKEN,
      }
    );
    const adId = response.data.id;
    return adId;
  } catch (error) {
    console.error("Error promoting Instagram post:", error.message);
    throw error;
  }
}

module.exports = { createInstagramPost, promoteInstagramPost };
