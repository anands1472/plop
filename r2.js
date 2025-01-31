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

// Ask the user for a folder name (main folder)
rl.question("Enter the main folder name: ", (folderName) => {
  folderName = formatCamelCase(folderName.trim());

  if (!folderName) {
    console.log("❌ Folder name cannot be empty!");
    rl.close();
    return;
  }

  // Ask the user if they want to create a subfolder inside the main folder
  rl.question(
    "Do you want to create a subfolder inside this folder? (yes/no): ",
    (createSubfolder) => {
      createSubfolder = createSubfolder.trim().toLowerCase();

      // Ask for the subfolder name only if the user wants a subfolder
      let subfolderName = "";
      if (createSubfolder === "yes") {
        rl.question("Enter the subfolder name: ", (subfolder) => {
          subfolderName = formatCamelCase(subfolder.trim());
          createFolders(folderName, subfolderName);
        });
      } else {
        createFolders(folderName);
      }
    }
  );
});

// Function to create folders and generate files
function createFolders(folderName, subfolderName = "") {
  const hooksFolderPath = path.join(BASE_PATH, "hooks"); // Main hooks folder
  const folderPath = subfolderName
    ? path.join(hooksFolderPath, folderName, subfolderName)
    : path.join(hooksFolderPath, folderName);
  const routesFolderPath = path.join(BASE_PATH, "routes"); // Global routes folder
  const configFolderPath = path.join(BASE_PATH, "config"); // Config folder

  // Ensure necessary folders exist
  [hooksFolderPath, folderPath, routesFolderPath, configFolderPath].forEach(
    (dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Created folder: ${dir}`);
      }
    }
  );

  // Define the appUriConfig.js file path inside the config folder
  const appUriConfigFilePath = path.join(configFolderPath, "appUriConfig.js");

  // Ask for URLs
  rl.question("Enter the Gateway API URL: ", (gatewayApiUrl) => {
    rl.question("Enter the Microservices API URL: ", (microservicesApiUrl) => {
      if (!gatewayApiUrl || !microservicesApiUrl) {
        console.log("❌ Both URLs are required!");
        rl.close();
        return;
      }

      // Read the current appUriConfig.js content (if exists)
      let currentConfig = {};
      if (fs.existsSync(appUriConfigFilePath)) {
        currentConfig = require(appUriConfigFilePath);
      }

      // Add new URIs to the existing config objects
      currentConfig.gatewayApiUri = currentConfig.gatewayApiUri || {};
      currentConfig.microservicesApiUri =
        currentConfig.microservicesApiUri || {};

      // Determine key name (formatted in camelCase)
      const gatewayKey = subfolderName
        ? `${folderName}${capitalizeFirstLetter(subfolderName)}GatewayApiUri`
        : `${folderName}GatewayApiUri`;
      const microservicesKey = subfolderName
        ? `${folderName}${capitalizeFirstLetter(
            subfolderName
          )}MicroservicesApiUri`
        : `${folderName}MicroservicesApiUri`;

      // Add new entries for the created folder
      currentConfig.gatewayApiUri[gatewayKey] = gatewayApiUrl;
      currentConfig.microservicesApiUri[microservicesKey] = microservicesApiUrl;

      // Create or update the appUriConfig.js file
      const updatedConfigContent = `// appUriConfig.js - Configuration for API URLs

export const gatewayApiUri = {
${Object.keys(currentConfig.gatewayApiUri)
  .map((key) => `  ${key}: "${currentConfig.gatewayApiUri[key]}",`)
  .join("\n")}
};

export const microservicesApiUri = {
${Object.keys(currentConfig.microservicesApiUri)
  .map((key) => `  ${key}: "${currentConfig.microservicesApiUri[key]}",`)
  .join("\n")}
};
`;

      fs.writeFileSync(appUriConfigFilePath, updatedConfigContent, "utf8");
      console.log(
        `✅ 'appUriConfig.js' updated with new URIs for '${folderName}${
          subfolderName ? "/" + subfolderName : ""
        }'.`
      );

      // Define JavaScript file names
      const requestFile = subfolderName
        ? `${subfolderName}Request.js`
        : `${folderName}Request.js`;
      const responseFile = subfolderName
        ? `${subfolderName}Response.js`
        : `${folderName}Response.js`;
      const routerFile = subfolderName
        ? `${subfolderName}Router.js`
        : `${folderName}Router.js`;

      // Define file paths
      const requestFilePath = path.join(folderPath, requestFile);
      const responseFilePath = path.join(folderPath, responseFile);
      const routerFilePath = path.join(routesFolderPath, routerFile);

      // Content for Request file
      const requestContent = `// ${requestFile} - Auto-generated request file
import genericRequest from "../genericRequest";

const requestPreProcessing = (req) => {
  genericRequest.hook(req);
};

export default {
  requestPreProcessing,
};`;

      // Content for Response file
      const responseContent = `// ${responseFile} - Auto-generated response file
import genericResponse from "../genericResponse";

const responsePostProcessing = (req, res, stream) => {
  genericResponse.hook(req, res, stream);
};

export default {
  responsePostProcessing,
};`;

      // Content for Router file
      const routerContent = `// ${routerFile} - Auto-generated router file
import config from "../../config";
import ${
        subfolderName ? subfolderName : folderName
      }Request from "../hooks/${folderName}${
        subfolderName ? "/" + subfolderName : ""
      }/${subfolderName ? subfolderName : folderName}Request";
import ${
        subfolderName ? subfolderName : folderName
      }Response from "../hooks/${folderName}${
        subfolderName ? "/" + subfolderName : ""
      }/${subfolderName ? subfolderName : folderName}Response";

const ${subfolderName ? subfolderName : folderName}Route = {
  proxyType: "http",
  prefix: config.${gatewayKey}, // proxy uri
  methods: ["GET"],
  fastProxy: {
    rejectUnauthorized: false,
  },
  hooks: {
    onRequest: ${
      subfolderName ? subfolderName : folderName
    }Request.requestPreProcessing,
    onResponse: ${
      subfolderName ? subfolderName : folderName
    }Response.responsePostProcessing,
  },
  target: config.commonServicesMicroServicesBaseUrL,
  disableQsOverwrite: true,
  pathRefex: "",
  prefixRewrite: config.${microservicesKey},
};

export default ${subfolderName ? subfolderName : folderName}Route;`;

      // Create the request, response, and router files
      fs.writeFileSync(requestFilePath, requestContent, "utf8");
      fs.writeFileSync(responseFilePath, responseContent, "utf8");
      fs.writeFileSync(routerFilePath, routerContent, "utf8");

      console.log(
        `✅ Created request, response, and router files inside 'hooks/${folderName}${
          subfolderName ? "/" + subfolderName : ""
        }' and 'routes/'.`
      );

      rl.close();
    });
  });
}

// Function to convert input into camelCase
function formatCamelCase(input) {
  return input.replace(/[-_ ]+(.)/g, (_, char) => char.toUpperCase());
}

// Function to capitalize first letter of a word
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
