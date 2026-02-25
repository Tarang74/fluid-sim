import { defineConfig, loadEnv, type PluginOption } from "vite";
import react from "@vitejs/plugin-react-swc";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    worker: {
      format: "es",
      plugins: () => [wasm(), topLevelAwait()] as PluginOption[],
    },
    build: {
      rollupOptions: {
        output: {
          entryFileNames: "assets/[name].js",
          chunkFileNames: "assets/[name].js",
          assetFileNames: "assets/[name].[ext]",
        },
      },
    },
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: `http://127.0.0.1:${env.API_PORT_HOST}`,
          changeOrigin: true,
          secure: false,
        },
        "/sim": {
          target: `ws://0.0.0.0:${env.WEBSOCKET_PORT}`,
          changeOrigin: true,
          ws: true,
          timeout: 60 * 60 * 1000,
          proxyTimeout: 60 * 60 * 1000,
          secure: false,
        },
      },
      headers: {
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Embedder-Policy": "require-corp",
      },
    },
    preview: {
      port: 5173,
      proxy: {
        "/api": {
          target: `http://127.0.0.1:${env.API_PORT_HOST}`,
          changeOrigin: true,
          secure: false,
        },
        "/sim": {
          target: `ws://127.0.0.1:${env.WEBSOCKET_PORT}`,
          changeOrigin: true,
          ws: true,
          timeout: 60 * 60 * 1000,
          proxyTimeout: 60 * 60 * 1000,
        },
      },
      headers: {
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Embedder-Policy": "require-corp",
      },
    },
  };
});
