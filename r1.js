const fs = require("fs");
const path = require("path");
const readline = require("readline");

// Setup readline for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Ask the user for a folder name (main folder)
rl.question("Enter the main folder name: ", (folderName) => {
    folderName = folderName.trim(); // Remove extra spaces

    if (!folderName) {
        console.log("❌ Folder name cannot be empty!");
        rl.close();
        return;
    }

    // Ask the user if they want to create a subfolder inside the main folder
    rl.question("Do you want to create a subfolder inside this folder? (yes/no): ", (createSubfolder) => {
        createSubfolder = createSubfolder.trim().toLowerCase();

        // Ask for the subfolder name only if the user wants a subfolder
        let subfolderName = '';
        if (createSubfolder === 'yes') {
            rl.question("Enter the subfolder name: ", (subfolder) => {
                subfolderName = subfolder.trim(); // Remove extra spaces
                createFolders(folderName, subfolderName);
            });
        } else {
            createFolders(folderName);
        }
    });
});

// Function to create folders and generate files
function createFolders(folderName, subfolderName = '') {
    const hooksFolderPath = path.join(__dirname, "hooks"); // Main hooks folder
    const folderPath = subfolderName ? path.join(hooksFolderPath, folderName, subfolderName) : path.join(hooksFolderPath, folderName); // UserAPI inside hooks
    const routesFolderPath = path.join(__dirname, "routes"); // Global routes folder
    const configFolderPath = path.join(__dirname, "config"); // Config folder

    // Ensure the hooks folder exists
    if (!fs.existsSync(hooksFolderPath)) {
        fs.mkdirSync(hooksFolderPath, { recursive: true });
        console.log(`✅ 'hooks' folder created.`);
    }

    // Ensure the main folder inside hooks exists
    if (!fs.existsSync(path.join(hooksFolderPath, folderName))) {
        fs.mkdirSync(path.join(hooksFolderPath, folderName), { recursive: true });
        console.log(`✅ Folder '${folderName}' created inside 'hooks'.`);
    }

    // Ensure the subfolder exists (if provided)
    if (subfolderName && !fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
        console.log(`✅ Subfolder '${subfolderName}' created inside '${folderName}' folder.`);
    } else if (subfolderName) {
        console.log(`ℹ️ Subfolder '${subfolderName}' already exists inside '${folderName}'.`);
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

    // Ask for URLs
    rl.question("Enter the Gateway API URL (e.g., http://example.com/api): ", (gatewayApiUrl) => {
        rl.question("Enter the Microservices API URL (e.g., http://example.com/api/base): ", (microservicesApiUrl) => {

            // Ensure the URLs are provided
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
            currentConfig.microservicesApiUri = currentConfig.microservicesApiUri || {};

            // Add the new URIs for the folder (this will keep the existing ones intact)
            currentConfig.gatewayApiUri[`${folderName}GatewayUri`] = gatewayApiUrl;
            currentConfig.microservicesApiUri[`${folderName}MicroservicesUri`] = microservicesApiUrl;

            // Create or update the appUriConfig.js file with the updated content
            const updatedConfigContent = `// appUriConfig.js - Configuration for API URLs

export const gatewayApiUri = {
${Object.keys(currentConfig.gatewayApiUri).map(key => `  ${key}: "${currentConfig.gatewayApiUri[key]}",`).join('\n')}
};

export const microservicesApiUri = {
${Object.keys(currentConfig.microservicesApiUri).map(key => `  ${key}: "${currentConfig.microservicesApiUri[key]}",`).join('\n')}
};
`;

            // Write the updated config content to appUriConfig.js
            fs.writeFileSync(appUriConfigFilePath, updatedConfigContent, "utf8");
            console.log(`✅ 'appUriConfig.js' updated with new URIs for '${folderName}'.`);

            // Define JavaScript file names based on subfolder (if exists)
            const requestFile = subfolderName ? `${subfolderName}Request.js` : `${folderName}Request.js`;
            const responseFile = subfolderName ? `${subfolderName}Response.js` : `${folderName}Response.js`;
            const routerFile = subfolderName ? `${subfolderName}Router.js` : `${folderName}Router.js`;

            // Define file paths for request, response, and router files
            const requestFilePath = path.join(folderPath, requestFile);
            const responseFilePath = path.join(folderPath, responseFile);
            const routerFilePath = path.join(routesFolderPath, routerFile); // Router file inside global routes folder

            // Content for Request file
            const requestContent = `// ${requestFile} - Auto-generated request file\nimport genericRequest from "../genericRequest";\n\nconst requestPreProcessing = (req) => {\n  genericRequest.hook(req);\n};\n\nexport default {\n  requestPreProcessing,\n};`;

            // Content for Response file
            const responseContent = `// ${responseFile} - Auto-generated response file\nimport genericResponse from "../genericResponse";\n\nconst responsePostProcessing = (req, res, stream) => {\n  genericResponse.hook(req, res, stream);\n};\n\nexport default {\n  responsePostProcessing,\n};`;

            // Content for Router file (using the provided template and dynamic imports)
            const routerContent = `// ${routerFile} - Auto-generated router file\nimport config from "../../config";\nimport ${subfolderName ? subfolderName : folderName}Request from "../hooks/${folderName}${subfolderName ? '/' + subfolderName : ''}/${subfolderName ? subfolderName : folderName}Request";\nimport ${subfolderName ? subfolderName : folderName}Response from "../hooks/${folderName}${subfolderName ? '/' + subfolderName : ''}/${subfolderName ? subfolderName : folderName}Response";\n\nconst ${subfolderName ? subfolderName : folderName}Route = {\n  proxyType: "http",\n  prefix: config.${subfolderName ? subfolderName : folderName}GatewayUri, // proxy uri\n  methods: ["GET"],\n  fastProxy: {\n    rejectUnauthorized: false,\n  },\n  hooks: {\n    onRequest: ${subfolderName ? subfolderName : folderName}Request.requestPreProcessing,\n    onResponse: ${subfolderName ? subfolderName : folderName}Response.responsePostProcessing,\n  },\n  target: config.commonServicesMicroServicesBaseUrL,\n  disableQsOverwrite: true,\n  pathRefex: "",\n  prefixRewrite: config.${subfolderName ? subfolderName : folderName}MicroservicesUri,\n};\n\nexport default ${subfolderName ? subfolderName : folderName}Route;`;

            // Create the request, response, and router files
            fs.writeFileSync(requestFilePath, requestContent, "utf8");
            fs.writeFileSync(responseFilePath, responseContent, "utf8");
            fs.writeFileSync(routerFilePath, routerContent, "utf8");

            console.log(`✅ JavaScript files '${requestFile}' and '${responseFile}' created inside 'hooks/${folderName}${subfolderName ? '/' + subfolderName : ''}'.`);
            console.log(`✅ JavaScript router file '${routerFile}' created inside 'routes/'.`);

            rl.close();
        });
    });
}
