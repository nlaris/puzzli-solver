"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var playwright_1 = require("playwright");
var fs = require("fs/promises");
var instagram_private_api_1 = require("instagram-private-api");
var dotenv = require("dotenv");
dotenv.config();
function uploadToInstagram(videoPath) {
    return __awaiter(this, void 0, void 0, function () {
        var ig, publishResult, _a, _b, error_1;
        var _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    ig = new instagram_private_api_1.IgApiClient();
                    // Basic Instagram setup
                    ig.state.generateDevice(process.env.IG_USERNAME);
                    return [4 /*yield*/, ig.account.login(process.env.IG_USERNAME, process.env.IG_PASSWORD)];
                case 1:
                    _d.sent();
                    _d.label = 2;
                case 2:
                    _d.trys.push([2, 6, , 7]);
                    _b = (_a = ig.publish).video;
                    _c = {};
                    return [4 /*yield*/, fs.readFile(videoPath)];
                case 3:
                    _c.video = _d.sent();
                    return [4 /*yield*/, fs.readFile('completed-puzzle.png')];
                case 4: return [4 /*yield*/, _b.apply(_a, [(_c.coverImage = _d.sent(),
                            _c.caption = 'Puzzle solved by my automation bot! 🧩✨ #puzzlegames #automation #coding',
                            _c)])];
                case 5:
                    publishResult = _d.sent();
                    console.log('Video uploaded to Instagram successfully!');
                    return [2 /*return*/, publishResult];
                case 6:
                    error_1 = _d.sent();
                    console.error('Failed to upload to Instagram:', error_1);
                    throw error_1;
                case 7: return [2 /*return*/];
            }
        });
    });
}
function solvePuzzli() {
    return __awaiter(this, void 0, void 0, function () {
        var browser, context, page, videoPath, tileData, estDate, formattedDate, newVideoPath, trimmedVideoPath, error_2;
        var _this = this;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, playwright_1.chromium.launch({
                        headless: false,
                        args: [
                            '--no-sandbox',
                            '--window-position=960,0', // Position window at x=960 (half of 1920), y=0
                            '--window-size=960,1080' // Make window width half of screen
                        ]
                    })];
                case 1:
                    browser = _b.sent();
                    return [4 /*yield*/, browser.newContext({
                            recordVideo: {
                                dir: './recordings',
                                size: { width: 960, height: 1080 }
                            }
                        })];
                case 2:
                    context = _b.sent();
                    return [4 /*yield*/, context.newPage()];
                case 3:
                    page = _b.sent();
                    return [4 /*yield*/, ((_a = page.video()) === null || _a === void 0 ? void 0 : _a.path())];
                case 4:
                    videoPath = _b.sent();
                    // Set up console log forwarding
                    page.on('console', function (msg) { return console.log(msg.text()); });
                    // Set viewport to half screen width
                    return [4 /*yield*/, page.setViewportSize({
                            width: 960, // Half of 1920
                            height: 1080
                        })];
                case 5:
                    // Set viewport to half screen width
                    _b.sent();
                    return [4 /*yield*/, page.goto('https://puzzligame.com')];
                case 6:
                    _b.sent();
                    return [4 /*yield*/, page.waitForSelector('text=Start')];
                case 7:
                    _b.sent();
                    return [4 /*yield*/, page.click('text=Start')];
                case 8:
                    _b.sent();
                    // Wait for elements to load
                    return [4 /*yield*/, page.waitForTimeout(500)];
                case 9:
                    // Wait for elements to load
                    _b.sent();
                    return [4 /*yield*/, page.waitForSelector('.tile img')];
                case 10:
                    _b.sent(); // Wait until at least one tile image is visible
                    // Take screenshot for video thumbnail
                    return [4 /*yield*/, page.screenshot({ path: 'completed-puzzle.png' })];
                case 11:
                    // Take screenshot for video thumbnail
                    _b.sent();
                    // Wait a second before starting the solution
                    return [4 /*yield*/, page.waitForTimeout(500)];
                case 12:
                    // Wait a second before starting the solution
                    _b.sent();
                    return [4 /*yield*/, page.evaluate(function () { return __awaiter(_this, void 0, void 0, function () {
                            function isTopBottomValid(topPattern, bottomPattern) {
                                return topPattern[5] === bottomPattern[2] && topPattern[6] === bottomPattern[1];
                            }
                            function isLeftRightValid(leftPattern, rightPattern) {
                                return leftPattern[3] === rightPattern[0] && leftPattern[4] === rightPattern[7];
                            }
                            function solutionValid(patterns) {
                                for (var i = 0; i < patterns.length; i++) {
                                    var pattern = patterns[i];
                                    // Check left-right validity
                                    if (i % 3 > 0) {
                                        var leftPattern = patterns[i - 1];
                                        if (!isLeftRightValid(leftPattern, pattern)) {
                                            return false;
                                        }
                                    }
                                    // Check top-bottom validity
                                    if (i >= 3) {
                                        var topPattern = patterns[i - 3];
                                        if (!isTopBottomValid(topPattern, pattern)) {
                                            return false;
                                        }
                                    }
                                }
                                return true;
                            }
                            var getPattern, tileMap, tiles, swapTiles, highlightMatchedTile, triedCombinations, tryAllCombinations, allPatterns, found;
                            var _this = this;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        getPattern = function (img) {
                                            var _a, _b;
                                            var pat = ((_b = (_a = img.getAttribute('src')) === null || _a === void 0 ? void 0 : _a.split('/').pop()) === null || _b === void 0 ? void 0 : _b.split('.')[0]) || '';
                                            var rot = parseInt(img.style.rotate || '0deg'.replace('deg', '') || '0');
                                            var shifts = ((rot / 90) % 8) * 2;
                                            return pat.slice(-shifts) + pat.slice(0, -shifts);
                                        };
                                        tileMap = new Map();
                                        tiles = Array.from(document.querySelectorAll('.tile img'));
                                        tiles.forEach(function (img, index) {
                                            tileMap.set(getPattern(img), index);
                                        });
                                        swapTiles = function (pattern1, pattern2, currentIndex) { return __awaiter(_this, void 0, void 0, function () {
                                            var index1, index2, tiles, firstTile, lastTile, lastRect, targetX, targetY, firstRect, steps, i, progress;
                                            return __generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0:
                                                        index1 = tileMap.get(pattern1);
                                                        index2 = tileMap.get(pattern2);
                                                        tiles = document.querySelectorAll('.tile');
                                                        firstTile = tiles[index1];
                                                        lastTile = tiles[index2];
                                                        lastRect = lastTile.getBoundingClientRect();
                                                        targetX = lastRect.x + lastRect.width / 2;
                                                        targetY = lastRect.y + lastRect.height / 2;
                                                        firstRect = firstTile.getBoundingClientRect();
                                                        firstTile.dispatchEvent(new MouseEvent('mousedown', {
                                                            bubbles: true,
                                                            clientX: firstRect.x + firstRect.width / 2,
                                                            clientY: firstRect.y + firstRect.height / 2
                                                        }));
                                                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 3); })];
                                                    case 1:
                                                        _a.sent();
                                                        steps = 10 + (currentIndex * 1.25);
                                                        i = 0;
                                                        _a.label = 2;
                                                    case 2:
                                                        if (!(i <= steps)) return [3 /*break*/, 5];
                                                        progress = i / steps;
                                                        firstTile.dispatchEvent(new MouseEvent('mousemove', {
                                                            bubbles: true,
                                                            clientX: firstRect.x + firstRect.width / 2 + (targetX - (firstRect.x + firstRect.width / 2)) * progress,
                                                            clientY: firstRect.y + firstRect.height / 2 + (targetY - (firstRect.y + firstRect.height / 2)) * progress
                                                        }));
                                                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 2); })];
                                                    case 3:
                                                        _a.sent();
                                                        _a.label = 4;
                                                    case 4:
                                                        i++;
                                                        return [3 /*break*/, 2];
                                                    case 5:
                                                        firstTile.dispatchEvent(new MouseEvent('mouseup', {
                                                            bubbles: true,
                                                            clientX: targetX,
                                                            clientY: targetY
                                                        }));
                                                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 3); })];
                                                    case 6:
                                                        _a.sent();
                                                        // Update our pattern tracking
                                                        tileMap.set(pattern1, index2);
                                                        tileMap.set(pattern2, index1);
                                                        return [2 /*return*/];
                                                }
                                            });
                                        }); };
                                        highlightMatchedTile = function (pattern, highlight, fadeOut) {
                                            if (highlight === void 0) { highlight = true; }
                                            if (fadeOut === void 0) { fadeOut = false; }
                                            var index = tileMap.get(pattern);
                                            var tiles = document.querySelectorAll('.tile');
                                            var tile = tiles[index];
                                            if (tile) {
                                                var existingHighlight = document.querySelector("#highlight-".concat(index));
                                                if (existingHighlight) {
                                                    existingHighlight.remove();
                                                }
                                                if (highlight) {
                                                    var rect = tile.getBoundingClientRect();
                                                    var highlight_1 = document.createElement('div');
                                                    highlight_1.id = "highlight-".concat(index);
                                                    highlight_1.style.cssText = "\n\t\t\t\t\t\tposition: absolute;\n\t\t\t\t\t\ttop: ".concat(rect.top, "px;\n\t\t\t\t\t\tleft: ").concat(rect.left, "px;\n\t\t\t\t\t\twidth: ").concat(rect.width, "px;\n\t\t\t\t\t\theight: ").concat(rect.height, "px;\n\t\t\t\t\t\tborder: 7px solid green;\n\t\t\t\t\t\tborder-radius: 8px;\n\t\t\t\t\t\tpointer-events: none;\n\t\t\t\t\t\tz-index: 9999;\n\t\t\t\t\t\tbox-sizing: border-box;\n\t\t\t\t\t\ttransition: opacity 1.5s ease-out;\n\t\t\t\t\t\topacity: 1;\n\t\t\t\t\t");
                                                    document.body.appendChild(highlight_1);
                                                    if (fadeOut) {
                                                        setTimeout(function () {
                                                            highlight_1.style.opacity = '0';
                                                            setTimeout(function () { return highlight_1.remove(); }, 1500);
                                                        }, 500);
                                                    }
                                                }
                                            }
                                        };
                                        triedCombinations = new Set();
                                        tryAllCombinations = function (remainingPatterns_1) {
                                            var args_1 = [];
                                            for (var _i = 1; _i < arguments.length; _i++) {
                                                args_1[_i - 1] = arguments[_i];
                                            }
                                            return __awaiter(_this, __spreadArray([remainingPatterns_1], args_1, true), void 0, function (remainingPatterns, placedPatterns) {
                                                var currentPosition, currentIndex, _a, remainingPatterns_2, pattern, combinationKey, patternCurrentPos, isValid, allPatterns_2, _b, allPatterns_1, pat, newRemaining, newPlaced;
                                                var _c;
                                                if (placedPatterns === void 0) { placedPatterns = []; }
                                                return __generator(this, function (_d) {
                                                    switch (_d.label) {
                                                        case 0:
                                                            if (remainingPatterns.size === 0) {
                                                                return [2 /*return*/, true];
                                                            }
                                                            currentPosition = placedPatterns.length;
                                                            currentIndex = currentPosition;
                                                            _a = 0, remainingPatterns_2 = remainingPatterns;
                                                            _d.label = 1;
                                                        case 1:
                                                            if (!(_a < remainingPatterns_2.length)) return [3 /*break*/, 7];
                                                            pattern = remainingPatterns_2[_a];
                                                            combinationKey = __spreadArray(__spreadArray([], placedPatterns, true), [pattern], false).join(',');
                                                            if (triedCombinations.has(combinationKey)) {
                                                                return [3 /*break*/, 6];
                                                            }
                                                            patternCurrentPos = (_c = Array.from(tileMap.entries())
                                                                .find(function (_a) {
                                                                var _ = _a[0], index = _a[1];
                                                                return index === currentIndex;
                                                            })) === null || _c === void 0 ? void 0 : _c[0];
                                                            if (!(patternCurrentPos !== pattern)) return [3 /*break*/, 3];
                                                            return [4 /*yield*/, swapTiles(patternCurrentPos, pattern, currentIndex)];
                                                        case 2:
                                                            _d.sent();
                                                            _d.label = 3;
                                                        case 3:
                                                            isValid = true;
                                                            if (currentPosition % 3 > 0) {
                                                                isValid = isValid && isLeftRightValid(placedPatterns[placedPatterns.length - 1], pattern);
                                                            }
                                                            if (currentPosition >= 3) {
                                                                isValid = isValid && isTopBottomValid(placedPatterns[currentPosition - 3], pattern);
                                                            }
                                                            if (!isValid) return [3 /*break*/, 6];
                                                            allPatterns_2 = __spreadArray(__spreadArray([], placedPatterns, true), Array.from(remainingPatterns), true);
                                                            if (!solutionValid(allPatterns_2)) return [3 /*break*/, 4];
                                                            // Highlight all tiles in current valid solution with fade out
                                                            for (_b = 0, allPatterns_1 = allPatterns_2; _b < allPatterns_1.length; _b++) {
                                                                pat = allPatterns_1[_b];
                                                                highlightMatchedTile(pat, true, true);
                                                            }
                                                            return [2 /*return*/, true];
                                                        case 4:
                                                            triedCombinations.add(combinationKey);
                                                            highlightMatchedTile(pattern);
                                                            newRemaining = new Set(remainingPatterns);
                                                            newRemaining.delete(pattern);
                                                            newPlaced = __spreadArray(__spreadArray([], placedPatterns, true), [pattern], false);
                                                            return [4 /*yield*/, tryAllCombinations(newRemaining, newPlaced)];
                                                        case 5:
                                                            if (_d.sent()) {
                                                                return [2 /*return*/, true];
                                                            }
                                                            highlightMatchedTile(pattern, false);
                                                            _d.label = 6;
                                                        case 6:
                                                            _a++;
                                                            return [3 /*break*/, 1];
                                                        case 7: return [2 /*return*/, false];
                                                    }
                                                });
                                            });
                                        };
                                        allPatterns = new Set(Array.from(tileMap.keys()));
                                        return [4 /*yield*/, tryAllCombinations(allPatterns)];
                                    case 1:
                                        found = _a.sent();
                                        return [2 /*return*/, {
                                                patterns: Array.from(tileMap.entries()),
                                                solutionFound: found
                                            }];
                                }
                            });
                        }); })];
                case 13:
                    tileData = _b.sent();
                    // Print in Node.js context
                    console.log("\n=== Final Results ===");
                    console.log("Solution ".concat(tileData.solutionFound ? "was found! 🎉" : "was NOT found ❌"));
                    console.log("\nFinal tile positions:");
                    tileData.patterns.forEach(function (_a) {
                        var pattern = _a[0], index = _a[1];
                        console.log("Position ".concat(index, ": pattern=").concat(pattern));
                    });
                    console.log("Puzzli bot executed successfully!");
                    return [4 /*yield*/, page.waitForTimeout(2000)];
                case 14:
                    _b.sent();
                    return [4 /*yield*/, context.close()];
                case 15:
                    _b.sent(); // This ensures the recording is finished
                    if (!videoPath) return [3 /*break*/, 22];
                    estDate = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
                    formattedDate = estDate.getFullYear() + '-' +
                        String(estDate.getMonth() + 1).padStart(2, '0') + '-' +
                        String(estDate.getDate()).padStart(2, '0');
                    newVideoPath = "./recordings/puzzli_".concat(formattedDate, ".mp4");
                    trimmedVideoPath = "./recordings/puzzli_".concat(formattedDate, "_trimmed.mp4");
                    return [4 /*yield*/, fs.rename(videoPath, newVideoPath)];
                case 16:
                    _b.sent();
                    console.log("Video recording saved to ".concat(newVideoPath));
                    _b.label = 17;
                case 17:
                    _b.trys.push([17, 21, , 22]);
                    return [4 /*yield*/, execAsync("ffmpeg -i \"".concat(newVideoPath, "\" -ss 1 -c copy \"").concat(trimmedVideoPath, "\""))];
                case 18:
                    _b.sent();
                    console.log("Trimmed video saved to ".concat(trimmedVideoPath));
                    // Replace original with trimmed version
                    return [4 /*yield*/, fs.unlink(newVideoPath)];
                case 19:
                    // Replace original with trimmed version
                    _b.sent();
                    return [4 /*yield*/, fs.rename(trimmedVideoPath, newVideoPath)];
                case 20:
                    _b.sent();
                    return [3 /*break*/, 22];
                case 21:
                    error_2 = _b.sent();
                    console.error('Failed to trim video:', error_2);
                    return [3 /*break*/, 22];
                case 22: return [4 /*yield*/, browser.close()];
                case 23:
                    _b.sent();
                    return [2 /*return*/];
            }
        });
    });
}
solvePuzzli();
