const fs = require("fs");
const path = require("path");
const readline = require("readline");

// Setup readline for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Ask the user for a folder name
rl.question("Enter the folder name: ", (folderName) => {
    folderName = folderName.trim(); // Remove extra spaces

    if (!folderName) {
        console.log("❌ Folder name cannot be empty!");
        rl.close();
        return;
    }

    // Ask for the URLs for gatewayApiUri and microservicesApiUri
    rl.question("Enter the Gateway API URL (e.g., http://example.com/api): ", (gatewayApiUrl) => {
        rl.question("Enter the Microservices API URL (e.g., http://example.com/api/base): ", (microservicesApiUrl) => {

            // Ensure the URLs are provided
            if (!gatewayApiUrl || !microservicesApiUrl) {
                console.log("❌ Both URLs are required!");
                rl.close();
                return;
            }

            const hooksFolderPath = path.join(__dirname, "hooks"); // Main hooks folder
            const folderPath = path.join(hooksFolderPath, folderName); // UserAPI inside hooks
            const routesFolderPath = path.join(__dirname, "routes"); // Global routes folder
            const configFolderPath = path.join(__dirname, "config"); // Config folder

            // Ensure the hooks folder exists
            if (!fs.existsSync(hooksFolderPath)) {
                fs.mkdirSync(hooksFolderPath, { recursive: true });
                console.log(`✅ 'hooks' folder created.`);
            }

            // Ensure the UserAPI folder inside hooks exists
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath, { recursive: true });
                console.log(`✅ Folder '${folderName}' created inside 'hooks'.`);
            } else {
                console.log(`ℹ️ Folder '${folderName}' already exists inside 'hooks'.`);
            }

            // Ensure the global routes folder exists
            if (!fs.existsSync(routesFolderPath)) {
                fs.mkdirSync(routesFolderPath, { recursive: true });
                console.log(`✅ Global 'routes' folder created.`);
            } else {
                console.log(`ℹ️ 'routes' folder already exists.`);
            }

            // Ensure the config folder exists
            if (!fs.existsSync(configFolderPath)) {
                fs.mkdirSync(configFolderPath, { recursive: true });
                console.log(`✅ 'config' folder created.`);
            } else {
                console.log(`ℹ️ 'config' folder already exists.`);
            }

            // Define the appUriConfig.js file path inside the config folder
            const appUriConfigFilePath = path.join(configFolderPath, "appUriConfig.js");

            // Content for appUriConfig.js with the user-provided URLs
            const appUriConfigContent = `// appUriConfig.js - Configuration for API URLs

export const gatewayApiUri = {
  ${folderName}GatewayUri: "${gatewayApiUrl}",
};

export const microservicesApiUri = {
  ${folderName}MicroservicesUri: "${microservicesApiUrl}",
};`;

            // Create the appUriConfig.js file
            fs.writeFileSync(appUriConfigFilePath, appUriConfigContent, "utf8");
            console.log(`✅ 'appUriConfig.js' created inside 'config' folder.`);

            // Define JavaScript file names based on folder name
            const requestFile = `${folderName}Request.js`;
            const responseFile = `${folderName}Response.js`;
            const routerFile = `${folderName}Router.js`;

            // Define file paths for request, response, and router files
            const requestFilePath = path.join(folderPath, requestFile);
            const responseFilePath = path.join(folderPath, responseFile);
            const routerFilePath = path.join(routesFolderPath, routerFile); // Router file inside global routes folder

            // Content for Request file
            const requestContent = `// ${requestFile} - Auto-generated request file\nimport genericRequest from "../genericRequest";\n\nconst requestPreProcessing = (req) => {\n  genericRequest.hook(req);\n};\n\nexport default {\n  requestPreProcessing,\n};`;

            // Content for Response file
            const responseContent = `// ${responseFile} - Auto-generated response file\nimport genericResponse from "../genericResponse";\n\nconst responsePostProcessing = (req, res, stream) => {\n  genericResponse.hook(req, res, stream);\n};\n\nexport default {\n  responsePostProcessing,\n};`;

            // Content for Router file (using the provided template and dynamic imports)
            const routerContent = `// ${routerFile} - Auto-generated router file\nimport config from "../../config";\nimport ${folderName}Request from "../hooks/${folderName}/${folderName}Request";\nimport ${folderName}Response from "../hooks/${folderName}/${folderName}Response";\n\nconst ${folderName}Route = {\n  proxyType: "http",\n  prefix: config.${folderName}GatewayUri, // proxy uri\n  methods: ["GET"],\n  fastProxy: {\n    rejectUnauthorized: false,\n  },\n  hooks: {\n    onRequest: ${folderName}Request.requestPreProcessing,\n    onResponse: ${folderName}Response.responsePostProcessing,\n  },\n  target: config.commonServicesMicroServicesBaseUrL,\n  disableQsOverwrite: true,\n  pathRefex: "",\n  prefixRewrite: config.${folderName}MicroservicesUri,\n};\n\nexport default ${folderName}Route;`;

            // Create the request, response, and router files
            fs.writeFileSync(requestFilePath, requestContent, "utf8");
            fs.writeFileSync(responseFilePath, responseContent, "utf8");
            fs.writeFileSync(routerFilePath, routerContent, "utf8");

            console.log(`✅ JavaScript files '${requestFile}' and '${responseFile}' created inside 'hooks/${folderName}'.`);
            console.log(`✅ JavaScript router file '${routerFile}' created inside 'routes/'.`);

            rl.close();
        });
    });
});
