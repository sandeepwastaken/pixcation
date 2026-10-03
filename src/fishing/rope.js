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

        fishingLine.fillRect(pixelPathX[index], pixelPathY[index], 1, 1);
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
        const x = Math.round(inverse * inverse * fromX + 2 * inverse * amount * controlX + amount * amount * toX);
        const y = Math.round(inverse * inverse * fromY + 2 * inverse * amount * controlY + amount * amount * toY);

        addPixelPathPoint(x, y, palette ? samplePalette(palette, amount) : color);
    }

    drawPixelPath();
}

function createFishingRope(fromX, fromY, toX, toY, lineLength) {
    const segmentCount = Math.max(2, Math.ceil(lineLength / ROPE_SEGMENT_LENGTH));
    const points = [];

    for (let index = 0; index <= segmentCount; index++) {
        const amount = index / segmentCount;
        const x = fromX + (toX - fromX) * amount;
        const y = fromY + (toY - fromY) * amount;

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
    const segmentLength = rope.segmentLength;

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
        points[0].x = fromX;
        points[0].y = fromY;
        points[lastIndex].x = toX;
        points[lastIndex].y = toY;

        for (let index = 0; index < lastIndex; index++) {
            const first = points[index];
            const second = points[index + 1];
            const dx = second.x - first.x;
            const dy = second.y - first.y;
            const distance = Math.max(0.001, Math.hypot(dx, dy));
            const correction = (distance - segmentLength) / distance;
            const firstFixed = index === 0;
            const secondFixed = index + 1 === lastIndex;

            if (!firstFixed) {
                const share = secondFixed ? 1 : 0.5;
                first.x += dx * correction * share;
                first.y += dy * correction * share;
            }

            if (!secondFixed) {
                const share = firstFixed ? 1 : 0.5;
                second.x -= dx * correction * share;
                second.y -= dy * correction * share;
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
        const distance = Math.max(1, Math.ceil(Math.hypot(second.x - first.x, second.y - first.y)));
        const amount = index / paletteSteps;
        const color = samplePalette(palette, 1 - Math.abs(amount * 2 - 1));

        for (let step = 0; step <= distance; step++) {
            const blend = step / distance;
            addPixelPathPoint(
                Math.round(first.x + (second.x - first.x) * blend),
                Math.round(first.y + (second.y - first.y) * blend),
                color
            );
        }
    }

    drawPixelPath();
}
