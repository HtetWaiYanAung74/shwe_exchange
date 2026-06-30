import { chromium } from "@playwright/test";
import fs from "fs";

async function capture() {
    const browser = await chromium.launch({headless: false});
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('https://www.binance.com');
    console.log('Log in and solve the image puzzle manually in the browser window...');
    // Keep the browser open for 2 minutes to give you time to log in
    await page.waitForTimeout(120000);    
    // Save the cookies and storage state
    const state = await context.storageState();
    fs.writeFileSync('binance-auth.json', JSON.stringify(state));
    console.log('✅ Session saved to binance-auth.json successfully!');
    await browser.close();
}

capture();