import querystring from "query-string";
export default {
  async fetch(request: Request) {
    /** QueryStringのキーペア */
    const params = querystring.parse(request.url.split("?")[1]);
    if (!params.url) {
      return new Response(
        "Please provide a growi's url! ex.`/?url=https://demo.growi.org`"
      );
    }
    /** サイト名 */
    const title = params.title ? decodeURI(params.title.toString()) : "Growi";
    /** サイトの説明 */
    const description = params.description
      ? decodeURI(params.description.toString())
      : `${title} Recent Changes`;
    /** フィードの出力形式 */
    const type = params.type ? params.type.toString() : "rss";
    /** 最大表示件数 */
    const limit = params.limit ? parseInt(params.limit.toString()) : 20;
    /** Growiのアドレス */
    const url = params.url.toString().replace(/\/$/, "");

    if (type !== "rss" && type !== "atom" && type !== "sitemaps") {
      return new Response("Supports only atom, rss and sitemaps.");
    }

    if (type === "rss" || type === "atom") {
      /** APIの実行結果 */
      const response = await fetch(
        `${url}/_api/v3/pages/recent?limit=${limit}`
      );
      /** APIのJSONデータ */
      const json = await response.json();

      const ret = [];
      ret.push('<?xml version="1.0" encoding="UTF-8"?>');
      if (type === "atom") {
        ret.push(`  <feed xmlns="http://www.w3.org/2005/Atom">
    <title>${title}</title>
    <subtitle>${description}</subtitle>
    <id>${url}/</id>
    <updated>${new Date().toISOString()}</updated>
    <link href="${request.url.replace("&", "&amp;")}" rel="self" />
    <link href="${url}" />`);
        ret.push(toEntries(url, json));
        ret.push("</feed>");
      } else {
        ret.push(`  <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
      <title>${title}</title>
      <link>${params.url}</link>
      <description>${description}</description>
      <generator>Growi Feed Converter v0.0.1</generator>
      <atom:link href="${request.url}" type="application/rss+xml" />`);
        ret.push(toItems(url, json));
        ret.push("  </channel>");
        ret.push("</rss>");
      }

      return new Response(ret.join("\n"), {
        headers: {
          "Content-Type": `application/${type}+xml;charset=UTF-8`,
          "Cache-Control": "no-cache",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET",
        },
      });
    } else if (type === "sitemaps") {
      /** APIの実行結果 */
      const response = await fetch(`${url}/_api/v3/pages/list?limit=${limit}`);
      /** APIのJSONデータ */
      const json = await response.json();
      const ret = [];
      ret.push('<?xml version="1.0" encoding="UTF-8"?>');
      ret.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
      ret.push(toUrls(url, json));
      ret.push("</urlset>");

      return new Response(ret.join("\n"), {
        headers: {
          "Content-Type": ` application/xml;charset=UTF-8`,
          "Cache-Control": "no-cache",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET",
        },
      });
    }
  },
};

/** Atomのエントリを生成 */
function toEntries(baseUri: string, json: any) {
  const entries: string[] = [];
  json.pages.forEach((page: any) => {
    entries.push(`    <entry>
      <title>${page.path}</title>
      <link href="${baseUri}${encodeURI(page.path)}" />
      <author>
        <name>${page.lastUpdateUser.name}</name>
        <email>${page.lastUpdateUser.email}</email>
      </author>
      <published>${new Date(page.createdAt).toISOString()}</published>
      <updated>${new Date(page.updatedAt).toISOString()}</updated>
      <id>${baseUri}/${page.id}</id>
    </entry>`);
  });
  return entries.join("\n");
}

/** RSSの項目を生成 */
function toItems(baseUri: string, json: any) {
  const items: string[] = [];
  json.pages.forEach((page: any) => {
    items.push(`      <item>
        <title>${page.path}</title>
        <description>${page.path}</description>
        <link>${baseUri}${encodeURI(page.path)}</link>
        <author>${page.lastUpdateUser.email} (${
      page.lastUpdateUser.name
    })</author>
        <pubDate>${new Date(page.updatedAt).toUTCString()}</pubDate>
        <comments>${baseUri}/${page.id}#page-comments-list</comments>
        <guid>${baseUri}/${page.id}</guid>
      </item>`);
  });
  return items.join("\n");
}

/** SitemapのURLを生成 */
function toUrls(baseUri: string, json: any) {
  const items: string[] = [];
  json.pages.forEach((page: any) => {
    if (page.wip) {
      return;
    }
    items.push(`  <url>
    <loc>${baseUri}/${page._id}</loc>
    <lastmod>${new Date(page.updatedAt).toISOString()}</lastmod>
    <changefreq>daily</changefreq>
  </url>`);
  });
  return items.join("\n");
}
