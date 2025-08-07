import { readFile, writeFile } from "fs/promises";
import { createServer } from "http";
import path from "path";
import Crypto from "crypto";

const Data_Path = path.join("data", "links.json");

const loadLinks = async () => {
  try {
    const data = await readFile(Data_Path, "utf-8");   
    return JSON.parse(data)
  } catch (error) {
    if (error.code === "ENOENT") {
      await writeFile(Data_Path, JSON.stringify({}), "utf-8");
      return {};
    }
    console.log(error);
  }
};

const server = createServer(async (req, res) => {
  if (req.method === "GET") {
    if (req.url === "/") {
      res.writeHead(200, { "Content-Type": "text/html" });
      await readFile(path.join("public", "index.html")).then((data) => {
        res.end(data);
      });
    }else if (req.url === "/link"){
        const links = await loadLinks();
        res.writeHead(200 , {"Content-Type" : "application/json"});
         return res.end(JSON.stringify(links))
    }else {
        const links = await loadLinks();
        const shortcode = req.url.slice(1)
        console.log(shortcode)
        
        if (links[shortcode]) {
          res.writeHead(302, { location: links[shortcode] });
          return res.end();
        }
    }
  }
  if (req.method === "POST" && req.url === "/shortLink") {
    const links = await loadLinks();
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", async () => {
      const { url, shortcode } = JSON.parse(body);
      if (!url) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "URL is required" }));
      }

      const finalshortCode = shortcode || Crypto.randomBytes(4).toString("hex");

      if (links[finalshortCode]) {
        res.writeHead("400", { "Content-Type": "text/plain" });
        console.log("Shortcode already exists");
        return res.end("Shortcode already exists");
      }

      links[finalshortCode] = url;
      await writeFile(Data_Path, JSON.stringify(links));
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ shortcode: finalshortCode }));
    });
  }
});

const PORT = 3001
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
