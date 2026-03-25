#!/usr/bin/env node
/**
 * Post-prebuild script to add expo-updates channel configuration
 * Run this after `npx expo prebuild` to add the channel config
 * 
 * Usage: node scripts/fix-updates-channel.js
 */

const fs = require("fs");
const path = require("path");

const CHANNEL = "production";

// Fix Android
const androidManifestPath = path.join(
  __dirname,
  "..",
  "android/app/src/main/AndroidManifest.xml"
);

if (fs.existsSync(androidManifestPath)) {
  let content = fs.readFileSync(androidManifestPath, "utf8");
  
  const metaDataKey = "expo.modules.updates.UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY";
  
  if (!content.includes(metaDataKey)) {
    // Find the EXPO_UPDATE_URL line and insert after it
    const searchString = `<meta-data android:name="expo.modules.updates.EXPO_UPDATE_URL" android:value="https://u.expo.dev/c8e9edc6-e561-422c-b8bc-576d4ebc2c82"/>`;
    const insertLine = `\n    <meta-data android:name="${metaDataKey}" android:value="{\&quot;expo-channel-name\&quot;:\&quot;${CHANNEL}\&quot;}"/>`;
    
    if (content.includes(searchString)) {
      content = content.replace(searchString, searchString + insertLine);
      fs.writeFileSync(androidManifestPath, content);
      console.log("✅ Android: Added channel config to AndroidManifest.xml");
    } else {
      // Fallback: try to find any EXPO_UPDATE_URL and add after
      const urlLine = content.match(/<meta-data android:name="expo\.modules\.updates\.EXPO_UPDATE_URL"[^>]*\/>/);
      if (urlLine) {
        content = content.replace(urlLine[0], urlLine[0] + insertLine);
        fs.writeFileSync(androidManifestPath, content);
        console.log("✅ Android: Added channel config to AndroidManifest.xml (fallback)");
      } else {
        console.log("⚠️  Android: Could not find EXPO_UPDATE_URL to insert after");
      }
    }
  } else {
    console.log("ℹ️  Android: Channel config already exists");
  }
} else {
  console.log("⚠️  Android: AndroidManifest.xml not found");
}

// Fix iOS
const iosExpoPlistPath = path.join(
  __dirname,
  "..",
  "ios/Skyinventories/Supporting/Expo.plist"
);

if (fs.existsSync(iosExpoPlistPath)) {
  let content = fs.readFileSync(iosExpoPlistPath, "utf8");
  
  if (!content.includes("EXUpdatesRequestHeaders")) {
    const insertContent = `    <key>EXUpdatesRequestHeaders</key>
    <dict>
      <key>expo-channel-name</key>
      <string>${CHANNEL}</string>
    </dict>
  </dict>`;
    
    content = content.replace(/  <\/dict>\s*<\/plist>/, insertContent + "\n</plist>");
    fs.writeFileSync(iosExpoPlistPath, content);
    console.log("✅ iOS: Added channel config to Expo.plist");
  } else {
    console.log("ℹ️  iOS: Channel config already exists");
  }
} else {
  console.log("⚠️  iOS: Expo.plist not found");
}

console.log("\n🎉 Done! Now run your build commands.");
