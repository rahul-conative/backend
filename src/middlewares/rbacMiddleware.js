const UAParser = require('ua-parser-js');

const parseUserAgent = (userAgent) => {
  if (!userAgent) {
    return { type: "Unknown", os: "Unknown", platform: "Unknown" };
  }

  if (userAgent.includes("okhttp/")) {
    return {
      type: "MOBILE",
      os: "Android",
      platform: "Mobile App",
    };
  }

  if (userAgent.includes("CFNetwork") && userAgent.includes("Darwin")) {
    return {
      type: "MOBILE",
      os: "iOS",
      platform: "Mobile App",
    };
  }

  if (userAgent.includes("chainDest") && userAgent.includes("Android")) {
    return {
      type: "MOBILE",
      os: "Android",
      platform: "Mobile App",
    };
  }

  if (userAgent.includes("Mobile") && userAgent.includes("iPhone")) {
    return {
      type: "MOBILE",
      os: "iOS",
      platform: "Mobile Browser",
    };
  }

  if (userAgent.includes("Android") && userAgent.includes("Mobile")) {
    return {
      type: "MOBILE",
      os: "Android",
      platform: "Mobile Browser",
    };
  }

  if (
    userAgent.includes("Windows") ||
    userAgent.includes("Macintosh") ||
    userAgent.includes("Linux")
  ) {
    return {
      type: "DESKTOP",
      os: userAgent.includes("Windows")
        ? "Windows"
        : userAgent.includes("Macintosh")
          ? "Mac"
          : "Linux",
      platform: "WEB",
    };
  }

  return { type: "Unknown", os: "Unknown", platform: "Unknown" };
};

const ipClientAdd = (req, res, next) => {
  let clientIp = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress;

  if (clientIp && clientIp.startsWith('::ffff:')) {
    clientIp = clientIp.split('::ffff:')[1];
  }

  const parser = new UAParser(req.headers['user-agent']);
  const uaResult = parser.getResult();
  const parsedUserAgent = parseUserAgent(req.headers['user-agent']);
  req.userAgent = parsedUserAgent?.platform || "Mobile App";
  req.platform = uaResult.os.name || "Unknown";
  req.browser = uaResult.browser.name || "Unknown";
  req.os = uaResult.os.version || "Unknown";
  req.clientIp = clientIp;


  next();
}


const mergeParamsToBody = (req, res, next) => {
  const mergedBody = { ...req.body };

  Object.assign(mergedBody, req.params);

  if (req.query) {
    const processedQuery = { ...req.query };

    const numberParams = ['pageNo', 'size'];

    for (const key of numberParams) {
      if (key in processedQuery && processedQuery[key] !== undefined) {
        const numberValue = Number(processedQuery[key]);
        if (!isNaN(numberValue)) {
          processedQuery[key] = numberValue;
        }
      }
    }

    Object.assign(mergedBody, processedQuery);
  }

  req.body = mergedBody;
  next();
};



module.exports = { ipClientAdd, mergeParamsToBody };
