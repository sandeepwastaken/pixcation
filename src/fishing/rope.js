function samplePalette(palette, amount) {
    if (!palette || palette.length === 0) return FISHING_LINE_COLOR;

    return palette[Math.round(Phaser.Math.Clamp(amount, 0, 1) * (palette.length - 1))];
}

function beginPixelPath() {
    pixelPathLength = 0;
}

function addPixelPathPoint(x, y, color) {
    if (pixelPathLength > 0 && pixelPathX[pixelPathLength - 1] === x && pixelPathY[pixelPathLength - 1] === y) {
        return;
    }

    if (pixelPathLength >= 2) {
        const previousX = pixelPathX[pixelPathLength - 2];
        const previousY = pixelPathY[pixelPathLength - 2];

        if (Math.abs(x - previousX) === 1 && Math.abs(y - previousY) === 1) {
            pixelPathLength--;
        }
    }

    if (pixelPathLength >= pixelPathX.length) {
        return;
    }

    pixelPathX[pixelPathLength] = x;
    pixelPathY[pixelPathLength] = y;
    pixelPathColor[pixelPathLength] = color;
    pixelPathLength++;
}

function drawPixelPath() {
    let activeColor = -1;

    for (let index = 0; index < pixelPathLength; index++) {
        if (pixelPathColor[index] !== activeColor) {
            activeColor = pixelPathColor[index];
            fishingLine.fillStyle(activeColor, 1);
        }

        const y = pixelPathY[index];
        let left = pixelPathX[index];
        let right = left;

        while (index + 1 < pixelPathLength && pixelPathColor[index + 1] === activeColor && pixelPathY[index + 1] === y) {
            const nextX = pixelPathX[index + 1];
            if (nextX === right + 1) right = nextX;
            else if (nextX === left - 1) left = nextX;
            else break;
            index++;
        }

        fishingLine.fillRect(left, y, right - left + 1, 1);
    }
}

function drawFishingWaterShadow(scene, fromHeight, toHeight) {
    if (!pixelPathLength) return;
    const lastIndex = Math.max(1, pixelPathLength - 1);
    const heightRange = toHeight - fromHeight;
    let previousX;
    let previousY;
    let water;
    let tileX;
    let tileY, tileOriginX, tileOriginY;
    fishingWaterShadow.fillStyle(0x5a7eb6, 1);
    for (let index = 0; index < pixelPathLength; index++) {
        const amount = index / lastIndex;
        const height = Math.max(0, fromHeight + heightRange * amount);
        const x = pixelPathX[index] + Math.round(height / 6);
        const y = pixelPathY[index] + Math.round(height);
        if (x === previousX && y === previousY) continue;
        previousX = x;
        previousY = y;
        if ((x + y) % 2) continue;
        const nextTileX = Math.floor(x / TILE_SIZE);
        const nextTileY = Math.floor(y / TILE_SIZE);
        if (nextTileX !== tileX || nextTileY !== tileY) {
            water = getTerrainSurface(scene, getWorldTile(nextTileX, nextTileY)).water;
            tileX = nextTileX; tileOriginX = tileX * TILE_SIZE;
            tileY = nextTileY; tileOriginY = tileY * TILE_SIZE;
        }
        if (water[(y - tileOriginY) * TILE_SIZE + x - tileOriginX] !== 1) continue;
        fishingWaterShadow.fillRect(x, y, 1, 1);
    }
}

function plotFishingLine(fromX, fromY, toX, toY, sag, palette) {
    const controlX = (fromX + toX) / 2;
    const controlY = (fromY + toY) / 2 + sag;
    const steps = Math.max(2, Math.ceil(Math.hypot(toX - fromX, toY - fromY) * 1.5));
    const color = palette ? 0 : fishingLine.defaultFillColor;

    beginPixelPath();

    for (let step = 0; step <= steps; step++) {
        const amount = step / steps;
        const inverse = 1 - amount;
        const fromWeight = inverse * inverse;
        const controlWeight = 2 * inverse * amount;
        const toWeight = amount * amount;
        const x = Math.round(fromWeight * fromX + controlWeight * controlX + toWeight * toX);
        const y = Math.round(fromWeight * fromY + controlWeight * controlY + toWeight * toY);

        addPixelPathPoint(x, y, palette ? samplePalette(palette, amount) : color);
    }

    drawPixelPath();
}

