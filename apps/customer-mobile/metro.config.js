// const { getDefaultConfig } = require("expo/metro-config");
// const path = require("path");

// const projectRoot = __dirname;
// const workspaceRoot = path.resolve(projectRoot, "../..");

// const config = getDefaultConfig(projectRoot);

// // Workspace support
// config.watchFolders = [workspaceRoot];

// // Keep Metro focused on the customer-mobile dependency tree
// config.resolver.nodeModulesPaths = [
//     path.resolve(projectRoot, "node_modules"),
//     path.resolve(workspaceRoot, "node_modules"),
// ];

// // IMPORTANT:
// // Customer mobile uses React 18.2.0.
// // Force every React import in this app to the same React instance.
// config.resolver.extraNodeModules = {
//     react: path.resolve(
//         workspaceRoot,
//         "node_modules/.pnpm/react@18.2.0/node_modules/react"
//     ),
// };

// module.exports = config;
const { getDefaultConfig } = require("expo/metro-config");

module.exports = getDefaultConfig(__dirname);