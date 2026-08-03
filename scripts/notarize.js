require('dotenv').config();
const { notarize } = require('electron-notarize');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== 'darwin') {
    console.log(`Skipping Notatization`);
    return;
  }

  const appName = context.packager.appInfo.productFilename;

  return await notarize({
    appBundleId: 'com.tmbill.tmbill-atlantic-pos',
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLEID,
    appleIdPassword: process.env.APPLEIDPASS,
    // appleApiKey: process.env.APPLE_API_KEY,
    // appleApiKeyId: process.env.APPLE_API_KEY_ID,
    // appleApiIssuer: process.env.APPLE_API_KEY_ISSUER,
    teamId: process.env.APPLE_TEAM_ID,
    tool: 'notarytool',
  }).then(() => {
    console.log(`Notatization Completed`);
  });
};
