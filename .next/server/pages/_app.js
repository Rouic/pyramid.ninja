/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "pages/_app";
exports.ids = ["pages/_app"];
exports.modules = {

/***/ "(pages-dir-node)/./src/context/PlayerContext.tsx":
/*!***************************************!*\
  !*** ./src/context/PlayerContext.tsx ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   PlayerProvider: () => (/* binding */ PlayerProvider),\n/* harmony export */   usePlayerContext: () => (/* binding */ usePlayerContext)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"react\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);\n\n\nconst defaultContext = {\n    playerId: \"\",\n    playerName: \"\",\n    isHost: false,\n    setPlayerId: ()=>{},\n    setPlayerName: ()=>{},\n    setIsHost: ()=>{}\n};\nconst PlayerContext = /*#__PURE__*/ (0,react__WEBPACK_IMPORTED_MODULE_1__.createContext)(defaultContext);\nconst usePlayerContext = ()=>(0,react__WEBPACK_IMPORTED_MODULE_1__.useContext)(PlayerContext);\nconst PlayerProvider = ({ children })=>{\n    const [playerId, setPlayerId] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(\"\");\n    const [playerName, setPlayerName] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(\"\");\n    const [isHost, setIsHost] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false);\n    // Initialize player info from localStorage if available\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)({\n        \"PlayerProvider.useEffect\": ()=>{\n            const storedPlayerId = localStorage.getItem(\"playerId\");\n            const storedPlayerName = localStorage.getItem(\"playerName\");\n            if (storedPlayerId) setPlayerId(storedPlayerId);\n            if (storedPlayerName) setPlayerName(storedPlayerName);\n        }\n    }[\"PlayerProvider.useEffect\"], []);\n    // Save changes to localStorage\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)({\n        \"PlayerProvider.useEffect\": ()=>{\n            if (playerId) localStorage.setItem(\"playerId\", playerId);\n            if (playerName) localStorage.setItem(\"playerName\", playerName);\n        }\n    }[\"PlayerProvider.useEffect\"], [\n        playerId,\n        playerName\n    ]);\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(PlayerContext.Provider, {\n        value: {\n            playerId,\n            playerName,\n            isHost,\n            setPlayerId,\n            setPlayerName,\n            setIsHost\n        },\n        children: children\n    }, void 0, false, {\n        fileName: \"/Users/alex/Developer/pyramid.ninja/src/context/PlayerContext.tsx\",\n        lineNumber: 50,\n        columnNumber: 5\n    }, undefined);\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHBhZ2VzLWRpci1ub2RlKS8uL3NyYy9jb250ZXh0L1BsYXllckNvbnRleHQudHN4IiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBOEU7QUFhOUUsTUFBTUssaUJBQW9DO0lBQ3hDQyxVQUFVO0lBQ1ZDLFlBQVk7SUFDWkMsUUFBUTtJQUNSQyxhQUFhLEtBQU87SUFDcEJDLGVBQWUsS0FBTztJQUN0QkMsV0FBVyxLQUFPO0FBQ3BCO0FBRUEsTUFBTUMsOEJBQWdCWCxvREFBYUEsQ0FBb0JJO0FBRWhELE1BQU1RLG1CQUFtQixJQUFNWCxpREFBVUEsQ0FBQ1UsZUFBZTtBQUV6RCxNQUFNRSxpQkFBMEQsQ0FBQyxFQUN0RUMsUUFBUSxFQUNUO0lBQ0MsTUFBTSxDQUFDVCxVQUFVRyxZQUFZLEdBQUdOLCtDQUFRQSxDQUFDO0lBQ3pDLE1BQU0sQ0FBQ0ksWUFBWUcsY0FBYyxHQUFHUCwrQ0FBUUEsQ0FBQztJQUM3QyxNQUFNLENBQUNLLFFBQVFHLFVBQVUsR0FBR1IsK0NBQVFBLENBQUM7SUFFckMsd0RBQXdEO0lBQ3hEQyxnREFBU0E7b0NBQUM7WUFDUixNQUFNWSxpQkFBaUJDLGFBQWFDLE9BQU8sQ0FBQztZQUM1QyxNQUFNQyxtQkFBbUJGLGFBQWFDLE9BQU8sQ0FBQztZQUU5QyxJQUFJRixnQkFBZ0JQLFlBQVlPO1lBQ2hDLElBQUlHLGtCQUFrQlQsY0FBY1M7UUFDdEM7bUNBQUcsRUFBRTtJQUVMLCtCQUErQjtJQUMvQmYsZ0RBQVNBO29DQUFDO1lBQ1IsSUFBSUUsVUFBVVcsYUFBYUcsT0FBTyxDQUFDLFlBQVlkO1lBQy9DLElBQUlDLFlBQVlVLGFBQWFHLE9BQU8sQ0FBQyxjQUFjYjtRQUNyRDttQ0FBRztRQUFDRDtRQUFVQztLQUFXO0lBRXpCLHFCQUNFLDhEQUFDSyxjQUFjUyxRQUFRO1FBQ3JCQyxPQUFPO1lBQ0xoQjtZQUNBQztZQUNBQztZQUNBQztZQUNBQztZQUNBQztRQUNGO2tCQUVDSTs7Ozs7O0FBR1AsRUFBRSIsInNvdXJjZXMiOlsiL1VzZXJzL2FsZXgvRGV2ZWxvcGVyL3B5cmFtaWQubmluamEvc3JjL2NvbnRleHQvUGxheWVyQ29udGV4dC50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0LCB7IGNyZWF0ZUNvbnRleHQsIHVzZUNvbnRleHQsIHVzZVN0YXRlLCB1c2VFZmZlY3QgfSBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCB7IGRvYywgZ2V0RG9jIH0gZnJvbSBcImZpcmViYXNlL2ZpcmVzdG9yZVwiO1xuaW1wb3J0IHsgZGIgfSBmcm9tIFwiLi4vbGliL2ZpcmViYXNlL2ZpcmViYXNlXCI7XG5cbmludGVyZmFjZSBQbGF5ZXJDb250ZXh0VHlwZSB7XG4gIHBsYXllcklkOiBzdHJpbmc7XG4gIHBsYXllck5hbWU6IHN0cmluZztcbiAgaXNIb3N0OiBib29sZWFuO1xuICBzZXRQbGF5ZXJJZDogKGlkOiBzdHJpbmcpID0+IHZvaWQ7XG4gIHNldFBsYXllck5hbWU6IChuYW1lOiBzdHJpbmcpID0+IHZvaWQ7XG4gIHNldElzSG9zdDogKGlzSG9zdDogYm9vbGVhbikgPT4gdm9pZDtcbn1cblxuY29uc3QgZGVmYXVsdENvbnRleHQ6IFBsYXllckNvbnRleHRUeXBlID0ge1xuICBwbGF5ZXJJZDogXCJcIixcbiAgcGxheWVyTmFtZTogXCJcIixcbiAgaXNIb3N0OiBmYWxzZSxcbiAgc2V0UGxheWVySWQ6ICgpID0+IHt9LFxuICBzZXRQbGF5ZXJOYW1lOiAoKSA9PiB7fSxcbiAgc2V0SXNIb3N0OiAoKSA9PiB7fSxcbn07XG5cbmNvbnN0IFBsYXllckNvbnRleHQgPSBjcmVhdGVDb250ZXh0PFBsYXllckNvbnRleHRUeXBlPihkZWZhdWx0Q29udGV4dCk7XG5cbmV4cG9ydCBjb25zdCB1c2VQbGF5ZXJDb250ZXh0ID0gKCkgPT4gdXNlQ29udGV4dChQbGF5ZXJDb250ZXh0KTtcblxuZXhwb3J0IGNvbnN0IFBsYXllclByb3ZpZGVyOiBSZWFjdC5GQzx7IGNoaWxkcmVuOiBSZWFjdC5SZWFjdE5vZGUgfT4gPSAoe1xuICBjaGlsZHJlbixcbn0pID0+IHtcbiAgY29uc3QgW3BsYXllcklkLCBzZXRQbGF5ZXJJZF0gPSB1c2VTdGF0ZShcIlwiKTtcbiAgY29uc3QgW3BsYXllck5hbWUsIHNldFBsYXllck5hbWVdID0gdXNlU3RhdGUoXCJcIik7XG4gIGNvbnN0IFtpc0hvc3QsIHNldElzSG9zdF0gPSB1c2VTdGF0ZShmYWxzZSk7XG5cbiAgLy8gSW5pdGlhbGl6ZSBwbGF5ZXIgaW5mbyBmcm9tIGxvY2FsU3RvcmFnZSBpZiBhdmFpbGFibGVcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBjb25zdCBzdG9yZWRQbGF5ZXJJZCA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwicGxheWVySWRcIik7XG4gICAgY29uc3Qgc3RvcmVkUGxheWVyTmFtZSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwicGxheWVyTmFtZVwiKTtcblxuICAgIGlmIChzdG9yZWRQbGF5ZXJJZCkgc2V0UGxheWVySWQoc3RvcmVkUGxheWVySWQpO1xuICAgIGlmIChzdG9yZWRQbGF5ZXJOYW1lKSBzZXRQbGF5ZXJOYW1lKHN0b3JlZFBsYXllck5hbWUpO1xuICB9LCBbXSk7XG5cbiAgLy8gU2F2ZSBjaGFuZ2VzIHRvIGxvY2FsU3RvcmFnZVxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChwbGF5ZXJJZCkgbG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJwbGF5ZXJJZFwiLCBwbGF5ZXJJZCk7XG4gICAgaWYgKHBsYXllck5hbWUpIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwicGxheWVyTmFtZVwiLCBwbGF5ZXJOYW1lKTtcbiAgfSwgW3BsYXllcklkLCBwbGF5ZXJOYW1lXSk7XG5cbiAgcmV0dXJuIChcbiAgICA8UGxheWVyQ29udGV4dC5Qcm92aWRlclxuICAgICAgdmFsdWU9e3tcbiAgICAgICAgcGxheWVySWQsXG4gICAgICAgIHBsYXllck5hbWUsXG4gICAgICAgIGlzSG9zdCxcbiAgICAgICAgc2V0UGxheWVySWQsXG4gICAgICAgIHNldFBsYXllck5hbWUsXG4gICAgICAgIHNldElzSG9zdCxcbiAgICAgIH19XG4gICAgPlxuICAgICAge2NoaWxkcmVufVxuICAgIDwvUGxheWVyQ29udGV4dC5Qcm92aWRlcj5cbiAgKTtcbn07XG4iXSwibmFtZXMiOlsiUmVhY3QiLCJjcmVhdGVDb250ZXh0IiwidXNlQ29udGV4dCIsInVzZVN0YXRlIiwidXNlRWZmZWN0IiwiZGVmYXVsdENvbnRleHQiLCJwbGF5ZXJJZCIsInBsYXllck5hbWUiLCJpc0hvc3QiLCJzZXRQbGF5ZXJJZCIsInNldFBsYXllck5hbWUiLCJzZXRJc0hvc3QiLCJQbGF5ZXJDb250ZXh0IiwidXNlUGxheWVyQ29udGV4dCIsIlBsYXllclByb3ZpZGVyIiwiY2hpbGRyZW4iLCJzdG9yZWRQbGF5ZXJJZCIsImxvY2FsU3RvcmFnZSIsImdldEl0ZW0iLCJzdG9yZWRQbGF5ZXJOYW1lIiwic2V0SXRlbSIsIlByb3ZpZGVyIiwidmFsdWUiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(pages-dir-node)/./src/context/PlayerContext.tsx\n");

