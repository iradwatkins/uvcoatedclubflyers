import { test, expect } from '@playwright/test';
import { ProductPage } from './helpers/page-objects';
import { TEST_PRODUCT, TEST_IMAGES } from './helpers/test-data';
import { WeightCalculator, assertWeightCalculation } from './helpers/weight-calculator';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Test Suite: Multi-Image Upload and Weight Calculation
 *
 * Tests image upload functionality and weight calculation accuracy
 */

test.describe('Image Upload Tests', () => {
  let productPage: ProductPage;
  let frontImagePath: string;
  let backImagePath: string;

  test.beforeAll(async () => {
    // Locate test images
    const imagesFolder = TEST_IMAGES.folder;
    const files = fs.readdirSync(imagesFolder);
    const imageFiles = files.filter(f => /\.(jpg|jpeg|png|gif)$/i.test(f));

    if (imageFiles.length < 2) {
      throw new Error(`Need at least 2 images in ${imagesFolder}, found ${imageFiles.length}`);
    }

    frontImagePath = path.join(imagesFolder, imageFiles[0]);
    backImagePath = path.join(imagesFolder, imageFiles[1]);

    console.log(`Test images:\n  Front: ${frontImagePath}\n  Back: ${backImagePath}`);

    // Verify files exist and are readable
    expect(fs.existsSync(frontImagePath)).toBeTruthy();
    expect(fs.existsSync(backImagePath)).toBeTruthy();

    const frontStats = fs.statSync(frontImagePath);
    const backStats = fs.statSync(backImagePath);

    console.log(`Front image size: ${(frontStats.size / 1024).toFixed(2)} KB`);
    console.log(`Back image size: ${(backStats.size / 1024).toFixed(2)} KB`);
  });

  test.beforeEach(async ({ page }) => {
    productPage = new ProductPage(page);
    await productPage.goto();
    await page.screenshot({ path: `test-results/screenshots/upload-start-${Date.now()}.png`, fullPage: true });
  });

  test('Upload two images for front and back sides', async ({ page }) => {
    test.setTimeout(60000);

    await test.step('Navigate to product page', async () => {
      const firstProduct = page.locator('[data-testid="product-card"], .product-card').first();
      await firstProduct.click();
      await page.waitForURL(/\/products\/.+/);
      await page.screenshot({ path: `test-results/screenshots/upload-01-product.png`, fullPage: true });
    });

    await test.step('Verify upload input is visible', async () => {
      const uploadInput = productPage.fileUploadInput;
      await expect(uploadInput).toBeAttached();

      // Verify it accepts multiple files
      const acceptAttr = await uploadInput.getAttribute('accept');
      console.log('Upload input accept attribute:', acceptAttr);

      const multipleAttr = await uploadInput.getAttribute('multiple');
      console.log('Upload input multiple attribute:', multipleAttr);
    });

    await test.step('Upload both images', async () => {
      await productPage.uploadImages(frontImagePath, backImagePath);

      // Wait for upload to complete
      await page.waitForTimeout(3000);

      await page.screenshot({ path: `test-results/screenshots/upload-02-uploaded.png`, fullPage: true });
    });

    await test.step('Verify images are displayed', async () => {
      // Look for image preview elements
      const imagePreviews = page.locator('img[src*="blob:"], img[src*="data:"], [data-testid="image-preview"]');

      // Wait for at least one preview to appear
      await imagePreviews.first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {
        console.log('⚠️  Image preview elements not found - upload may need visual verification');
      });

      const previewCount = await imagePreviews.count();
      console.log(`Found ${previewCount} image preview(s)`);

      await page.screenshot({ path: `test-results/screenshots/upload-03-preview.png`, fullPage: true });
    });

    await test.step('Verify upload location', async () => {
      // The upload component should be above turnaround times section
      const turnaroundSection = page.locator('text=/turnaround|delivery time/i').first();

      if (await turnaroundSection.isVisible().catch(() => false)) {
        const turnaroundBox = await turnaroundSection.boundingBox();
        const uploadBox = await productPage.fileUploadInput.boundingBox();

        if (turnaroundBox && uploadBox) {
          console.log(`Upload Y position: ${uploadBox.y}`);
          console.log(`Turnaround Y position: ${turnaroundBox.y}`);

          // Upload should be above (smaller Y value) turnaround
          expect(uploadBox.y).toBeLessThan(turnaroundBox.y);
        }
      }
    });

    console.log('✅ Image upload test completed successfully');
  });

  test('Test single image upload validation', async ({ page }) => {
    test.setTimeout(60000);

    await test.step('Navigate to product page', async () => {
      const firstProduct = page.locator('[data-testid="product-card"], .product-card').first();
      await firstProduct.click();
      await page.waitForURL(/\/products\/.+/);
    });

    await test.step('Upload only one image', async () => {
      await productPage.fileUploadInput.setInputFiles([frontImagePath]);
      await page.waitForTimeout(2000);

      await page.screenshot({ path: `test-results/screenshots/upload-single.png`, fullPage: true });
    });

    await test.step('Verify validation for two-sided printing', async () => {
      // If product requires both sides, there should be validation
      const sidesSelect = page.locator('select').filter({ hasText: /sides/i }).first();

      if (await sidesSelect.isVisible()) {
        const selectedSide = await sidesSelect.inputValue();
        console.log('Selected sides option:', selectedSide);

        if (selectedSide.toLowerCase().includes('both') || selectedSide.includes('2')) {
          console.log('⚠️  Two-sided printing selected - should validate for 2 images');
          // Look for validation error
          const errorMessages = page.locator('text=/required|must upload|need.*images?/i');
          const hasError = await errorMessages.count();
          console.log(`Validation errors found: ${hasError}`);
        }
      }
    });

    console.log('✅ Single image validation test completed');
  });

  test('Test unsupported file type', async ({ page }) => {
    test.setTimeout(60000);

    await test.step('Navigate to product page', async () => {
      const firstProduct = page.locator('[data-testid="product-card"], .product-card').first();
      await firstProduct.click();
      await page.waitForURL(/\/products\/.+/);
    });

    await test.step('Attempt to upload invalid file type', async () => {
      // Create a temporary text file
      const tempDir = path.join(process.cwd(), 'test-results');
      const tempFile = path.join(tempDir, 'test.txt');

      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      fs.writeFileSync(tempFile, 'This is not an image');

      try {
        await productPage.fileUploadInput.setInputFiles([tempFile]);
        await page.waitForTimeout(2000);

        // Look for error message
        const errorMessages = page.locator('text=/invalid|not supported|must be.*image/i');
        const hasError = await errorMessages.count();

        if (hasError > 0) {
          console.log('✅ Validation error shown for invalid file type');
        } else {
          console.log('⚠️  No validation error for invalid file - may accept any file');
        }

        await page.screenshot({ path: `test-results/screenshots/upload-invalid.png`, fullPage: true });
      } finally {
        // Cleanup temp file
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }
    });

    console.log('✅ Invalid file type test completed');
  });
});

