const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch all files in the monorepo
config.watchFolders = [workspaceRoot];

// Let Metro handle symlinks
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Force Metro to resolve to a single instance of React
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Ensure react and react-native resolve to the mobile app's node_modules
  if (moduleName === 'react' || moduleName === 'react-native') {
    const modulePath = path.resolve(
      projectRoot,
      'node_modules',
      moduleName
    );
    return {
      filePath: require.resolve(moduleName, {
        paths: [projectRoot],
      }),
      type: 'sourceFile',
    };
  }

  // Otherwise, use the default resolver
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
