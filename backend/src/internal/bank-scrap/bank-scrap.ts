import { VAULT_PASSWORD, VAULT_RUT } from "@internal/config";
import puppeteer from "puppeteer";

export class SantanderClScraper {
  private readonly RUT = VAULT_RUT || "";
  private readonly PASS = VAULT_PASSWORD || "";

  public async getVaultBalance(rut: string = this.RUT, pass: string = this.PASS): Promise<number> {
    console.log("✅ Starting Santander CL scraper");

    let browser;
    try {
      browser = await puppeteer.launch({
        args: process.env.PUPPETEER_ARGS?.split(',') || [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-infobars",
          "--window-position=0,0",
          "--ignore-certificate-errors",
          "--ignore-certificate-errors-spki-list",
          "--incognito",
        ],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
        ignoreDefaultArgs: ["--disable-extensions"],
        headless: true,
      });

      const page = await browser.newPage();

      await page.goto("https://banco.santander.cl/personas").catch(() => {
        throw new Error("Failed to load Santander homepage. Check internet connection or website availability.");
      });
      console.log("✅ Page loaded correctly");

      await page.waitForSelector('a.btn-ingresar[aria-label="Abrir panel de ingreso"]', {
        visible: true,
        timeout: 10000,
      });
      await page.click('a.btn-ingresar[aria-label="Abrir panel de ingreso"]');
      console.log("✅ Click performed on 'Ingresar' button");

      console.log("⏳ Waiting 5 seconds for iframe to load");
      await new Promise((resolve) => setTimeout(resolve, 4000));

      const iframeElement = await page.$('iframe[id="login-frame"]');
      console.log("✅ Iframe found");

      const iframe = await iframeElement?.contentFrame();
      if (!iframe) {
        throw new Error("CRITICAL: Failed to access iframe content");
      }
      console.log("✅ Successful access to iframe");

      await iframe.waitForSelector("#rut", {
        visible: true,
        timeout: 10000,
      });
      console.log("✅ RUT field found");

      await iframe.type("#rut", rut);
      console.log(`✅ RUT entered in input field`);

      await iframe.type("#pass", pass);
      console.log(`✅ Password entered in input field`);

      await iframe.waitForSelector('button[type="submit"]', {
        visible: true,
        timeout: 10000,
      });
      console.log("✅ 'Ingresar' button found");

      await iframe.click('button[type="submit"]');
      console.log("✅ Click performed on 'Ingresar' button");

      await page.waitForNavigation({ waitUntil: "networkidle0", timeout: 30000 }).catch(() => {
        throw new Error("Navigation after login failed. Possible reasons: slow internet, website changes, or incorrect credentials.");
      });
      console.log("✅ Page loaded after login");

      try {
        await page.waitForSelector("button.mat-stroked-button", {
          visible: true,
          timeout: 5000,
        });
        console.log("✅ 'Cerrar' button found");
        await page.click("button.mat-stroked-button");
        console.log("✅ Click performed on 'Cerrar' button");
      } catch (error) {
        console.log("ℹ️ 'Cerrar' button not found or not clickable");
      }

      const balanceSelector = "div.monto1 span.ng-star-inserted p.amount-pipe-4";
      await page.waitForSelector(balanceSelector, {
        visible: true,
        timeout: 10000,
      });
      console.log("✅ Balance visible on page");

      const balanceText = await page.$eval(balanceSelector, (element) => element.innerText);
      const balanceValue = balanceText.replace(/\D/g, "");
      console.log(`💰 Available balance: $${balanceValue} CLP`);

      const cuentaSelector = "div.datos p:nth-of-type(2)";
      await page.waitForSelector(cuentaSelector, {
        visible: true,
        timeout: 10000,
      });

      const cuentaNumero = await page.$eval(cuentaSelector, (el) => el.innerText.trim());
      console.log(`💳 View account number: ${cuentaNumero}`);

      await browser.close();

      return Number(balanceValue);
    } catch (error: unknown) {
      console.error("❌ CRITICAL: An error occurred in Santander scraper:");

      if (error instanceof Error) {
        console.error(`Error type: ${error.name}`);
        console.error(`Error message: ${error.message}`);
        console.error(`Stack trace: ${error.stack}`);
      } else {
        console.error(`Unknown error: ${error}`);
      }

      if (browser) {
        await browser.close();
      }

      throw error;
    }
  }
}