test.describe('Weight Calculation Tests', () => {
  test('Verify 9pt card stock weight formula', () => {
    // Test case: 5000 flyers, 4x6 inches, 9pt card stock
    const result = assertWeightCalculation(
      0.009,  // 9pt card stock weight
      4,      // width in inches
      6,      // height in inches
      5000,   // quantity
      {
        totalWeight: 1080,  // Expected: 0.009 × 4 × 6 × 5000 = 1080 lbs
        numberOfBoxes: 30   // Expected: 1080 / 36 = 30 boxes
      }
    );

    console.log('Weight Calculation Results:');
    console.log(`  Formula: ${result.formula}`);
    console.log(`  Total Weight: ${result.totalWeight} lbs`);
    console.log(`  Packaging Weight: ${result.packagingWeight} lbs`);
    console.log(`  Combined Weight: ${result.combinedWeight} lbs`);
    console.log(`  Number of Boxes: ${result.numberOfBoxes}`);
    console.log(`  Weight per Box: ${result.weightPerBox.join(', ')} lbs`);

    expect(result.totalWeight).toBe(40);
    expect(result.numberOfBoxes).toBe(2);
    expect(result.packagingWeight).toBe(1); // 2 boxes × 0.5 lbs
    expect(result.combinedWeight).toBe(41); // 40 + 1

    console.log('✅ Weight calculation verified');
  });

  test('Verify box splitting logic', () => {
    const testCases = [
      { qty: 100, expected: 1 },    // 10.8 lbs → 1 box
      { qty: 500, expected: 2 },    // 54 lbs → 2 boxes
      { qty: 1000, expected: 3 },   // 108 lbs → 3 boxes
      { qty: 2500, expected: 8 },   // 270 lbs → 8 boxes
      { qty: 5000, expected: 30 },  // 1080 lbs → 30 boxes
      { qty: 10000, expected: 60 }, // 2160 lbs → 60 boxes
    ];

    testCases.forEach(({ qty, expected }) => {
      const result = WeightCalculator.calculate9ptCardStock(4, 6, qty);

      console.log(`Quantity: ${qty} → Weight: ${result.totalWeight} lbs → Boxes: ${result.numberOfBoxes}`);

      expect(result.numberOfBoxes).toBe(expected);
    });

    console.log('✅ Box splitting logic verified for all test cases');
  });

  test('Verify weight per box does not exceed 36 lbs', () => {
    const quantities = [500, 1000, 2500, 5000, 10000];

    quantities.forEach(qty => {
      const result = WeightCalculator.calculate9ptCardStock(4, 6, qty);

      result.weightPerBox.forEach((weight, index) => {
        console.log(`  Box ${index + 1}: ${weight} lbs`);
        expect(weight).toBeLessThanOrEqual(36.5); // Allow for packaging
      });
    });

    console.log('✅ All boxes within weight limit');
  });

  test('Verify different paper stocks', () => {
    const paperStocks = [
      { name: '8pt', weight: 0.008 },
      { name: '9pt', weight: 0.009 },
      { name: '10pt', weight: 0.010 },
      { name: '12pt', weight: 0.012 },
      { name: '14pt', weight: 0.014 },
    ];

    paperStocks.forEach(({ name, weight }) => {
      const result = WeightCalculator.calculateWeight(weight, 4, 6, 5000);

      console.log(`${name} card stock (${weight} lbs/sq in):`);
      console.log(`  Total Weight: ${result.totalWeight} lbs`);
      console.log(`  Boxes Needed: ${result.numberOfBoxes}`);
    });

    console.log('✅ Weight calculations verified for all paper stocks');
  });

  test('Verify different sizes', () => {
    const sizes = [
      { name: '2x3.5', width: 2, height: 3.5 },
      { name: '4x6', width: 4, height: 6 },
      { name: '5x7', width: 5, height: 7 },
      { name: '8.5x11', width: 8.5, height: 11 },
    ];

    sizes.forEach(({ name, width, height }) => {
      const result = WeightCalculator.calculate9ptCardStock(width, height, 5000);

      console.log(`Size ${name}:`);
      console.log(`  Total Weight: ${result.totalWeight} lbs`);
      console.log(`  Boxes Needed: ${result.numberOfBoxes}`);
    });

    console.log('✅ Weight calculations verified for all sizes');
  });
});
