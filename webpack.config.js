const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const glob = require('glob');
const {
  CleanWebpackPlugin
} = require('clean-webpack-plugin');
const GoogleFontsPlugin = require("@beyonk/google-fonts-webpack-plugin");
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const PurgecssPlugin = require('purgecss-webpack-plugin');
const WorkboxPlugin = require('workbox-webpack-plugin');
var WebpackPwaManifest = require('webpack-pwa-manifest');


const PATHS = {
	  src: path.join(__dirname, 'src')
	}

module.exports = {
  entry: {
	main: './src/index.js',
	app: './src/app/app.js'
  },
  output: {
	filename: '[name].[contenthash:8].js',
	path: path.resolve(__dirname, 'dist'),
  },
  optimization: {
	runtimeChunk: 'single',
	splitChunks: {
	  chunks: 'all',
	  maxInitialRequests: Infinity,
	  minSize: 0,
	  cacheGroups: {
		  styles: {
				name: 'styles',
				test: /\.css$/,
				chunks: 'all',
				enforce: true
			  },
		vendor: {
		  test: /[\\/]node_modules[\\/]/,
		  name(module) {
			const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
			return `npm.${packageName.replace('@', '')}`;
		  },
		},
	  },
	},
  },
  plugins: [
	new MiniCssExtractPlugin({
	  filename: 'style.[contenthash:8].css',
	  chunkFilename: '[id].css',
	}),
	new PurgecssPlugin({
		  paths: glob.sync(`${PATHS.src}/**/*`,  { nodir: true }),
		  safelist: {
			  greedy: [/playingcard/, /face/]
		}
		}),
	new CleanWebpackPlugin(),
	new HtmlWebpackPlugin({
	  template: './src/app/index.html',
	}),
	new webpack.ProvidePlugin({
	  jQuery: 'jquery',
	  $: 'jquery',
	  jquery: 'jquery',
	}),
	new GoogleFontsPlugin({
	  fonts: [{
		  family: "Roboto",
		  variants: ["300", "400", "500", "700"]
		},
		{
		  family: "Roboto Slab",
		  variants: ["400", "700"]
		},
	  ],
	  path: 'fonts/'
	}),
	new CopyPlugin({
	  patterns: [
		{
		  from: '*',
		  to: 'templates/',
		  context: './src/app/templates/'
		},
		{
		  from: '*',
		  to: 'assets/img/',
		  context: './src/assets/img/'
		},
		{
		  from: '**',
		  to: 'assets/sounds/',
		  context: './src/assets/sounds/'
		},
	  ],
	}),
	new WebpackPwaManifest({
		name: 'Pyramid.ninja',
		short_name: 'Pyramid.ninja',
		description: 'A digital version of the drinking game Pyramid.',
		background_color: '#e91e63',
		crossorigin: 'use-credentials',
		orientation: "portrait",
		inject: true,
		ios: true,
		publicPath: '/',
		display: "standalone",
		start_url: "/",
		icons: [
		  {
			src: path.resolve('src/assets/img/icon_dark@4x.png'),
			sizes: [96, 128, 192, 256, 384, 512, 1024, 2048],
			destination: 'assets/img/icons/',
			ios: true
		  },
		  {
			  src: path.resolve('src/assets/img/icon_dark@4x.png'),
			  sizes: [96, 128, 192, 256, 384, 512, 1024, 2048],
			  destination: 'assets/img/icons/',
			},
		  {
			src: path.resolve('src/assets/img/icon_dark@3x.png'),
			size: '1024x1024',
			destination: 'assets/img/icons/',
		  },
		  {
			src: path.resolve('src/assets/img/icon_dark@3x.png'),
			size: '1024x1024',
			purpose: 'maskable',
			destination: 'assets/img/icons/',
		  }
		]
	  }),
	new WorkboxPlugin.GenerateSW({
		navigationPreload: true,
		offlineGoogleAnalytics: true,
		runtimeCaching: [{
			urlPattern: /\.(?:png|jpg|jpeg|svg)$/,
			handler: 'CacheFirst',
			options: {
			  cacheName: 'images',
			  expiration: {
				maxEntries: 20,
			  },
			},
		  },{
			urlPattern: '.',
			handler: 'NetworkFirst',
			
		}],
		clientsClaim: true,
		skipWaiting: true,
		cacheId: 'pyramid.ninja'
	}),
	
  ],
  module: {
	rules: [{
		test: /\.css$/,
		use: [{
			loader: MiniCssExtractPlugin.loader,
			options: {
			  publicPath: '/',
			},
		  },
		  'css-loader',
		],
	  },
	  {
		test: /\.(png|jpg|gif)$/i,
		use: [{
		  loader: 'url-loader',
		  options: {
			outputPath: 'assets/img/',
			limit: 8192,
		  },
		}, ],
	  },
	  {
		test: /\.svg$/i,
		use: [{
		  loader: 'svg-url-loader',
		  options: {
			outputPath: 'assets/img/',
			limit: 10000,
		  },
		}, ],
	  },
	  {
		test: /\.(woff(2)?|ttf|eot)(\?v=\d+\.\d+\.\d+)?$/,
		use: [{
		  loader: 'file-loader',
		  options: {
			name: '[name].[ext]',
			outputPath: 'assets/fonts/'
		  }
		}]
	  }
	],
  },
};