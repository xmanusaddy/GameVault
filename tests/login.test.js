const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { Builder, By, until } = require("selenium-webdriver");

require("dotenv").config();

describe("GameVault - inicio de sesión", function () {
    let driver;

    const APP_URL = "http://localhost:5000";
    const TEST_EMAIL = process.env.TEST_USER_EMAIL;
    const TEST_PASSWORD = process.env.TEST_USER_PASSWORD;

    this.timeout(120000);

    async function takeScreenshot(fileName) {
        const screenshotsDir = path.join(__dirname, "..", "screenshots");
        fs.mkdirSync(screenshotsDir, { recursive: true });

        const screenshot = await driver.takeScreenshot();

        fs.writeFileSync(
            path.join(screenshotsDir, fileName),
            screenshot,
            "base64"
        );
    }

    async function typeSlowly(element, text) {
        for (const character of String(text)) {
            await element.sendKeys(character);
            await driver.sleep(45);
        }
    }

    async function resetSession() {
        await driver.get(APP_URL);

        await driver.wait(
            until.elementLocated(By.css('[data-testid="email-input"]')),
            10000
        );

        await driver.executeScript(`
            localStorage.clear();
            sessionStorage.clear();
        `);

        await driver.manage().deleteAllCookies();
        await driver.navigate().refresh();

        await driver.wait(
            until.elementLocated(By.css('[data-testid="email-input"]')),
            10000
        );
    }

    before(async function () {
        if (!TEST_EMAIL || !TEST_PASSWORD) {
            throw new Error("Faltan las credenciales de prueba en el archivo .env");
        }

        driver = await new Builder()
            .forBrowser("chrome")
            .build();

        await driver.manage().window().maximize();
    });

    beforeEach(async function () {
        await resetSession();
    });

    after(async function () {
        await driver.quit();
    });

    it("camino feliz: debe iniciar sesión con credenciales válidas", async function () {
        const emailInput = await driver.findElement(
            By.css('[data-testid="email-input"]')
        );

        const passwordInput = await driver.findElement(
            By.css('[data-testid="password-input"]')
        );

        const loginButton = await driver.findElement(
            By.css('[data-testid="login-button"]')
        );

        await typeSlowly(emailInput, TEST_EMAIL);
        await typeSlowly(passwordInput, TEST_PASSWORD);
        await loginButton.click();

        const authenticatedView = await driver.wait(
            until.elementLocated(
                By.css('[data-testid="authenticated-view"]')
            ),
            15000
        );

        await driver.wait(
            until.elementIsVisible(authenticatedView),
            10000
        );

        assert.strictEqual(
            await authenticatedView.isDisplayed(),
            true
        );

        await takeScreenshot("login-exitoso.png");
    });

    it("prueba negativa: debe rechazar una contraseña incorrecta", async function () {
        const emailInput = await driver.findElement(
            By.css('[data-testid="email-input"]')
        );

        const passwordInput = await driver.findElement(
            By.css('[data-testid="password-input"]')
        );

        const loginButton = await driver.findElement(
            By.css('[data-testid="login-button"]')
        );

        await typeSlowly(emailInput, TEST_EMAIL);
        await typeSlowly(passwordInput, "ContraseñaIncorrecta123!");
        await loginButton.click();

        const errorElement = await driver.wait(
            until.elementLocated(
                By.css('[data-testid="login-error"]')
            ),
            10000
        );

        await driver.wait(async () => {
            const errorText = await errorElement.getText();
            return errorText.trim().length > 0;
        }, 10000);

        const errorText = await errorElement.getText();

        assert.ok(errorText.trim().length > 0);

        await takeScreenshot("login-credenciales-incorrectas.png");
    });

    it("prueba de límites: debe rechazar correo y contraseña vacíos", async function () {
        const loginButton = await driver.findElement(
            By.css('[data-testid="login-button"]')
        );

        await loginButton.click();

        const errorElement = await driver.wait(
            until.elementLocated(
                By.css('[data-testid="login-error"]')
            ),
            10000
        );

        await driver.wait(async () => {
            const errorText = await errorElement.getText();
            return errorText.trim().length > 0;
        }, 10000);

        const errorText = await errorElement.getText();

        assert.ok(errorText.trim().length > 0);

        await takeScreenshot("login-campos-vacios.png");
    });
});
