const fs = require("fs");
const path = require("path");

const { Builder, By, until } = require("selenium-webdriver");
const assert = require("assert");

describe("GameVault - inicio de sesión", function () {
    let driver;

    // Tiempo máximo para toda la suite
    this.timeout(120000);

    before(async function () {
        // Tiempo adicional para iniciar Chrome la primera vez
        this.timeout(120000);

        driver = await new Builder()
            .forBrowser("chrome")
            .build();
    });

    after(async function () {
        if (driver) {
            await driver.quit();
        }
    });

    it("debe abrir GameVault correctamente", async function () {
        await driver.get("http://localhost:5000");

        await driver.wait(
            until.elementLocated(By.tagName("body")),
            10000
        );

        const pageTitle = await driver.getTitle();

        assert.ok(
            pageTitle.toLowerCase().includes("gamevault"),
            `Se esperaba que el título incluyera "GameVault", pero fue: ${pageTitle}`
        );

        const screenshotsDir = path.join(__dirname, "..", "screenshots");
        const screenshotPath = path.join(screenshotsDir, "login-carga-inicial.png");
        const screenshot = await driver.takeScreenshot();

        fs.mkdirSync(screenshotsDir, { recursive: true });
        fs.writeFileSync(screenshotPath, screenshot, "base64");
    });
});
