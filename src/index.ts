import querystring from "query-string";
export default {
  async fetch(request: Request) {
    const params = querystring.parse(request.url.split("?")[1]);
    if (!params.url) {
      return new Response(`Please provide a growi's url! ex.`);
    }

    let ret = [];
    ret.push(`<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0">
    <channel>
      <title>${
        params.title
          ? decodeURI(params.title.toString())
          : "Growi Recent Changes"
      }</title>
      <link>${params.url}</link>
      <description>${
        params.description
          ? decodeURI(params.description.toString())
          : "Growi Recent Changes"
      }</description>
      <generator>Growi Feed Converter v0.0.0</generator>`);
    ret.push(
      await getBody(
        params.url.toString(),
        params.limit ? parseInt(params.limit.toString()) : 10
      )
    );
    ret.push("  </channel>");
    ret.push("</rss>");
    return new Response(ret.join("\n"));
  },
};

async function getBody(baseUri: string, limit: number) {
  const response = await fetch(
    baseUri + "/_api/v3/pages/recent" + (limit ? "?limit=" + limit : "")
  );
  const items: string[] = [];
  const json: any = await response.json();
  json.pages.forEach((page: any) => {
    items.push(`      <item>
        <title>${page.path}</title>
        <link>${baseUri}${encodeURI(page.path)}</link>
        <author>${page.lastUpdateUser.name}</author>
        <pubdate>${buildRFC822Date(page.updatedAt)}</pubdate>
        <comments>${baseUri}/${page.id}#page-comments-list</comments>
        <guid>${baseUri}/${page.id}</guid>
      </item>`);
  });
  return items.join("\n");
}

// Code taken from https://whitep4nth3r.com/blog/how-to-format-dates-for-rss-feeds-rfc-822/
// add a leading 0 to a number if it is only one digit
function addLeadingZero(num: number): string {
  let no = num.toString();
  while (no.length < 2) no = "0" + no;
  return no;
}

function buildRFC822Date(dateString: string) {
  const dayStrings = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthStrings = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const timeStamp = Date.parse(dateString);
  const date = new Date(timeStamp);

  const day = dayStrings[date.getDay()];
  const dayNumber = addLeadingZero(date.getDate());
  const month = monthStrings[date.getMonth()];
  const year = date.getFullYear();
  const time = `${addLeadingZero(date.getHours())}:${addLeadingZero(
    date.getMinutes()
  )}:00`;
  const timezone = date.getTimezoneOffset() === 0 ? "GMT" : "BST";

  //Wed, 02 Oct 2002 13:00:00 GMT
  return `${day}, ${dayNumber} ${month} ${year} ${time} ${timezone}`;
}
