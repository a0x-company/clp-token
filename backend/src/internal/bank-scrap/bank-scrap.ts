/* eslint-disable quotes */
import { VAULT_PASSWORD, VAULT_RUT, DISCORD_WEBHOOK_URL } from "@internal/config";
import { DiscordNotificationService, NotificationType } from "@internal/notifications";
import puppeteer from "puppeteer";

export class SantanderClScraper {
  private readonly RUT = VAULT_RUT || "";

  private readonly PASS = VAULT_PASSWORD || "";

  private discordService: DiscordNotificationService;

  constructor() {
    this.discordService = new DiscordNotificationService(DISCORD_WEBHOOK_URL || "");
  }

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

      await page.goto("https://banco.santander.cl/personas").catch(async () => {
        await this.discordService.sendNotification(
          "Failed to load Santander homepage. Bank scraping process interrupted.",
          NotificationType.ERROR,
          "Santander Scraper Alert"
        );
        throw new Error("Failed to load Santander homepage");
      });
      console.log("✅ Page loaded correctly");

      await page
        .waitForSelector('a.btn-ingresar[aria-label="Abrir panel de ingreso"]', {
          visible: true,
          timeout: 10000,
        })
        .catch(() => {
          throw new Error("Ingresar button not found");
        });
      await page.click('a.btn-ingresar[aria-label="Abrir panel de ingreso"]');
      console.log("✅ Click performed on 'Ingresar' button");

      console.log("⏳ Waiting 5 seconds for iframe to load");
      await new Promise((resolve) => setTimeout(resolve, 4000));

      const iframeElement = await page.$('iframe[id="login-frame"]').catch(() => {
        throw new Error("Login iframe not found");
      });
      console.log("✅ Iframe found");

      const iframe = await iframeElement?.contentFrame();
      if (!iframe) {
        throw new Error("❌ Failed to access iframe content");
      }
      console.log("✅ Successful access to iframe");

      await iframe
        .waitForSelector("#rut", {
          visible: true,
          timeout: 10000,
        })
        .catch(() => {
          throw new Error("❌ RUT input field not found");
        });
      console.log("✅ RUT field found");

      await iframe.type("#rut", rut);
      console.log(`✅ RUT entered in input field`);

      await iframe.type("#pass", pass);
      console.log(`✅ Password entered in input field`);

      await iframe
        .waitForSelector('button[type="submit"]', {
          visible: true,
          timeout: 10000,
        })
        .catch(() => {
          throw new Error("❌ 'Ingresar' submit button not found");
        });
      console.log("✅ 'Ingresar' button found");

      await iframe.click('button[type="submit"]');
      console.log("✅ Click performed on 'Ingresar' button");

      await page.waitForNavigation({ waitUntil: "networkidle0" }).catch(async () => {
        await this.discordService.sendNotification(
          "Navigation after login failed. Unable to access account information.",
          NotificationType.WARNING,
          "Santander Scraper Alert"
        );
        throw new Error("❌ Navigation after login failed");
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
      await page
        .waitForSelector(balanceSelector, {
          visible: true,
          timeout: 10000,
        })
        .catch(() => {
          throw new Error("❌ Balance information not found");
        });
      console.log("✅ Balance visible on page");

      const balanceText = await page.$eval(balanceSelector, (element) => element.innerText);
      const balanceValue = balanceText.replace(/\D/g, "");
      console.log(`💰 Available balance: $${balanceValue} CLP`);

      const cuentaSelector = "div.datos p:nth-of-type(2)";
      await page
        .waitForSelector(cuentaSelector, {
          visible: true,
          timeout: 10000,
        })
        .catch(() => {
          throw new Error("❌ Account number information not found");
        });

      const cuentaNumero = await page.$eval(cuentaSelector, (el) => el.innerText.trim());
      console.log(`💳 View account number: ${cuentaNumero}`);

      await browser.close();

      return Number(balanceValue);
    } catch (error: unknown) {
      console.error("❌ An error occurred:");

      if (error instanceof Error) {
        console.error(error.message);
      }

      if (browser) {
        await browser.close();
      }

      return 0;
    }
  }
}