function createFishingRope(fromX, fromY, toX, toY, lineLength) {
    const segmentCount = Math.max(2, Math.ceil(lineLength / ROPE_SEGMENT_LENGTH));
    const points = [], spanX = toX - fromX, spanY = toY - fromY;

    for (let index = 0; index <= segmentCount; index++) {
        const amount = index / segmentCount;
        const x = fromX + spanX * amount;
        const y = fromY + spanY * amount;

        points.push({ x, y, oldX: x, oldY: y });
    }

    return { points, length: lineLength, segmentLength: lineLength / segmentCount };
}

function updateFishingRope(rope, fromX, fromY, toX, toY, delta, tautness) {
    const points = rope.points;
    const lastIndex = points.length - 1;
    const seconds = Math.min(delta, 34) / 1000;
    const gravity = ROPE_GRAVITY * seconds * seconds;
    const targetLength = Math.max(Math.hypot(toX - fromX, toY - fromY) + (1 - tautness) * 7, ROPE_SEGMENT_LENGTH);

    rope.length += (targetLength - rope.length) * Math.min(1, seconds * (tautness ? 14 : 5));
    rope.segmentLength = rope.length / lastIndex;
    const segmentLength = rope.segmentLength, firstPoint = points[0], lastPoint = points[lastIndex];

    for (let index = 1; index < lastIndex; index++) {
        const point = points[index];
        const velocityX = (point.x - point.oldX) * 0.985;
        const velocityY = (point.y - point.oldY) * 0.985;

        point.oldX = point.x;
        point.oldY = point.y;
        point.x += velocityX;
        point.y += velocityY + gravity;
    }

    for (let pass = 0; pass < ROPE_CONSTRAINT_PASSES; pass++) {
        firstPoint.x = fromX;
        firstPoint.y = fromY;
        lastPoint.x = toX;
        lastPoint.y = toY;

        for (let index = 0; index < lastIndex; index++) {
            const first = points[index];
            const second = points[index + 1];
            const dx = second.x - first.x;
            const dy = second.y - first.y;
            const distance = Math.max(0.001, Math.hypot(dx, dy));
            const correction = (distance - segmentLength) / distance;
            const correctionX = dx * correction;
            const correctionY = dy * correction;
            const firstFixed = index === 0;
            const secondFixed = index + 1 === lastIndex;

            if (!firstFixed) {
                const share = secondFixed ? 1 : 0.5;
                first.x += correctionX * share;
                first.y += correctionY * share;
            }

            if (!secondFixed) {
                const share = firstFixed ? 1 : 0.5;
                second.x -= correctionX * share;
                second.y -= correctionY * share;
            }
        }
    }
}

function drawFishingRope(rope, palette) {
    const points = rope.points;
    const lastIndex = points.length - 1;
    const paletteSteps = Math.max(1, lastIndex - 1);

    beginPixelPath();

    for (let index = 0; index < lastIndex; index++) {
        const first = points[index];
        const second = points[index + 1];
        const dx = second.x - first.x;
        const dy = second.y - first.y;
        const distance = Math.max(1, Math.ceil(Math.hypot(dx, dy)));
        const amount = index / paletteSteps;
        const color = samplePalette(palette, 1 - Math.abs(amount * 2 - 1));

        for (let step = 0; step <= distance; step++) {
            const blend = step / distance;
            addPixelPathPoint(
                Math.round(first.x + dx * blend),
                Math.round(first.y + dy * blend),
                color
            );
        }
    }

    drawPixelPath();
}
