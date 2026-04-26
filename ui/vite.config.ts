import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

/**
 * GitHub Pages 向けの公開パスを解決する。
 *
 * - ローカル開発: `/`
 * - リポジトリ Pages: `/{repo-name}/`
 * - ユーザー/組織 Pages: `/`
 * - 明示上書きしたい場合: `VITE_BASE_PATH`
 */
function resolveBasePath() {
  const explicitBasePath = process.env.VITE_BASE_PATH
  if (explicitBasePath) {
    return explicitBasePath
  }

  if (process.env.GITHUB_PAGES !== 'true') {
    return '/'
  }

  const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1]
  if (!repositoryName || repositoryName.endsWith('.github.io')) {
    return '/'
  }

  return `/${repositoryName}/`
}

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  base: resolveBasePath(),
  plugins: [
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        /**
         * グラフ系・UI系の依存を分割して、初回表示で読み込むJS量を減らす。
         *
         * 特にrechartsは結果画面/比較画面でのみ使うため、専用チャンクに切り出す。
         */
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined
          }

          if (id.includes('recharts')) {
            return 'charts'
          }

          if (id.includes('@radix-ui')) {
            return 'radix-ui'
          }

          if (id.includes('lucide-react')) {
            return 'icons'
          }

          return 'vendor'
        },
      },
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
