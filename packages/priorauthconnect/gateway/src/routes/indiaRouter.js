// indiaRouter.js - Auto-generated router file
import config from "../../config";
import indiaRequest from "../hooks/india/indiaRequest";
import indiaResponse from "../hooks/india/indiaResponse";

const indiaRoute = {
  proxyType: "http",
  prefix: config.indiaGatewayApiUri, // proxy uri
  methods: ["GET"],
  fastProxy: {
    rejectUnauthorized: false,
  },
  hooks: {
    onRequest: indiaRequest.requestPreProcessing,
    onResponse: indiaResponse.responsePostProcessing,
  },
  target: config.commonServicesMicroServicesBaseUrL,
  disableQsOverwrite: true,
  pathRefex: "",
  prefixRewrite: config.indiaMicroservicesApiUri,
};

export default indiaRoute;