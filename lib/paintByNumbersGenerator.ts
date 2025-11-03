import sharp from 'sharp';
import { PaintTemplate, PaintRegion } from '@/types/overlay';

interface GeneratorOptions {
  numColors?: number;
  minRegionSize?: number;
  maxDimension?: number;
  maxSampleSize?: number;
  drawBorders?: boolean;
  templateName?: string;
  templateDescription?: string;
}

interface Color {
  r: number;
  g: number;
  b: number;
}

export class PaintByNumbersGenerator {
  private numColors: number;
  private minRegionSize: number;
  private maxDimension: number;
  private maxSampleSize: number;
  private drawBorders: boolean;
  private templateName: string;
  private templateDescription: string;

  constructor(options: GeneratorOptions = {}) {
    this.numColors = options.numColors || 10;
    this.minRegionSize = options.minRegionSize || 10;
    this.maxDimension = options.maxDimension || 100;
    this.maxSampleSize = options.maxSampleSize || 50000;
    this.drawBorders =
      options.drawBorders !== undefined ? options.drawBorders : true;
    this.templateName = options.templateName || 'Paint by Numbers Template';
    this.templateDescription =
      options.templateDescription || 'Generated paint by numbers template';
  }

  // K-means clustering for color quantization
  private async quantizeColors(
    pixels: Buffer,
    width: number,
    height: number,
    channels = 4
  ): Promise<Color[]> {
    const numPixels = width * height;
    const colors: Color[] = [];

    // Extract RGB values
    for (let i = 0; i < numPixels; i++) {
      const idx = i * channels;
      colors.push({
        r: pixels[idx],
        g: pixels[idx + 1],
        b: pixels[idx + 2],
      });
    }

    console.log(`Extracted ${colors.length} colors from image`);

    // Subsample pixels for large color counts
    let sampledColors = colors;

    if (colors.length > this.maxSampleSize && this.numColors > 50) {
      const sampleRate = Math.ceil(colors.length / this.maxSampleSize);
      sampledColors = colors.filter((_, idx) => idx % sampleRate === 0);
      console.log(
        `Subsampled to ${sampledColors.length} colors for clustering (every ${sampleRate}th pixel)`
      );
    }

    // Initialize centroids using k-means++ for better initial distribution
    const centroids: Color[] = [];
    const firstIdx = Math.floor(Math.random() * sampledColors.length);
    centroids.push({ ...sampledColors[firstIdx] });

    console.log('Initializing centroids with k-means++...');

    for (let i = 1; i < this.numColors; i++) {
      if (i % 50 === 0) {
        console.log(`  Initialized ${i}/${this.numColors} centroids...`);
      }

      const distances = sampledColors.map(color => {
        const minDist = Math.min(
          ...centroids.map(c => this.colorDistance(color, c))
        );
        return minDist * minDist;
      });

      const totalDist = distances.reduce((sum, d) => sum + d, 0);
      let rand = Math.random() * totalDist;

      for (let j = 0; j < distances.length; j++) {
        rand -= distances[j];
        if (rand <= 0) {
          centroids.push({ ...sampledColors[j] });
          break;
        }
      }
    }

    console.log(`Initialized ${centroids.length} centroids`);

    // K-means iterations
    const maxIterations = 100;
    for (let iter = 0; iter < maxIterations; iter++) {
      const clusters: Color[][] = Array.from(
        { length: this.numColors },
        () => []
      );

      // Assign pixels to nearest centroid (using sampled colors)
      sampledColors.forEach(color => {
        let minDist = Infinity;
        let clusterIdx = 0;

        centroids.forEach((centroid, idx) => {
          const dist = this.colorDistance(color, centroid);
          if (dist < minDist) {
            minDist = dist;
            clusterIdx = idx;
          }
        });

        clusters[clusterIdx].push(color);
      });

      // Update centroids
      let changed = false;
      centroids.forEach((centroid, idx) => {
        if (clusters[idx].length === 0) {
          // If cluster is empty, reinitialize with a random color
          const randomIdx = Math.floor(Math.random() * sampledColors.length);
          centroids[idx] = { ...sampledColors[randomIdx] };
          changed = true;
          return;
        }

        const newCentroid: Color = {
          r: Math.round(
            clusters[idx].reduce((sum, c) => sum + c.r, 0) /
              clusters[idx].length
          ),
          g: Math.round(
            clusters[idx].reduce((sum, c) => sum + c.g, 0) /
              clusters[idx].length
          ),
          b: Math.round(
            clusters[idx].reduce((sum, c) => sum + c.b, 0) /
              clusters[idx].length
          ),
        };

        if (
          newCentroid.r !== centroid.r ||
          newCentroid.g !== centroid.g ||
          newCentroid.b !== centroid.b
        ) {
          changed = true;
          centroids[idx] = newCentroid;
        }
      });

      if (iter % 10 === 0 || !changed) {
        console.log(
          `Iteration ${iter + 1}: ${centroids.filter(c => !isNaN(c.r)).length} valid centroids`
        );
      }

      if (!changed) {
        console.log(`Converged after ${iter + 1} iterations`);
        break;
      }
    }

    return centroids;
  }

