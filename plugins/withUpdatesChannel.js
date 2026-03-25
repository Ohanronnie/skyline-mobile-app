const { withAndroidManifest, withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * Config plugin to add expo-updates channel request headers for local builds.
 * This ensures the channel is set even when not using EAS Build.
 */
function withUpdatesChannel(config, { channel = "production" } = {}) {
  // Android: Add UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY to AndroidManifest.xml
  config = withAndroidManifest(config, (modConfig) => {
    const mainApplication = modConfig.modResults.manifest.application?.[0];
    
    if (mainApplication) {
      // Ensure meta-data array exists
      if (!mainApplication["meta-data"]) {
        mainApplication["meta-data"] = [];
      }

      const keyName = "expo.modules.updates.UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY";
      const metaDataArray = mainApplication["meta-data"];
      
      // Check if the key already exists
      const existingIndex = metaDataArray.findIndex(
        (item) => item.$?.["android:name"] === keyName
      );

      const metaData = {
        $: {
          "android:name": keyName,
          "android:value": JSON.stringify({ "expo-channel-name": channel }),
        },
      };

      if (existingIndex >= 0) {
        // Update existing entry
        metaDataArray[existingIndex] = metaData;
      } else {
        // Add new entry
        metaDataArray.push(metaData);
      }
      
      console.log(`[withUpdatesChannel] Added channel "${channel}" to Android manifest`);
    } else {
      console.warn("[withUpdatesChannel] Could not find mainApplication in manifest");
    }

    return modConfig;
  });

  // iOS: Add EXUpdatesRequestHeaders to Expo.plist
  config = withDangerousMod(config, [
    "ios",
    async (modConfig) => {
      const appName = modConfig.modRequest.projectName || modConfig.name;
      const expoPlistPath = path.join(
        modConfig.modRequest.platformProjectRoot,
        appName,
        "Supporting",
        "Expo.plist"
      );

      if (fs.existsSync(expoPlistPath)) {
        let content = fs.readFileSync(expoPlistPath, "utf8");
        
        // Check if EXUpdatesRequestHeaders already exists
        if (!content.includes("EXUpdatesRequestHeaders")) {
          // Insert before the closing </dict> tag
          const insertContent = `  <key>EXUpdatesRequestHeaders</key>
    <dict>
      <key>expo-channel-name</key>
      <string>${channel}</string>
    </dict>
  </dict>`;
          
          content = content.replace(/  <\/dict>\s*<\/plist>/, insertContent + "\n</plist>");
          fs.writeFileSync(expoPlistPath, content);
          console.log(`[withUpdatesChannel] Added channel "${channel}" to iOS Expo.plist`);
        }
      } else {
        console.log(`[withUpdatesChannel] Expo.plist not found at ${expoPlistPath}`);
      }

      return modConfig;
    },
  ]);

  return config;
}

module.exports = withUpdatesChannel;