/***/ }),

/***/ "(pages-dir-node)/./src/pages/_app.tsx":
/*!****************************!*\
  !*** ./src/pages/_app.tsx ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../styles/globals.css */ \"(pages-dir-node)/./src/styles/globals.css\");\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_styles_globals_css__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var next_head__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/head */ \"next/head\");\n/* harmony import */ var next_head__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_head__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _context_PlayerContext__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../context/PlayerContext */ \"(pages-dir-node)/./src/context/PlayerContext.tsx\");\n\n\n\n\nfunction MyApp({ Component, pageProps }) {\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_context_PlayerContext__WEBPACK_IMPORTED_MODULE_3__.PlayerProvider, {\n        children: [\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)((next_head__WEBPACK_IMPORTED_MODULE_2___default()), {\n                children: [\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"title\", {\n                        children: \"Pyramid.Ninja - Card Drinking Game\"\n                    }, void 0, false, {\n                        fileName: \"/Users/alex/Developer/pyramid.ninja/src/pages/_app.tsx\",\n                        lineNumber: 10,\n                        columnNumber: 9\n                    }, this),\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"meta\", {\n                        name: \"description\",\n                        content: \"A digital version of the popular drinking game Pyramid\"\n                    }, void 0, false, {\n                        fileName: \"/Users/alex/Developer/pyramid.ninja/src/pages/_app.tsx\",\n                        lineNumber: 11,\n                        columnNumber: 9\n                    }, this),\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"meta\", {\n                        name: \"viewport\",\n                        content: \"width=device-width, initial-scale=1, maximum-scale=1\"\n                    }, void 0, false, {\n                        fileName: \"/Users/alex/Developer/pyramid.ninja/src/pages/_app.tsx\",\n                        lineNumber: 15,\n                        columnNumber: 9\n                    }, this),\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"link\", {\n                        rel: \"icon\",\n                        href: \"/favicon.ico\"\n                    }, void 0, false, {\n                        fileName: \"/Users/alex/Developer/pyramid.ninja/src/pages/_app.tsx\",\n                        lineNumber: 19,\n                        columnNumber: 9\n                    }, this)\n                ]\n            }, void 0, true, {\n                fileName: \"/Users/alex/Developer/pyramid.ninja/src/pages/_app.tsx\",\n                lineNumber: 9,\n                columnNumber: 7\n            }, this),\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(Component, {\n                ...pageProps\n            }, void 0, false, {\n                fileName: \"/Users/alex/Developer/pyramid.ninja/src/pages/_app.tsx\",\n                lineNumber: 21,\n                columnNumber: 7\n            }, this)\n        ]\n    }, void 0, true, {\n        fileName: \"/Users/alex/Developer/pyramid.ninja/src/pages/_app.tsx\",\n        lineNumber: 8,\n        columnNumber: 5\n    }, this);\n}\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (MyApp);\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHBhZ2VzLWRpci1ub2RlKS8uL3NyYy9wYWdlcy9fYXBwLnRzeCIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBK0I7QUFFRjtBQUM2QjtBQUUxRCxTQUFTRSxNQUFNLEVBQUVDLFNBQVMsRUFBRUMsU0FBUyxFQUFZO0lBQy9DLHFCQUNFLDhEQUFDSCxrRUFBY0E7OzBCQUNiLDhEQUFDRCxrREFBSUE7O2tDQUNILDhEQUFDSztrQ0FBTTs7Ozs7O2tDQUNQLDhEQUFDQzt3QkFDQ0MsTUFBSzt3QkFDTEMsU0FBUTs7Ozs7O2tDQUVWLDhEQUFDRjt3QkFDQ0MsTUFBSzt3QkFDTEMsU0FBUTs7Ozs7O2tDQUVWLDhEQUFDQzt3QkFBS0MsS0FBSTt3QkFBT0MsTUFBSzs7Ozs7Ozs7Ozs7OzBCQUV4Qiw4REFBQ1I7Z0JBQVcsR0FBR0MsU0FBUzs7Ozs7Ozs7Ozs7O0FBRzlCO0FBRUEsaUVBQWVGLEtBQUtBLEVBQUMiLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbGV4L0RldmVsb3Blci9weXJhbWlkLm5pbmphL3NyYy9wYWdlcy9fYXBwLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgXCIuLi9zdHlsZXMvZ2xvYmFscy5jc3NcIjtcbmltcG9ydCB0eXBlIHsgQXBwUHJvcHMgfSBmcm9tIFwibmV4dC9hcHBcIjtcbmltcG9ydCBIZWFkIGZyb20gXCJuZXh0L2hlYWRcIjtcbmltcG9ydCB7IFBsYXllclByb3ZpZGVyIH0gZnJvbSBcIi4uL2NvbnRleHQvUGxheWVyQ29udGV4dFwiO1xuXG5mdW5jdGlvbiBNeUFwcCh7IENvbXBvbmVudCwgcGFnZVByb3BzIH06IEFwcFByb3BzKSB7XG4gIHJldHVybiAoXG4gICAgPFBsYXllclByb3ZpZGVyPlxuICAgICAgPEhlYWQ+XG4gICAgICAgIDx0aXRsZT5QeXJhbWlkLk5pbmphIC0gQ2FyZCBEcmlua2luZyBHYW1lPC90aXRsZT5cbiAgICAgICAgPG1ldGFcbiAgICAgICAgICBuYW1lPVwiZGVzY3JpcHRpb25cIlxuICAgICAgICAgIGNvbnRlbnQ9XCJBIGRpZ2l0YWwgdmVyc2lvbiBvZiB0aGUgcG9wdWxhciBkcmlua2luZyBnYW1lIFB5cmFtaWRcIlxuICAgICAgICAvPlxuICAgICAgICA8bWV0YVxuICAgICAgICAgIG5hbWU9XCJ2aWV3cG9ydFwiXG4gICAgICAgICAgY29udGVudD1cIndpZHRoPWRldmljZS13aWR0aCwgaW5pdGlhbC1zY2FsZT0xLCBtYXhpbXVtLXNjYWxlPTFcIlxuICAgICAgICAvPlxuICAgICAgICA8bGluayByZWw9XCJpY29uXCIgaHJlZj1cIi9mYXZpY29uLmljb1wiIC8+XG4gICAgICA8L0hlYWQ+XG4gICAgICA8Q29tcG9uZW50IHsuLi5wYWdlUHJvcHN9IC8+XG4gICAgPC9QbGF5ZXJQcm92aWRlcj5cbiAgKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgTXlBcHA7XG4iXSwibmFtZXMiOlsiSGVhZCIsIlBsYXllclByb3ZpZGVyIiwiTXlBcHAiLCJDb21wb25lbnQiLCJwYWdlUHJvcHMiLCJ0aXRsZSIsIm1ldGEiLCJuYW1lIiwiY29udGVudCIsImxpbmsiLCJyZWwiLCJocmVmIl0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(pages-dir-node)/./src/pages/_app.tsx\n");

/***/ }),

/***/ "(pages-dir-node)/./src/styles/globals.css":
/*!********************************!*\
  !*** ./src/styles/globals.css ***!
  \********************************/
/***/ (() => {



/***/ }),

/***/ "next/head":
/*!****************************!*\
  !*** external "next/head" ***!
  \****************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/head");

/***/ }),

/***/ "react":
/*!************************!*\
  !*** external "react" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = require("react");

/***/ }),

/***/ "react/jsx-dev-runtime":
/*!****************************************!*\
  !*** external "react/jsx-dev-runtime" ***!
  \****************************************/
/***/ ((module) => {

"use strict";
module.exports = require("react/jsx-dev-runtime");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = (__webpack_exec__("(pages-dir-node)/./src/pages/_app.tsx"));
module.exports = __webpack_exports__;

})();