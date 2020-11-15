const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const glob = require('glob');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const GoogleFontsPlugin = require("@beyonk/google-fonts-webpack-plugin");
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const PurgecssPlugin = require('purgecss-webpack-plugin');
const workbox = require('workbox-webpack-plugin');
const RobotstxtPlugin = require("robotstxt-webpack-plugin");
const WebpackPwaManifest = require('webpack-pwa-manifest-contrib');
const WebpackAutoInject = require('webpack-auto-inject-version');




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
	new RobotstxtPlugin({
		host: "https://pyramid.ninja",	
		policy: [
			{
			  userAgent: "Googlebot",
			  allow: "/",
			  disallow: ["/game", "/host"],
			},
			{
			  userAgent: "OtherBot",
			  allow: "/",
			  disallow: ["/game", "/host"],
			},
			{
			  userAgent: "*",
			  allow: "/",
			},
		  ],
	}),
	new WebpackAutoInject({
		components: {
			InjectAsComment: false
		  },
	}),
	new HtmlWebpackPlugin({
		template: './src/app/index.html',
	}),
	new MiniCssExtractPlugin({
	  filename: 'style.[contenthash:8].css',
	  chunkFilename: 'style.[contenthash:8].css',
	}),
	new PurgecssPlugin({
		  paths: glob.sync(`${PATHS.src}/**/*`,  { nodir: true }),
		  safelist: {
			  greedy: [/playingcard/, /face/]
		}
		}),
	new CleanWebpackPlugin(),
	new webpack.ProvidePlugin({
	  jQuery: 'jquery',
	  $: 'jquery',
	  jquery: 'jquery',
	}),
	new CopyPlugin({
	  patterns: [
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
		theme_color: '#e91e63',
		inject: true,
		ios: true,
		publicPath: '/',
		display: "standalone",
		start_url: "/",
		icons: [
		  {
			src: path.resolve('src/assets/icons/icon_dark@4x.png'),
			sizes: [96, 128, 192, 256, 384, 512, 1024, 2048],
			destination: 'assets/img/icons/',
			ios: true
		  },
		  {
			  src: path.resolve('src/assets/icons/icon_dark@4x.png'),
			  sizes: [96, 128, 192, 256, 384, 512, 1024, 2048],
			  destination: 'assets/img/icons/',
			},
		  {
			src: path.resolve('src/assets/icons/icon_dark@3x.png'),
			size: '1024x1024',
			destination: 'assets/img/icons/',
		  },
		  {
			src: path.resolve('src/assets/icons/icon_dark@3x.png'),
			size: '1024x1024',
			purpose: 'maskable',
			destination: 'assets/img/icons/',
		  }
		]
	  }),
	  new workbox.InjectManifest({
		  swSrc: './src/service-worker.js',
		  swDest: 'sw.js',
		  compileSrc: true,
		  
	  }),
  ],
  module: {
	rules: [
		{
		  test: /\.html$/,
		  exclude: /index\.html$/,
		  use: [
			  {
				  loader: 'file-loader',
				  options: {
					  name: 'template.[contenthash:8].html',
					  outputPath: 'templates/'
				  }
			  },
			  'extract-loader', 
			  {
				loader: 'html-loader',
				options: {
					attributes: false,
					
				}
			  }
		  ],
		},
		{
			test: /\.scss$/,
			loader: 'style-loader!css-loader!sass-loader'
		},
		{
		test: /\.css$/,
		use: [{
			loader: MiniCssExtractPlugin.loader,
			options: {
			  publicPath: '/',
			},
		  },
		  {
		  loader: 'css-loader',
	  	  }
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