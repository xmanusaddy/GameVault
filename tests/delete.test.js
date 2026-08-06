const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { Builder, By, until } = require("selenium-webdriver");

require("dotenv").config();

describe("GameVault - eliminar videojuego", function () {
    let driver;
    let gameName;

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

    async function login() {
        await driver.get(APP_URL);

        const emailInput = await driver.wait(
            until.elementLocated(By.css('[data-testid="email-input"]')),
            10000
        );

        await typeSlowly(emailInput, TEST_EMAIL);

        const passwordInput = await driver.findElement(
            By.css('[data-testid="password-input"]')
        );

        await typeSlowly(passwordInput, TEST_PASSWORD);

        await driver.findElement(
            By.css('[data-testid="login-button"]')
        ).click();

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

    async function waitForToast(expectedText = "") {
        const toast = await driver.wait(
            until.elementLocated(By.id("toast-message")),
            10000
        );
        let matchedText = "";

        await driver.wait(async () => {
            const isVisible = await toast.isDisplayed();
            const text = await toast.getText();
            const normalizedText = text.toLowerCase();
            const matches = isVisible &&
                text.trim().length > 0 &&
                normalizedText.includes(expectedText.toLowerCase());

            if (matches) {
                matchedText = text;
            }

            return matches;
        }, 10000);

        return matchedText;
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

    async function createGame() {
        gameName = `Delete Game ${Date.now()}`;

        await clearForm();
        await typeSlowly(await driver.findElement(By.id("game-name")), gameName);
        await typeSlowly(await driver.findElement(By.id("game-genre")), "Acción");
        await typeSlowly(await driver.findElement(By.id("game-platform")), "PC");
        await typeSlowly(await driver.findElement(By.id("game-developer")), "Delete Studio");
        await typeSlowly(await driver.findElement(By.id("game-year")), "2025");
        await typeSlowly(await driver.findElement(By.id("game-price")), "49.99");

        await driver.findElement(
            By.css('#game-form button[type="submit"]')
        ).click();

        await waitForToast("creado");

        await driver.wait(async () => {
            const table = await driver.findElement(
                By.id("games-table-body")
            ).getText();

            return table.includes(gameName);
        }, 15000);
    }

    async function findRow() {
        return driver.wait(
            until.elementLocated(
                By.xpath(
                    `//tbody[@id="games-table-body"]/tr[td[1][normalize-space()="${gameName}"]]`
                )
            ),
            15000
        );
    }

    async function waitForDeleteModal() {
        const modal = await driver.wait(
            until.elementLocated(By.id("delete-modal")),
            10000
        );

        await driver.wait(
            until.elementIsVisible(modal),
            10000
        );
    }

    before(async function () {
        if (!TEST_EMAIL || !TEST_PASSWORD) {
            throw new Error("Faltan las credenciales del .env");
        }

        driver = await new Builder()
            .forBrowser("chrome")
            .build();

        await driver.manage().window().maximize();

        await login();
        await createGame();
    });

    after(async function () {
        if (driver) {
            await driver.quit();
        }
    });

    it("camino feliz: debe eliminar un videojuego", async function () {
        const row = await findRow();

        await row.findElement(
            By.css(".danger-button")
        ).click();

        await waitForDeleteModal();

        await driver.findElement(
            By.id("confirm-delete-button")
        ).click();

        const toastText = await waitForToast("eliminado");

        assert.ok(
            toastText.toLowerCase().includes("videojuego"),
            `Mensaje inesperado: ${toastText}`
        );

        await driver.wait(async () => {
            const table = await driver.findElement(
                By.id("games-table-body")
            ).getText();

            return !table.includes(gameName);
        }, 15000);

        await takeScreenshot("delete-videojuego-exitoso.png");
    });

    it("prueba negativa: cancelar la eliminación debe conservar el videojuego", async function () {
        await createGame();

        const row = await findRow();

        await row.findElement(
            By.css(".danger-button")
        ).click();

        await waitForDeleteModal();

        await driver.findElement(
            By.id("cancel-delete-button")
        ).click();

        const table = await driver.findElement(
            By.id("games-table-body")
        ).getText();

        assert.ok(
            table.includes(gameName),
            "El videojuego desapareció después de cancelar la eliminación"
        );

        await takeScreenshot("delete-cancelado.png");
    });

    it("prueba de límites: el modal debe contener dos opciones", async function () {
        const row = await findRow();

        await row.findElement(
            By.css(".danger-button")
        ).click();

        await waitForDeleteModal();

        const cancelButton = await driver.findElement(
            By.id("cancel-delete-button")
        );

        const confirmButton = await driver.findElement(
            By.id("confirm-delete-button")
        );

        assert.strictEqual(
            await cancelButton.isDisplayed(),
            true
        );

        assert.strictEqual(
            await confirmButton.isDisplayed(),
            true
        );

        await takeScreenshot("delete-modal.png");

        await cancelButton.click();
    });
});
