const fs = require("fs");
const path = require("path");
const readline = require("readline");

const BASE_PATH = path.join(__dirname, "/packages/priorauthconnect/gateway/src/");
fs.mkdirSync(BASE_PATH, { recursive: true });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function startProcess() {
  const folderName = formatCamelCase(await askQuestion("Enter the main folder name: "));
  if (!folderName) {
    console.log("❌ Folder name cannot be empty!");
    rl.close();
    return;
  }

  const createSubfolder = (await askQuestion("Create a subfolder? (yes/no): ")).trim().toLowerCase();
  let subfolderName = "";
  if (createSubfolder === "yes") {
    subfolderName = formatCamelCase(await askQuestion("Enter the subfolder name: "));
  }

  const gatewayApiUrl = await askQuestion("Enter the Gateway API URL: ");
  const microservicesApiUrl = await askQuestion("Enter the Microservices API URL: ");

  if (!gatewayApiUrl || !microservicesApiUrl) {
    console.log("❌ Both URLs are required!");
    rl.close();
    return;
  }

  await createFolders(folderName, subfolderName, gatewayApiUrl, microservicesApiUrl);
  rl.close();
}

async function createFolders(folderName, subfolderName, gatewayApiUrl, microservicesApiUrl) {
  const hooksFolderPath = path.join(BASE_PATH, "hooks");
  const folderPath = subfolderName
    ? path.join(hooksFolderPath, folderName, subfolderName)
    : path.join(hooksFolderPath, folderName);
  const routesFolderPath = path.join(BASE_PATH, "routes");
  const configFolderPath = path.join(BASE_PATH, "config");

  [hooksFolderPath, folderPath, routesFolderPath, configFolderPath].forEach((dir) => {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created folder: ${dir}`);
  });

  const appUriConfigFilePath = path.join(configFolderPath, "appUriConfig.js");
  let currentConfig = { gatewayApiUri: {}, microservicesApiUri: {} };

  if (fs.existsSync(appUriConfigFilePath)) {
    const configContent = fs.readFileSync(appUriConfigFilePath, "utf8");
    try {
      const gatewayMatch = configContent.match(/export const gatewayApiUri = ({[\s\S]*?});/);
      const microservicesMatch = configContent.match(/export const microservicesApiUri = ({[\s\S]*?});/);
      
      if (gatewayMatch) {
        currentConfig.gatewayApiUri = eval(`(${gatewayMatch[1]})`);
      }
      if (microservicesMatch) {
        currentConfig.microservicesApiUri = eval(`(${microservicesMatch[1]})`);
      }
    } catch (err) {
      console.log("⚠️ Error parsing existing appUriConfig.js. Using default values.");
    }
  }

  const gatewayKey = subfolderName
    ? `${folderName}${capitalizeFirstLetter(subfolderName)}GatewayApiUri`
    : `${folderName}GatewayApiUri`;
  const microservicesKey = subfolderName
    ? `${folderName}${capitalizeFirstLetter(subfolderName)}MicroservicesApiUri`
    : `${folderName}MicroservicesApiUri`;

  currentConfig.gatewayApiUri[gatewayKey] = gatewayApiUrl;
  currentConfig.microservicesApiUri[microservicesKey] = microservicesApiUrl;

  const formatObject = (obj) => {
    return Object.entries(obj)
      .map(([key, value]) => `  ${key}: "${value}"`)
      .join(",\n");
  };

  const updatedConfigContent = `// appUriConfig.js - Configuration for API URLs

export const gatewayApiUri = {
${formatObject(currentConfig.gatewayApiUri)}
};

export const microservicesApiUri = {
${formatObject(currentConfig.microservicesApiUri)}
};
`;

  fs.writeFileSync(appUriConfigFilePath, updatedConfigContent, "utf8");
  console.log("✅ 'appUriConfig.js' updated without removing existing entries.");
}

function formatCamelCase(input) {
  return input.replace(/[-_ ]+(.)/g, (_, char) => char.toUpperCase());
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

startProcess();
