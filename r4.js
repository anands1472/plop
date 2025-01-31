const fs = require("fs");
const path = require("path");
const readline = require("readline");

// Base path where config, hooks, and routes should be created
const BASE_PATH = path.join(
  __dirname,
  "/packages/priorauthconnect/gateway/src/"
);

// Ensure the base path exists
if (!fs.existsSync(BASE_PATH)) {
  fs.mkdirSync(BASE_PATH, { recursive: true });
}

// Setup readline for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function askQuestion(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function startProcess() {
  const folderName = formatCamelCase((await askQuestion("Enter the main folder name: ")).trim());
  if (!folderName) {
    console.log("❌ Folder name cannot be empty!");
    rl.close();
    return;
  }

  const createSubfolder = (await askQuestion("Do you want to create a subfolder inside this folder? (yes/no): ")).trim().toLowerCase();
  let subfolderName = "";

  if (createSubfolder === "yes") {
    subfolderName = formatCamelCase((await askQuestion("Enter the subfolder name: ")).trim());
  }

  await createFolders(folderName, subfolderName);
  rl.close();
}

async function createFolders(folderName, subfolderName = "") {
  const hooksFolderPath = path.join(BASE_PATH, "hooks");
  const folderPath = subfolderName
    ? path.join(hooksFolderPath, folderName, subfolderName)
    : path.join(hooksFolderPath, folderName);
  const routesFolderPath = path.join(BASE_PATH, "routes");
  const configFolderPath = path.join(BASE_PATH, "config");

  [hooksFolderPath, folderPath, routesFolderPath, configFolderPath].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Created folder: ${dir}`);
    }
  });

  const appUriConfigFilePath = path.join(configFolderPath, "appUriConfig.js");

  const gatewayApiUrl = await askQuestion("Enter the Gateway API URL: ");
  const microservicesApiUrl = await askQuestion("Enter the Microservices API URL: ");

  if (!gatewayApiUrl || !microservicesApiUrl) {
    console.log("❌ Both URLs are required!");
    return;
  }

  let currentConfig = { gatewayApiUri: {}, microservicesApiUri: {} };
  if (fs.existsSync(appUriConfigFilePath)) {
    currentConfig = require(appUriConfigFilePath);
  }

  const gatewayKey = subfolderName
    ? `${folderName}${capitalizeFirstLetter(subfolderName)}GatewayApiUri`
    : `${folderName}GatewayApiUri`;
  const microservicesKey = subfolderName
    ? `${folderName}${capitalizeFirstLetter(subfolderName)}MicroservicesApiUri`
    : `${folderName}MicroservicesApiUri`;

  currentConfig.gatewayApiUri[gatewayKey] = gatewayApiUrl;
  currentConfig.microservicesApiUri[microservicesKey] = microservicesApiUrl;

  const updatedConfigContent = `// appUriConfig.js - Configuration for API URLs

module.exports = {
  gatewayApiUri: {
${Object.entries(currentConfig.gatewayApiUri)
  .map(([key, value]) => `    ${key}: "${value}",`)
  .join("\n")}
  },
  microservicesApiUri: {
${Object.entries(currentConfig.microservicesApiUri)
  .map(([key, value]) => `    ${key}: "${value}",`)
  .join("\n")}
  }
};
`;

  fs.writeFileSync(appUriConfigFilePath, updatedConfigContent, "utf8");
  console.log(`✅ 'appUriConfig.js' updated.`);

  const requestFile = subfolderName ? `${subfolderName}Request.js` : `${folderName}Request.js`;
  const responseFile = subfolderName ? `${subfolderName}Response.js` : `${folderName}Response.js`;
  const routerFile = subfolderName ? `${subfolderName}Router.js` : `${folderName}Router.js`;

  const requestFilePath = path.join(folderPath, requestFile);
  const responseFilePath = path.join(folderPath, responseFile);
  const routerFilePath = path.join(routesFolderPath, routerFile);

  const requestContent = `// ${requestFile} - Auto-generated request file
import genericRequest from "../genericRequest";

const requestPreProcessing = (req) => {
  genericRequest.hook(req);
};

export default { requestPreProcessing };`;

  const responseContent = `// ${responseFile} - Auto-generated response file
import genericResponse from "../genericResponse";

const responsePostProcessing = (req, res, stream) => {
  genericResponse.hook(req, res, stream);
};

export default { responsePostProcessing };`;

  const routerContent = `// ${routerFile} - Auto-generated router file
import config from "../../config";
import ${folderName}Request from "../hooks/${folderName}${subfolderName ? "/" + subfolderName : ""}/${folderName}Request";
import ${folderName}Response from "../hooks/${folderName}${subfolderName ? "/" + subfolderName : ""}/${folderName}Response";

const ${folderName}Route = {
  proxyType: "http",
  prefix: config.${gatewayKey},
  methods: ["GET"],
  fastProxy: { rejectUnauthorized: false },
  hooks: {
    onRequest: ${folderName}Request.requestPreProcessing,
    onResponse: ${folderName}Response.responsePostProcessing,
  },
  target: config.commonServicesMicroServicesBaseUrL,
  disableQsOverwrite: true,
};

export default ${folderName}Route;`;

  fs.writeFileSync(requestFilePath, requestContent, "utf8");
  fs.writeFileSync(responseFilePath, responseContent, "utf8");
  fs.writeFileSync(routerFilePath, routerContent, "utf8");

  console.log(`✅ Created request, response, and router files.`);
}

function formatCamelCase(input) {
  return input.replace(/[-_ ]+(.)/g, (_, char) => char.toUpperCase());
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

startProcess();
