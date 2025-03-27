"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const playwright_1 = require("playwright");
const fs = __importStar(require("fs/promises"));
const instagram_private_api_1 = require("instagram-private-api");
const dotenv = __importStar(require("dotenv"));
const utils_js_1 = require("./utils.js");
dotenv.config();
let globalShareText = null;
let globalScreenshotPath = `screenshots/completed-puzzle_${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })
    .split(',')[0]
    .replace(/\//g, '_')}.png`;
async function uploadToInstagram(videoPath, page) {
    const ig = new instagram_private_api_1.IgApiClient();
    try {
        // Basic Instagram setup
        console.log('Logging in as:', process.env.IG_USERNAME);
        ig.state.generateDevice(process.env.IG_USERNAME);
        if (!process.env.IG_USERNAME || !process.env.IG_PASSWORD) {
            throw new Error('Instagram credentials not found in environment variables');
        }
        await ig.account.login(process.env.IG_USERNAME, process.env.IG_PASSWORD);
        console.log('Instagram login successful');
        console.log('Preparing video upload...');
        const videoBuffer = await fs.readFile(videoPath);
        const coverBuffer = await fs.readFile(globalScreenshotPath);
        console.log('Starting video upload...');
        // const publishResult = await ig.publish.video({
        //     video: videoBuffer,
        //     coverImage: coverBuffer,
        //     caption: `${globalShareText}\n\n#puzzli #puzzligame #puzzle #puzzlegame #puzzlesolver #puzzleoftheday #puzzlechallenge #brainteaser #dailypuzzle #logicpuzzle`,
        //     transcodeDelay: 15000  // Increased delay
        // });
        console.log('Video upload completed!');
        return null;
    }
    catch (error) {
        // Type guard for Instagram API errors
        const isIgError = (err) => {
            return typeof err === 'object' && err !== null && 'name' in err;
        };
        if (isIgError(error) && error.name === 'IgConfigureVideoError') {
            console.error('Failed to configure video. Video specs:', {
                size: (await fs.stat(videoPath)).size,
                path: videoPath
            });
        }
        console.error('Failed to upload to Instagram:', error);
        throw error;
    }
}
async function solvePuzzli() {
    const browser = await playwright_1.chromium.launch({
        headless: false,
        args: [
            '--no-sandbox',
            '--window-position=960,0',
            '--window-size=960,960'
        ]
    });
    const context = await browser.newContext({
        recordVideo: {
            dir: './recordings',
            size: { width: 960, height: 960 }
        },
        permissions: ['clipboard-read', 'clipboard-write']
    });
    const page = await context.newPage();
    const videoPath = await page.video()?.path();
    // Set up console log forwarding
    page.on('console', msg => console.log(msg.text()));
    // Set viewport to match recording size
    await page.setViewportSize({
        width: 960,
        height: 960
    });
    await page.goto('https://puzzligame.com');
    await page.waitForSelector('text=Start');
    await page.click('text=Start');
    await page.waitForSelector('.tile img'); // Wait until at least one tile image is visible
    await page.waitForTimeout(1000);
    // Get tile data and perform drag operation
    const tileData = await page.evaluate(async () => {
        // Helper function to get pattern from image element
        const getPattern = (img) => {
            const pat = img.getAttribute('src')?.split('/').pop()?.split('.')[0] || '';
            const rot = parseInt(img.style.rotate || '0deg'.replace('deg', '') || '0');
            const shifts = ((rot / 90) % 8) * 2;
            return pat.slice(-shifts) + pat.slice(0, -shifts);
        };
        function isTopBottomValid(topPattern, bottomPattern) {
            return topPattern[5] === bottomPattern[2] && topPattern[6] === bottomPattern[1];
        }
        function isLeftRightValid(leftPattern, rightPattern) {
            return leftPattern[3] === rightPattern[0] && leftPattern[4] === rightPattern[7];
        }
        // Initialize tile map: pattern -> position
        const tileMap = new Map();
        const tiles = Array.from(document.querySelectorAll('.tile img'));
        tiles.forEach((img, index) => {
            tileMap.set(getPattern(img), index);
        });
        const swapTiles = async (pattern1, pattern2, currentIndex) => {
            const index1 = tileMap.get(pattern1);
            const index2 = tileMap.get(pattern2);
            const tiles = document.querySelectorAll('.tile');
            const firstTile = tiles[index1];
            const lastTile = tiles[index2];
            const lastRect = lastTile.getBoundingClientRect();
            const targetX = lastRect.x + lastRect.width / 2;
            const targetY = lastRect.y + lastRect.height / 2;
            const firstRect = firstTile.getBoundingClientRect();
            firstTile.dispatchEvent(new MouseEvent('mousedown', {
                bubbles: true,
                clientX: firstRect.x + firstRect.width / 2,
                clientY: firstRect.y + firstRect.height / 2
            }));
            await new Promise(resolve => setTimeout(resolve, 40));
            const steps = 25;
            for (let i = 0; i <= steps; i++) {
                const progress = i / steps;
                firstTile.dispatchEvent(new MouseEvent('mousemove', {
                    bubbles: true,
                    clientX: firstRect.x + firstRect.width / 2 + (targetX - (firstRect.x + firstRect.width / 2)) * progress,
                    clientY: firstRect.y + firstRect.height / 2 + (targetY - (firstRect.y + firstRect.height / 2)) * progress
                }));
                await new Promise(resolve => setTimeout(resolve, 4));
            }
            firstTile.dispatchEvent(new MouseEvent('mouseup', {
                bubbles: true,
                clientX: targetX,
                clientY: targetY
            }));
            await new Promise(resolve => setTimeout(resolve, 40));
            // Update our pattern tracking
            tileMap.set(pattern1, index2);
            tileMap.set(pattern2, index1);
        };
        const highlightMatchedTile = (pattern, highlight = true, fadeOut = false) => {
            const index = tileMap.get(pattern);
            const tiles = document.querySelectorAll('.tile');
            const tile = tiles[index];
            if (tile) {
                const existingHighlight = document.querySelector(`#highlight-${index}`);
                if (existingHighlight) {
                    existingHighlight.remove();
                }
                if (highlight) {
                    const rect = tile.getBoundingClientRect();
                    const highlight = document.createElement('div');
                    highlight.id = `highlight-${index}`;
                    highlight.style.cssText = `
						position: absolute;
						top: ${rect.top}px;
						left: ${rect.left}px;
						width: ${rect.width}px;
						height: ${rect.height}px;
						border: 7px solid green;
						border-radius: 8px;
						pointer-events: none;
						z-index: 9999;
						box-sizing: border-box;
						transition: opacity 0.5s ease-out;
						opacity: 1;
					`;
                    document.body.appendChild(highlight);
                    if (fadeOut) {
                        setTimeout(() => {
                            highlight.style.opacity = '0';
                            setTimeout(() => highlight.remove(), 500);
                        }, 500);
                    }
                }
            }
        };
        const triedCombinations = new Set();
        function solutionValid(patterns) {
            for (let i = 0; i < patterns.length; i++) {
                let pattern = patterns[i];
                // Check left-right validity
                if (i % 3 > 0) {
                    let leftPattern = patterns[i - 1];
                    if (!isLeftRightValid(leftPattern, pattern)) {
                        return false;
                    }
                }
                // Check top-bottom validity
                if (i >= 3) {
                    let topPattern = patterns[i - 3];
                    if (!isTopBottomValid(topPattern, pattern)) {
                        return false;
                    }
                }
            }
            return true;
        }
        const tryAllCombinations = async (remainingPatterns, placedPatterns = []) => {
            if (remainingPatterns.size === 0) {
                return true;
            }
            const currentPosition = placedPatterns.length;
            const currentIndex = currentPosition;
            const currentPattern = Array.from(tileMap.entries()).find(([_, index]) => index === currentIndex)?.[0] ?? '';
            const orderedPatterns = [currentPattern, ...Array.from(remainingPatterns).filter(p => p !== currentPattern)];
            for (const pattern of orderedPatterns) {
                if (!pattern)
                    continue; // Skip undefined/empty patterns
                const combinationKey = [...placedPatterns, pattern].join(',');
                if (triedCombinations.has(combinationKey)) {
                    continue;
                }
                // Check validity before swapping
                let isValid = true;
                if (currentPosition % 3 > 0) {
                    isValid = isValid && isLeftRightValid(placedPatterns[placedPatterns.length - 1], pattern);
                }
                if (currentPosition >= 3) {
                    isValid = isValid && isTopBottomValid(placedPatterns[currentPosition - 3], pattern);
                }
                if (isValid) {
                    const patternCurrentPos = Array.from(tileMap.entries())
                        .find(([_, index]) => index === currentIndex)?.[0];
                    if (patternCurrentPos !== pattern) {
                        await swapTiles(patternCurrentPos, pattern, currentIndex);
                    }
                    const allPatterns = [...placedPatterns, ...Array.from(remainingPatterns)];
                    if (solutionValid(allPatterns)) {
                        // Highlight all tiles in current valid solution with fade out
                        for (const pat of allPatterns) {
                            highlightMatchedTile(pat, true, true);
                        }
                        return true;
                    }
                    else {
                        triedCombinations.add(combinationKey);
                        highlightMatchedTile(pattern);
                        const newRemaining = new Set(remainingPatterns);
                        newRemaining.delete(pattern);
                        const newPlaced = [...placedPatterns, pattern];
                        if (await tryAllCombinations(newRemaining, newPlaced)) {
                            return true;
                        }
                        highlightMatchedTile(pattern, false);
                    }
                }
            }
            return false;
        };
        // Start solving with all patterns
        const allPatterns = new Set(Array.from(tileMap.keys()));
        const found = await tryAllCombinations(allPatterns);
        return {
            patterns: Array.from(tileMap.entries()),
            solutionFound: found
        };
    });
    // Print in Node.js context
    console.log("\n=== Final Results ===");
    console.log(`Solution ${tileData.solutionFound ? "was found! 🎉" : "was NOT found ❌"}`);
    console.log("\nFinal tile positions:");
    tileData.patterns.forEach(([pattern, index]) => {
        console.log(`Position ${index}: pattern=${pattern}`);
    });
    console.log("Puzzli bot executed successfully!");
    await page.waitForTimeout(2000);
    // Get share text and take screenshot before closing context
    await page.click('text=Share Results');
    await page.waitForTimeout(250);
    globalShareText = await page.evaluate(async () => {
        // Get clipboard text
        const clipboardText = await navigator.clipboard.readText();
        return clipboardText;
    });
    // Close the modal
    await page.click('.btn-close');
    await page.waitForTimeout(500);
    // Before taking the screenshot, scale up the tiles
    await page.evaluate(() => {
        const tiles = document.querySelectorAll('.tile');
        tiles.forEach(tile => {
            tile.style.transition = 'transform 0.3s ease-out';
            tile.style.transform = 'scale(1.015)';
        });
    });
    // Wait for the animation to complete
    await page.waitForTimeout(300);
    // Take screenshot after tiles are scaled
    await page.screenshot({
        path: globalScreenshotPath,
        clip: {
            x: 55, // Centers horizontally: (960 - 850) / 2
            y: 120, // Adjusted to keep puzzle centered vertically
            width: 850,
            height: 850
        }
    });
    await context.close(); // Close context after getting share text and screenshot
    if (videoPath) {
        const estDate = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
        const formattedDate = estDate.getFullYear() + '_' +
            String(estDate.getMonth() + 1).padStart(2, '0') + '_' +
            String(estDate.getDate()).padStart(2, '0');
        const newVideoPath = `./recordings/puzzli_${formattedDate}.mp4`;
        const trimmedVideoPath = `./recordings/puzzli_${formattedDate}_trimmed.mp4`;
        await fs.rename(videoPath, newVideoPath);
        console.log(`Video recording saved to ${newVideoPath}`);
        // Get video duration first
        const durationResult = await (0, utils_js_1.execAsync)(`"C:\\Program Files\\ffmpeg-7.1.1-essentials_build\\bin\\ffmpeg.exe" -i "${newVideoPath}" 2>&1 | findstr "Duration"`);
        const durationMatch = durationResult.stdout.match(/Duration: (\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
        const videoDuration = durationMatch ?
            parseInt(durationMatch[1]) * 3600 +
                parseInt(durationMatch[2]) * 60 +
                parseInt(durationMatch[3]) +
                parseInt(durationMatch[4]) / 100 : 0;
        // Trim from both start and end
        await (0, utils_js_1.execAsync)(`"C:\\Program Files\\ffmpeg-7.1.1-essentials_build\\bin\\ffmpeg.exe" -i "${newVideoPath}" -ss 2.05 -t ${videoDuration - 3.75} -vf "crop=810:810:75:140" -c:v libx264 "${trimmedVideoPath}"`);
        console.log(`Trimmed video saved to ${trimmedVideoPath}`);
        // Replace original with trimmed version
        await fs.unlink(newVideoPath);
        await fs.rename(trimmedVideoPath, newVideoPath);
        try {
            await uploadToInstagram(newVideoPath, page);
        }
        catch (error) {
            console.error('Instagram upload failed:', error);
        }
    }
    await browser.close();
}
solvePuzzli();
