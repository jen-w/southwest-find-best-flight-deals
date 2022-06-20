const puppeteer = require("puppeteer");
const fs = require("fs");

(async () => {
  const browser = await puppeteer.launch();
  let result = "departing\tinternational\tdestination\tdate\tprice\n";

  for (let airport of ["OAK", "SJC", "SFO"]) {
    const data = await getData(browser, airport);
    result = result + data;
  }

  fs.writeFile(`destinations-${getDate()}.tsv`, result, "utf8", function (err) {
    if (err) {
      console.log("unable to write file");
    }
  });

  await browser.close();

  console.log("finished");
})();

function getDate() {
  const d = new Date();
  const mm = d.getMonth() + 1;
  const dd = d.getDate();
  const yy = d.getFullYear();
  return yy + "-" + mm + "-" + dd;
}

async function getData(browser, airport) {
  const page = await browser.newPage();
  await page.goto(
    `https://www.southwest.com/find-best-flight-deals/?originMarket=${airport}`
  );
  await page.setViewport({
    width: 1200,
    height: 800,
  });
  await autoScroll(page);

  // Build list of destinations
  await page.waitForSelector(".dest-stations");

  return await page.evaluate((airport) => {
    let res = "";
    document.querySelectorAll(".dest-stations").forEach((dest) => {
      res = res.concat(
        `${airport}\t${dest.getAttribute("data-intl")}\t${
          dest.querySelector(".dest-location").textContent
        }\t${dest.querySelector(".departDate").textContent}\t${dest
          .querySelector(".price-display-span")
          .getAttribute("d")}\n`
      );
    });
    return res;
  }, airport);
}

// Helper function from here:
// https://stackoverflow.com/questions/57044231/puppeteer-with-lazy-loading-images
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      let totalHeight = 0,
        distance = 100;
      let timer = setInterval(() => {
        var scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}
