// samsungRouter.js - Auto-generated router file
import config from "../../config";
import samsungRequest from "../hooks/apple/samsung/samsungRequest";
import samsungResponse from "../hooks/apple/samsung/samsungResponse";

const samsungRoute = {
  proxyType: "http",
  prefix: config.applesamsungGatewayUri, // proxy uri
  methods: ["GET"],
  fastProxy: {
    rejectUnauthorized: false,
  },
  hooks: {
    onRequest: samsungRequest.requestPreProcessing,
    onResponse: samsungResponse.responsePostProcessing,
  },
  target: config.commonServicesMicroServicesBaseUrL,
  disableQsOverwrite: true,
  pathRefex: "",
  prefixRewrite: config.applesamsungMicroservicesUri,
};

export default samsungRoute;