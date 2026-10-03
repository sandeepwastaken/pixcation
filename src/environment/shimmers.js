function poolShimmer(shimmer) {
    shimmer.shimmerChunk = null;
    shimmer.stop().setVisible(false).setActive(false);
    shimmerPool.push(shimmer);
}

function releaseShimmer(chunk, shimmer) {
    const index = chunk.shimmers.indexOf(shimmer);

    if (index !== -1) {
        chunk.shimmers.splice(index, 1);
    }

    poolShimmer(shimmer);
}

function finishShimmer(animation, frame, shimmer) {
    if (shimmer.shimmerChunk) releaseShimmer(shimmer.shimmerChunk, shimmer);
}

function spawnShimmer(scene) {
    let visibleCount = 0;

    for (const chunk of loadedShimmerChunks) {
        if (chunk.visible) visibleCount++;
    }

    if (visibleCount === 0) return;

    let selected = Math.floor(Math.random() * visibleCount);

    for (const chunk of loadedShimmerChunks) {
        if (!chunk.visible || selected-- > 0) continue;
        spawnChunkShimmer(scene, chunk);
        return;
    }
}

function spawnChunkShimmer(scene, chunk) {
    const cell = Math.floor(Math.random() * (chunk.waterCells.length / 4)) * 4;
    let shimmer = shimmerPool.pop();

    if (!shimmer) {
        shimmer = scene.add.sprite(0, 0, 'shimmer').setOrigin(0).setDepth(1.25);
        shimmer.on(Phaser.Animations.Events.ANIMATION_COMPLETE, finishShimmer);
    }

    shimmer.shimmerChunk = chunk;
    shimmer
        .setPosition(
            chunk.waterCells[cell] + Phaser.Math.Between(0, chunk.waterCells[cell + 2] - 12),
            chunk.waterCells[cell + 1] + Phaser.Math.Between(0, chunk.waterCells[cell + 3] - 1)
        )
        .setVisible(true)
        .setActive(true);

    chunk.shimmers.push(shimmer);
    shimmer.play('shimmer');
}
