import { AfterAll } from "@cucumber/cucumber";
import { Browser, Page } from "@playwright/test";

export interface CustomWorld {
    browser: Browser;
    page: Page;
}
