const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { Builder, By, until } = require("selenium-webdriver");

require("dotenv").config();

describe("GameVault - registrar videojuego", function () {
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

    async function login() {
        await driver.get(APP_URL);

        const emailInput = await driver.wait(
            until.elementLocated(By.css('[data-testid="email-input"]')),
            10000
        );

        const passwordInput = await driver.findElement(
            By.css('[data-testid="password-input"]')
        );

        const loginButton = await driver.findElement(
            By.css('[data-testid="login-button"]')
        );

        await emailInput.sendKeys(TEST_EMAIL);
        await passwordInput.sendKeys(TEST_PASSWORD);
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
    }

    async function clearForm() {
        const fields = [
            "game-name",
            "game-genre",
            "game-platform",
            "game-developer",
            "game-year",
            "game-price"
        ];

        for (const id of fields) {
            const input = await driver.findElement(By.id(id));
            await input.clear();
        }
    }

    before(async function () {
        if (!TEST_EMAIL || !TEST_PASSWORD) {
            throw new Error("Faltan las credenciales de prueba en el archivo .env");
        }

        driver = await new Builder()
            .forBrowser("chrome")
            .build();

        await driver.manage().window().maximize();

        await login();
    });

    beforeEach(async function () {
        await clearForm();
    });

    after(async function () {
        if (driver) {
            await driver.quit();
        }
    });

    it("camino feliz: debe registrar un videojuego válido", async function () {
        const gameName = `Selenium Game ${Date.now()}`;

        await driver.findElement(By.id("game-name")).sendKeys(gameName);
        await driver.findElement(By.id("game-genre")).sendKeys("Aventura");
        await driver.findElement(By.id("game-platform")).sendKeys("PC");
        await driver.findElement(By.id("game-developer")).sendKeys("Selenium Studio");
        await driver.findElement(By.id("game-year")).sendKeys("2025");
        await driver.findElement(By.id("game-price")).sendKeys("39.99");

        await driver.findElement(
            By.css('#game-form button[type="submit"]')
        ).click();

        const toast = await driver.wait(
            until.elementLocated(By.id("toast-message")),
            10000
        );

        await driver.wait(async () => {
            const isVisible = await toast.isDisplayed();
            const toastText = await toast.getText();

            return isVisible && toastText.trim().length > 0;
        }, 10000);

        const toastText = await toast.getText();

        assert.ok(
            toastText.toLowerCase().includes("videojuego creado correctamente"),
            `Se esperaba un mensaje de creación exitosa, pero fue: ${toastText}`
        );

        await driver.wait(async () => {
            const tableText = await driver.findElement(
                By.id("games-table-body")
            ).getText();

            return tableText.includes(gameName);
        }, 15000);

        const tableText = await driver.findElement(
            By.id("games-table-body")
        ).getText();

        assert.ok(
            tableText.includes(gameName),
            "El videojuego creado no apareció en la tabla"
        );

        await takeScreenshot("create-videojuego-exitoso.png");
    });

    it("prueba negativa: debe rechazar un precio negativo", async function () {
        await driver.findElement(By.id("game-name")).sendKeys("Juego inválido");
        await driver.findElement(By.id("game-genre")).sendKeys("Acción");
        await driver.findElement(By.id("game-platform")).sendKeys("PC");
        await driver.findElement(By.id("game-developer")).sendKeys("Test Studio");
        await driver.findElement(By.id("game-year")).sendKeys("2024");
        await driver.findElement(By.id("game-price")).sendKeys("-1");

        const priceInput = await driver.findElement(By.id("game-price"));

        await driver.findElement(
            By.css('#game-form button[type="submit"]')
        ).click();

        const validPrice = await driver.executeScript(
            "return arguments[0].checkValidity();",
            priceInput
        );

        assert.strictEqual(
            validPrice,
            false,
            "El campo precio aceptó un valor negativo"
        );

        await takeScreenshot("create-precio-negativo.png");
    });

    it("prueba de límites: debe rechazar el formulario vacío", async function () {
        const form = await driver.findElement(By.id("game-form"));

        await driver.findElement(
            By.css('#game-form button[type="submit"]')
        ).click();

        const formIsValid = await driver.executeScript(
            "return arguments[0].checkValidity();",
            form
        );

        assert.strictEqual(
            formIsValid,
            false,
            "El formulario permitió registrar un videojuego sin datos"
        );

        await takeScreenshot("create-campos-vacios.png");
    });
});
