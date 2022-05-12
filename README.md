# Discourse To Notion

This is a quick script to migrate topics and posts from Discourse to Notion.

> Node.js v16+

## How it works

Everything starts from a main page in Notion. This "main page" there's nothing special, it's like the first page of your blog in Discourse.

- Under the main page, one page for each Discourse category will be created;
- For each category page, will create another one for each category topic;
- And finally, for each post found in topic, will create another page under the previously topic page created.

## Environment Variables

- You will need a [integration](https://developers.notion.com/docs#getting-started) from Notion to access its api;
- You must create a initial page and give access for your integration, the id of this page is also a environment variable;
- Also you will need a Token from Discourse, it can be obtained accessing the Discourse Admin panel;

```
NOTION_SECRET=<YOUR INTEGRATION SECRET>
NOTION_MAIN_PAGE_ID=<YOUR MAIN PAGE ID IN UUID FORMAT>

DISCOURSE_URL=<YOUR BLOG URL>
DISCOURSE_USER=<YOU USERNAME IN BLOG>
DISCOURSE_TOKEN=<TOKEN GENERATED IN ADMIN PANEL>
```

## Running

To migrate your blog, all you need to do is configure your environment variables and run:

```
npm start
```

## Extras

This script uses the [@tryfabric/martian](https://github.com/instantish/martian) library to parse Discourse markdown to Notion blocks.

### Images

When get the markdown from Discourse, the url of the images is not filled, receives a sha hash instead, but if checks the html content of the post, we can find this same sha hash inside a `<img>` html tag.

So, to get the correct image URL, the script uses the sha hash present in markdown to find src of the image tag in html content.

## Limitations

It's not possible to use the benefits of some core Node.js features, like asynchronous requests. Notion API will returns an [`409`](https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Status/409) error when trying to save multiple posts under the same page. 
