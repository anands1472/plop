// sdsdsRouter.js - Auto-generated router file
import config from "../../config";
import sdsdsRequest from "../hooks/kushaan/sdsds/sdsdsRequest";
import sdsdsResponse from "../hooks/kushaan/sdsds/sdsdsResponse";

const sdsdsRoute = {
  proxyType: "http",
  prefix: config.kushaanSdsdsGatewayApiUri, // proxy uri
  methods: ["GET"],
  fastProxy: {
    rejectUnauthorized: false,
  },
  hooks: {
    onRequest: sdsdsRequest.requestPreProcessing,
    onResponse: sdsdsResponse.responsePostProcessing,
  },
  target: config.commonServicesMicroServicesBaseUrL,
  disableQsOverwrite: true,
  pathRefex: "",
  prefixRewrite: config.kushaanSdsdsMicroservicesApiUri,
};

export default sdsdsRoute;