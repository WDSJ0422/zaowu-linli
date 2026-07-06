from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "outputs/reward-preview-equal-qr.jpg"
FONT_REG = "/System/Library/Fonts/STHeiti Light.ttc"
FONT_BOLD = "/System/Library/Fonts/STHeiti Medium.ttc"


def font(size: int, bold: bool = False):
    return ImageFont.truetype(FONT_BOLD if bold else FONT_REG, size)


def dark_bbox(image: Image.Image) -> tuple[int, int, int, int]:
    gray = image.convert("L")
    xs, ys = [], []
    for y in range(gray.height):
        for x in range(gray.width):
            if gray.getpixel((x, y)) < 80:
                xs.append(x)
                ys.append(y)
    if not xs:
        return (0, 0, image.width, image.height)
    return (min(xs), min(ys), max(xs) + 1, max(ys) + 1)


def square_expand(box: tuple[int, int, int, int], limit: tuple[int, int]) -> tuple[int, int, int, int]:
    x1, y1, x2, y2 = box
    w, h = x2 - x1, y2 - y1
    side = max(w, h)
    cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
    nx1 = max(0, cx - side // 2)
    ny1 = max(0, cy - side // 2)
    nx2 = min(limit[0], nx1 + side)
    ny2 = min(limit[1], ny1 + side)
    nx1 = max(0, nx2 - side)
    ny1 = max(0, ny2 - side)
    return (nx1, ny1, nx2, ny2)


def equal_qr_canvas(image: Image.Image, outer_size=560, qr_body_size=520, bg=(255, 255, 255)) -> Image.Image:
    image = image.convert("RGB")
    body = image.crop(square_expand(dark_bbox(image), (image.width, image.height)))
    body = body.resize((qr_body_size, qr_body_size), Image.Resampling.LANCZOS)
    out = Image.new("RGB", (outer_size, outer_size), bg)
    pad = (outer_size - qr_body_size) // 2
    out.paste(body, (pad, pad))
    return out


def make_card(source: Path, crop_box, title: str, color):
    src = Image.open(source).convert("RGB")
    qr = src.crop(crop_box)
    # Same QR canvas AND same dark QR body size for both payment methods.
    qr_canvas = equal_qr_canvas(qr, outer_size=560, qr_body_size=520)

    w, h = 820, 1020
    card = Image.new("RGB", (w, h), (248, 246, 242))
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse((w - 260, -120, w + 120, 260), fill=(*color, 34))
    gd.ellipse((-130, h - 300, 230, h + 80), fill=(*color, 20))
    card = Image.alpha_composite(card.convert("RGBA"), glow.filter(ImageFilter.GaussianBlur(16))).convert("RGB")
    draw = ImageDraw.Draw(card)

    draw.rounded_rectangle((52, 46, w - 52, h - 46), radius=40, fill=(255, 255, 255), outline=(235, 226, 216), width=2)
    draw.ellipse((100, 103, 128, 131), fill=color)
    draw.text((146, 88), title, font=font(42, True), fill=(30, 42, 58))
    draw.text((100, 160), "支持造物邻里", font=font(50, True), fill=(239, 98, 62))
    draw.text((100, 226), "自愿打赏支持继续维护，不对应订单或交易担保。", font=font(24), fill=(101, 113, 130))

    panel = (100, 312, w - 100, 932)
    draw.rounded_rectangle(panel, radius=34, fill=(250, 248, 245), outline=(235, 226, 216), width=2)
    inner = (130, 342, w - 130, 902)
    draw.rounded_rectangle(inner, radius=22, fill=(255, 255, 255), outline=(238, 232, 224), width=1)
    card.paste(qr_canvas, (130, 342))

    return card


def main():
    wechat_src = Path("/Users/wdsj/Downloads/IMG_1123.JPG")
    alipay_src = Path("/Users/wdsj/Downloads/IMG_1126.JPG")

    # Tighter crops around the QR bodies so both appear visually equal, not just equal image boxes.
    wechat_card = make_card(wechat_src, (215, 292, 615, 657), "微信支付", (18, 184, 102))
    alipay_card = make_card(alipay_src, (300, 880, 1410, 1990), "支付宝支付", (22, 119, 255))

    canvas = Image.new("RGB", (1760, 1080), (244, 241, 235))
    canvas.paste(wechat_card, (50, 30))
    canvas.paste(alipay_card, (890, 30))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(OUT, "JPEG", quality=94, optimize=True)
    print(OUT)


if __name__ == "__main__":
    main()