  private colorDistance(c1: Color, c2: Color): number {
    return Math.sqrt(
      Math.pow(c1.r - c2.r, 2) +
        Math.pow(c1.g - c2.g, 2) +
        Math.pow(c1.b - c2.b, 2)
    );
  }

  private rgbToHex(r: number, g: number, b: number): string {
    return (
      '#' +
      [r, g, b]
        .map(x => {
          const hex = x.toString(16);
          return hex.length === 1 ? '0' + hex : hex;
        })
        .join('')
    );
  }

  private findNearestColor(color: Color, palette: Color[]): number {
    let minDist = Infinity;
    let nearestIdx = 0;

    palette.forEach((paletteColor, idx) => {
      const dist = this.colorDistance(color, paletteColor);
      if (dist < minDist) {
        minDist = dist;
        nearestIdx = idx;
      }
    });

    return nearestIdx;
  }

  private buildRegions(
    colorMap: Uint16Array,
    width: number,
    height: number,
    palette: Color[]
  ): PaintRegion[] {
    const regions: PaintRegion[] = [];

    // Create one region per color
    for (let colorIdx = 0; colorIdx < palette.length; colorIdx++) {
      const pixels: [number, number][] = [];

      // Collect all pixels with this color
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          if (colorMap[idx] === colorIdx) {
            pixels.push([x, y]);
          }
        }
      }

