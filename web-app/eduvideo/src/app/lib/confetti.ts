const CONFETTI_COLORS = ["#8b5cf6", "#db2777", "#f472b6", "#3b82f6", "#a855f7", "#fbbf24", "#10b981"];

export function fireConfetti(originX: number, originY: number, count = 60) {
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "0";
    container.style.top = "0";
    container.style.width = "100%";
    container.style.height = "100%";
    container.style.pointerEvents = "none";
    container.style.zIndex = "9999";
    document.body.appendChild(container);
    const speedFactor = 3.1;
    const fallSpeedFactor = 1.5

    for (let i = 0; i < count; i++) {
        const piece = document.createElement("div");
        const angle = Math.random() * Math.PI * 2;
        const burstDistance = 120 + Math.random() * 100;
        const fallDistance = 350 + Math.random() * 220;
        const dxBurst = Math.cos(angle) * burstDistance;
        const dyBurst = Math.sin(angle) * burstDistance - 40;
        const rotation = Math.random() * 720 - 360;
        const size = 6 + Math.random() * 6;
        const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
        const growDuration = (80 + Math.random() * 40) * speedFactor;
        const burstDuration = (180 + Math.random() * 80) * speedFactor;
        const fallDuration = (700 + Math.random() * 400) * fallSpeedFactor;
        const fallStartDelay = growDuration + burstDuration *0.55;
        piece.style.position = "absolute";
        piece.style.left = `${originX}px`;
        piece.style.top = `${originY}px`;
        piece.style.width = `${size}px`;
        piece.style.height = `${size * 0.5}px`;
        piece.style.backgroundColor = color;
        piece.style.borderRadius = "1px";
        piece.style.opacity = "0";
        piece.style.transform = "translate(-50%, -50%) scale(0) rotate(0deg)";
        piece.style.transformOrigin = "center";
        container.appendChild(piece);
        requestAnimationFrame(() => {
            piece.style.transition = `transform ${growDuration}ms ease-out, opacity ${growDuration}ms ease-out`;
            piece.style.transform = `translate(-50%, -50%) scale(1) rotate(${rotation * 0.2}deg)`;
            piece.style.opacity = "1";
        });
        setTimeout(() => {
            piece.style.transition = `transform ${burstDuration}ms cubic-bezier(0.15, 0.7, 0.4, 1)`;
            piece.style.transform = `translate(calc(-50% + ${dxBurst}px), calc(-50% + ${dyBurst}px)) scale(1) rotate(${rotation}deg)`;
        }, growDuration);
        setTimeout(() => {
            piece.style.transition = `transform ${fallDuration}ms cubic-bezier(0.55, 0.06, 0.68, 0.19), opacity ${fallDuration}ms ease-in`;
            piece.style.transform = `translate(calc(-50% + ${dxBurst * 1.4}px), calc(-50% + ${dyBurst + fallDistance}px)) rotate(${rotation * 1.5}deg)`;
            piece.style.opacity = "0";
        }, fallStartDelay);
        setTimeout(() => piece.remove(), fallStartDelay + fallDuration);
    }
    setTimeout(() => container.remove(), 1800 * speedFactor);
}