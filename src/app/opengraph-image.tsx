import { ImageResponse } from "next/og";

// 社交分享卡（1200×630）：暗色终端美学，与站点视觉一致。
// 字体策略：satori 不支持 woff2，故从 GitHub raw 拉取 TTF/OTF——
// JetBrains Mono（等宽主字体）+ Noto Sans SC（中文标语）。
// 任一字体拉取失败则优雅降级（CJK 失败 → 英文标语；mono 失败 → 默认无衬线），
// 保证 OG 图在任何网络环境下都能渲染。模块级 memo，构建期只拉一次。

export const alt = "ORG — Organization Harness · 子智能体是工程资产，不是一次性函数";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const MONO_URL =
  "https://raw.githubusercontent.com/JetBrains/JetBrainsMono/master/fonts/ttf/JetBrainsMono-Regular.ttf";
const CJK_URL =
  "https://raw.githubusercontent.com/googlefonts/noto-cjk/main/Sans/SubsetOTF/SC/NotoSansSC-Regular.otf";

let fontsCache: { mono: ArrayBuffer | null; cjk: ArrayBuffer | null } | null = null;

async function fetchFont(url: string, timeoutMs = 10000): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

async function loadFonts() {
  if (fontsCache) return fontsCache;
  const [mono, cjk] = await Promise.all([fetchFont(MONO_URL), fetchFont(CJK_URL, 15000)]);
  fontsCache = { mono, cjk };
  return fontsCache;
}

// 窗口铬点（zinc 系，第三颗用 emerald 点题）
function Dot({ color }: { color: string }) {
  return <div style={{ width: 12, height: 12, borderRadius: 999, backgroundColor: color }} />;
}

function Pill({ children, accent = false, family = "sans-serif" }: { children: string; accent?: boolean; family?: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        border: `1px solid ${accent ? "rgba(16,185,129,0.45)" : "#27272a"}`,
        borderRadius: 999,
        padding: "8px 18px",
        color: accent ? "#34d399" : "#a1a1aa",
        backgroundColor: accent ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.02)",
        fontFamily: family,
      }}
    >
      <span style={{ fontSize: 17 }}>{children}</span>
    </div>
  );
}

export const runtime = "nodejs";

export default async function OgImage() {
  const { mono, cjk } = await loadFonts();
  const monoFamily = mono ? '"mono"' : "sans-serif";
  const cjkFamily = cjk ? `${monoFamily}, "cjk"` : monoFamily;

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#09090b",
          position: "relative",
          ...(mono ? { fontFamily: monoFamily } : {}),
        }}
      >
        {/* 蓝图网格 */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1200,
            height: 630,
            display: "flex",
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        {/* 左下 emerald 辉光 */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1200,
            height: 630,
            display: "flex",
            background:
              "radial-gradient(640px 320px at 10% 105%, rgba(16,185,129,0.13), transparent)",
          }}
        />

        {/* 内容层 */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1200,
            height: 630,
            display: "flex",
            flexDirection: "column",
            padding: "40px 64px 44px",
          }}
        >
          {/* 窗口标题栏 */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Dot color="#3f3f46" />
            <Dot color="#52525b" />
            <Dot color="#10b981" />
            <div
              style={{
                marginLeft: 14,
                display: "flex",
                color: "#71717a",
                fontSize: 16,
                fontFamily: cjkFamily,
              }}
            >
              {cjk ? "org — 驾驶舱 · myh2026/org" : "org — dashboard · myh2026/org"}
            </div>
            <div style={{ marginLeft: "auto", display: "flex", color: "#52525b", fontSize: 16 }}>
              v0.4.1
            </div>
          </div>
          {/* 分隔线 */}
          <div
            style={{
              marginTop: 22,
              display: "flex",
              height: 1,
              backgroundColor: "#1f1f23",
            }}
          />

          {/* 主区 */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 26,
            }}
          >
            {/* 提示符行 */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ color: "#059669", fontSize: 26, fontFamily: monoFamily }}>$</span>
              <span style={{ color: "#fafafa", fontSize: 26, fontFamily: monoFamily }}>org</span>
              <div style={{ width: 13, height: 30, backgroundColor: "#10b981" }} />
            </div>

            {/* 主标语 */}
            {cjk ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  fontSize: 58,
                  lineHeight: 1.3,
                  color: "#fafafa",
                  fontFamily: cjkFamily,
                }}
              >
                <div style={{ display: "flex" }}>
                  <span>子智能体是</span>
                  <span style={{ color: "#34d399" }}>工程资产</span>
                  <span>，</span>
                </div>
                <div style={{ display: "flex" }}>不是一次性函数。</div>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  fontSize: 44,
                  lineHeight: 1.35,
                  color: "#fafafa",
                  fontFamily: monoFamily,
                }}
              >
                <div style={{ display: "flex" }}>
                  <span>Subagents are </span>
                  <span style={{ color: "#34d399" }}>engineering assets</span>
                  <span>,</span>
                </div>
                <div style={{ display: "flex" }}>not one-shot functions.</div>
              </div>
            )}

            {/* 徽章行（CJK 字体缺席时降级英文文案，避免 tofu） */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <Pill accent family={cjkFamily}>
                {cjk ? "Windows · macOS · Linux 单二进制" : "Windows · macOS · Linux single binary"}
              </Pill>
              <Pill family={monoFamily}>HSL BNF v1.5.0</Pill>
              <Pill family={cjkFamily}>{cjk ? "模型调用 5→1→0" : "model calls 5→1→0"}</Pill>
            </div>
          </div>

          {/* 页脚 */}
          <div
            style={{
              borderTop: "1px solid #1f1f23",
              paddingTop: 22,
              display: "flex",
              justifyContent: "space-between",
              color: "#71717a",
              fontSize: 16,
              fontFamily: monoFamily,
            }}
          >
            <div style={{ display: "flex" }}>github.com/myh2026/org</div>
            <div style={{ display: "flex" }}>69 tests green · MIT</div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        ...(mono ? [{ name: "mono", data: mono, style: "normal" as const }] : []),
        ...(cjk ? [{ name: "cjk", data: cjk, style: "normal" as const }] : []),
      ],
    },
  );
}
