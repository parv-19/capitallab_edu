const CAPTCHA_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateCaptchaCode(length = 5) {
  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += CAPTCHA_CHARS[Math.floor(Math.random() * CAPTCHA_CHARS.length)];
  }
  return code;
}

export function drawCaptcha(canvas: HTMLCanvasElement, code: string) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { width, height } = canvas;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#EEF0F5";
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 5; i += 1) {
    ctx.strokeStyle = `rgba(${randomInt(80, 180)}, ${randomInt(80, 180)}, ${randomInt(80, 180)}, 0.5)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(randomInt(0, width), randomInt(0, height));
    ctx.lineTo(randomInt(0, width), randomInt(0, height));
    ctx.stroke();
  }

  const charWidth = width / code.length;
  code.split("").forEach((char, index) => {
    ctx.save();
    const x = charWidth * index + charWidth / 2;
    const y = height / 2 + randomInt(-4, 4);
    ctx.translate(x, y);
    ctx.rotate((randomInt(-22, 22) * Math.PI) / 180);
    ctx.font = "bold 24px 'Source Sans 3', sans-serif";
    ctx.fillStyle = `rgb(${randomInt(20, 90)}, ${randomInt(20, 90)}, ${randomInt(20, 90)})`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(char, 0, 0);
    ctx.restore();
  });

  for (let i = 0; i < 25; i += 1) {
    ctx.fillStyle = `rgba(${randomInt(100, 200)}, ${randomInt(100, 200)}, ${randomInt(100, 200)}, 0.5)`;
    ctx.beginPath();
    ctx.arc(randomInt(0, width), randomInt(0, height), 1, 0, Math.PI * 2);
    ctx.fill();
  }
}
