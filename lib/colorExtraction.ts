// lib/colorExtraction.ts
import { createCanvas, loadImage } from 'canvas';

export interface ExtractedColors {
  palette: string[]; // Array of 5-8 dominant colors as hex
  primary: string; // Most dominant color
  secondary: string; // Second most dominant or best contrasting color
  accent: string; // Color with highest contrast to primary
}

/**
 * Calculate luminance of a color (0-1 scale)
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const val = c / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Convert RGB to hex
 */
function rgbToHex(r: number, g: number, b: number): string {
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

/**
 * Calculate color distance using Euclidean distance in RGB space
 */
function colorDistance(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number
): number {
  return Math.sqrt(
    Math.pow(r2 - r1, 2) + Math.pow(g2 - g1, 2) + Math.pow(b2 - b1, 2)
  );
}

/**
 * Get dominant colors from image using k-means clustering
 */
async function getDominantColors(
  imageUrl: string,
  colorCount: number = 8
): Promise<number[][]> {
  const image = await loadImage(imageUrl);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  // Sample pixels (every 10th pixel for performance)
  const sampledColors: number[][] = [];
  for (let i = 0; i < pixels.length; i += 40) {
    // 40 = 10 pixels * 4 (RGBA)
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const a = pixels[i + 3];

    // Skip transparent pixels and very dark/light pixels
    if (a > 128 && r + g + b > 30 && r + g + b < 735) {
      sampledColors.push([r, g, b]);
    }
  }

  // Simple k-means clustering
  const clusters = kMeansClustering(sampledColors, colorCount);

  // Sort clusters by size (most dominant first)
  clusters.sort((a, b) => b.count - a.count);

  return clusters.map(c => c.center);
}

/**
 * Simple k-means clustering implementation
 */
function kMeansClustering(
  colors: number[][],
  k: number,
  maxIterations: number = 10
): Array<{ center: number[]; count: number }> {
  // Initialize centroids randomly from the color samples
  let centroids = colors
    .sort(() => Math.random() - 0.5)
    .slice(0, k)
    .map(c => [...c]);

  for (let iter = 0; iter < maxIterations; iter++) {
    // Assign each color to nearest centroid
    const clusters: number[][][] = Array(k)
      .fill(null)
      .map(() => []);

    colors.forEach(color => {
      let minDist = Infinity;
      let closestCluster = 0;

      centroids.forEach((centroid, idx) => {
        const dist = colorDistance(
          color[0],
          color[1],
          color[2],
          centroid[0],
          centroid[1],
          centroid[2]
        );
        if (dist < minDist) {
          minDist = dist;
          closestCluster = idx;
        }
      });

      clusters[closestCluster].push(color);
    });

    // Update centroids
    centroids = clusters.map(cluster => {
      if (cluster.length === 0) return centroids[0]; // Fallback if empty
      const sum = cluster.reduce(
        (acc, color) => [
          acc[0] + color[0],
          acc[1] + color[1],
          acc[2] + color[2],
        ],
        [0, 0, 0]
      );
      return [
        Math.round(sum[0] / cluster.length),
        Math.round(sum[1] / cluster.length),
        Math.round(sum[2] / cluster.length),
      ];
    });
  }

  // Return centroids with their cluster sizes
  const clusters: number[][][] = Array(k)
    .fill(null)
    .map(() => []);
  colors.forEach(color => {
    let minDist = Infinity;
    let closestCluster = 0;

    centroids.forEach((centroid, idx) => {
      const dist = colorDistance(
        color[0],
        color[1],
        color[2],
        centroid[0],
        centroid[1],
        centroid[2]
      );
      if (dist < minDist) {
        minDist = dist;
        closestCluster = idx;
      }
    });

    clusters[closestCluster].push(color);
  });

  return centroids.map((center, idx) => ({
    center,
    count: clusters[idx].length,
  }));
}

/**
 * Extract color palette and theme colors from image
 */
export async function extractColorsFromImage(
  imageUrl: string
): Promise<ExtractedColors> {
  // Get dominant colors
  const dominantColors = await getDominantColors(imageUrl, 8);

  // Convert to hex
  const palette = dominantColors.map(([r, g, b]) => rgbToHex(r, g, b));

  // Primary: Most dominant color
  const primary = palette[0];
  const [r1, g1, b1] = dominantColors[0];

  // Secondary: Find color with good contrast to primary but not too different
  let secondaryIdx = 1;
  let maxContrast = 0;

  for (let i = 1; i < dominantColors.length; i++) {
    const [r2, g2, b2] = dominantColors[i];
    const dist = colorDistance(r1, g1, b1, r2, g2, b2);
    // Look for colors that are different but not too different (sweet spot: 80-200)
    if (dist > 80 && dist < 200 && dist > maxContrast) {
      maxContrast = dist;
      secondaryIdx = i;
    }
  }

  const secondary = palette[secondaryIdx];

  // Accent: Find color with highest luminance contrast to primary
  const primaryLum = getLuminance(r1, g1, b1);
  let accentIdx = 0;
  let maxLumDiff = 0;

  for (let i = 0; i < dominantColors.length; i++) {
    const [r, g, b] = dominantColors[i];
    const lum = getLuminance(r, g, b);
    const lumDiff = Math.abs(lum - primaryLum);

    if (lumDiff > maxLumDiff) {
      maxLumDiff = lumDiff;
      accentIdx = i;
    }
  }

  const accent = palette[accentIdx];

  return {
    palette,
    primary,
    secondary,
    accent,
  };
}
