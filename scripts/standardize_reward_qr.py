from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
REWARD_DIRS = [
    ROOT / "site/assets/reward",
    ROOT / "outputs/assets/reward",
    ROOT / "upload-package/site/assets/reward",
]

FONT_REG = "/System/Library/Fonts/STHeiti Light.ttc"
FONT_BOLD = "/System/Library/Fonts/STHeiti Medium.ttc"


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(FONT_BOLD if bold else FONT_REG, size)


def rounded_rect(draw, xy, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


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
    side = max(x2 - x1, y2 - y1)
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


def make_card(source_path: Path, output_path: Path, kind: str, color: tuple[int, int, int], qr_box: tuple[int, int, int, int]):
    source = Image.open(source_path).convert("RGB")
    qr = equal_qr_canvas(source.crop(qr_box), outer_size=560, qr_body_size=520)

    W, H = 820, 1020
    card = Image.new("RGB", (W, H), (248, 246, 242))
    draw = ImageDraw.Draw(card)

    # Soft background circles
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse((W - 280, -120, W + 160, 320), fill=(*color, 35))
    gd.ellipse((-140, H - 340, 260, H + 80), fill=(*color, 20))
    card = Image.alpha_composite(card.convert("RGBA"), glow.filter(ImageFilter.GaussianBlur(18))).convert("RGB")
    draw = ImageDraw.Draw(card)

    # Main card
    rounded_rect(draw, (52, 46, W - 52, H - 46), 40, (255, 255, 255), (235, 226, 216), 2)

    # Header
    draw.ellipse((100, 103, 128, 131), fill=color)
    draw.text((146, 88), kind, font=font(42, True), fill=(30, 42, 58))
    draw.text((100, 160), "支持造物邻里", font=font(50, True), fill=(239, 98, 62))
    draw.text((100, 226), "自愿打赏支持继续维护，不对应订单或交易担保。", font=font(24), fill=(101, 113, 130))

    # QR panel
    panel = (100, 312, W - 100, 932)
    rounded_rect(draw, panel, 34, (250, 248, 245), (235, 226, 216), 2)
    inner = (130, 342, W - 130, 902)
    rounded_rect(draw, inner, 22, (255, 255, 255), (238, 232, 224), 1)
    card.paste(qr, (130, 342))

    output_path.parent.mkdir(parents=True, exist_ok=True)
    card.save(output_path, "JPEG", quality=94, optimize=True)


def main():
    src_wechat = Path("/Users/wdsj/Downloads/IMG_1123.JPG")
    src_alipay = Path("/Users/wdsj/Downloads/IMG_1126.JPG")
    if not src_wechat.exists():
        src_wechat = ROOT / "site/assets/reward/wechat-pay.jpg"
    if not src_alipay.exists():
        src_alipay = ROOT / "site/assets/reward/alipay.jpg"

    # These crops keep the QR code quiet zone while removing the original phone-screenshot style.
    wechat_crop = (215, 292, 615, 657)
    alipay_crop = (300, 880, 1410, 1990)

    for reward_dir in REWARD_DIRS:
        make_card(src_wechat, reward_dir / "wechat-pay.jpg", "微信支付", (18, 184, 102), wechat_crop)
        make_card(src_alipay, reward_dir / "alipay.jpg", "支付宝支付", (22, 119, 255), alipay_crop)


if __name__ == "__main__":
    main()
