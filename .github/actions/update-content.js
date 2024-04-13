const json2md = require("json2md");
const fs = require("fs");

let outputDir = "./resources/";
let headers = {};
let apiEndpoint = 'https://palestinelove.org/api/v1/websites';


async function convertJson2Markdown(title, data) {
  data = data.map((item) => {
    return {
      h3: item.name,
      ul: [
        `Description: ${item.description ? item.description : ''}`,
        `Link: [${item.name}](${item.url})`,
        [
          "Categories:",
          {
            ul: item.categories.map((category) => {
              return [category]
            }
            )
          }
        ]

      ]
    }
  }
  );

  return json2md(data);
}

async function writeMarkdown(filename, md, outputDir) {
  md = md
    .split("\n")
    .map((item) => {
      return item.replace(/^ | $/g, "");
    })
    .join("\n");


  fs.writeFileSync(`${outputDir}${filename}`, md, (err) => {
    if (err) throw err;
    console.log(`${filename} saved!`);
  });
}

async function getEndpointsData(apiEndpoint, headers) {
  let req = await fetch(apiEndpoint, { headers: headers });
  let data = await req.json();
  return data;
}


async function splitDataIntoCategories(data) {
  let categories = {};
  for (let item of data) {
    for (let category of item.categories) {
      category = category.trim().replace('/', '-');
      if (categories[category]) {
        categories[category].push(item);
      } else {
        categories[category] = [item];
      }
    }
  }
  return categories;
}

async function splitDataIntoNetworks(data) {
  let networks = {};
  for (let item of data) {
    let network = item.network;
    if (networks[network]) {
      networks[network].push(item);
    } else {
      networks[network] = [item];
    }
  }
  return networks;
}

async function main() {
  let promises = getEndpointsData(apiEndpoint, headers);
  let dataForAllEndpoints = (await Promise.all([promises]))[0]; // the returned data is [[obj,obj,..]]
  let categorizedData = await splitDataIntoCategories(dataForAllEndpoints);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  for (category in categorizedData) {
    let item = categorizedData[category];
    let title = category.charAt(0).toUpperCase() + category.slice(1);
    let md = await convertJson2Markdown(title, item);
    await writeMarkdown(`${title}.md`, md, outputDir);
  }
  console.log('done')

}

main().catch((err) => {
  console.log(err);
});
