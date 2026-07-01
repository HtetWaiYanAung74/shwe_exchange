import fs from "fs";
import { After, Before, DataTable, Given, setDefaultTimeout, Then, When } from "@cucumber/cucumber";
import { chromium, expect } from "@playwright/test";
import config from "../utils/config";
import { supabase } from "../utils/supabase";
import { CustomWorld } from "../utils/world";

setDefaultTimeout(60 * 1000);

let mmkBuy: string, mmkSell: string, vndBuy: string, vndSell: string;

Before(async function(this: CustomWorld) {
    this.browser = await chromium.launch({headless: true});
    
    // Check if the saved login session exists
    if (fs.existsSync('binance-auth.json')) {
        // Inject the saved cookies/tokens to bypass the login image puzzle
        this.context = await this.browser.newContext({ storageState: 'binance-auth.json' });
    } else {
        throw new Error("Missing binance-auth.json! Run capture-session.js first.");
    }

    this.page = await this.context.newPage();
});

Given('The user already logged in to the Binance website', async function(this: CustomWorld) {
    await this.page.goto(config.baseUrl);
    await this.page.waitForLoadState();
    
    // Try to reject cookies if the button exists, but don't fail if it doesn't
    try {
        await this.page.getByRole('button', { name: 'Reject Additional Cookies' }).click({ timeout: 5000 });
    } catch (e) {
        console.log('Reject cookies button not found, proceeding...');
    }
    
    try {
        await this.page.getByRole('button', {name: "Ignore", exact: true}).click({ timeout: 5000 });
    } catch (e) {
        console.log('Ignore button not found, proceeding...');
    }
});

When('The user hovers the TRADE header menu item', async function (this: CustomWorld) {
    await this.page.locator('.header-dropdown-menu.header-menu-align_frist').hover();
});

When('The user clicks the {string} sub item', async function (this: CustomWorld, subItem: string) {
    await this.page.locator('.header-dropdown-menu.header-menu-align_frist #ba-titile2-1').click();
    await this.page.waitForLoadState();
});

Then('The following tabs are displayed', async function (this: CustomWorld, dataTable: DataTable) {
    const tabNames = await this.page.locator('.bn-tabs__segment-outline').getByRole('tab').allTextContents();
    const rows = dataTable.rows();
    for (let i = 0; i < rows.length; i++) {
        expect(tabNames[i]).toBe(rows[i][0]);
    }
});

When('The user selects {string} for currency, enters {string} for amount and selects for payment', async function (this: CustomWorld, currency: string, amount: string) {
    await this.page.getByRole('combobox').first().waitFor({state: 'visible', timeout: 5000});
    await this.page.getByRole('combobox').first().hover();
    const activeLocator = this.page.locator('.active');
    await activeLocator.getByPlaceholder('Search').waitFor({state: 'visible', timeout: 5000});
    await activeLocator.getByPlaceholder('Search').fill(currency, {timeout: 10000});
    await activeLocator.getByRole('option', { name: currency }).waitFor({state: 'visible', timeout: 5000});
    await activeLocator.getByRole('option', { name: currency }).click({timeout: 10000});
    if (currency == 'MMK') {
        await this.page.getByPlaceholder(amount).fill('1000000', {timeout: 10000});
    } else {
        await this.page.getByPlaceholder(amount).clear({timeout: 10000});
        await this.page.getByPlaceholder(amount).fill('20000000', {timeout: 10000});
    }
    await this.page.getByRole('combobox').nth(1).hover();
    await activeLocator.getByRole('checkbox', { checked: false }).first().waitFor({state: 'visible', timeout: 10000});
    await activeLocator.getByRole('checkbox', { checked: false }).first().click({timeout: 10000});
});

Then('The user saves the very first shown {string} buy and sell rate in database', async function (this: CustomWorld, currency: string) {
    if (currency == 'VND') {
        await this.page.locator('.bn-tabs__segment-outline').getByRole('tab').first().click({timeout: 10000});
    }
    const notPromotedRow = this.page.getByRole('row').nth(3);
    const notPromotedCol = notPromotedRow.getByRole('cell').nth(2);
    await notPromotedCol.locator('.text-primaryText').waitFor({state: 'visible', timeout: 10000});	
    const buyPrice = await notPromotedCol.locator('.text-primaryText').textContent();
    currency == 'MMK' ? mmkBuy = buyPrice : vndBuy = buyPrice;
    console.log('buy mmk rate ....', mmkBuy);
    console.log('buy vnd rate ....', vndBuy);

    await this.page.locator('.bn-tabs__segment-outline').getByRole('tab').last().click();
    const sellPrice = await notPromotedCol.locator('.text-primaryText').textContent();
    currency == 'MMK' ? mmkSell = sellPrice : vndSell = sellPrice;
    console.log('sell mmk rate ....', mmkSell);
    console.log('sell vnd rate ....', vndSell);

    if (currency == 'VND') {
        const {data, error} = await supabase.from('p2p_rates').insert([
            {
                mmk_buy_price: Number(mmkBuy.replace(/,/g, '')),
                mmk_sell_price: Number(mmkSell.replace(/,/g, '')),
                vnd_buy_price: Number(vndBuy.replace(/,/g, '')),
                vnd_sell_price: Number(vndSell.replace(/,/g, ''))
            }
        ]);

        if (error) {
            console.error(error);
        } else {
            console.log('The p2p rates are inserted successfully!!! ', data);
        }
    }
});

After(async function (this: CustomWorld) {
    try {
        if (this.page && !this.page.isClosed()) await this.page.close();
    } catch (e) {
        console.warn('page close failed', e);
    }
    try {
        if (this.context) await this.context.close();
    } catch (e) {
        console.warn('context close failed', e);
    }
    try {
        if (this.browser) await this.browser.close();
    } catch (e) {
        console.warn('browser close failed', e);
    }
});