      if (pixels.length > 0) {
        const color = palette[colorIdx];
        regions.push({
          id: colorIdx + 1,
          color: this.rgbToHex(color.r, color.g, color.b),
          pixels: pixels,
          filled: false,
        });
      }
    }

    return regions;
  }

  /**
   * Generate a paint-by-numbers template from an image buffer
   * @param imageBuffer - The image file buffer
   * @returns Promise with the PaintTemplate and preview image buffer
   */
  async generate(imageBuffer: Buffer): Promise<{
    template: PaintTemplate;
    previewImage: Buffer;
    width: number;
    height: number;
  }> {
    console.log('Loading image...');
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    const { width = 0, height = 0 } = metadata;
    console.log(`Original image size: ${width}x${height}`);

    // Resize if too large
    let processWidth = width;
    let processHeight = height;

    if (width > this.maxDimension || height > this.maxDimension) {
      if (width > height) {
        processWidth = this.maxDimension;
        processHeight = Math.round(height * (this.maxDimension / width));
      } else {
        processHeight = this.maxDimension;
        processWidth = Math.round(width * (this.maxDimension / height));
      }
      console.log(`Resizing to: ${processWidth}x${processHeight}`);
    }

    const { data, info } = await sharp(imageBuffer)
      .resize(processWidth, processHeight)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    console.log(
      `Buffer info: ${data.length} bytes, channels: ${info.channels}`
    );
    console.log(
      `Expected size: ${processWidth * processHeight * info.channels}`
    );

    const channels = info.channels;

    console.log('Quantizing colors...');
    const palette = await this.quantizeColors(
      data,
      processWidth,
      processHeight,
      channels
    );

    console.log(`Palette generated with ${palette.length} colors`);

    // Create color map (assign each pixel to nearest palette color)
    console.log('Creating color map...');
    const colorMap = new Uint16Array(processWidth * processHeight);
    const outputBuffer = Buffer.alloc(processWidth * processHeight * 4);

    // Track color assignments
    const colorCounts = new Array(palette.length).fill(0);

    for (let i = 0; i < processWidth * processHeight; i++) {
      const pixelIdx = i * channels;
      const color: Color = {
        r: data[pixelIdx],
        g: data[pixelIdx + 1],
        b: data[pixelIdx + 2],
      };

      const colorIdx = this.findNearestColor(color, palette);
      colorMap[i] = colorIdx;
      colorCounts[colorIdx]++;

      // Set output pixel to palette color
      const outIdx = i * 4;
      outputBuffer[outIdx] = palette[colorIdx].r;
      outputBuffer[outIdx + 1] = palette[colorIdx].g;
      outputBuffer[outIdx + 2] = palette[colorIdx].b;
      outputBuffer[outIdx + 3] = 255;
    }

    // Filter out unused colors and create color mapping
    console.log('Filtering unused colors...');
    const usedColors: Color[] = [];
    const oldToNewColorIdx = new Map<number, number>();

    palette.forEach((color, idx) => {
      if (colorCounts[idx] > 0) {
        oldToNewColorIdx.set(idx, usedColors.length);
        usedColors.push(color);
      }
    });

    console.log(
      `Filtered from ${palette.length} to ${usedColors.length} colors (removed ${palette.length - usedColors.length} unused)`
    );

    // Remap colorMap to use new indices
    for (let i = 0; i < colorMap.length; i++) {
      const oldIdx = colorMap[i];
      const newIdx = oldToNewColorIdx.get(oldIdx);
      if (newIdx !== undefined) {
        colorMap[i] = newIdx;
      }
    }

    // Use filtered palette for rest of processing
    const finalPalette = usedColors;

    // Draw borders between different colored regions (optional)
    if (this.drawBorders) {
      console.log('Drawing region borders...');
      let borderCount = 0;
      for (let y = 0; y < processHeight; y++) {
        for (let x = 0; x < processWidth; x++) {
          const idx = y * processWidth + x;
          const currentColor = colorMap[idx];

          // Check if adjacent pixels have different colors
          let isBorder = false;
          if (x > 0 && colorMap[idx - 1] !== currentColor) isBorder = true;
          if (x < processWidth - 1 && colorMap[idx + 1] !== currentColor)
            isBorder = true;
          if (y > 0 && colorMap[idx - processWidth] !== currentColor)
            isBorder = true;
          if (
            y < processHeight - 1 &&
            colorMap[idx + processWidth] !== currentColor
          )
            isBorder = true;

          if (isBorder) {
            borderCount++;
            const pixelIdx = idx * 4;
            outputBuffer[pixelIdx] = 0;
            outputBuffer[pixelIdx + 1] = 0;
            outputBuffer[pixelIdx + 2] = 0;
            outputBuffer[pixelIdx + 3] = 255;
          }
        }
      }
      console.log(`Drew ${borderCount} border pixels`);
    } else {
      console.log('Skipping border drawing (disabled)');
    }

    console.log('Generating preview image...');
    const previewImage = await sharp(outputBuffer, {
      raw: {
        width: processWidth,
        height: processHeight,
        channels: 4,
      },
    })
      .png()
      .toBuffer();

    // Build regions and create PaintTemplate
    console.log('Building regions...');
    const regions = this.buildRegions(
      colorMap,
      processWidth,
      processHeight,
      finalPalette
    );

    // Sort regions by pixel count (descending) and reassign IDs
    regions.sort((a, b) => b.pixels.length - a.pixels.length);
    regions.forEach((region, idx) => {
      region.id = idx + 1;
    });

    console.log(`Built ${regions.length} regions (sorted by size)`);

    // Verify all pixels are assigned
    const totalPixelsInRegions = regions.reduce(
      (sum, region) => sum + region.pixels.length,
      0
    );
    const totalPixels = processWidth * processHeight;
    console.log(
      `Total pixels: ${totalPixels}, Pixels in regions: ${totalPixelsInRegions}`
    );

    if (totalPixelsInRegions !== totalPixels) {
      console.warn(
        `WARNING: ${totalPixels - totalPixelsInRegions} pixels not assigned to any region!`
      );
    }

    // Create PaintTemplate object
    const paintTemplate: PaintTemplate = {
      id: this.generateId(),
      name: this.templateName,
      description: this.templateDescription,
      width: processWidth,
      height: processHeight,
      regions: regions,
    };

    console.log(`Number of colors requested: ${this.numColors}`);
    console.log(`Number of colors used: ${finalPalette.length}`);
    console.log(`Number of regions: ${regions.length}`);

    return {
      template: paintTemplate,
      previewImage,
      width: processWidth,
      height: processHeight,
    };
  }

  private generateId(): string {
    return `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
