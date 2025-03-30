import { chromium, Page } from 'playwright';
import * as fs from 'fs/promises';
import { IgApiClient } from 'instagram-private-api';
import * as dotenv from 'dotenv';
import { execAsync } from './utils';

dotenv.config();

let globalShareText: string | null = null;
let globalVideoPath: string | null = null;
let globalScreenshotPath = `screenshots/completed-puzzle_${new Date().toLocaleString("en-US", {timeZone: "America/New_York"})
	.split(',')[0]
	.replace(/\//g, '_')}.png`;

async function uploadToInstagram(videoPath: string) {
    const ig = new IgApiClient();
    
    try {
        console.log('Logging in as:', process.env.IG_USERNAME);
        ig.state.generateDevice(process.env.IG_USERNAME!);
        
        if (!process.env.IG_USERNAME || !process.env.IG_PASSWORD) {
            throw new Error('Instagram credentials not found in environment variables');
        }
        
        await ig.account.login(process.env.IG_USERNAME!, process.env.IG_PASSWORD!);
        console.log('Instagram login successful');
        
        console.log('Preparing video upload...');
        const videoBuffer = await fs.readFile(videoPath);
        const coverBuffer = await fs.readFile(globalScreenshotPath);
        if (!globalShareText) {
            globalShareText = await loadShareText();
            if (!globalShareText) {
                throw new Error('Share text is not available');
            }
        }
        console.log('Starting video upload...');
        const publishResult = await ig.publish.video({
            video: videoBuffer,
            coverImage: coverBuffer,
            caption: `${globalShareText}\n\n#puzzli #puzzligame #puzzle #puzzlegame #puzzlesolver #puzzleoftheday #puzzlechallenge #brainteaser #dailypuzzle #logicpuzzle`,
            transcodeDelay: 15000
        });
        
        console.log('Video upload completed!');
        return publishResult;
    } catch (error: unknown) {
        const isIgError = (err: unknown): err is { name: string } => {
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

function getTodayVideoPath(): string {
    const estDate = new Date(new Date().toLocaleString("en-US", {timeZone: "America/New_York"}));
    const formattedDate = estDate.getFullYear() + '_' + 
        String(estDate.getMonth() + 1).padStart(2, '0') + '_' + 
        String(estDate.getDate()).padStart(2, '0');
    return `./recordings/puzzli_${formattedDate}.mp4`;
}

async function saveShareText(text: string) {
    await fs.writeFile('./data/shareText.txt', text);
}

async function loadShareText(): Promise<string | null> {
    try {
        const text = await fs.readFile('./data/shareText.txt', 'utf-8');
        return text;
    } catch (error) {
        return null;
    }
}

async function uploadVideo(waitForInput: boolean = false) {
    const videoPath = getTodayVideoPath();
    const maxRetries = 5;
    let retryCount = 0;

    try {
        await fs.access(videoPath);
        
        if (waitForInput) {
            console.log('\nPress Enter to upload to Instagram, or Ctrl+C to exit...');
            process.stdin.setRawMode(true);
            await new Promise<void>((resolve, reject) => {
                process.stdin.once('data', data => {
                    if (data[0] === 13 || data[0] === 10) {
                        process.stdin.setRawMode(false);
                        resolve();
                    }
                    // Handle Ctrl+C (character code 3)
                    if (data[0] === 3) {
                        process.stdin.setRawMode(false);
                        console.log('\nCancelled upload');
                        process.exit(0);
                    }
                });
            });
        }

        while (retryCount < maxRetries) {
            try {
                await uploadToInstagram(videoPath);
                console.log('Upload successful!');
                process.exit(0);
            } catch (error) {
                retryCount++;
                if (retryCount === maxRetries) {
                    console.error(`Failed to upload after ${maxRetries} attempts`);
                    process.exit(1);
                }
                console.log(`Upload failed, retrying (attempt ${retryCount}/${maxRetries})...`);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    } catch (error) {
        console.error('Video not found:', error);
        process.exit(1);
    }
}

async function solvePuzzli() {
	const browser = await chromium.launch({
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
	const page: Page = await context.newPage();
	globalVideoPath = await page.video()?.path() ?? null;
	
	page.on('console', msg => console.log(msg.text()));

	await page.setViewportSize({
		width: 960,
		height: 960
	});

	await page.goto('https://puzzligame.com');

	await page.waitForSelector('text=Start');
	await page.click('text=Start');

	await page.waitForSelector('.tile img');

	await page.waitForTimeout(1000);

	const tileData = await page.evaluate(async () => {
		const getPattern = (img: Element): string => {
			const pat = img.getAttribute('src')?.split('/').pop()?.split('.')[0] || '';
			const rot = parseInt((img as HTMLImageElement).style.rotate || '0deg'.replace('deg', '') || '0');
			const shifts = ((rot / 90) % 8) * 2;
			return pat.slice(-shifts) + pat.slice(0, -shifts);
		};

		function isTopBottomValid(topPattern: string, bottomPattern: string): boolean {
			return topPattern[5] === bottomPattern[2] && topPattern[6] === bottomPattern[1];
		}

		function isLeftRightValid(leftPattern: string, rightPattern: string): boolean {
			return leftPattern[3] === rightPattern[0] && leftPattern[4] === rightPattern[7];
		}

		const tileMap = new Map<string, number>();
		const tiles = Array.from(document.querySelectorAll('.tile img'));
		tiles.forEach((img, index) => {
			tileMap.set(getPattern(img), index);
		});

		const swapTiles = async (pattern1: string, pattern2: string, currentIndex: number) => {
			const index1 = tileMap.get(pattern1)!;
			const index2 = tileMap.get(pattern2)!;
			
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

			tileMap.set(pattern1, index2);
			tileMap.set(pattern2, index1);
		};

		const highlightMatchedTile = (pattern: string, highlight: boolean = true, fadeOut: boolean = false) => {
			const index = tileMap.get(pattern)!;
			const tiles = document.querySelectorAll('.tile');
			const tile = tiles[index] as HTMLElement;
			
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

		const triedCombinations = new Set<string>();

		function solutionValid(patterns: string[]) {
			for (let i = 0; i < patterns.length; i++) {
				let pattern = patterns[i];
				
				if (i % 3 > 0) {
					let leftPattern = patterns[i - 1];
					if (!isLeftRightValid(leftPattern, pattern)) {
						return false;
					}
				}
				
				if (i >= 3) {
					let topPattern = patterns[i - 3];
					if (!isTopBottomValid(topPattern, pattern)) {
						return false;
					}
				}
			}
			return true;
		}

		const tryAllCombinations = async (
			remainingPatterns: string[],
			placedPatterns: string[] = []
		): Promise<boolean> => {
			if (remainingPatterns.length === 0) {
				return true;
			}

			const currentPosition = placedPatterns.length;

			// For the first position (index 0), use random order
			// For all other positions, keep the orderedPatterns logic
			const patterns = currentPosition === 0 
				? remainingPatterns 
				: (() => {
					const currentPattern = Array.from(tileMap.entries()).find(([_, index]) => index === currentPosition)?.[0] ?? '';
					return [currentPattern, ...remainingPatterns.filter(p => p !== currentPattern)];
				})();

			for (const pattern of patterns) {
				if (!pattern) continue;
				const combinationKey = [...placedPatterns, pattern].join(',');
				
				if (triedCombinations.has(combinationKey)) {
					continue;
				}

				let isValid = true;
				if (currentPosition % 3 > 0) {
					isValid = isValid && isLeftRightValid(placedPatterns[placedPatterns.length - 1], pattern);
				}
				if (currentPosition >= 3) {
					isValid = isValid && isTopBottomValid(placedPatterns[currentPosition - 3], pattern);
				}

				if (isValid) {
					const patternCurrentPos = Array.from(tileMap.entries())
						.find(([_, index]) => index === currentPosition)?.[0];
					
					if (patternCurrentPos !== pattern) {
						await swapTiles(patternCurrentPos!, pattern, currentPosition);
					}

					const allPatterns = [...placedPatterns, ...remainingPatterns];
					if (solutionValid(allPatterns)) {
						for (const pat of allPatterns) {
							highlightMatchedTile(pat, true, true);
						}
						return true;
					} else {
						triedCombinations.add(combinationKey);
						highlightMatchedTile(pattern);

						const newRemaining = remainingPatterns.filter(p => p !== pattern);
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

		const allPatterns = Array.from(tileMap.keys())
			.sort(() => Math.random() - 0.5);
		console.log(allPatterns);
		const found = await tryAllCombinations(allPatterns);

		return { 
			patterns: Array.from(tileMap.entries()),
			solutionFound: found
		};
	});

	console.log("\n=== Final Results ===");
	console.log(`Solution ${tileData.solutionFound ? "was found! 🎉" : "was NOT found ❌"}`);
	console.log("\nFinal tile positions:");
	tileData.patterns.forEach(([pattern, index]) => {
		console.log(`Position ${index}: pattern=${pattern}`);
	});

	console.log("Puzzli bot executed successfully!");
	await page.waitForTimeout(2000);

	await page.click('text=Share Results');
	await page.waitForTimeout(250);

	globalShareText = await page.evaluate(async () => {
		const clipboardText = await navigator.clipboard.readText();
		return clipboardText;
	});

	// Save the share text after getting it
	if (globalShareText) {
		await saveShareText(globalShareText);
	}

	await page.click('.btn-close');
	await page.waitForTimeout(500);

	await page.evaluate(() => {
		const tiles = document.querySelectorAll('.tile');
		tiles.forEach(tile => {
			(tile as HTMLElement).style.transition = 'transform 0.3s ease-out';
			(tile as HTMLElement).style.transform = 'scale(1.015)';
		});
	});

	await page.waitForTimeout(300);

	await page.screenshot({
		path: globalScreenshotPath,
		clip: {
			x: 55,
			y: 120,
			width: 850,
			height: 850
		}
	});

	await context.close();
	await browser.close();

	if (globalVideoPath) {
		const newVideoPath = getTodayVideoPath();
		const trimmedVideoPath = newVideoPath.replace('.mp4', '_trimmed.mp4');
		
		await fs.rename(globalVideoPath, newVideoPath);
		console.log(`Video recording saved to ${newVideoPath}`);

		const durationResult = await execAsync(`"C:\\Program Files\\ffmpeg-7.1.1-essentials_build\\bin\\ffmpeg.exe" -i "${newVideoPath}" 2>&1 | findstr "Duration"`);
		const durationMatch = durationResult.stdout.match(/Duration: (\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
		const videoDuration = durationMatch ? 
			parseInt(durationMatch[1]) * 3600 + 
			parseInt(durationMatch[2]) * 60 + 
			parseInt(durationMatch[3]) + 
			parseInt(durationMatch[4]) / 100 : 0;

		await execAsync(`"C:\\Program Files\\ffmpeg-7.1.1-essentials_build\\bin\\ffmpeg.exe" -i "${newVideoPath}" -ss 2.07 -t ${videoDuration - 3.75} -vf "crop=810:810:75:140" -c:v libx264 "${trimmedVideoPath}"`);
		console.log(`Trimmed video saved to ${trimmedVideoPath}`);
		
		await fs.unlink(newVideoPath);
		await fs.rename(trimmedVideoPath, newVideoPath);
	}
}

async function main() {
	console.log('Starting Puzzli bot...');
  const args = process.argv.slice(2);
  const shouldSolve = args.includes('--solve') || args.includes('-s');
  const shouldUpload = args.includes('--upload') || args.includes('-u');

  // If no args provided, do both by default and wait for input
  if (args.length === 0) {
      await solvePuzzli();
      await uploadVideo(true);
      return;
  }

  if (shouldSolve) {
      await solvePuzzli();
  }

  if (shouldUpload) {
      await uploadVideo(false);
  }
}

main();